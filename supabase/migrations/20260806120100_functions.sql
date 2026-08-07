-- =============================================================================
-- Functions & RPCs
--
-- Every write to dossiers/mouvements goes through one of these SECURITY
-- DEFINER functions — there are deliberately no client-facing INSERT/UPDATE
-- policies on those two tables (see the RLS migration). Each function:
--   1. resolves the caller's profile (role/service/active) itself, since
--      SECURITY DEFINER bypasses RLS;
--   2. re-checks permission in SQL, never trusting the client;
--   3. does its work inside one implicit transaction (the function body),
--      row-locking the dossier with `for update` where a counter is mutated.
--
-- `set search_path = public, pg_temp` on every definer function blocks the
-- classic search_path-hijack privilege-escalation vector.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- require_profile(): fetch the caller's profile or raise. Shared by every RPC.
-- -----------------------------------------------------------------------------
create function public.require_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'FORBIDDEN: authentication required' using errcode = '28000';
  end if;

  select * into v_profile from public.profiles where id = auth.uid();

  if v_profile is null then
    raise exception 'FORBIDDEN: no profile for this account' using errcode = '28000';
  end if;

  if not v_profile.is_active then
    raise exception 'FORBIDDEN: account is deactivated' using errcode = '28000';
  end if;

  return v_profile;
end;
$$;

revoke execute on function public.require_profile() from public, anon;
grant execute on function public.require_profile() to authenticated;

-- -----------------------------------------------------------------------------
-- can_access_dossier(): the shared visibility/mutation rule for
-- 'agent' and 'responsable_service' — scoped to their own service, plus any
-- dossier they personally created. admin/auditeur bypass this (checked by
-- callers before reaching here). Mirrors the dossiers SELECT RLS policy.
-- -----------------------------------------------------------------------------
create function public.can_access_dossier(p_profile public.profiles, p_dossier public.dossiers)
returns boolean
language sql
stable
as $$
  select p_dossier.current_service_id = p_profile.service_id
      or p_dossier.created_by = p_profile.id;
$$;

