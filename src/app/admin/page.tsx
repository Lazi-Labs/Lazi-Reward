import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminStats } from "@/lib/admin";

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

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
      </section>
    </>
  );
}
