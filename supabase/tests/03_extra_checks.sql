\set ON_ERROR_STOP on
\set agent_id '''00000000-0000-0000-0000-000000000003'''
\set admin_id '''00000000-0000-0000-0000-000000000001'''

-- update_dossier_metadata: edits title, leaves an untouched field alone,
-- and journalizes a 'modification' row.
begin;
set local role authenticated;
set local request.jwt.claim.sub = :agent_id;
do $$
declare
  v_type_id uuid;
  v_service_id uuid;
  v_dossier public.dossiers;
  v_mod_count int;
begin
  select id into v_type_id from public.dossier_types where name = 'demande_attestation';
  select id into v_service_id from public.services where name = 'Accueil';
  v_dossier := public.create_dossier('Titre initial', v_type_id, v_service_id, 'Owner Initial');

  v_dossier := public.update_dossier_metadata(v_dossier.id, 'Titre corrigé', null, 'Correction de faute de frappe');
  if v_dossier.title <> 'Titre corrigé' or v_dossier.owner_name <> 'Owner Initial' then
    raise exception 'TEST FAILED: update_dossier_metadata did not update title / wrongly touched owner_name (title=%, owner=%)',
      v_dossier.title, v_dossier.owner_name;
  end if;

  select count(*) into v_mod_count from public.mouvements
    where dossier_id = v_dossier.id and action = 'modification';
  if v_mod_count <> 1 then
    raise exception 'TEST FAILED: modification not journalized (found % rows)', v_mod_count;
  end if;

  raise notice 'PASS: update_dossier_metadata updated title, preserved owner_name, journalized 1 modification row';
end
$$;
commit;

-- DB-level idempotency backstop: two mouvements can never share a
-- client_uuid, even via a raw insert that bypasses register_scan's
-- application-level dedup check.
do $$
declare
  v_dossier_id uuid;
  v_shared_uuid uuid := gen_random_uuid();
begin
  select id into v_dossier_id from public.dossiers limit 1;

  insert into public.mouvements (dossier_id, action, performed_by, client_uuid)
  values (v_dossier_id, 'scan', '00000000-0000-0000-0000-000000000001', v_shared_uuid);

  begin
    insert into public.mouvements (dossier_id, action, performed_by, client_uuid)
    values (v_dossier_id, 'scan', '00000000-0000-0000-0000-000000000001', v_shared_uuid);
    raise exception 'TEST FAILED: duplicate client_uuid was accepted at the DB level';
  exception
    when unique_violation then
      raise notice 'PASS: mouvements.client_uuid unique index rejects duplicates';
  end;
end
$$;

\echo '=== 03_extra_checks.sql: ALL TESTS PASSED ==='
