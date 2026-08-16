import type { LucideIcon } from "lucide-react";
import { Bell, ClipboardList, FolderOpen, LayoutDashboard, ScanLine, Settings, Sparkles, WifiOff } from "lucide-react";
import type { UserRole } from "@/types/database";

export interface OnboardingStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Same source data drives both the auto-shown first-login tour and the
 * "Revoir le tutoriel" replay from /aide — one list, filtered by role so
 * nobody sees a step for a screen they can't reach (mirrors the role
 * filtering in nav-items.ts: auditeur has no Scanner, only admin has
 * Administration).
 */
export function getOnboardingSteps(role: UserRole, firstName: string): OnboardingStep[] {
  const canScan = role !== "auditeur";
  const canSeeAudit = role === "admin" || role === "auditeur";
  const isAdmin = role === "admin";

  const steps: OnboardingStep[] = [
    {
      icon: Sparkles,
      title: firstName ? `Bienvenue, ${firstName}` : "Bienvenue",
      description:
        "Ce court tutoriel présente l'essentiel en quelques étapes. Vous pourrez le revoir à tout moment depuis Aide.",
    },
    {
      icon: LayoutDashboard,
      title: "Tableau de bord",
      description:
        "Votre écran d'accueil : un résumé des dossiers en cours, en retard, et leur répartition par statut.",
    },
    {
      icon: FolderOpen,
      title: "Dossiers",
      description: canScan
        ? "Consultez, recherchez, créez un dossier et imprimez son étiquette QR à coller sur le dossier physique."
        : "Consultez, recherchez et exportez la liste des dossiers en PDF ou Excel.",
    },
  ];

  if (canScan) {
    steps.push(
      {
        icon: ScanLine,
        title: "Scanner",
        description:
          "Scannez le QR d'un dossier (ou saisissez sa référence) pour enregistrer un transfert, une validation ou un rejet.",
      },
      {
        icon: WifiOff,
        title: "Fonctionnement hors ligne",
        description:
          "Pas de réseau ? Vos scans restent en attente sur votre appareil et s'envoient automatiquement dès la reconnexion — rien n'est perdu.",
      },
    );
  }

  if (canSeeAudit) {
    steps.push({
      icon: ClipboardList,
      title: "Audit",
      description: "L'historique complet de tous les mouvements, tous dossiers confondus, avec export PDF/Excel.",
    });
  }

  steps.push({
    icon: Bell,
    title: "Alertes",
    description: "Les dossiers sans mouvement depuis trop longtemps apparaissent ici automatiquement.",
  });

  if (isAdmin) {
    steps.push({
      icon: Settings,
      title: "Administration",
      description: "Gérez les services, les types de dossiers, les utilisateurs et les paramètres de l'organisation.",
    });
  }

  steps.push({
    icon: Sparkles,
    title: "Vous êtes prêt·e !",
    description: "Retrouvez ce tutoriel et le guide complet à tout moment depuis Aide, en haut de l'écran.",
  });

  return steps;
}
