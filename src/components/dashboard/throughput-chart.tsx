"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartTooltipCard, ChartLegend } from "@/components/dashboard/chart-chrome";
import { formatDate } from "@/lib/date";
import type { ThroughputPoint } from "@/hooks/use-dashboard-stats";

const CREATED_COLOR = "var(--chart-1)";
const CLOSED_COLOR = "var(--chart-2)";

export function ThroughputChart({ throughput }: { throughput: ThroughputPoint[] }) {
  const hasData = throughput.some((p) => p.created > 0 || p.closed > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Débit (30 derniers jours)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {hasData ? (
          <>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={throughput} margin={{ left: -20, right: 8, top: 4, bottom: 4 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => formatDate(v).slice(0, 5)}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={24}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, label, payload }) => (
                      <ChartTooltipCard
                        active={active}
                        label={typeof label === "string" ? formatDate(label) : undefined}
                        items={(payload ?? []).map((p) => ({
                          name: p.name === "created" ? "Créés" : "Clôturés",
                          value: p.value as number,
                          color: p.name === "created" ? CREATED_COLOR : CLOSED_COLOR,
                        }))}
                      />
                    )}
                  />
                  <Line type="monotone" dataKey="created" stroke={CREATED_COLOR} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="closed" stroke={CLOSED_COLOR} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <ChartLegend items={[{ label: "Créés", color: CREATED_COLOR }, { label: "Clôturés", color: CLOSED_COLOR }]} />
          </>
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">Aucune donnée pour le moment.</p>
        )}
      </CardContent>
    </Card>
  );
}