-- -----------------------------------------------------------------------------
-- handle_new_user(): populates public.profiles from auth.users metadata.
-- Triggered after every auth.users insert. Admin-driven invites
-- (supabase.auth.admin.createUser) set user_metadata { full_name, role,
-- service_id }; role defaults to the least-privileged 'agent' if omitted.
-- -----------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data ->> 'role', 'agent');
begin
  if v_role not in ('admin', 'responsable_service', 'agent', 'auditeur') then
    v_role := 'agent';
  end if;

  insert into public.profiles (id, full_name, email, role, service_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    v_role,
    nullif(new.raw_user_meta_data ->> 'service_id', '')::uuid
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- generate_dossier_reference(): DOS-<year>-<zero-padded seq>, atomic per year.
-- Internal only — not granted to authenticated/anon, called from create_dossier.
-- -----------------------------------------------------------------------------
create function public.generate_dossier_reference()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_year integer := extract(year from now())::integer;
  v_seq  integer;
begin
  insert into public.dossier_reference_counters (year, last_seq)
  values (v_year, 1)
  on conflict (year) do update
    set last_seq = public.dossier_reference_counters.last_seq + 1
  returning last_seq into v_seq;

  return 'DOS-' || v_year || '-' || lpad(v_seq::text, 5, '0');
end;
$$;

revoke execute on function public.generate_dossier_reference() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- create_dossier(): the only way a dossier row comes into existence.
-- Allowed roles: admin, responsable_service, agent (not auditeur).
-- -----------------------------------------------------------------------------
create function public.create_dossier(
  p_title text,
  p_type_id uuid,
  p_service_id uuid,
  p_owner_name text default null
)
returns public.dossiers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles;
  v_type public.dossier_types;
  v_dossier public.dossiers;
begin
  v_profile := public.require_profile();

  if v_profile.role = 'auditeur' then
    raise exception 'FORBIDDEN: read-only role cannot create dossiers' using errcode = '28000';
  end if;

  if p_title is null or btrim(p_title) = '' then
    raise exception 'INVALID_INPUT: title is required' using errcode = '22023';
  end if;

  select * into v_type from public.dossier_types where id = p_type_id and is_active;
  if v_type is null then
    raise exception 'INVALID_INPUT: unknown or inactive dossier type' using errcode = '22023';
  end if;

  if not exists (select 1 from public.services where id = p_service_id and is_active) then
    raise exception 'INVALID_INPUT: unknown or inactive service' using errcode = '22023';
  end if;

  insert into public.dossiers (
    reference, title, owner_name, type_id, current_service_id,
    max_scans, created_by
  )
  values (
    public.generate_dossier_reference(),
    btrim(p_title),
    nullif(btrim(coalesce(p_owner_name, '')), ''),
    p_type_id,
    p_service_id,
    v_type.max_scans,
    v_profile.id
  )
  returning * into v_dossier;

  insert into public.mouvements (
    dossier_id, action, to_service_id, status_snapshot, step_number, performed_by
  )
  values (
    v_dossier.id, 'creation', p_service_id, v_dossier.status, 0, v_profile.id
  );

  return v_dossier;
end;
$$;

revoke execute on function public.create_dossier(text, uuid, uuid, text) from public, anon;
grant execute on function public.create_dossier(text, uuid, uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- register_scan(): the atomic, idempotent core of the whole system.
-- Replays of the same client_uuid (offline sync) are safe no-ops that return
-- the current dossier state instead of raising or double-counting.
-- -----------------------------------------------------------------------------
create function public.register_scan(
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

-- -----------------------------------------------------------------------------
-- close_dossier(): only once scan_count >= max_scans. admin or the
-- responsable_service of the dossier's current service.
-- -----------------------------------------------------------------------------
create function public.close_dossier(
  p_dossier_id uuid,
  p_note text default null
)
returns public.dossiers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles;
  v_dossier public.dossiers;
begin
  v_profile := public.require_profile();

  if v_profile.role not in ('admin', 'responsable_service') then
    raise exception 'FORBIDDEN: only an admin or the service manager can close a dossier' using errcode = '28000';
  end if;

  select * into v_dossier from public.dossiers where id = p_dossier_id for update;
  if v_dossier is null then
    raise exception 'NOT_FOUND: dossier does not exist' using errcode = 'P0002';
  end if;

  if v_profile.role = 'responsable_service' and not public.can_access_dossier(v_profile, v_dossier) then
    raise exception 'FORBIDDEN: dossier is outside your service' using errcode = '28000';
  end if;

  if v_dossier.is_locked then
    raise exception 'DOSSIER_LOCKED: dossier is already closed' using errcode = '55000';
  end if;

  if v_dossier.scan_count < v_dossier.max_scans then
    raise exception 'NOT_READY: dossier has not reached its last step (%/%)',
      v_dossier.scan_count, v_dossier.max_scans using errcode = '55000';
  end if;

  update public.dossiers
     set status = 'cloture',
         is_locked = true,
         closed_at = now(),
         closed_by = v_profile.id
   where id = v_dossier.id
  returning * into v_dossier;

  insert into public.mouvements (
    dossier_id, action, status_snapshot, step_number, performed_by, note
  )
  values (
    v_dossier.id, 'cloture', v_dossier.status, v_dossier.scan_count, v_profile.id, p_note
  );

  return v_dossier;
end;
$$;

revoke execute on function public.close_dossier(uuid, text) from public, anon;
grant execute on function public.close_dossier(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- reopen_dossier(): admin-only, mandatory reason, itself journalized.
-- -----------------------------------------------------------------------------
create function public.reopen_dossier(
  p_dossier_id uuid,
  p_reason text
)
returns public.dossiers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles;
  v_dossier public.dossiers;
begin
  v_profile := public.require_profile();

  if v_profile.role <> 'admin' then
    raise exception 'FORBIDDEN: only an admin can reopen a closed dossier' using errcode = '28000';
  end if;

  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'INVALID_INPUT: a reason is required to reopen a dossier' using errcode = '22023';
  end if;

  select * into v_dossier from public.dossiers where id = p_dossier_id for update;
  if v_dossier is null then
    raise exception 'NOT_FOUND: dossier does not exist' using errcode = 'P0002';
  end if;

  if not v_dossier.is_locked then
    raise exception 'NOT_CLOSED: dossier is not closed' using errcode = '55000';
  end if;

  update public.dossiers
     set status = 'en_cours',
         is_locked = false,
         closed_at = null,
         closed_by = null
   where id = v_dossier.id
  returning * into v_dossier;

  insert into public.mouvements (
    dossier_id, action, status_snapshot, step_number, performed_by, note
  )
  values (
    v_dossier.id, 'reouverture', v_dossier.status, v_dossier.scan_count, v_profile.id, p_reason
  );

  return v_dossier;
end;
$$;

revoke execute on function public.reopen_dossier(uuid, text) from public, anon;
grant execute on function public.reopen_dossier(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- update_dossier_metadata(): edits title/owner_name only — never scan_count,
-- status or type. Logged as a 'modification' mouvement.
-- -----------------------------------------------------------------------------
create function public.update_dossier_metadata(
  p_dossier_id uuid,
  p_title text default null,
  p_owner_name text default null,
  p_note text default null
)
returns public.dossiers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles;
  v_dossier public.dossiers;
begin
  v_profile := public.require_profile();

  if v_profile.role = 'auditeur' then
    raise exception 'FORBIDDEN: read-only role cannot modify dossiers' using errcode = '28000';
  end if;

  select * into v_dossier from public.dossiers where id = p_dossier_id for update;
  if v_dossier is null then
    raise exception 'NOT_FOUND: dossier does not exist' using errcode = 'P0002';
  end if;

  if v_dossier.is_locked then
    raise exception 'DOSSIER_LOCKED: dossier is closed and cannot be modified' using errcode = '55000';
  end if;

  if v_profile.role in ('agent', 'responsable_service')
     and not public.can_access_dossier(v_profile, v_dossier) then
    raise exception 'FORBIDDEN: dossier is outside your service' using errcode = '28000';
  end if;

  if p_title is not null and btrim(p_title) = '' then
    raise exception 'INVALID_INPUT: title cannot be empty' using errcode = '22023';
  end if;

  update public.dossiers
     set title = coalesce(nullif(btrim(p_title), ''), title),
         owner_name = case when p_owner_name is not null
                           then nullif(btrim(p_owner_name), '')
                           else owner_name end
   where id = v_dossier.id
  returning * into v_dossier;

  insert into public.mouvements (
    dossier_id, action, status_snapshot, step_number, performed_by, note
  )
  values (
    v_dossier.id, 'modification', v_dossier.status, null, v_profile.id, p_note
  );

  return v_dossier;
end;
$$;

revoke execute on function public.update_dossier_metadata(uuid, text, text, text) from public, anon;
grant execute on function public.update_dossier_metadata(uuid, text, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- create_notification(): internal helper for server-side/Edge Function code
-- (e.g. the late-dossier cron in Phase 7). Not granted to end users.
-- -----------------------------------------------------------------------------
create function public.create_notification(
  p_dossier_id uuid,
  p_user_id uuid,
  p_type text,
  p_message text
)
returns public.notifications
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_notification public.notifications;
begin
  insert into public.notifications (dossier_id, user_id, type, message)
  values (p_dossier_id, p_user_id, p_type, p_message)
  returning * into v_notification;

  return v_notification;
end;
$$;

revoke execute on function public.create_notification(uuid, uuid, text, text) from public, anon, authenticated;
