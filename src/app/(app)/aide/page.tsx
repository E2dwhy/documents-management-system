import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  Bell,
  CheckCircle2,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  ScanLine,
  Settings,
  WifiOff,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ReplayTourButton } from "@/components/onboarding/replay-tour-button";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export const metadata: Metadata = { title: "Aide" };

interface InfoItem {
  icon?: LucideIcon;
  label: string;
  description: string;
}

const NAV_REFERENCE: InfoItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", description: "Vue d'ensemble et statistiques" },
  { icon: FolderOpen, label: "Dossiers", description: "Liste, recherche et création des dossiers" },
  { icon: ScanLine, label: "Scanner", description: "Scanner un QR code ou saisir une référence" },
  { icon: ClipboardList, label: "Audit", description: "Historique complet de tous les mouvements" },
  { icon: Bell, label: "Alertes", description: "Notifications de dossiers en retard" },
  { icon: Settings, label: "Administration", description: "Services, types, utilisateurs, paramètres (admin)" },
];

const SCAN_ACTIONS: InfoItem[] = [
  { icon: ArrowRightLeft, label: "Transférer", description: "Envoie le dossier vers un autre service (sauf à la dernière étape du circuit)" },
  { icon: CheckCircle2, label: "Valider", description: "Marque l'étape actuelle comme validée" },
  { icon: XCircle, label: "Rejeter", description: "Marque le dossier comme rejeté" },
];

const ROLE_PERMISSIONS: InfoItem[] = [
  {
    label: "Administrateur",
    description:
      "Accès complet : gère services, types et utilisateurs ; voit et modifie tous les dossiers ; seul rôle pouvant rouvrir un dossier clôturé.",
  },
  {
    label: "Responsable de service",
    description: "Scanne, transfère et clôture les dossiers de son service ; consulte leur historique.",
  },
  {
    label: "Agent",
    description:
      "Crée des dossiers, scanne/transfère, consulte l'historique des dossiers de son service ou qu'il a créés lui-même.",
  },
  {
    label: "Auditeur",
    description: "Lecture seule : consultation des dossiers, de l'historique et des exports. Aucune écriture.",
  },
];

const FAQ = [
  {
    q: "Je ne vois pas la rubrique Administration.",
    a: "Elle n'est visible que pour le rôle administrateur. Contactez votre administrateur si vous pensez devoir y avoir accès.",
  },
  {
    q: "Le bouton « Clôturer » n'apparaît pas sur un dossier.",
    a: "Il n'apparaît que lorsque toutes les étapes du circuit ont été franchies (progression complète, ex. « 2/2 »), et uniquement pour un administrateur ou un responsable du service concerné.",
  },
  {
    q: "J'ai scanné un dossier hors connexion, et rien ne semble s'être passé.",
    a: "C'est normal : le mouvement est enregistré sur votre appareil et affiché « en attente » (icône en haut de l'écran). Il sera envoyé automatiquement dès que la connexion reviendra — vous pouvez aussi cliquer sur Synchroniser maintenant une fois en ligne.",
  },
  {
    q: "Le scanner me dit qu'un dossier n'est pas disponible hors ligne.",
    a: "Vous devez avoir consulté ce dossier au moins une fois en ligne (sa fiche ou l'écran Scanner) avant de pouvoir le scanner hors connexion.",
  },
  {
    q: "J'ai oublié mon mot de passe.",
    a: "Depuis l'écran de connexion, cliquez sur Mot de passe oublié et suivez les instructions reçues par email.",
  },
  {
    q: "Comment obtenir un compte ?",
    a: "Seul un administrateur peut créer votre compte, depuis Administration → Utilisateurs. Vous recevrez un email pour définir votre mot de passe.",
  },
];

