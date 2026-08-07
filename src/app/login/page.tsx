import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthShell
      title="Connexion"
      description="Suivi de dossiers par QR code — accédez à votre espace."
      footer={
        <>
          Besoin d&apos;un compte ?{" "}
          <span className="text-foreground">Contactez votre administrateur.</span>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
