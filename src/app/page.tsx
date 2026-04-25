import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

import { buttonVariants } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <div className="max-w-2xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          LAZI Rewards
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Refer a friend. Earn real rewards.
        </h1>
        <p className="text-lg text-muted-foreground">
          The customer loyalty, referral, and review platform for LIV Pools and
          Perfect Catch Electric.
        </p>
      </div>

      <SignedOut>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
            Create your account
          </Link>
          <Link
            href="/sign-in"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            Sign in
          </Link>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
            Go to your dashboard
          </Link>
          <UserButton />
        </div>
      </SignedIn>

      <p className="pt-12 text-xs text-muted-foreground">
        Phase 0 scaffold · Next.js 16 · Clerk · Drizzle · Neon · shadcn/ui
      </p>
    </main>
  );
}
