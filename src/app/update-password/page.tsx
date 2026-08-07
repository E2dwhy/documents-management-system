import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default function UpdatePasswordPage() {
  return (
    <AuthShell
      title="Nouveau mot de passe"
      description="Choisissez un nouveau mot de passe pour votre compte."
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
