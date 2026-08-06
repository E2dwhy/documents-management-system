import { QrCode, WifiOff, ShieldCheck, History } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/date";

const FEATURES = [
  {
    icon: QrCode,
    title: "Suivi par QR code",
    description:
      "Chaque dossier reçoit un code QR unique, scanné à chaque changement de main.",
  },
  {
    icon: WifiOff,
    title: "Fonctionne hors ligne",
    description:
      "Les scans sont mis en file d'attente et synchronisés dès le retour du réseau.",
  },
  {
    icon: History,
    title: "Historique complet",
    description:
      "Chaque mouvement est journalisé pour un audit fiable et exportable.",
  },
  {
    icon: ShieldCheck,
    title: "Accès par rôle",
    description:
      "Administrateur, responsable de service, agent, auditeur : chacun voit ce qu'il doit voir.",
  },
] as const;

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight">
            Système de Suivi de Dossiers par QR Code
          </h1>
          <p className="text-sm text-muted-foreground">
            Base technique installée — {formatDateTime(new Date())}. La
            connexion à l&apos;espace de travail et l&apos;authentification
            arrivent dans une prochaine phase.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardHeader className="gap-1">
                <Icon className="size-5 text-primary" aria-hidden />
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
