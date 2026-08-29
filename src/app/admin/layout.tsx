import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

import { brandFor } from "@/lib/brand";
import { requireAdmin } from "@/lib/admin";

import { MobileTabBar, SidebarNav } from "./admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireAdmin();
  const brand = brandFor(null);

  return (
    <div className="grid min-h-screen w-full bg-pce-sky/40 md:grid-cols-[240px_1fr]">
      <aside className="hidden bg-pce-navy text-white md:block">
        <div className="sticky top-0 flex h-screen flex-col gap-6 p-5">
          <Link href="/admin" className="flex items-center gap-3">
            <Image src={brand.logo} alt="" width={120} height={68} className="h-auto w-[120px]" />
          </Link>
          <p className="-mt-3 font-display text-[13px] tracking-[1.5px] text-pce-teal">Rewards Admin</p>
          <SidebarNav />
          <div className="mt-auto flex items-center gap-3 rounded-lg bg-white/10 p-3 text-sm">
            <UserButton />
            <div className="min-w-0">
              <p className="truncate font-medium">{me.name ?? me.email}</p>
              <p className="truncate text-xs text-white/70">{me.role}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-pce-navy px-4 py-2.5 text-white md:hidden">
          <Link href="/admin" className="flex items-center gap-2">
            <Image src={brand.logo} alt="" width={84} height={48} className="h-auto w-[84px]" />
            <span className="font-display text-[12px] tracking-[1.5px] text-pce-teal">Admin</span>
          </Link>
          <UserButton />
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-8">{children}</main>
        <MobileTabBar />
      </div>
    </div>
  );
}
