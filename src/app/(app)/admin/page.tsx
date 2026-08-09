import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ChevronRight, FileType, Settings, Users } from "lucide-react";

export const metadata: Metadata = { title: "Administration" };

const SECTIONS = [
  {
    href: "/admin/services",
    icon: Building2,
    title: "Services",
    description: "Bureaux/départements entre lesquels les dossiers circulent.",
  },
  {
    href: "/admin/types",
    icon: FileType,
    title: "Types de dossiers",
    description: "Circuits de traitement (nombre d'étapes) et seuils de retard.",
  },
  {
    href: "/admin/utilisateurs",
    icon: Users,
    title: "Utilisateurs",
    description: "Inviter, assigner un rôle/service, activer/désactiver.",
  },
  {
    href: "/admin/parametres",
    icon: Settings,
    title: "Paramètres",
    description: "Nom et logo de l'organisation.",
  },
] as const;

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Administration</h1>

      <ul className="space-y-2">
        {SECTIONS.map(({ href, icon: Icon, title, description }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="size-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{title}</p>
                <p className="truncate text-xs text-muted-foreground">{description}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
