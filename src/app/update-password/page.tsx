import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { getAppSettings } from "@/lib/data/app-settings";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function UpdatePasswordPage() {
  const settings = await getAppSettings();

  return (
    <AuthShell
      title="Nouveau mot de passe"
      description="Choisissez un nouveau mot de passe pour votre compte."
      orgName={settings.orgName}
      logoUrl={settings.logoUrl}
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
