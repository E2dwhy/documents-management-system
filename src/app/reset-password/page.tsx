import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { RequestResetForm } from "@/components/auth/request-reset-form";
import { getAppSettings } from "@/lib/data/app-settings";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default async function ResetPasswordPage() {
  const settings = await getAppSettings();

  return (
    <AuthShell
      title="Mot de passe oublié"
      description="Saisissez votre email pour recevoir un lien de réinitialisation."
      orgName={settings.orgName}
      logoUrl={settings.logoUrl}
      footer={
        <Link href="/login" className="inline-flex items-center gap-1 underline underline-offset-2">
          <ArrowLeft className="size-3.5" aria-hidden />
          Retour à la connexion
        </Link>
      }
    >
      <RequestResetForm />
    </AuthShell>
  );
}
