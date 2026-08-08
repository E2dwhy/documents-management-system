"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltipCard } from "@/components/dashboard/chart-chrome";
import { STATUS_CHART_COLORS, STATUS_LABELS } from "@/lib/dossiers/status";
import type { DossierStatus } from "@/types/database";

export function StatusBreakdownChart({ byStatus }: { byStatus: Record<DossierStatus, number> }) {
  const data = (Object.keys(STATUS_LABELS) as DossierStatus[]).map((status) => ({
    status,
    label: STATUS_LABELS[status],
    value: byStatus[status],
    color: STATUS_CHART_COLORS[status],
  }));

  const hasData = data.some((d) => d.value > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Dossiers par statut</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={80}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  content={({ active, payload }) => (
                    <ChartTooltipCard
                      active={active}
                      items={(payload ?? []).map((p) => ({
                        name: (p.payload as { label: string }).label,
                        value: p.value as number,
                        color: (p.payload as { color: string }).color,
                      }))}
                    />
                  )}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {data.map((d) => (
                    <Cell key={d.status} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">Aucune donnée pour le moment.</p>
        )}
      </CardContent>
    </Card>
  );
}
