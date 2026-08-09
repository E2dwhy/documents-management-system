import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgNameForm } from "@/components/admin/org-name-form";
import { LogoUploader } from "@/components/admin/logo-uploader";
import { getAppSettings } from "@/lib/data/app-settings";

export const metadata: Metadata = { title: "Paramètres" };

export default async function AdminSettingsPage() {
  const settings = await getAppSettings();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground">
          Affichés dans l&apos;en-tête, les étiquettes QR et les exports.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Identité de l&apos;organisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <OrgNameForm orgName={settings.orgName} />
          <LogoUploader initialLogoUrl={settings.logoUrl} />
        </CardContent>
      </Card>
    </div>
  );
}
