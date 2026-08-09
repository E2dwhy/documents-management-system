# Système de Suivi de Dossiers par QR Code

Application web progressive (PWA), mobile-first et fonctionnant hors ligne, pour
suivre la circulation physique/administrative de dossiers à l'aide de QR codes.
Chaque dossier reçoit un QR code unique à sa création ; chaque changement de main
est enregistré par un scan, jusqu'à la clôture et l'archivage. Historique complet,
exportable, et journalisé pour l'audit.

## Sommaire

- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration du projet Supabase](#configuration-du-projet-supabase)
- [Variables d'environnement](#variables-denvironnement)
- [Migrations et données de démonstration](#migrations-et-données-de-démonstration)
- [Lancer l'application](#lancer-lapplication)
- [Rôles et permissions](#rôles-et-permissions)
- [Fonctionnement hors ligne](#fonctionnement-hors-ligne)
- [Alertes de retard (tâche planifiée)](#alertes-de-retard-tâche-planifiée)
- [Exports PDF / Excel](#exports-pdf--excel)
- [Tests](#tests)
- [Build de production et PWA](#build-de-production-et-pwa)
- [Structure du projet](#structure-du-projet)
- [Limitations connues](#limitations-connues)
- [Repli Laravel](#repli-laravel-non-actif)

## Stack technique

| Domaine | Choix |
|---|---|
| Frontend | Next.js (App Router, TypeScript strict), React 19 |
| UI | Tailwind CSS v4 + shadcn/ui (style `radix-nova`) |
| Backend | Supabase (Postgres, Auth, Row Level Security, Realtime, Storage) |
| PWA / hors ligne | Serwist (service worker) + IndexedDB (`idb`) pour la file d'attente de scans |
| QR | `qrcode` (génération), `@yudiel/react-qr-scanner` (scan caméra) |
| Graphiques | Recharts |
| Exports | `jspdf` + `jspdf-autotable` (PDF), `xlsx` — SheetJS (Excel) |
| État serveur | TanStack Query |
| Validation | Zod |
| Tests | Vitest + `fake-indexeddb` (logique hors ligne), suite SQL maison (`supabase/tests/`) |

Toute l'interface est en français (fr-FR). Le code, les commentaires et les noms
de tables/colonnes sont en anglais. Dates affichées au format `dd/MM/yyyy HH:mm`,
fuseau `Africa/Abidjan` (UTC, sans heure d'été).

## Prérequis

- **Node.js 22+** recommandé. Le projet a été développé et testé sur Node 20.19 ;
  cela fonctionne, mais `@supabase/supabase-js` affiche un avertissement de
  dépréciation et son client Realtime a besoin du flag `--experimental-websocket`
  sur Node 20 pour les scripts exécutés en dehors du navigateur (voir
  `supabase/seed-demo.mjs`). Le navigateur n'est pas concerné : Realtime dans
  l'app fonctionne nativement.
- Un compte [Supabase](https://supabase.com) et un projet créé (offre gratuite
  suffisante pour démarrer).
- Le [CLI Supabase](https://supabase.com/docs/guides/cli) (`npm i -g supabase`
  ou `brew install supabase/tap/supabase`) pour appliquer les migrations.
- Pour lancer la suite de tests SQL locale (`supabase/tests/run.sh`) : un
  Postgres local (`brew install postgresql@17` sur macOS). Optionnel — sert
  uniquement à valider les migrations avant de les pousser sur le vrai projet.

## Installation

```bash
git clone <url-du-dépôt>
cd DMS
npm install
cp .env.example .env.local
```

Remplissez `.env.local` (voir [Variables d'environnement](#variables-denvironnement)),
puis passez à la [configuration Supabase](#configuration-du-projet-supabase).

## Configuration du projet Supabase

1. Créez un projet sur [supabase.com](https://supabase.com/dashboard).
2. Dans **Project Settings → API**, récupérez :
   - l'URL du projet,
   - la clé **publishable** (`sb_publishable_...`) — équivalent moderne de
     l'ancienne clé `anon`,
   - la clé **secret** (`sb_secret_...`) — équivalent moderne de l'ancienne clé
     `service_role`. **Ne jamais l'exposer côté client.**

   Si votre projet utilise encore l'ancien système de clés (`anon` /
   `service_role`, format JWT), l'app les accepte aussi de façon transparente
   (voir `src/lib/supabase/env.ts`) — utilisez alors `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   / `SUPABASE_SERVICE_ROLE_KEY` à la place des variables `*_PUBLISHABLE_KEY` /
   `*_SECRET_KEY`.
3. Dans **Project Settings → Database**, notez le mot de passe Postgres (ou
   réinitialisez-le) — nécessaire uniquement pour appliquer les migrations.
4. Liez le CLI à votre projet :

   ```bash
   supabase link --project-ref <votre-ref> --password <mot-de-passe-postgres>
   ```

   `<votre-ref>` est l'identifiant du projet, visible dans l'URL du dashboard
   (`https://supabase.com/dashboard/project/<ref>`).

## Variables d'environnement

Voir `.env.example` pour la liste complète et commentée. Résumé :

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé publique (exposée au navigateur) |
| `SUPABASE_SECRET_KEY` | Clé serveur uniquement — invitations d'utilisateurs, etc. |
| `SUPABASE_DB_PASSWORD` | Mot de passe Postgres — sert uniquement à pousser les migrations, jamais lu par le code applicatif |
| `NEXT_PUBLIC_APP_URL` | URL publique de l'app (liens email, callback OAuth, QR codes) |
| `NEXT_PUBLIC_ORG_NAME` | Nom affiché par défaut, avant qu'un admin ne le personnalise via **Administration → Paramètres** |
| `NEXT_PUBLIC_APP_TIMEZONE` | Fuseau applicatif (par défaut `Africa/Abidjan`) |

## Migrations et données de démonstration

Les migrations SQL vivent dans `supabase/migrations/`, appliquées dans l'ordre
de leur préfixe horodaté. Elles couvrent : le schéma, les politiques RLS, les
fonctions RPC (`register_scan`, `create_dossier`, `close_dossier`,
`reopen_dossier`, etc.), la détection des dossiers en retard (`pg_cron`), le
Realtime, et les paramètres d'organisation.

**Appliquer les migrations sur votre projet Supabase :**

```bash
supabase db push
```

Si le mot de passe direct à la base échoue (arrive parfois selon la
configuration réseau), la même chose fonctionne via l'API de gestion, sans
mot de passe :

```bash
for f in supabase/migrations/*.sql; do
  supabase db query -f "$f" --linked
done
```

**Charger les données de référence (services, types de dossiers) :**

```bash
supabase db query -f supabase/seed.sql --linked
```

**Créer des comptes de démonstration + dossiers d'exemple** (utilise l'API
admin de Supabase Auth pour créer 4 comptes — un par rôle — avec le mot de
passe `Demo1234!`, puis se connecte avec chacun pour créer de vrais dossiers
via les RPC réelles) :

```bash
node --env-file=.env.local supabase/seed-demo.mjs
# Sur Node < 22, ajoutez --experimental-websocket avant --env-file
```

> Les comptes de démonstration utilisent le domaine `@dossiers.demo`,
> volontairement invalide (`.demo` n'est pas un TLD réel) pour qu'une démo ne
> puisse jamais envoyer d'email à une vraie personne. Conséquence : la
> réinitialisation de mot de passe ne peut pas leur envoyer d'email réel — géré
> normalement pour de vrais utilisateurs invités avec une vraie adresse.

## Lancer l'application

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000). Connectez-vous avec un
compte de démonstration (ex. `admin@dossiers.demo` / `Demo1234!`, si
`seed-demo.mjs` a été exécuté), ou invitez le premier compte administrateur
depuis **Administration → Utilisateurs** une fois qu'un compte admin existe.

> `npm run dev` force le mode Webpack (`next dev --webpack`), pas Turbopack
> (par défaut sur Next.js 16) : Serwist (le service worker PWA) n'a pas encore
> de support Turbopack stable. À revisiter quand `@serwist/turbopack` mûrit.

## Rôles et permissions

| Rôle | Accès |
|---|---|
| **admin** | Accès complet ; gère services/types/utilisateurs ; peut rouvrir un dossier clôturé ; voit tout. |
| **responsable_service** | Scanne, transfère, consulte et gère les dossiers de son service ; clôture les dossiers ayant atteint leur dernière étape. |
| **agent** | Crée des dossiers, scanne/transfère, consulte l'historique — dossiers de son service ou qu'il a lui-même créés. |
| **auditeur** | Lecture seule : dossiers, historique, exports. Aucune écriture. |

Appliqué à la fois par les politiques RLS Postgres (`supabase/migrations/`,
défense en profondeur au niveau base de données) et par les gardes de route
côté application (`src/proxy.ts`, layouts `(app)/admin`, `(app)/audit`). Le
détail de chaque politique est commenté directement dans les fichiers de
migration.

## Fonctionnement hors ligne

Le scanner (`/scanner`) est le seul écran conçu pour fonctionner **sans aucune
connectivité**, pas seulement sur une connexion instable — c'est une contrainte
structurelle du choix technique (Server Components + Next.js App Router) :
une navigation vers une *nouvelle* page nécessite toujours un aller-retour
serveur, donc aucune mise en cache ne peut faire fonctionner une nouvelle page
hors ligne. Le flux scan → confirmation → soumission reste donc sur un seul
écran déjà chargé, rendu entièrement côté client.

**Principe (motif "outbox") :**

1. Chaque scan est **toujours** écrit dans IndexedDB d'abord (`src/lib/offline/`),
   qu'il y ait du réseau ou non — une seule voie de code, pas de branchement
   en ligne/hors ligne.
2. Une tentative de synchronisation immédiate suit. En ligne, c'est
   instantané. Hors ligne, l'élément reste `pending` dans la file.
3. Un bandeau dans l'en-tête (icône avec badge) affiche « En attente de
   synchronisation (N) », avec la liste des mouvements en attente et un
   bouton **Synchroniser maintenant**.
4. La synchronisation se relance automatiquement à la reconnexion
   (`window.addEventListener('online', …)`) et toutes les 60 secondes en
   filet de sécurité.
5. Chaque scan porte un identifiant `client_uuid` généré localement, utilisé
   comme clé d'idempotence par la fonction `register_scan` côté base — un
   même scan rejoué après reconnexion ne peut jamais être compté deux fois
   (garanti et testé, voir `supabase/tests/02_rpc_and_rls.sql`).
6. Un conflit réel (ex. le dossier a été clôturé entretemps par quelqu'un
   d'autre) n'est **jamais éliminé silencieusement** : il reste visible dans
   la file avec un message clair, et propose de réessayer ou d'ignorer.
7. Consulter un dossier en ligne (fiche détail ou scanner) met
   automatiquement en cache son détail + historique dans IndexedDB — un
   dossier déjà consulté reste donc lisible hors ligne, avec un bandeau
   « Hors ligne — données mises en cache, peut-être périmées ».

**Limite assumée :** un dossier jamais consulté en ligne ne peut pas être
scanné hors ligne (impossible de connaître son identifiant interne sans
requête réseau). En pratique, les dossiers activement suivis ont déjà été vus
au moins une fois en ligne.

## Alertes de retard (tâche planifiée)

Un dossier est considéré « en retard » quand le temps écoulé depuis son
**dernier mouvement** (pas sa création) dépasse le seuil configuré pour son
type (`late_threshold_hours`, éditable dans **Administration → Types de
dossiers**). La fonction `flag_late_dossiers()` :

- tourne automatiquement toutes les heures via `pg_cron` (confirmé actif sur
  le projet réel ; se dégrade proprement si `pg_cron` n'est pas disponible —
  par exemple sur un Postgres local de test),
- peut aussi être déclenchée manuellement par un admin depuis **Alertes →
  Vérifier maintenant**,
- ne renvoie pas de notification en double pour un même dossier tant qu'il
  n'a pas bougé depuis la dernière alerte.

## Exports PDF / Excel

Disponibles sur la liste des dossiers et sur l'audit global — l'export porte
toujours sur **l'ensemble des lignes filtrées**, pas seulement la page
affichée (`src/lib/export/`). Le paquet `xlsx` est installé depuis le CDN
officiel de SheetJS plutôt que le registre npm : la version npm porte deux
failles connues (pollution de prototype, ReDoS) sans correctif publié côté
npm ; SheetJS recommande explicitement leur propre CDN, qui contient le
correctif. `npm audit` est propre.

## Tests

```bash
# Tests unitaires (logique hors ligne : outbox, cache, moteur de synchronisation)
npm run test

# Suite SQL (schéma, RLS, RPC — contre un Postgres local jetable)
./supabase/tests/run.sh
```

La suite SQL couvre notamment : idempotence de `register_scan` (un scan
rejoué ne compte jamais deux fois), portée RLS par service/rôle, blocage des
écritures directes sur `dossiers`/`mouvements` (tout passe par les RPC),
cycle clôture/réouverture, et détection des dossiers en retard. La suite
Vitest couvre le moteur de synchronisation hors ligne (succès, échec réseau
vs conflit serveur, traitement par lot).

## Build de production et PWA

```bash
npm run build   # force --webpack, voir la note plus haut
npm run start
```

Le service worker (Serwist, `src/app/sw.ts`) met en cache l'app shell et les
ressources statiques. Le trafic vers `*.supabase.co` n'est **jamais** mis en
cache par le service worker : la gestion du hors ligne pour les écritures
passe entièrement par la file IndexedDB applicative (voir plus haut), pas par
une stratégie de cache HTTP générique — nécessaire pour la logique de
conflit/idempotence propre à ce projet.

L'app est installable (manifeste + icônes dans `public/icons/`).

## Structure du projet

```
src/
  app/                    Routes App Router (pages + layouts)
    (app)/                Écrans authentifiés (dossiers, scanner, audit, admin…)
    login/, reset-password/, update-password/   Pages publiques d'authentification
  components/             Composants React, organisés par domaine
  lib/
    actions/               Server Actions (mutations)
    data/                  Lectures serveur (Server Components)
    offline/                IndexedDB, moteur de synchronisation
    export/                 Génération PDF/Excel
    supabase/               Clients Supabase (navigateur/serveur/service-role)
    validations/            Schémas Zod
  hooks/                   Hooks React (TanStack Query, hors ligne, debounce…)
  types/database.ts        Types Supabase — maintenus à la main (voir note dans le fichier)
supabase/
  migrations/              Schéma SQL, RLS, RPC — appliqué dans l'ordre chronologique
  tests/                    Suite de tests SQL (Postgres local jetable)
  seed.sql                  Données de référence (services, types)
  seed-demo.mjs              Comptes + dossiers de démonstration
```

## Limitations connues

- **Node 20 vs 22** : fonctionne sur Node 20, mais `@supabase/supabase-js`
  est en dépréciation active à ce sujet. Recommandé de migrer vers Node 22+
  avant une mise en production durable.
- **Agrégation du tableau de bord côté client** : les statistiques
  (`src/hooks/use-dashboard-stats.ts`) récupèrent les colonnes nécessaires et
  agrègent en JavaScript plutôt que via des vues SQL dédiées — adapté au
  volume réaliste d'un outil de gestion documentaire interne, mais à revoir
  (vues matérialisées, agrégations SQL) si le nombre de dossiers devient très
  important.
- **`src/types/database.ts` maintenu à la main** plutôt que généré : les
  contraintes `CHECK` sur `text` (statut, rôle, action) ne produisent pas de
  types littéraux via `supabase gen types` (qui les reflète en `string` nu) —
  un compromis délibéré pour conserver le typage strict dont dépend
  fortement ce code. Régénérer et **comparer** avant de remplacer :

  ```bash
  supabase gen types typescript --linked > /tmp/generated.ts
  ```

## Repli Laravel (non actif)

Si l'hébergement venait à être limité à un hébergement mutualisé sans
runtime Node, l'architecture (modèle de données, moteur hors ligne par
outbox) est conçue pour être portée vers une API Laravel 11 + Sanctum, avec
le même frontend Next.js/PWA. Non implémenté — à activer uniquement sur
demande explicite.
