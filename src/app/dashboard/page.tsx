import { UserButton } from "@clerk/nextjs";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ensureCurrentUser } from "@/lib/users";

export default async function DashboardPage() {
  const user = await ensureCurrentUser();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            LAZI Rewards
          </p>
          <h1 className="text-3xl font-bold">Welcome, {user.name ?? "there"}</h1>
        </div>
        <UserButton />
      </header>

      <Separator />

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Rewards earned</CardDescription>
            <CardTitle className="text-3xl">$0</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Earn $200 per converted referral.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pending referrals</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            People you&rsquo;ve referred who haven&rsquo;t booked yet.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Completed referrals</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Jobs that&rsquo;ve closed and rewards issued.
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Refer a friend, earn rewards</CardTitle>
          <CardDescription>
            Share your unique link. We&rsquo;ll handle the rest.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Your referral link will appear here once a campaign is active for
          your account. Coming in Phase 3.
        </CardContent>
      </Card>
    </div>
  );
}
