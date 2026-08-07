-- =============================================================================
-- Schema: Système de Suivi de Dossiers par QR Code
-- Tables, constraints, indexes and the one generic `updated_at` trigger.
-- RPCs and RLS policies live in the migrations that follow this one.
-- =============================================================================

-- gen_random_uuid() is built into Postgres 13+ (used by every Supabase
-- project), but pgcrypto is enabled defensively in case of an older base.
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- services — organizational units a dossier can be handed between.
-- -----------------------------------------------------------------------------
create table public.services (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.services is
  'Organizational units (bureaux/départements) dossiers circulate between.';

-- -----------------------------------------------------------------------------
-- profiles — 1-1 with auth.users. Holds the role/service used by RLS.
-- Populated by the handle_new_user() trigger (see functions migration) when
-- a new auth.users row is created — never written to directly by the client.
-- -----------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null,
  email      text not null,
  role       text not null check (
                role in ('admin', 'responsable_service', 'agent', 'auditeur')
              ),
  service_id uuid references public.services (id) on delete set null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Application profile for an auth.users row: role + service drive every RLS policy.';

create index profiles_service_id_idx on public.profiles (service_id);
create index profiles_role_idx on public.profiles (role);

-- -----------------------------------------------------------------------------
-- dossier_types — defines the processing circuit (number of steps) and,
-- optionally, a late-alert threshold (used by Phase 7 notifications).
-- -----------------------------------------------------------------------------
create table public.dossier_types (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null unique, -- stable key, e.g. "passport_renewal"
  label               text not null,        -- French display label
  max_scans           integer not null check (max_scans > 0),
  late_threshold_hours integer check (late_threshold_hours is null or late_threshold_hours > 0),
  description         text,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);

comment on table public.dossier_types is
  'A processing circuit template: how many scans (steps) a dossier of this type requires.';

-- -----------------------------------------------------------------------------
-- dossier_reference_counters — internal sequence backing DOS-<year>-<seq>.
-- Never queried directly by the client; only touched (with a row lock) by
-- generate_dossier_reference() in the functions migration.
-- -----------------------------------------------------------------------------
create table public.dossier_reference_counters (
  year     integer primary key,
  last_seq integer not null default 0
);

comment on table public.dossier_reference_counters is
  'One row per year; last_seq is incremented atomically to mint DOS-<year>-<seq> references.';

-- -----------------------------------------------------------------------------
-- dossiers
-- -----------------------------------------------------------------------------
create table public.dossiers (
  id                  uuid primary key default gen_random_uuid(),
  reference           text not null unique,               -- DOS-2026-00125
  qr_token            uuid not null unique default gen_random_uuid(),
  title               text not null,
  owner_name          text,
  type_id             uuid not null references public.dossier_types (id),
  current_service_id  uuid references public.services (id),
  status              text not null default 'en_cours' check (
                         status in ('en_cours', 'valide', 'rejete', 'cloture', 'archive')
                       ),
  scan_count          integer not null default 0 check (scan_count >= 0),
  max_scans           integer not null check (max_scans > 0), -- snapshot of type.max_scans at creation
  is_locked           boolean not null default false,
  created_by          uuid references public.profiles (id),
  closed_by           uuid references public.profiles (id),
  closed_at           timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint dossiers_closed_fields_consistent check (
    (closed_at is null) = (closed_by is null)
  )
);

comment on table public.dossiers is
  'A tracked file. scan_count/status/current_service_id are only ever mutated by RPCs (register_scan, close_dossier, reopen_dossier), never by direct client writes — see the RLS migration.';

create index dossiers_status_idx on public.dossiers (status);
create index dossiers_current_service_id_idx on public.dossiers (current_service_id);
create index dossiers_type_id_idx on public.dossiers (type_id);
create index dossiers_created_by_idx on public.dossiers (created_by);
create index dossiers_reference_idx on public.dossiers (reference);
create index dossiers_qr_token_idx on public.dossiers (qr_token);

-- -----------------------------------------------------------------------------
-- mouvements — immutable audit trail. Every row is inserted by an RPC;
-- there is intentionally no UPDATE/DELETE path (see RLS migration).
-- -----------------------------------------------------------------------------
create table public.mouvements (
  id              uuid primary key default gen_random_uuid(),
  dossier_id      uuid not null references public.dossiers (id) on delete cascade,
  action          text not null check (
                     action in ('creation', 'scan', 'transfert', 'modification', 'cloture', 'reouverture')
                   ),
  from_service_id uuid references public.services (id),
  to_service_id   uuid references public.services (id),
  status_snapshot text,       -- dossiers.status right after this movement
  step_number     integer,    -- which step of the circuit this represents (null for modification)
  performed_by    uuid references public.profiles (id),
  note            text,
  client_uuid     uuid,       -- idempotency key generated by the offline client
  performed_at    timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

comment on table public.mouvements is
  'Immutable history/audit trail. client_uuid deduplicates offline scans replayed after reconnecting.';

create index mouvements_dossier_id_idx on public.mouvements (dossier_id, performed_at desc);
create index mouvements_performed_by_idx on public.mouvements (performed_by);
create index mouvements_action_idx on public.mouvements (action);
-- Idempotency guard: two mouvements can never share a client_uuid. Partial
-- (client_uuid is not null) because server-initiated actions (e.g. reopen)
-- don't carry one.
create unique index mouvements_client_uuid_key
  on public.mouvements (client_uuid)
  where client_uuid is not null;

-- -----------------------------------------------------------------------------
-- notifications — late-dossier alerts and similar.
-- -----------------------------------------------------------------------------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  dossier_id uuid references public.dossiers (id) on delete cascade,
  user_id    uuid references public.profiles (id) on delete cascade,
  type       text not null,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.notifications is
  'In-app notifications (e.g. dossier en retard). Written by trusted server-side code only.';

create index notifications_user_id_idx on public.notifications (user_id, is_read);
create index notifications_dossier_id_idx on public.notifications (dossier_id);

-- -----------------------------------------------------------------------------
-- updated_at trigger (dossiers only — the sole table that tracks it)
-- -----------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger dossiers_set_updated_at
  before update on public.dossiers
  for each row
  execute function public.set_updated_at();