export default async function AidePage() {
  const profile = await getCurrentProfile();
  const role = profile?.role ?? "agent";
  const canScan = role !== "auditeur";
  const canSeeAudit = role === "admin" || role === "auditeur";
  const isAdmin = role === "admin";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Aide</h1>
        <p className="text-sm text-muted-foreground">
          Comment utiliser l&apos;application, étape par étape.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-start gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Nouveau ici ?</p>
            <p className="text-sm text-muted-foreground">Revoyez le tutoriel de présentation en quelques étapes.</p>
          </div>
          <ReplayTourButton />
        </CardContent>
      </Card>

      <Section title="Se repérer dans l'application">
        <p className="text-sm text-muted-foreground">
          Une barre de navigation en bas de l&apos;écran donne accès aux rubriques disponibles pour votre rôle.
        </p>
        <InfoList items={NAV_REFERENCE} />
      </Section>

      <Section title="Gérer les dossiers">
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Depuis <strong className="text-foreground">Dossiers</strong>, recherchez par référence, titre ou
            propriétaire, et filtrez par statut, service ou type. Les boutons <strong className="text-foreground">PDF</strong>{" "}
            et <strong className="text-foreground">Excel</strong> exportent l&apos;ensemble des lignes filtrées, pas
            seulement celles affichées à l&apos;écran.
          </p>
          {canScan ? (
            <p>
              Cliquez sur <strong className="text-foreground">Nouveau</strong> pour créer un dossier : titre,
              propriétaire, type (qui détermine le nombre d&apos;étapes du circuit) et service initial. Une
              référence unique et un QR code sont générés automatiquement — imprimez l&apos;étiquette depuis la
              fiche du dossier (bouton <strong className="text-foreground">Étiquette QR</strong>) pour la coller sur
              le dossier physique.
            </p>
          ) : null}
          <p>
            La fiche d&apos;un dossier affiche sa progression (ex. « 1/2 »), ses informations et son historique
            complet des mouvements.
          </p>
        </div>
      </Section>

      {canScan ? (
        <Section title="Scanner un dossier" icon={ScanLine}>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Depuis <strong className="text-foreground">Scanner</strong>, scannez le QR code à la caméra ou
              saisissez la référence (<code className="rounded bg-muted px-1 py-0.5 text-xs">DOS-AAAA-NNNNN</code>).
              Vous pouvez aussi cliquer sur le bouton Scanner depuis la fiche d&apos;un dossier déjà ouverte.
            </p>
            <InfoList items={SCAN_ACTIONS} />
            <p>
              Une note optionnelle peut être ajoutée avant de confirmer. Après confirmation, l&apos;écran revient à
              la saisie pour enchaîner le scan suivant.
            </p>
          </div>
        </Section>
      ) : null}

      {canScan ? (
        <Section title="Fonctionnement hors ligne" icon={WifiOff}>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              L&apos;écran Scanner fonctionne même sans connexion. Chaque scan est d&apos;abord enregistré sur votre
              appareil ; s&apos;il n&apos;y a pas de réseau, il reste « en attente » (pastille sur l&apos;icône en
              haut de l&apos;écran) et s&apos;envoie automatiquement dès le retour de la connexion. Vous pouvez aussi
              forcer l&apos;envoi avec <strong className="text-foreground">Synchroniser maintenant</strong>.
            </p>
            <p>
              Limite à connaître : un dossier ne peut être scanné hors ligne que si vous l&apos;avez déjà consulté au
              moins une fois en ligne.
            </p>
          </div>
        </Section>
      ) : null}

      <Section title="Les alertes de retard" icon={Bell}>
        <p className="text-sm text-muted-foreground">
          Un dossier est signalé « en retard » quand le temps écoulé depuis son dernier mouvement dépasse le seuil
          défini pour son type. La vérification est automatique toutes les heures
          {isAdmin ? (
            <>
              , ou peut être déclenchée manuellement avec <strong className="text-foreground">Vérifier maintenant</strong>
            </>
          ) : null}
          .
        </p>
      </Section>

      {canSeeAudit ? (
        <Section title="L'audit et les exports" icon={ClipboardList}>
          <p className="text-sm text-muted-foreground">
            La rubrique <strong className="text-foreground">Audit</strong> liste tous les mouvements, tous dossiers
            et services confondus. Comme sur la liste des dossiers, les boutons PDF et Excel exportent
            l&apos;ensemble des lignes filtrées.
          </p>
        </Section>
      ) : null}

      {isAdmin ? (
        <Section title="Administration" icon={Settings}>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Services</strong> — les bureaux/départements entre lesquels les
              dossiers circulent.
            </p>
            <p>
              <strong className="text-foreground">Types de dossiers</strong> — définissent le circuit (nombre
              d&apos;étapes) et, en option, un seuil de retard.
            </p>
            <p>
              <strong className="text-foreground">Utilisateurs</strong> — invitez un compte (email, nom, rôle,
              service) ; un email est envoyé pour définir le mot de passe. Vous pouvez aussi modifier un rôle ou
              désactiver un compte.
            </p>
            <p>
              <strong className="text-foreground">Paramètres</strong> — nom et logo de l&apos;organisation, affichés
              dans l&apos;en-tête, les étiquettes QR et les exports.
            </p>
          </div>
        </Section>
      ) : null}

      <Section title="Rôles et permissions">
        <InfoList items={ROLE_PERMISSIONS} />
      </Section>

      <Section title="Questions fréquentes">
        <div className="divide-y">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group py-3 first:pt-0 last:pb-0">
              <summary className="cursor-pointer list-none text-sm font-medium marker:content-none">
                <span className="inline-flex w-full items-center justify-between gap-2">
                  {q}
                  <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden>
                    ⌄
                  </span>
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </Section>
    </div>
  );
}

/** Label/description pairs, stacked and wrapping — used instead of a data
 * table for reference content, since a fixed-column table forces
 * horizontal scrolling on the phone-sized viewports this app targets. */
function InfoList({ items }: { items: InfoItem[] }) {
  return (
    <div className="space-y-2">
      {items.map(({ icon: Icon, label, description }) => (
        <div key={label} className="rounded-lg border p-3">
          <p className="inline-flex items-center gap-2 text-sm font-medium">
            {Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
            {label}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      ))}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="size-4 text-muted-foreground" aria-hidden /> : null}
        <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      </div>
      <Separator />
      {children}
    </div>
  );
}
