import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

import { kitButton } from "@/components/brand/brand-frame";
import { brandFor } from "@/lib/brand";

export default async function HomePage() {
  const { userId } = await auth();
  const brand = brandFor(null);

  return (
    <main className="pce-wash flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <Image
        src={brand.logo}
        alt={brand.logoAlt}
        width={260}
        height={147}
        priority
        className="mb-8 h-auto w-[260px]"
      />
      <div className="pce-navy-card w-full max-w-2xl rounded-2xl border-b-[5px] border-b-pce-teal px-9 py-12 shadow-[0_20px_50px_rgba(0,40,70,0.28)]">
        <span className="mb-3 inline-block font-display text-[13px] tracking-[1.5px] text-pce-teal">
          Refer a Friend
        </span>
        <h1 className="mb-3 font-display text-4xl text-pce-cream sm:text-5xl">
          Refer a friend.
          <br />
          Earn real rewards.
        </h1>
        <p className="mx-auto mb-8 max-w-md text-lg leading-[1.6] text-white">
          Share Perfect Catch with someone you know. When their job is complete, you pick a gift
          card — on us.
        </p>
        {userId ? (
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/dashboard" className={kitButton.primary}>
              Go to your dashboard
            </Link>
            <UserButton />
          </div>
        ) : (
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/sign-up" className={kitButton.primary}>
              Create your account
            </Link>
            <Link href="/sign-in" className={kitButton.ghostOnNavy}>
              Sign in
            </Link>
          </div>
        )}
      </div>
      <p className="mt-6 text-[13.5px] text-pce-muted">
        {brand.longName} ·{" "}
        <a href={brand.phoneHref} className="font-bold text-pce-coral">
          {brand.phone}
        </a>
      </p>
    </main>
  );
}
