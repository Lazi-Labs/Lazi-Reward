import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminStats } from "@/lib/admin";
import { giftStats } from "@/lib/gifts";
import { getBalance, isTremendousConfigured, isTremendousSandbox } from "@/lib/tremendous";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default async function AdminOverviewPage() {
  const [stats, gifts, balance] = await Promise.all([
    getAdminStats(),
    giftStats(),
    isTremendousConfigured() ? getBalance() : Promise.resolve(null),
  ]);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Active referral and contact activity at a glance.
        </p>
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total referrals</CardDescription>
            <CardTitle className="text-3xl">{stats.totalReferrals}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Across all customers and campaigns.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">
              {stats.completedReferrals}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Closed jobs eligible for reward payout.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Contacts</CardDescription>
            <CardTitle className="text-3xl">{stats.totalContacts}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Total people in the CRM.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Gift cards this month</CardDescription>
            <CardTitle className="text-3xl">
              {gifts.monthCount}{" "}
              <span className="text-base font-normal text-muted-foreground">
                · {money.format(gifts.monthTotal)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {gifts.failedCount > 0 ? (
              <span className="text-pce-red-deep">{gifts.failedCount} failed — see Reviews.</span>
            ) : (
              "Unconditional thank-yous sent with review requests."
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>
              Tremendous balance{isTremendousSandbox() ? " (sandbox)" : ""}
            </CardDescription>
            <CardTitle className="text-3xl">
              {balance === null ? "—" : money.format(balance)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {isTremendousConfigured()
              ? "Available funds for gift cards."
              : "Not configured — set TREMENDOUS_API_KEY."}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
