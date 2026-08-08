"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltipCard } from "@/components/dashboard/chart-chrome";
import type { ServiceBreakdown } from "@/hooks/use-dashboard-stats";

const CHART_COLOR_VARS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const MAX_SERIES = 5; // beyond this, fold into "Autres" rather than cycling colors (dataviz skill)

export function ServiceBreakdownChart({ byService }: { byService: ServiceBreakdown[] }) {
  const top = byService.slice(0, MAX_SERIES);
  const restCount = byService.slice(MAX_SERIES).reduce((sum, s) => sum + s.count, 0);
  const data = [
    ...top.map((s, i) => ({ label: s.serviceName, value: s.count, color: CHART_COLOR_VARS[i] })),
    ...(restCount > 0 ? [{ label: "Autres", value: restCount, color: "var(--muted-foreground)" }] : []),
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Dossiers par service</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={100}
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
                    <Cell key={d.label} fill={d.color} />
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
