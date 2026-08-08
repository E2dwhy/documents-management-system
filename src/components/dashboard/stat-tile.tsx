import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatTile({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone?: "default" | "critical";
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Icon
          className={cn("size-4 shrink-0", tone === "critical" && value > 0 ? "text-status-critical" : "text-muted-foreground")}
          aria-hidden
        />
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
      <p className={cn("mt-1 text-2xl font-semibold tabular-nums", tone === "critical" && value > 0 && "text-status-critical")}>
        {value}
      </p>
    </div>
  );
}
