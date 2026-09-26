-- =============================================================================
-- register_scan(): a dossier can no longer be transferred at its last step.
-- The final scan (scan_count + 1 = max_scans) must happen in the service that
-- holds the dossier — it validates/rejects it there, then that service's
-- responsable closes it. Mirrors isFinalStep() in src/lib/dossiers/access.ts.
-- Only the FINAL_STEP check is new; the rest is unchanged from
-- 20260806120100_functions.sql.
-- =============================================================================
create or replace function public.register_scan(
  p_dossier_id uuid,
  p_action text,               -- 'scan' | 'transfert'
  p_client_uuid uuid,
  p_to_service_id uuid default null,
  p_new_status text default null,   -- 'valide' | 'rejete' | 'en_cours' (optional)
  p_note text default null,
  p_step_number integer default null
)
returns public.dossiers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles;
  v_dossier public.dossiers;
  v_existing_mouvement_id uuid;
  v_step integer;
begin
  v_profile := public.require_profile();

  if v_profile.role = 'auditeur' then
    raise exception 'FORBIDDEN: read-only role cannot scan' using errcode = '28000';
  end if;

  if p_action not in ('scan', 'transfert') then
    raise exception 'INVALID_INPUT: action must be scan or transfert' using errcode = '22023';
  end if;

  if p_client_uuid is null then
    raise exception 'INVALID_INPUT: client_uuid is required for idempotency' using errcode = '22023';
  end if;

  if p_new_status is not null and p_new_status not in ('en_cours', 'valide', 'rejete') then
    raise exception 'INVALID_INPUT: invalid status' using errcode = '22023';
  end if;

  -- Idempotency: a previously-synced offline scan replayed verbatim is a
  -- no-op — return the dossier as it stands now rather than erroring or
  -- double-incrementing scan_count.
  select id into v_existing_mouvement_id from public.mouvements where client_uuid = p_client_uuid;
  if v_existing_mouvement_id is not null then
    select * into v_dossier from public.dossiers where id = p_dossier_id;
    return v_dossier;
  end if;

  -- Row lock: serializes concurrent scans of the same dossier so scan_count
  -- increments never race.
  select * into v_dossier from public.dossiers where id = p_dossier_id for update;
  if v_dossier is null then
    raise exception 'NOT_FOUND: dossier does not exist' using errcode = 'P0002';
  end if;

  if v_dossier.is_locked then
    raise exception 'DOSSIER_LOCKED: dossier is closed and cannot be scanned' using errcode = '55000';
  end if;

  if v_profile.role in ('agent', 'responsable_service')
     and not public.can_access_dossier(v_profile, v_dossier) then
    raise exception 'FORBIDDEN: dossier is outside your service' using errcode = '28000';
  end if;

  if p_to_service_id is not null and not exists (
    select 1 from public.services where id = p_to_service_id and is_active
  ) then
    raise exception 'INVALID_INPUT: unknown or inactive target service' using errcode = '22023';
  end if;

  if v_dossier.scan_count + 1 >= v_dossier.max_scans
     and (p_action = 'transfert'
          or (p_to_service_id is not null and p_to_service_id is distinct from v_dossier.current_service_id)) then
    raise exception 'FINAL_STEP: dossier cannot be transferred at its last step' using errcode = '55000';
  end if;

  v_step := coalesce(p_step_number, v_dossier.scan_count + 1);

  insert into public.mouvements (
    dossier_id, action, from_service_id, to_service_id, status_snapshot,
    step_number, performed_by, note, client_uuid
  )
  values (
    v_dossier.id, p_action, v_dossier.current_service_id,
    coalesce(p_to_service_id, v_dossier.current_service_id),
    coalesce(p_new_status, v_dossier.status), v_step, v_profile.id, p_note, p_client_uuid
  );

  update public.dossiers
     set scan_count = scan_count + 1,
         current_service_id = coalesce(p_to_service_id, current_service_id),
         status = coalesce(p_new_status, status)
   where id = v_dossier.id
  returning * into v_dossier;

  return v_dossier;
end;
$$;

revoke execute on function public.register_scan(uuid, text, uuid, uuid, text, text, integer) from public, anon;
grant execute on function public.register_scan(uuid, text, uuid, uuid, text, text, integer) to authenticated;

