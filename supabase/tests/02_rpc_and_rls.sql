-- =============================================================================
-- Test matrix: RPCs + RLS, run as each simulated role via SET LOCAL ROLE +
-- request.jwt.claim.sub (stand-in for a real JWT's `sub` claim).
-- Each `do $$ ... $$` block raises on the first failed assertion, so
-- reaching "ALL TESTS PASSED" at the end means every check passed.
-- =============================================================================
\set ON_ERROR_STOP on

-- ids from 01_seed_test_users.sql
\set admin_id '''00000000-0000-0000-0000-000000000001'''
\set resp_id '''00000000-0000-0000-0000-000000000002'''
\set agent_id '''00000000-0000-0000-0000-000000000003'''
\set audit_id '''00000000-0000-0000-0000-000000000004'''
\set agent2_id '''00000000-0000-0000-0000-000000000005'''

-- ---------------------------------------------------------------------------
-- Test 1: auditeur cannot create a dossier (FORBIDDEN)
-- ---------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :audit_id;
do $$
declare
  v_type_id uuid;
  v_service_id uuid;
begin
  select id into v_type_id from public.dossier_types where name = 'demande_attestation';
  select id into v_service_id from public.services where name = 'Accueil';
  begin
    perform public.create_dossier('Test interdit', v_type_id, v_service_id, 'X');
    raise exception 'TEST FAILED: auditeur was able to create a dossier';
  exception
    when others then
      if sqlerrm not like 'FORBIDDEN%' then
        raise exception 'TEST FAILED: expected FORBIDDEN, got: %', sqlerrm;
      end if;
      raise notice 'PASS: auditeur blocked from create_dossier (%)', sqlerrm;
  end;
end
$$;
commit;

-- ---------------------------------------------------------------------------
-- Test 2: agent creates a dossier in their own service (Accueil)
-- ---------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :agent_id;
do $$
declare
  v_type_id uuid;
  v_service_id uuid;
  v_dossier public.dossiers;
begin
  select id into v_type_id from public.dossier_types where name = 'dossier_contentieux'; -- max_scans = 3
  select id into v_service_id from public.services where name = 'Accueil';

  v_dossier := public.create_dossier('Dossier Test 1', v_type_id, v_service_id, 'Konan Yao');

  if v_dossier.reference !~ '^DOS-\d{4}-\d{5}$' then
    raise exception 'TEST FAILED: unexpected reference format: %', v_dossier.reference;
  end if;
  if v_dossier.max_scans <> 3 then
    raise exception 'TEST FAILED: max_scans not copied from type (got %)', v_dossier.max_scans;
  end if;
  if v_dossier.scan_count <> 0 or v_dossier.status <> 'en_cours' or v_dossier.is_locked then
    raise exception 'TEST FAILED: unexpected initial state';
  end if;

  raise notice 'PASS: create_dossier -> % (max_scans=%)', v_dossier.reference, v_dossier.max_scans;

  create temporary table if not exists test_state (key text primary key, value text);
  insert into test_state values ('dossier1_id', v_dossier.id::text)
    on conflict (key) do update set value = excluded.value;
end
$$;
commit;

select action, step_number, performed_by
from public.mouvements
where dossier_id = (select value::uuid from test_state where key = 'dossier1_id');

-- ---------------------------------------------------------------------------
-- Test 3: idempotent register_scan — replaying the same client_uuid must
-- not double-increment scan_count. This is the core "offline replay safety"
-- guarantee the whole sync design (Phase 6) depends on.
-- ---------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :agent_id;
do $$
declare
  v_dossier_id uuid := (select value::uuid from test_state where key = 'dossier1_id');
  v_client_uuid uuid := gen_random_uuid();
  v_after_first public.dossiers;
  v_after_replay public.dossiers;
begin
  v_after_first := public.register_scan(v_dossier_id, 'scan', v_client_uuid, null, null, 'Premier scan');
  if v_after_first.scan_count <> 1 then
    raise exception 'TEST FAILED: expected scan_count=1 after first scan, got %', v_after_first.scan_count;
  end if;

  -- replay with the SAME client_uuid (simulates a re-synced offline queue item)
  v_after_replay := public.register_scan(v_dossier_id, 'scan', v_client_uuid, null, null, 'Premier scan (replay)');
  if v_after_replay.scan_count <> 1 then
    raise exception 'TEST FAILED: replay incremented scan_count to % (idempotency broken)', v_after_replay.scan_count;
  end if;

  if (select count(*) from public.mouvements where client_uuid = v_client_uuid) <> 1 then
    raise exception 'TEST FAILED: replay inserted a duplicate mouvement row';
  end if;

  raise notice 'PASS: register_scan idempotent on client_uuid replay (scan_count stayed at %)', v_after_replay.scan_count;
end
$$;
commit;

-- ---------------------------------------------------------------------------
-- Test 4: agent2 (different service, did not create the dossier) is
-- forbidden from scanning it.
-- ---------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :agent2_id;
do $$
declare
  v_dossier_id uuid := (select value::uuid from test_state where key = 'dossier1_id');
begin
  begin
    perform public.register_scan(v_dossier_id, 'scan', gen_random_uuid(), null, null, 'Ne devrait pas marcher');
    raise exception 'TEST FAILED: agent2 was able to scan a dossier outside their service';
  exception
    when others then
      if sqlerrm not like 'FORBIDDEN%' then
        raise exception 'TEST FAILED: expected FORBIDDEN, got: %', sqlerrm;
      end if;
      raise notice 'PASS: cross-service scan blocked (%)', sqlerrm;
  end;
end
$$;
commit;

-- ---------------------------------------------------------------------------
-- Test 5: RLS SELECT — agent2 cannot see dossier1 (different service, not
-- the creator); admin and auditeur can.
-- ---------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :agent2_id;
do $$
declare
  v_dossier_id uuid := (select value::uuid from test_state where key = 'dossier1_id');
  v_visible boolean;
begin
  select exists(select 1 from public.dossiers where id = v_dossier_id) into v_visible;
  if v_visible then
    raise exception 'TEST FAILED: agent2 can SELECT a dossier outside their service via RLS';
  end if;
  raise notice 'PASS: dossiers RLS hides out-of-service dossier from agent2';
end
$$;
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = :audit_id;
do $$
declare
  v_dossier_id uuid := (select value::uuid from test_state where key = 'dossier1_id');
  v_visible boolean;
begin
  select exists(select 1 from public.dossiers where id = v_dossier_id) into v_visible;
  if not v_visible then
    raise exception 'TEST FAILED: auditeur cannot SELECT dossiers (should see everything)';
  end if;
  raise notice 'PASS: auditeur sees all dossiers via RLS';
end
$$;
commit;

-- ---------------------------------------------------------------------------
-- Test 6: direct client-side INSERT/UPDATE on dossiers must be rejected by
-- RLS — proves mutation is only possible through the RPCs, even for admin.
-- ---------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :admin_id;
do $$
begin
  begin
    update public.dossiers set scan_count = 999 where id = (select value::uuid from test_state where key = 'dossier1_id');
    raise exception 'TEST FAILED: direct UPDATE on dossiers succeeded (should be blocked, no policy exists)';
  exception
    when insufficient_privilege then
      raise notice 'PASS: direct UPDATE on dossiers blocked by RLS (even for admin)';
  end;
end
$$;
rollback;

-- ---------------------------------------------------------------------------
-- Test 7: close_dossier before max_scans reached must fail (isolated from
-- scoping by using admin); after reaching max_scans, the
-- responsable_service of the dossier's current service can close it;
-- register_scan on a closed dossier must then fail with DOSSIER_LOCKED.
-- ---------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :admin_id;
do $$
declare
  v_dossier_id uuid := (select value::uuid from test_state where key = 'dossier1_id');
begin
  begin
    perform public.close_dossier(v_dossier_id, 'Trop tôt');
    raise exception 'TEST FAILED: closed a dossier before reaching max_scans';
  exception
    when others then
      if sqlerrm not like 'NOT_READY%' then
        raise exception 'TEST FAILED: expected NOT_READY, got: %', sqlerrm;
      end if;
      raise notice 'PASS: close_dossier blocked before max_scans reached (%)', sqlerrm;
  end;
end
$$;
commit;

-- move dossier1 (type max_scans=3, currently scan_count=1) to Secrétariat
-- Général as agent — step 2/3, a transfer is still allowed
begin;
set local role authenticated;
set local request.jwt.claim.sub = :agent_id;
do $$
declare
  v_dossier_id uuid := (select value::uuid from test_state where key = 'dossier1_id');
  v_secretariat uuid;
  v_dossier public.dossiers;
begin
  select id into v_secretariat from public.services where name = 'Secrétariat Général';
  v_dossier := public.register_scan(v_dossier_id, 'transfert', gen_random_uuid(), v_secretariat, null, 'Transmis au secrétariat');
  if v_dossier.scan_count <> 2 or v_dossier.current_service_id <> v_secretariat then
    raise exception 'TEST FAILED: expected scan_count=2 at Secrétariat, got % at %', v_dossier.scan_count, v_dossier.current_service_id;
  end if;
  raise notice 'PASS: transfer allowed before the last step (scan_count=%)', v_dossier.scan_count;
end
$$;
commit;

-- step 3/3 is the last step: a transfer (or a scan that moves the dossier)
-- must fail with FINAL_STEP; a plain validating scan succeeds
begin;
set local role authenticated;
set local request.jwt.claim.sub = :resp_id;
do $$
declare
  v_dossier_id uuid := (select value::uuid from test_state where key = 'dossier1_id');
  v_accueil uuid;
  v_dossier public.dossiers;
begin
  select id into v_accueil from public.services where name = 'Accueil';
  begin
    perform public.register_scan(v_dossier_id, 'transfert', gen_random_uuid(), v_accueil, null, 'Ne devrait pas marcher');
    raise exception 'TEST FAILED: transferred a dossier at its last step';
  exception
    when others then
      if sqlerrm not like 'FINAL_STEP%' then
        raise exception 'TEST FAILED: expected FINAL_STEP, got: %', sqlerrm;
      end if;
      raise notice 'PASS: transfer blocked at last step (%)', sqlerrm;
  end;
  begin
    perform public.register_scan(v_dossier_id, 'scan', gen_random_uuid(), v_accueil, null, 'Ne devrait pas marcher');
    raise exception 'TEST FAILED: moved a dossier via scan at its last step';
  exception
    when others then
      if sqlerrm not like 'FINAL_STEP%' then
        raise exception 'TEST FAILED: expected FINAL_STEP, got: %', sqlerrm;
      end if;
      raise notice 'PASS: service change via scan blocked at last step (%)', sqlerrm;
  end;

  v_dossier := public.register_scan(v_dossier_id, 'scan', gen_random_uuid(), null, 'valide', 'Validé');
  if v_dossier.scan_count <> 3 or v_dossier.status <> 'valide' then
    raise exception 'TEST FAILED: expected scan_count=3/valide, got %/%', v_dossier.scan_count, v_dossier.status;
  end if;
  raise notice 'PASS: dossier1 reached last step (scan_count=%/max_scans=%)', v_dossier.scan_count, v_dossier.max_scans;
end
$$;
commit;

-- now responsable_service (scoped to Secrétariat Général, dossier just
-- arrived there) can close it
begin;
set local role authenticated;
set local request.jwt.claim.sub = :resp_id;
do $$
declare
  v_dossier_id uuid := (select value::uuid from test_state where key = 'dossier1_id');
  v_dossier public.dossiers;
begin
  v_dossier := public.close_dossier(v_dossier_id, 'Circuit complet');
  if v_dossier.status <> 'cloture' or not v_dossier.is_locked or v_dossier.closed_at is null then
    raise exception 'TEST FAILED: close_dossier did not set expected state';
  end if;
  raise notice 'PASS: close_dossier -> status=%, is_locked=%', v_dossier.status, v_dossier.is_locked;
end
$$;
commit;

-- scanning a closed dossier must fail with DOSSIER_LOCKED
begin;
set local role authenticated;
set local request.jwt.claim.sub = :resp_id;
do $$
declare
  v_dossier_id uuid := (select value::uuid from test_state where key = 'dossier1_id');
begin
  begin
    perform public.register_scan(v_dossier_id, 'scan', gen_random_uuid(), null, null, 'Ne devrait pas marcher');
    raise exception 'TEST FAILED: scanned a locked/closed dossier';
  exception
    when others then
      if sqlerrm not like 'DOSSIER_LOCKED%' then
        raise exception 'TEST FAILED: expected DOSSIER_LOCKED, got: %', sqlerrm;
      end if;
      raise notice 'PASS: scan blocked on closed dossier (%)', sqlerrm;
  end;
end
$$;
commit;

-- ---------------------------------------------------------------------------
-- Test 8: reopen_dossier — non-admin forbidden, missing reason rejected,
-- admin with a reason succeeds and is journalized.
-- ---------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :resp_id;
do $$
declare
  v_dossier_id uuid := (select value::uuid from test_state where key = 'dossier1_id');
begin
  begin
    perform public.reopen_dossier(v_dossier_id, 'Je ne suis pas admin');
    raise exception 'TEST FAILED: non-admin was able to reopen a dossier';
  exception
    when others then
      if sqlerrm not like 'FORBIDDEN%' then
        raise exception 'TEST FAILED: expected FORBIDDEN, got: %', sqlerrm;
      end if;
      raise notice 'PASS: non-admin blocked from reopen_dossier (%)', sqlerrm;
  end;
end
$$;
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = :admin_id;
do $$
declare
  v_dossier_id uuid := (select value::uuid from test_state where key = 'dossier1_id');
begin
  begin
    perform public.reopen_dossier(v_dossier_id, '');
    raise exception 'TEST FAILED: reopened with an empty reason';
  exception
    when others then
      if sqlerrm not like 'INVALID_INPUT%' then
        raise exception 'TEST FAILED: expected INVALID_INPUT, got: %', sqlerrm;
      end if;
      raise notice 'PASS: reopen_dossier rejects empty reason (%)', sqlerrm;
  end;
end
$$;
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = :admin_id;
do $$
declare
  v_dossier_id uuid := (select value::uuid from test_state where key = 'dossier1_id');
  v_dossier public.dossiers;
  v_reopen_count int;
begin
  v_dossier := public.reopen_dossier(v_dossier_id, 'Erreur de saisie, à corriger');
  if v_dossier.status <> 'en_cours' or v_dossier.is_locked then
    raise exception 'TEST FAILED: reopen_dossier did not unlock the dossier';
  end if;

  select count(*) into v_reopen_count from public.mouvements
    where dossier_id = v_dossier_id and action = 'reouverture';
  if v_reopen_count <> 1 then
    raise exception 'TEST FAILED: reopen was not journalized (found % rows)', v_reopen_count;
  end if;

  raise notice 'PASS: admin reopen_dossier succeeded and was journalized';
end
$$;
commit;

\echo '=== 02_rpc_and_rls.sql: ALL TESTS PASSED ==='
