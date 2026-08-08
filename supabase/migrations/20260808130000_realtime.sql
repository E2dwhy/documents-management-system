-- =============================================================================
-- Enable Supabase Realtime (postgres_changes) for the tables the dashboard
-- and dossier detail page subscribe to. On a real Supabase project the
-- supabase_realtime publication already exists (created by the platform)
-- but starts with no tables in it — postgres_changes subscriptions
-- silently receive nothing until a table is added here. On a plain local
-- Postgres (this repo's test harness) the publication doesn't exist at
-- all, so it's created from scratch — either way this migration is
-- idempotent and safe to re-run.
--
-- profiles/services/dossier_types/notifications are deliberately NOT
-- added: nothing currently subscribes to them, and Realtime traffic scales
-- with (tables published) x (connected clients) x (write rate), so this
-- stays limited to what's actually used.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime for table public.dossiers, public.mouvements;
  else
    begin
      alter publication supabase_realtime add table public.dossiers;
    exception
      when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.mouvements;
    exception
      when duplicate_object then null;
    end;
  end if;
end;
$$;
