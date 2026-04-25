import { UserButton } from "@clerk/nextjs";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getOrCreateReferrerForUser,
  getReferralStats,
  listReferralsForReferrer,
} from "@/lib/referrals";
import { ensureCurrentUser } from "@/lib/users";

import { ReferralForm } from "./referral-form";
import { ReferralPipeline } from "./referral-pipeline";
import { ShareLink } from "./share-link";

const dollarFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default async function DashboardPage() {
  const user = await ensureCurrentUser();
  const { referrer, campaign } = await getOrCreateReferrerForUser(user.id);
  const [stats, rows] = await Promise.all([
    getReferralStats(referrer.id),
    listReferralsForReferrer(referrer.id),
  ]);

  const rewardAmount = dollarFmt.format(Number(campaign.rewardAmount));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            LAZI Rewards
          </p>
          <h1 className="text-3xl font-bold">
            Welcome, {user.name?.split(" ")[0] ?? "there"}
          </h1>
        </div>
        <UserButton />
      </header>

      <Separator />

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Rewards earned</CardDescription>
            <CardTitle className="text-3xl">
              {dollarFmt.format(stats.totalEarningsCents / 100)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Earn {rewardAmount} per converted referral.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>In progress</CardDescription>
            <CardTitle className="text-3xl">
              {stats.pending + stats.inProgress}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            People you&rsquo;ve referred who haven&rsquo;t booked yet.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">{stats.completed}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Jobs that&rsquo;ve closed and rewards issued.
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Share your referral link</CardTitle>
            <CardDescription>
              Send it via text, email, or social — every conversion earns you{" "}
              {rewardAmount}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ShareLink
              link={referrer.referralLink}
              rewardAmount={rewardAmount}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Submit a referral</CardTitle>
            <CardDescription>
              Have someone in mind? Drop their info and we&rsquo;ll reach out.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReferralForm />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold">Your referrals</h2>
            <p className="text-sm text-muted-foreground">
              Status updates as our team contacts and books each one.
            </p>
          </div>
        </div>
        <ReferralPipeline rows={rows} />
      </section>
    </div>
  );
}
