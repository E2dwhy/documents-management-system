import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from "@/lib/dossiers/status";
import type { DossierStatus } from "@/types/database";

export function DossierStatusBadge({ status, className }: { status: DossierStatus; className?: string }) {
  return (
    <Badge variant="secondary" className={cn(STATUS_BADGE_CLASSES[status], "border-0", className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
