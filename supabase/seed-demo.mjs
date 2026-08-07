#!/usr/bin/env node
// =============================================================================
// Demo accounts + sample dossiers with realistic history.
//
// Unlike seed.sql (plain SQL, safe to run via `supabase db reset`), creating
// auth users needs the Auth admin API — there's no reliable way to insert a
// working password into auth.users by hand. This script signs in as each
// demo user afterwards and drives the real create_dossier/register_scan/
// close_dossier RPCs, which doubles as a smoke test that the migrations in
// this folder actually work end-to-end (RLS included).
//
// Prerequisites: migrations + supabase/seed.sql already applied (this script
// looks up the "Accueil"/"Secrétariat Général" services and the
// "demande_attestation" dossier type they create).
//
// Usage:
//   node --env-file=.env.local supabase/seed-demo.mjs
// =============================================================================

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceRoleKey || url.includes("xxxxxxxxxxxx")) {
  console.error(
    "✗ Missing/placeholder Supabase env vars. Run with:\n" +
      "    node --env-file=.env.local supabase/seed-demo.mjs\n" +
      "  after filling in .env.local with a real Supabase project.",
  );
  process.exit(1);
}

// Local/demo only — never used for a real account.
const DEMO_PASSWORD = "Demo1234!";

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_USERS = [
  { email: "admin@dossiers.demo", full_name: "Awa Koffi", role: "admin", service_name: null },
  {
    email: "responsable@dossiers.demo",
    full_name: "Moussa Diarra",
    role: "responsable_service",
    service_name: "Secrétariat Général",
  },
  { email: "agent@dossiers.demo", full_name: "Fatou Bamba", role: "agent", service_name: "Accueil" },
  { email: "auditeur@dossiers.demo", full_name: "Jean Kouadio", role: "auditeur", service_name: null },
];

async function ensureDemoUser(demo, serviceIdByName) {
  const service_id = demo.service_name ? serviceIdByName[demo.service_name] : null;
  if (demo.service_name && !service_id) {
    throw new Error(`Service "${demo.service_name}" not found — run supabase/seed.sql first.`);
  }

  const { data: existing, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listError) throw listError;
  let user = existing.users.find((u) => u.email === demo.email);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: demo.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: demo.full_name, role: demo.role, service_id },
    });
    if (error) throw error;
    user = data.user;
    console.log(`  created ${demo.email} (${demo.role})`);
  } else {
    console.log(`  ${demo.email} already exists, skipping`);
  }

  return { ...demo, id: user.id };
}

async function signInAs(email) {
  const client = createClient(url, anonKey);
  const { error } = await client.auth.signInWithPassword({ email, password: DEMO_PASSWORD });
  if (error) throw error;
  return client;
}

function rpcOrThrow(promise, label) {
  return promise.then(({ data, error }) => {
    if (error) throw new Error(`${label}: ${error.message}`);
    return data;
  });
}

async function main() {
  console.log("→ Resolving services…");
  const { data: services, error: servicesError } = await admin.from("services").select("id, name");
  if (servicesError) throw servicesError;
  const serviceIdByName = Object.fromEntries(services.map((s) => [s.name, s.id]));

  console.log("→ Ensuring demo accounts exist…");
  const profiles = {};
  for (const demo of DEMO_USERS) {
    profiles[demo.role] = await ensureDemoUser(demo, serviceIdByName);
  }

  console.log("→ Signing in as agent + responsable_service to create sample dossiers…");
  const agentClient = await signInAs(profiles.agent.email);
  const responsableClient = await signInAs(profiles.responsable_service.email);

  const { data: types, error: typesError } = await agentClient.from("dossier_types").select("id, name, max_scans");
  if (typesError) throw typesError;
  const typeByName = Object.fromEntries(types.map((t) => [t.name, t]));

  const accueilId = serviceIdByName["Accueil"];
  const secretariatId = serviceIdByName["Secrétariat Général"];

  console.log("→ Creating a dossier still in progress…");
  const dossierA = await rpcOrThrow(
    agentClient.rpc("create_dossier", {
      p_title: "Renouvellement carte professionnelle",
      p_type_id: typeByName["demande_attestation"].id,
      p_service_id: accueilId,
      p_owner_name: "Konan Yao",
    }),
    "create_dossier (A)",
  );
  console.log(`  ${dossierA.reference} created (0/${dossierA.max_scans})`);

  await rpcOrThrow(
    agentClient.rpc("register_scan", {
      p_dossier_id: dossierA.id,
      p_action: "transfert",
      p_client_uuid: crypto.randomUUID(),
      p_to_service_id: secretariatId,
      p_note: "Transmis au secrétariat pour validation.",
    }),
    "register_scan (A)",
  );
  console.log(`  ${dossierA.reference} transféré vers Secrétariat Général (1/${dossierA.max_scans})`);

  console.log("→ Creating and closing a completed dossier…");
  const dossierB = await rpcOrThrow(
    responsableClient.rpc("create_dossier", {
      p_title: "Attestation de résidence",
      p_type_id: typeByName["demande_attestation"].id,
      p_service_id: secretariatId,
      p_owner_name: "Aya Traoré",
    }),
    "create_dossier (B)",
  );

  await rpcOrThrow(
    responsableClient.rpc("register_scan", {
      p_dossier_id: dossierB.id,
      p_action: "scan",
      p_client_uuid: crypto.randomUUID(),
      p_new_status: "valide",
      p_note: "Validé par le secrétariat.",
    }),
    "register_scan (B)",
  );

  await rpcOrThrow(
    responsableClient.rpc("close_dossier", {
      p_dossier_id: dossierB.id,
      p_note: "Circuit complet, dossier clôturé.",
    }),
    "close_dossier (B)",
  );
  console.log(`  ${dossierB.reference} clôturé`);

  console.log(`\n✓ Demo data ready. Accounts (mot de passe : ${DEMO_PASSWORD}):`);
  for (const demo of DEMO_USERS) {
    console.log(`  - ${demo.email} (${demo.role})`);
  }
}

main().catch((err) => {
  console.error("✗ Échec du seed :", err.message ?? err);
  process.exit(1);
});
