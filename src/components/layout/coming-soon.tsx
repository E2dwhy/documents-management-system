import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
  phase,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
      <Icon className="size-8 text-muted-foreground" aria-hidden />
      <div className="space-y-1">
        <h1 className="text-base font-semibold">{title}</h1>
        <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
      </div>
      <p className="text-xs text-muted-foreground">Arrive en {phase}.</p>
    </div>
  );
}
