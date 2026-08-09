import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgBrand } from "@/components/layout/org-brand";
import { appConfig } from "@/lib/config";

export function AuthShell({
  title,
  description,
  children,
  footer,
  orgName = appConfig.orgName,
  logoUrl = null,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  orgName?: string;
  logoUrl?: string | null;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <OrgBrand orgName={orgName} logoUrl={logoUrl} className="flex items-center gap-2 text-sm font-semibold" />

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>

      {footer ? <div className="text-center text-sm text-muted-foreground">{footer}</div> : null}
    </main>
  );
}
