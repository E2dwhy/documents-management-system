-- =============================================================================
-- App settings: a singleton row (org name + logo) editable by admin,
-- readable by everyone authenticated — used on the header, QR labels, and
-- exports. Deliberately a table, not an env var: env vars need a redeploy
-- to change, this is meant to be a same-day admin edit.
-- =============================================================================

create table public.app_settings (
  id         boolean primary key default true,
  org_name   text not null default 'Mon Organisation',
  logo_url   text,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id) -- forces exactly one row (id must be `true`)
);

comment on table public.app_settings is
  'Singleton row (id is always true) — organization-wide display settings.';

insert into public.app_settings (id, org_name) values (true, 'Mon Organisation');

create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row
  execute function public.set_updated_at();

alter table public.app_settings enable row level security;

-- Readable pre-login too (anon): org name/logo aren't sensitive, and
-- showing correct branding on /login is worth more than gating it.
grant select on public.app_settings to authenticated, anon;
grant update on public.app_settings to authenticated;

create policy app_settings_select on public.app_settings
  for select to authenticated, anon
  using (true);

create policy app_settings_admin_update on public.app_settings
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- -----------------------------------------------------------------------------
-- Storage: a public bucket for the org logo. Public read (it's just a
-- logo, shown on every page — no reason to gate it behind auth), writes
-- restricted to admin.
--
-- The `storage` schema only exists on a real Supabase project (it's part
-- of the platform, not something our own migrations create) — this repo's
-- local test harness runs against plain Postgres, so it's absent there.
-- Guarded the same way as the pg_cron block above: degrade gracefully
-- rather than fail the whole migration locally.
-- -----------------------------------------------------------------------------
do $$
begin
  insert into storage.buckets (id, name, public)
  values ('org-assets', 'org-assets', true)
  on conflict (id) do nothing;

  create policy org_assets_public_read on storage.objects
    for select to public
    using (bucket_id = 'org-assets');

  create policy org_assets_admin_write on storage.objects
    for insert to authenticated
    with check (
      bucket_id = 'org-assets'
      and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    );

  create policy org_assets_admin_update on storage.objects
    for update to authenticated
    using (
      bucket_id = 'org-assets'
      and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    );

  create policy org_assets_admin_delete on storage.objects
    for delete to authenticated
    using (
      bucket_id = 'org-assets'
      and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    );
exception
  when undefined_table or invalid_schema_name then
    raise notice 'storage schema unavailable in this environment (local test harness?) — skipping org-assets bucket setup.';
end;
$$;
