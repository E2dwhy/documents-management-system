/**
 * Shared tooltip + legend for every dashboard chart, so mark specs (a
 * small card, muted-ink labels, a colored swatch carrying identity — never
 * colored text) stay identical across all three rather than each chart
 * reinventing its own.
 */
export function ChartTooltipCard({
  active,
  label,
  items,
}: {
  active?: boolean;
  label?: string;
  items: { name: string; value: string | number; color: string }[];
}) {
  if (!active || items.length === 0) return null;

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      {label ? <p className="mb-1 font-medium text-popover-foreground">{label}</p> : null}
      <dl className="space-y-0.5">
        {items.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
            <dt className="text-muted-foreground">{item.name}</dt>
            <dd className="ml-auto font-medium text-popover-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
