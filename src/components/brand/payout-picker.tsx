"use client";

import { PAYOUT_OPTIONS, type PayoutOption } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Small vector tiles for each payout option — ported from the design template. */
function PayoutIcon({ id }: { id: string }) {
  const tile = "inline-flex size-8 flex-none items-center justify-center rounded-lg";
  switch (id) {
    case "mastercard":
      return (
        <span className={cn(tile, "bg-[#252B37]")}>
          <span className="-mr-[5px] size-[13px] rounded-full bg-[#EB001B]" />
          <span className="size-[13px] rounded-full bg-[#F79E1B] opacity-90" />
        </span>
      );
    case "amazon":
      return (
        <span className={cn(tile, "flex-col border border-[#E3E8EE] bg-white")}>
          <span className="font-[Arial] text-[17px] font-extrabold leading-[15px] text-[#131921]">a</span>
          <span className="h-[5px] w-[13px] rounded-b-[7px] border-b-[2.5px] border-[#FF9900]" />
        </span>
      );
    case "venmo":
      return (
        <span className={cn(tile, "bg-[#3D95CE]")}>
          <span className="font-[Arial] text-base font-extrabold italic leading-none text-white">V</span>
        </span>
      );
    case "cashapp":
      return (
        <span className={cn(tile, "bg-[#00D632]")}>
          <span className="font-[Arial] text-base font-extrabold leading-none text-white">$</span>
        </span>
      );
    case "bank":
      return (
        <span className={cn(tile, "flex-col border border-[#E3E8EE] bg-[#EEF3F8]")}>
          <span className="h-0 w-0 border-x-[7px] border-b-[5px] border-x-transparent border-b-[#253044]" />
          <span className="mt-px h-[7px] w-[14px] bg-[repeating-linear-gradient(90deg,#253044_0_2.5px,transparent_2.5px_5px)]" />
          <span className="mt-px h-[2.5px] w-4 bg-[#253044]" />
        </span>
      );
    default:
      return (
        <span className={cn(tile, "bg-[#E93B52]")}>
          <span className="text-[15px] leading-none text-white">♥</span>
        </span>
      );
  }
}

type Props = {
  value: string;
  onChange: (id: string) => void;
  /** Label tone: dark card (navy) or light card. */
  tone?: "light" | "dark";
  className?: string;
};

function Group({
  label,
  options,
  value,
  onChange,
  tone,
}: {
  label: string;
  options: PayoutOption[];
  value: string;
  onChange: (id: string) => void;
  tone: "light" | "dark";
}) {
  return (
    <div>
      <p
        className={cn(
          "mb-2 text-xs font-bold uppercase tracking-[1.2px]",
          tone === "dark" ? "text-pce-sky-deep" : "text-pce-muted",
        )}
      >
        {label}
      </p>
      {options.map((o) => {
        const selected = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={selected}
            className="mb-2.5 flex w-full items-center gap-3 rounded-xl border border-pce-line border-b-[3px] bg-white px-3.5 py-[11px] text-left transition-colors hover:bg-pce-sky/40"
          >
            <PayoutIcon id={o.id} />
            <span className="flex-1">
              <span className="block text-[15.5px] font-bold text-pce-ink">{o.name}</span>
              <span className="block text-[13px] text-pce-muted">{o.note}</span>
            </span>
            <span
              className={cn(
                "size-[18px] flex-none rounded-full border-2 border-[#9DB4C6] transition-[border]",
                selected && "border-[6px] border-pce-coral",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export function PayoutPicker({ value, onChange, tone = "light", className }: Props) {
  return (
    <div className={cn("space-y-3", className)}>
      <Group
        label="Reward options"
        options={PAYOUT_OPTIONS.filter((o) => o.group === "card")}
        value={value}
        onChange={onChange}
        tone={tone}
      />
      <Group
        label="Or direct deposit, donate"
        options={PAYOUT_OPTIONS.filter((o) => o.group === "deposit")}
        value={value}
        onChange={onChange}
        tone={tone}
      />
    </div>
  );
}
