"use client";

import { useState } from "react";
import { Monitor, RefreshCw, Smartphone } from "lucide-react";

import { cn } from "@/lib/utils";

type Mode = "phone" | "desktop";

/** Live iframe of a customer page with a phone / desktop toggle and reload. */
export function DevicePreview({ url, title }: { url: string; title: string }) {
  const [mode, setMode] = useState<Mode>("phone");
  const [nonce, setNonce] = useState(0);
  const src = `${url}${url.includes("?") ? "&" : "?"}preview=${nonce}`;

  return (
    <div className="flex flex-1 flex-col bg-pce-sky/40">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex gap-1 rounded-lg bg-white p-1" role="group" aria-label="Preview size">
          {(
            [
              ["phone", Smartphone, "Phone"],
              ["desktop", Monitor, "Desktop"],
            ] as const
          ).map(([m, Icon, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={cn(
                "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                mode === m ? "bg-pce-navy text-white" : "text-pce-body hover:bg-muted",
              )}
            >
              <Icon className="size-3.5" aria-hidden /> {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setNonce((n) => n + 1)}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-white px-2.5 text-xs font-medium text-pce-body hover:bg-muted"
        >
          <RefreshCw className="size-3.5" aria-hidden /> Reload
        </button>
      </div>
      <div className="flex justify-center overflow-x-auto px-3 pb-3">
        <div
          className={cn(
            "overflow-hidden rounded-[22px] border-[6px] border-[#1c1f24] bg-white shadow-[0_18px_40px_rgba(0,40,70,0.25)] transition-[width] duration-200",
            mode === "phone" ? "w-[390px]" : "w-full",
          )}
        >
          <iframe
            key={`${mode}-${nonce}`}
            src={src}
            title={`${title} preview`}
            className={cn("block w-full bg-white", mode === "phone" ? "h-[760px]" : "h-[720px]")}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      </div>
    </div>
  );
}
