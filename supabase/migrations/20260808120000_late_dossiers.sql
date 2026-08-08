-- =============================================================================
-- Late-dossier detection.
--
-- "Late" = time since the dossier's last movement (dossiers.updated_at,
-- already maintained by the existing set_updated_at trigger — no new
-- column needed) exceeds its type's late_threshold_hours, and it's still
-- open (not closed/archived, not locked). Measured from the *last*
-- movement rather than creation: a dossier that moved quickly through
-- several steps and then got stuck is exactly the case worth flagging,
-- not one that's simply old.
--
-- flag_late_dossiers() is both the scheduled job body (pg_cron, hourly)
-- and a manually-triggerable admin RPC — see the auth.uid() branch below.
-- =============================================================================

-- pg_cron isn't available in every environment (a local Postgres used for
-- testing, or some Supabase tiers) — degrade gracefully rather than fail
-- the whole migration. flag_late_dossiers() itself is fully usable either
-- way (manual admin trigger from the UI); only the automatic hourly run
-- depends on this succeeding.
do $$
begin
  create extension if not exists pg_cron with schema extensions;
exception
  when others then
    raise notice 'pg_cron unavailable in this environment — skipping (flag_late_dossiers() still works manually): %', sqlerrm;
end;
$$;

create or replace function public.flag_late_dossiers()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller_role text;
  v_created_count integer := 0;
  v_dossier record;
  v_recipient record;
begin
  -- Called two ways: by pg_cron (no JWT, auth.uid() is null — always
  -- allowed, it's a trusted scheduled system job) or by an authenticated
  -- admin manually triggering a check from the UI (role re-checked here,
  -- same pattern as every other RPC in this project).
  if auth.uid() is not null then
    select role into v_caller_role from public.profiles where id = auth.uid();
    if v_caller_role is distinct from 'admin' then
      raise exception 'FORBIDDEN: only an admin can trigger late-dossier detection manually'
        using errcode = '28000';
    end if;
  end if;

  for v_dossier in
    select
      d.id, d.reference, d.current_service_id, d.updated_at,
      t.label as type_label
    from public.dossiers d
    join public.dossier_types t on t.id = d.type_id
    where d.status not in ('cloture', 'archive')
      and not d.is_locked
      and t.late_threshold_hours is not null
      and now() - d.updated_at > (t.late_threshold_hours || ' hours')::interval
  loop
    -- Recipients: the responsable_service of the dossier's current
    -- service, plus every admin (oversight).
    for v_recipient in
      select p.id from public.profiles p
      where p.is_active
        and (
          (p.role = 'responsable_service' and p.service_id = v_dossier.current_service_id)
          or p.role = 'admin'
        )
    loop
      -- Don't re-notify the same person for the same "stuck episode" on
      -- every hourly run — only if no late notification exists for this
      -- dossier+user since it last actually moved.
      if not exists (
        select 1 from public.notifications n
        where n.dossier_id = v_dossier.id
          and n.user_id = v_recipient.id
          and n.type = 'dossier_en_retard'
          and n.created_at > v_dossier.updated_at
      ) then
        perform public.create_notification(
          v_dossier.id,
          v_recipient.id,
          'dossier_en_retard',
          format(
            'Le dossier %s (%s) est en retard depuis le %s.',
            v_dossier.reference,
            v_dossier.type_label,
            to_char(v_dossier.updated_at, 'DD/MM/YYYY HH24:MI')
          )
        );
        v_created_count := v_created_count + 1;
      end if;
    end loop;
  end loop;

  return v_created_count;
end;
$$;

revoke execute on function public.flag_late_dossiers() from public, anon;
grant execute on function public.flag_late_dossiers() to authenticated;

do $$
begin
  perform cron.schedule(
    'flag-late-dossiers-hourly',
    '0 * * * *',
    $sql$select public.flag_late_dossiers();$sql$
  );
exception
  when others then
    raise notice 'Could not schedule the hourly late-dossier cron job (pg_cron unavailable?): %', sqlerrm;
end;
$$;
