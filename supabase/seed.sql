-- =============================================================================
-- Static reference-data seed: services + dossier_types.
--
-- Run automatically by `supabase db reset`, or manually with:
--   psql "$DATABASE_URL" -f supabase/seed.sql
--
-- Idempotent (ON CONFLICT DO NOTHING keyed on the unique `name`), so it's
-- safe to re-run. Demo users + sample dossiers are seeded separately by
-- `supabase/seed-demo.mjs` (needs the Auth admin API, not plain SQL — see
-- that file's header comment).
-- =============================================================================

insert into public.services (name, description) values
  ('Accueil', 'Point d''entrée des dossiers, premier enregistrement.'),
  ('Secrétariat Général', 'Traitement administratif courant.'),
  ('Direction Juridique', 'Analyse et validation juridique des dossiers.'),
  ('Direction Financière', 'Contrôle et validation budgétaire.'),
  ('Archives', 'Classement et conservation des dossiers clôturés.')
on conflict (name) do nothing;

insert into public.dossier_types (name, label, max_scans, late_threshold_hours, description) values
  ('demande_attestation', 'Demande d''attestation', 2, 48,
    'Circuit court : accueil puis validation.'),
  ('demande_passeport', 'Demande de passeport', 4, 120,
    'Accueil, vérification, validation juridique, archivage.'),
  ('permis_construire', 'Permis de construire', 5, 240,
    'Circuit complet incluant contrôle financier.'),
  ('dossier_contentieux', 'Dossier contentieux', 3, 168,
    'Accueil, instruction juridique, décision.')
on conflict (name) do nothing;
