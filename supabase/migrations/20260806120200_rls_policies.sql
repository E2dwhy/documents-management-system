-- =============================================================================
-- Row Level Security
--
-- Design summary (see README for the full write-up):
--   - services / dossier_types: readable by any authenticated user (needed
--     for dropdowns/filters everywhere), writable by admin only.
--   - profiles: readable by any authenticated user (names shown throughout
--     the UI), writable by admin only — self-service profile edits are a
--     deliberately out-of-scope, later addition if ever needed.
--   - dossiers / mouvements: SELECT-only policies. There is NO insert/update/
--     delete policy on either table — every mutation goes through a
--     SECURITY DEFINER RPC (create_dossier, register_scan, close_dossier,
--     reopen_dossier, update_dossier_metadata) that re-checks permissions in
--     SQL. This is what makes "never trust a client-set counter" and
--     "immutable history" actual guarantees instead of conventions.
--   - dossier_reference_counters: no policies at all — internal only, never
--     touched outside generate_dossier_reference().
--   - notifications: users read/mark-read their own; admin sees all;
--     inserts are server-side only (create_notification()).
--
-- Visibility scoping for 'agent' and 'responsable_service':
--   a dossier currently in their service, OR one they personally created —
--   matches can_access_dossier() used by the RPCs, so what a user can see
--   and what they can act on never disagree.
-- =============================================================================

alter table public.services enable row level security;
alter table public.profiles enable row level security;
alter table public.dossier_types enable row level security;
alter table public.dossier_reference_counters enable row level security;
alter table public.dossiers enable row level security;
alter table public.mouvements enable row level security;
alter table public.notifications enable row level security;

-- No table-level access at all for unauthenticated visitors — every screen
-- in the app requires a session (see Phase 3 route guards).
grant usage on schema public to authenticated;

-- -----------------------------------------------------------------------------
-- services
-- -----------------------------------------------------------------------------
grant select, insert, update, delete on public.services to authenticated;

create policy services_select on public.services
  for select to authenticated
  using (true);

create policy services_admin_write on public.services
  for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy services_admin_update on public.services
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy services_admin_delete on public.services
  for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
grant select, insert, update on public.profiles to authenticated;

create policy profiles_select on public.profiles
  for select to authenticated
  using (true);

create policy profiles_admin_insert on public.profiles
  for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy profiles_admin_update on public.profiles
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- -----------------------------------------------------------------------------
-- dossier_types
-- -----------------------------------------------------------------------------
grant select, insert, update, delete on public.dossier_types to authenticated;

create policy dossier_types_select on public.dossier_types
  for select to authenticated
  using (true);

create policy dossier_types_admin_insert on public.dossier_types
  for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy dossier_types_admin_update on public.dossier_types
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy dossier_types_admin_delete on public.dossier_types
  for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- -----------------------------------------------------------------------------
-- dossiers — SELECT only. Writes exclusively via RPCs (functions migration).
-- -----------------------------------------------------------------------------
grant select on public.dossiers to authenticated;

create policy dossiers_select on public.dossiers
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.role in ('admin', 'auditeur')
          or dossiers.current_service_id = p.service_id
          or dossiers.created_by = p.id
        )
    )
  );

-- -----------------------------------------------------------------------------
-- mouvements — SELECT only, scoped through the parent dossier's visibility.
-- -----------------------------------------------------------------------------
grant select on public.mouvements to authenticated;

create policy mouvements_select on public.mouvements
  for select to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      join public.dossiers d on d.id = mouvements.dossier_id
      where p.id = auth.uid()
        and (
          p.role in ('admin', 'auditeur')
          or d.current_service_id = p.service_id
          or d.created_by = p.id
        )
    )
  );

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
grant select, update on public.notifications to authenticated;

create policy notifications_select on public.notifications
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy notifications_update on public.notifications
  for update to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- dossier_reference_counters: RLS enabled with zero policies above = fully
-- deny-by-default for anon/authenticated; only reachable via
-- generate_dossier_reference() (SECURITY DEFINER, owned by the migrations
-- role, which bypasses RLS). No grant is issued to authenticated either.
