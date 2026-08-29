import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, ListChecks, Star, Users } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { requireAdmin } from "@/lib/admin";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/referrals", label: "Referrals", icon: ListChecks },
  { href: "/admin/contacts", label: "Contacts", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await requireAdmin();

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[240px_1fr]">
      <aside className="hidden border-r bg-muted/20 md:block">
        <div className="flex h-full flex-col gap-6 p-6">
          <Link href="/admin" className="text-sm font-semibold">
            Perfect Catch Admin
          </Link>
          <nav className="flex flex-col gap-1 text-sm">
            {NAV.map((n) => {
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto flex items-center gap-3 rounded-md border p-3 text-sm">
            <UserButton />
            <div className="min-w-0">
              <p className="truncate font-medium">{me.name ?? me.email}</p>
              <p className="truncate text-xs text-muted-foreground">
                {me.role}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-4 md:hidden">
          <Link href="/admin" className="text-sm font-semibold">
            Perfect Catch Admin
          </Link>
          <UserButton />
        </header>
        <main className="flex flex-1 flex-col gap-6 p-6 md:p-8">
          {children}
        </main>
        <Separator className="md:hidden" />
        <nav className="flex justify-around border-t bg-muted/20 px-2 py-3 md:hidden">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className="flex flex-col items-center gap-1 text-xs text-muted-foreground"
              >
                <Icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
