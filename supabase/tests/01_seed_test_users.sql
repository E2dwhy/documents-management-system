-- Creates 5 auth.users rows (simulating the admin-invite flow's
-- user_metadata) and relies on handle_new_user() to populate matching
-- public.profiles rows — this is itself a test that the trigger works.
do $$
declare
  v_accueil uuid;
  v_secretariat uuid;
begin
  select id into v_accueil from public.services where name = 'Accueil';
  select id into v_secretariat from public.services where name = 'Secrétariat Général';

  insert into auth.users (id, email, raw_user_meta_data) values
    ('00000000-0000-0000-0000-000000000001', 'admin@test.local',
      jsonb_build_object('full_name', 'Test Admin', 'role', 'admin')),
    ('00000000-0000-0000-0000-000000000002', 'resp@test.local',
      jsonb_build_object('full_name', 'Test Responsable', 'role', 'responsable_service', 'service_id', v_secretariat)),
    ('00000000-0000-0000-0000-000000000003', 'agent@test.local',
      jsonb_build_object('full_name', 'Test Agent', 'role', 'agent', 'service_id', v_accueil)),
    ('00000000-0000-0000-0000-000000000004', 'audit@test.local',
      jsonb_build_object('full_name', 'Test Auditeur', 'role', 'auditeur')),
    -- second agent in a DIFFERENT service, to test cross-service denial
    ('00000000-0000-0000-0000-000000000005', 'agent2@test.local',
      jsonb_build_object('full_name', 'Test Agent Deux', 'role', 'agent', 'service_id', v_secretariat));

  if (select count(*) from public.profiles where id in (
        '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000005'
      )) <> 5 then
    raise exception 'TEST FAILED: handle_new_user() did not create all 5 profiles';
  end if;

  raise notice 'PASS: handle_new_user() populated profiles for all 5 auth.users rows';
end
$$;
