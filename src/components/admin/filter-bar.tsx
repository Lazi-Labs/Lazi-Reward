"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type FilterOption = { value: string; label: string };

type Props = {
  /** Named select filters; each is a query param. */
  selects?: { param: string; label: string; options: FilterOption[] }[];
  /** Free-text search param name (omit to hide). */
  searchParam?: string;
  searchPlaceholder?: string;
  /** Period chips (days). */
  periods?: number[];
  className?: string;
};

/** URL-backed filter bar: every control writes to searchParams, so links are shareable. */
export function FilterBar({ selects = [], searchParam, searchPlaceholder, periods, className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(searchParam ? (sp.get(searchParam) ?? "") : "");

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(sp.toString());
      if (value && value !== "all") next.set(key, value);
      else next.delete(key);
      start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
    },
    [pathname, router, sp],
  );

  // Debounced search.
  useEffect(() => {
    if (!searchParam) return;
    const current = sp.get(searchParam) ?? "";
    if (q === current) return;
    const t = setTimeout(() => setParam(searchParam, q.trim() || null), 300);
    return () => clearTimeout(t);
  }, [q, searchParam, setParam, sp]);

  const activeCount =
    selects.filter((s) => sp.get(s.param)).length + (searchParam && sp.get(searchParam) ? 1 : 0);
  const period = sp.get("days") ?? String(periods?.[1] ?? 30);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border bg-card p-2 sm:flex-row sm:flex-wrap sm:items-center",
        pending && "opacity-70",
        className,
      )}
      role="search"
    >
      {searchParam ? (
        <label className="relative flex min-w-0 flex-1 items-center">
          <Search className="pointer-events-none absolute left-3 size-4 text-pce-muted" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder ?? "Search…"}
            aria-label={searchPlaceholder ?? "Search"}
            className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:h-10 sm:text-sm"
          />
        </label>
      ) : null}
      {selects.map((s) => (
        <label key={s.param} className="flex items-center gap-2 text-sm">
          <span className="sr-only">{s.label}</span>
          <select
            value={sp.get(s.param) ?? "all"}
            onChange={(e) => setParam(s.param, e.target.value)}
            aria-label={s.label}
            className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-base sm:h-10 sm:flex-none sm:text-sm"
          >
            <option value="all">All {s.label.toLowerCase()}</option>
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      {periods ? (
        <div className="flex gap-1 rounded-lg bg-muted p-1" role="group" aria-label="Period">
          {periods.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setParam("days", String(d))}
              aria-pressed={period === String(d)}
              className={cn(
                "h-9 min-w-11 cursor-pointer rounded-md px-3 text-sm font-medium transition-colors sm:h-8",
                period === String(d)
                  ? "bg-pce-navy text-white"
                  : "text-pce-body hover:bg-white hover:text-pce-ink",
              )}
            >
              {d === 365 ? "1y" : `${d}d`}
            </button>
          ))}
        </div>
      ) : null}
      {activeCount > 0 ? (
        <button
          type="button"
          onClick={() => {
            setQ("");
            start(() => router.replace(pathname, { scroll: false }));
          }}
          className="inline-flex h-11 cursor-pointer items-center gap-1 rounded-lg px-3 text-sm text-pce-muted hover:bg-muted hover:text-pce-ink sm:h-10"
        >
          <X className="size-4" aria-hidden /> Clear
        </button>
      ) : null}
    </div>
  );
}
