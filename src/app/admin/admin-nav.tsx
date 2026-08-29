"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Eye, Gift, LayoutDashboard, ListChecks, Star, Users, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export const ADMIN_NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/gifts", label: "Gifts", icon: Gift },
  { href: "/admin/referrals", label: "Referrals", icon: ListChecks },
  { href: "/admin/contacts", label: "Contacts", icon: Users },
  { href: "/admin/preview", label: "Preview", icon: Eye },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 text-sm" aria-label="Admin">
      {ADMIN_NAV.map((n) => {
        const Icon = n.icon;
        const active = isActive(pathname, n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 items-center gap-2.5 rounded-lg px-3 transition-colors",
              active
                ? "bg-white/15 font-semibold text-white"
                : "text-white/75 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="size-4" aria-hidden /> {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Bottom tab bar for phones — 44px+ targets, safe-area aware. */
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="sticky bottom-0 z-30 grid grid-cols-6 border-t bg-pce-navy pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Admin"
    >
      {ADMIN_NAV.map((n) => {
        const Icon = n.icon;
        const active = isActive(pathname, n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
              active ? "text-pce-cream" : "text-white/70 hover:text-white",
            )}
          >
            <Icon className={cn("size-5", active && "text-pce-teal")} aria-hidden />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
