import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function KpiTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "good" | "warn" | "brand";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 ring-1 ring-foreground/5",
        tone === "warn" && "border-pce-red-deep/30 bg-pce-cream/40",
        tone === "good" && "border-pce-teal/40",
        tone === "brand" && "bg-pce-navy text-white ring-0",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            "text-[11px] font-bold uppercase tracking-[1.2px]",
            tone === "brand" ? "text-pce-sky-deep" : "text-pce-muted",
          )}
        >
          {label}
        </p>
        {Icon ? (
          <Icon
            className={cn("size-4", tone === "brand" ? "text-pce-teal" : "text-pce-muted")}
            aria-hidden
          />
        ) : null}
      </div>
      <p
        className={cn(
          "mt-1 font-display text-[32px] leading-none",
          tone === "brand" ? "text-pce-cream" : "text-pce-navy",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className={cn("mt-1.5 text-xs", tone === "brand" ? "text-white/80" : "text-pce-body")}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Horizontal funnel: each step shows count + % of the first step. */
export function FunnelBars({
  steps,
}: {
  steps: { label: string; value: number; hint?: string }[];
}) {
  const base = steps[0]?.value || 0;
  return (
    <ol className="space-y-2.5">
      {steps.map((s, i) => {
        const pct = base ? Math.round((s.value / base) * 100) : 0;
        return (
          <li key={s.label} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
            <div>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="font-medium text-pce-ink">{s.label}</span>
                <span className="text-xs text-pce-muted">
                  {s.value.toLocaleString()}
                  {i > 0 ? ` · ${pct}%` : ""}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-pce-sky">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-300",
                    i === 0 ? "bg-pce-navy" : i === steps.length - 1 ? "bg-pce-coral" : "bg-pce-teal",
                  )}
                  style={{ width: `${base ? Math.max(pct, s.value ? 3 : 0) : 0}%` }}
                />
              </div>
              {s.hint ? <p className="mt-0.5 text-[11px] text-pce-muted">{s.hint}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function RatingBars({ distribution }: { distribution: Record<1 | 2 | 3 | 4 | 5, number> }) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  return (
    <ul className="space-y-1.5">
      {([5, 4, 3, 2, 1] as const).map((r) => {
        const n = distribution[r];
        const pct = total ? Math.round((n / total) * 100) : 0;
        return (
          <li key={r} className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2 text-xs">
            <span className="font-semibold text-pce-ink">
              {r}
              <span className="text-[#F5A623]">★</span>
            </span>
            <div className="h-2 overflow-hidden rounded-full bg-pce-sky">
              <div
                className={cn("h-full rounded-full", r >= 4 ? "bg-pce-teal" : "bg-pce-coral")}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-right text-pce-muted">{n}</span>
          </li>
        );
      })}
    </ul>
  );
}
