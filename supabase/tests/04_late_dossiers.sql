-- =============================================================================
-- Test matrix: flag_late_dossiers() — permission check, detection, and
-- no-duplicate-notification-per-stuck-episode behavior.
-- =============================================================================
\set ON_ERROR_STOP on
\set admin_id '''00000000-0000-0000-0000-000000000001'''
\set agent_id '''00000000-0000-0000-0000-000000000003'''

-- Create a dossier, then simulate it having been stuck for a long time.
-- The set_updated_at trigger unconditionally overwrites updated_at on
-- every UPDATE, so backdating it for the test means briefly disabling
-- that trigger — not something application code ever does.
begin;
set local role authenticated;
set local request.jwt.claim.sub = :agent_id;
do $$
declare
  v_type_id uuid;
  v_service_id uuid;
  v_dossier public.dossiers;
begin
  select id into v_type_id from public.dossier_types where name = 'demande_attestation'; -- late_threshold_hours = 48
  select id into v_service_id from public.services where name = 'Accueil';
  v_dossier := public.create_dossier('Dossier en retard - test', v_type_id, v_service_id, 'Test');

  create temporary table if not exists test_state (key text primary key, value text);
  insert into test_state values ('late_dossier_id', v_dossier.id::text)
    on conflict (key) do update set value = excluded.value;
end
$$;
commit;

alter table public.dossiers disable trigger dossiers_set_updated_at;
update public.dossiers set updated_at = now() - interval '100 hours'
  where id = (select value::uuid from test_state where key = 'late_dossier_id');
alter table public.dossiers enable trigger dossiers_set_updated_at;

-- non-admin cannot manually trigger a check
begin;
set local role authenticated;
set local request.jwt.claim.sub = :agent_id;
do $$
begin
  begin
    perform public.flag_late_dossiers();
    raise exception 'TEST FAILED: agent was able to trigger flag_late_dossiers manually';
  exception
    when others then
      if sqlerrm not like 'FORBIDDEN%' then
        raise exception 'TEST FAILED: expected FORBIDDEN, got: %', sqlerrm;
      end if;
      raise notice 'PASS: non-admin blocked from manually triggering flag_late_dossiers (%)', sqlerrm;
  end;
end
$$;
commit;

-- admin triggers it -> a notification is created for the late test dossier
begin;
set local role authenticated;
set local request.jwt.claim.sub = :admin_id;
do $$
declare
  v_created integer;
  v_notif_count integer;
begin
  v_created := public.flag_late_dossiers();
  if v_created < 1 then
    raise exception 'TEST FAILED: expected at least 1 notification created, got %', v_created;
  end if;

  select count(*) into v_notif_count from public.notifications
    where dossier_id = (select value::uuid from test_state where key = 'late_dossier_id')
      and type = 'dossier_en_retard';
  if v_notif_count < 1 then
    raise exception 'TEST FAILED: no dossier_en_retard notification found for the late dossier';
  end if;

  raise notice 'PASS: flag_late_dossiers created % notification(s), including for the late test dossier', v_created;
end
$$;
commit;

-- running it again right away must not duplicate the notification for the
-- same stuck episode (dossier hasn't moved since)
begin;
set local role authenticated;
set local request.jwt.claim.sub = :admin_id;
do $$
declare
  v_before integer;
  v_after integer;
begin
  select count(*) into v_before from public.notifications
    where dossier_id = (select value::uuid from test_state where key = 'late_dossier_id')
      and type = 'dossier_en_retard';

  perform public.flag_late_dossiers();

  select count(*) into v_after from public.notifications
    where dossier_id = (select value::uuid from test_state where key = 'late_dossier_id')
      and type = 'dossier_en_retard';

  if v_after <> v_before then
    raise exception 'TEST FAILED: re-running flag_late_dossiers duplicated notifications (% -> %)', v_before, v_after;
  end if;

  raise notice 'PASS: re-running flag_late_dossiers does not duplicate notifications for the same stuck episode';
end
$$;
commit;

\echo '=== 04_late_dossiers.sql: ALL TESTS PASSED ==='
