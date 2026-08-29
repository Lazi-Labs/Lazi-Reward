// Run with: pnpm db:seed (uses tsx --env-file=.env.local).
import { db } from "../src/db";
import { businesses, referralCampaigns } from "../src/db/schema";

const seedBusinesses = [
  {
    name: "LIV Pools",
    slug: "liv-pools",
    gmbUrl: null,
    reviewTemplate:
      "We had a great experience with LIV Pools — friendly, on-time, and great quality work.",
    avatar: null,
    isActive: true,
    sortOrder: 1,
  },
  {
    name: "Perfect Catch Electric",
    slug: "perfect-catch-electric",
    gmbUrl: "https://g.page/r/CUDCVygcLSPwEBM/review",
    reviewTemplate:
      "Perfect Catch Electric did fantastic work — clean, professional, and reasonably priced.",
    avatar: null,
    isActive: true,
    sortOrder: 2,
  },
] as const;

async function main() {
  console.log("Seeding businesses…");
  const inserted = await db
    .insert(businesses)
    .values([...seedBusinesses])
    .onConflictDoNothing({ target: businesses.slug })
    .returning();
  console.log(`  inserted ${inserted.length} businesses`);

  // For each business, ensure one default referral campaign exists.
  console.log("Seeding default referral campaigns…");
  const allBiz = await db.query.businesses.findMany();
  for (const biz of allBiz) {
    await db
      .insert(referralCampaigns)
      .values({
        businessId: biz.id,
        name: `${biz.name} — Refer a Friend`,
        slug: `${biz.slug}-refer-a-friend`,
        isActive: true,
        rewardAmount: "200.00",
        rewardType: "gift_card",
        conversionTrigger: "job_completion",
        description: `Refer a friend to ${biz.name} and earn a $200 gift card when they book their first job.`,
      })
      .onConflictDoNothing({ target: referralCampaigns.slug });
    console.log(`  ✓ ${biz.slug}-refer-a-friend`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
