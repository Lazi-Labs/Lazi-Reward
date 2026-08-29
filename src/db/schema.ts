import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ── Enum string unions (use with z.enum or column check constraints) ─────────

export const userRoles = ["customer", "staff", "admin"] as const;
export type UserRole = (typeof userRoles)[number];

export const contactSources = [
  "referral",
  "review",
  "manual",
  "import",
] as const;
export type ContactSource = (typeof contactSources)[number];

export const referralStatuses = [
  "pending",
  "clicked",
  "signed_up",
  "contacted",
  "hired",
  "completed",
  "rejected",
  "cancelled",
] as const;
export type ReferralStatus = (typeof referralStatuses)[number];

export const rewardStatuses = [
  "pending",
  "processing",
  "issued",
  "failed",
] as const;
export type RewardStatus = (typeof rewardStatuses)[number];

export const rewardTypes = ["cash", "credit", "gift_card"] as const;
export type RewardType = (typeof rewardTypes)[number];

export const submissionStatuses = [
  "pending",
  "waiting_for_screenshot",
  "verified",
  "rejected",
  "completed",
] as const;
export type SubmissionStatus = (typeof submissionStatuses)[number];

export const reviewSources = [
  "google",
  "facebook",
  "yelp",
  "internal",
] as const;
export type ReviewSource = (typeof reviewSources)[number];

export const commChannels = ["sms", "email", "call", "note", "system"] as const;
export type CommChannel = (typeof commChannels)[number];

export const commDirections = ["inbound", "outbound"] as const;
export type CommDirection = (typeof commDirections)[number];

export const reviewRequestStatuses = [
  "queued",
  "sent",
  "clicked",
  "submitted",
  "failed",
] as const;
export type ReviewRequestStatus = (typeof reviewRequestStatuses)[number];

export const giftCardSources = ["review_request", "manual", "referral"] as const;
export type GiftCardSource = (typeof giftCardSources)[number];

export const giftCardStatuses = ["created", "delivered", "failed", "canceled"] as const;
export type GiftCardStatus = (typeof giftCardStatuses)[number];

export const giftDeliveryChannels = ["sms", "email", "manual"] as const;
export type GiftDeliveryChannel = (typeof giftDeliveryChannels)[number];

// ── Users (shadow table — Clerk owns identity) ───────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: text("clerk_user_id").notNull().unique(),
    email: text("email").notNull(),
    name: text("name"),
    phone: text("phone"),
    role: text("role").$type<UserRole>().notNull().default("customer"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("users_email_idx").on(table.email),
    index("users_role_idx").on(table.role),
  ],
);

// ── Businesses ───────────────────────────────────────────────────────────────

export const businesses = pgTable(
  "businesses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    gmbUrl: text("gmb_url"),
    reviewTemplate: text("review_template"),
    avatar: text("avatar"),
    // Unconditional thank-you gift sent with every review request (not tied to
    // the review — see design/README.md, "reward the job, not the review").
    giftAmount: numeric("gift_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("10.00"),
    tremendousCampaignId: text("tremendous_campaign_id"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("businesses_active_idx").on(table.isActive)],
);

// ── Contacts (CRM) ───────────────────────────────────────────────────────────

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    linkedUserId: uuid("linked_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ownerUserId: uuid("owner_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    source: text("source").$type<ContactSource>().notNull().default("manual"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Postgres UNIQUE permits multiple NULLs per group, so these do
    // not block contacts that omit email/phone.
    uniqueIndex("contacts_business_email_unique").on(
      table.businessId,
      table.email,
    ),
    uniqueIndex("contacts_business_phone_unique").on(
      table.businessId,
      table.phone,
    ),
    index("contacts_owner_idx").on(table.ownerUserId),
  ],
);

// ── Referral Campaigns ───────────────────────────────────────────────────────

export const referralCampaigns = pgTable(
  "referral_campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").references(() => businesses.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    isActive: boolean("is_active").notNull().default(true),
    rewardAmount: numeric("reward_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("200.00"),
    rewardType: text("reward_type")
      .$type<RewardType>()
      .notNull()
      .default("gift_card"),
    conversionTrigger: text("conversion_trigger").notNull().default(
      "job_completion",
    ), // signup | job_completion | payment
    description: text("description"),
    termsConditions: text("terms_conditions"),
    settings: jsonb("settings").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("campaigns_active_idx").on(table.isActive),
    index("campaigns_business_idx").on(table.businessId),
  ],
);

// ── Referrers (one row per user-per-campaign) ────────────────────────────────

export const referrers = pgTable(
  "referrers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => referralCampaigns.id, { onDelete: "cascade" }),
    referralCode: varchar("referral_code", { length: 12 }).notNull().unique(),
    referralLink: text("referral_link").notNull(),
    qrCodePath: text("qr_code_path"),
    totalReach: integer("total_reach").notNull().default(0), // clicks
    totalReferrals: integer("total_referrals").notNull().default(0), // signups
    convertedReferrals: integer("converted_referrals").notNull().default(0),
    totalEarnings: numeric("total_earnings", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    source: text("source").notNull().default("direct"), // direct | referred | social
    referredById: uuid("referred_by_id"),
    qualifiedAt: timestamp("qualified_at", { withTimezone: true }),
    preferredPayoutMethod: text("preferred_payout_method"),
    payoutEmail: text("payout_email"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("referrers_user_campaign_unique").on(
      table.userId,
      table.campaignId,
    ),
    index("referrers_qualified_idx").on(table.qualifiedAt),
  ],
);

// ── Referrals (the actual referred-person record) ────────────────────────────

export const referrals = pgTable(
  "referrals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referrerId: uuid("referrer_id")
      .notNull()
      .references(() => referrers.id, { onDelete: "cascade" }),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => referralCampaigns.id, { onDelete: "cascade" }),
    referredContactId: uuid("referred_contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    referredUserId: uuid("referred_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: text("status")
      .$type<ReferralStatus>()
      .notNull()
      .default("pending"),
    referrerNote: text("referrer_note"),
    clickedAt: timestamp("clicked_at", { withTimezone: true }),
    signedUpAt: timestamp("signed_up_at", { withTimezone: true }),
    contactedAt: timestamp("contacted_at", { withTimezone: true }),
    hiredAt: timestamp("hired_at", { withTimezone: true }),
    convertedAt: timestamp("converted_at", { withTimezone: true }),
    rewardedAt: timestamp("rewarded_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    source: text("source"), // direct | social | email | sms
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("referrals_referrer_status_idx").on(table.referrerId, table.status),
    index("referrals_campaign_idx").on(table.campaignId),
    index("referrals_status_idx").on(table.status),
  ],
);

// ── Referral Clicks (analytics) ──────────────────────────────────────────────

export const referralClicks = pgTable(
  "referral_clicks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referrerId: uuid("referrer_id")
      .notNull()
      .references(() => referrers.id, { onDelete: "cascade" }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    refererUrl: text("referer_url"),
    country: varchar("country", { length: 2 }),
    city: text("city"),
    deviceType: text("device_type"), // mobile | desktop | tablet
    browser: text("browser"),
    os: text("os"),
    converted: boolean("converted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("clicks_referrer_created_idx").on(table.referrerId, table.createdAt),
  ],
);

// ── Referral Rewards ─────────────────────────────────────────────────────────

export const referralRewards = pgTable(
  "referral_rewards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referrerId: uuid("referrer_id")
      .notNull()
      .references(() => referrers.id, { onDelete: "cascade" }),
    referralId: uuid("referral_id")
      .notNull()
      .references(() => referrals.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    type: text("type").$type<RewardType>().notNull(),
    status: text("status")
      .$type<RewardStatus>()
      .notNull()
      .default("pending"),
    paymentMethod: text("payment_method"),
    paymentReference: text("payment_reference"),
    paymentDetails: text("payment_details"),
    failureReason: text("failure_reason"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("rewards_referrer_idx").on(table.referrerId),
    index("rewards_status_idx").on(table.status),
  ],
);

// ── Gift card products (Tremendous catalog) ──────────────────────────────────

export const giftCardProducts = pgTable("gift_card_products", {
  id: uuid("id").primaryKey().defaultRandom(),
  tremendousProductId: text("tremendous_product_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  category: text("category"),
  minValue: numeric("min_value", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  maxValue: numeric("max_value", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  currencyCode: varchar("currency_code", { length: 3 }).notNull().default(
    "USD",
  ),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Photos ───────────────────────────────────────────────────────────────────

export const photos = pgTable(
  "photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").references(() => businesses.id, {
      onDelete: "set null",
    }),
    uploadedByUserId: uuid("uploaded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    filePath: text("file_path").notNull(),
    fileSize: integer("file_size"),
    mimeType: text("mime_type"),
    isUsed: boolean("is_used").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("photos_business_idx").on(table.businessId)],
);

// ── Reviews (text content + media) ───────────────────────────────────────────

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").references(() => businesses.id, {
      onDelete: "cascade",
    }),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    photoId: uuid("photo_id").references(() => photos.id, {
      onDelete: "set null",
    }),
    rating: smallint("rating"),
    content: text("content").notNull(),
    source: text("source").$type<ReviewSource>().notNull().default("internal"),
    externalReviewId: text("external_review_id"),
    externalUrl: text("external_url"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("reviews_business_source_idx").on(table.businessId, table.source),
  ],
);

// ── Submissions (review wizard pipeline + Tremendous fulfillment) ────────────

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    reviewId: uuid("review_id").references(() => reviews.id, {
      onDelete: "set null",
    }),
    photoId: uuid("photo_id").references(() => photos.id, {
      onDelete: "set null",
    }),
    giftCardProductId: uuid("gift_card_product_id").references(
      () => giftCardProducts.id,
      { onDelete: "set null" },
    ),
    token: text("token").notNull().unique(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    status: text("status")
      .$type<SubmissionStatus>()
      .notNull()
      .default("pending"),
    reviewContent: text("review_content"),
    verificationStatus: text("verification_status"), // pending | verified | rejected
    rewardDeliveryMethod: text("reward_delivery_method"), // email | sms
    tremendousOrderId: text("tremendous_order_id"),
    tremendousRecipientEmail: text("tremendous_recipient_email"),
    reviewReservationToken: text("review_reservation_token"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("submissions_business_status_idx").on(
      table.businessId,
      table.status,
    ),
    index("submissions_contact_idx").on(table.contactId),
  ],
);

// ── Communication logs (CRM activity feed) ───────────────────────────────────

export const communicationLogs = pgTable(
  "communication_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    channel: text("channel").$type<CommChannel>().notNull(),
    direction: text("direction").$type<CommDirection>().notNull(),
    subject: text("subject"),
    body: text("body"),
    externalRef: text("external_ref"), // e.g. Twilio SID
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("comm_contact_occurred_idx").on(table.contactId, table.occurredAt),
  ],
);

// ── Tasks (staff follow-ups) ─────────────────────────────────────────────────

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "cascade",
    }),
    referralId: uuid("referral_id").references(() => referrals.id, {
      onDelete: "cascade",
    }),
    assignedUserId: uuid("assigned_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    notes: text("notes"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("tasks_assigned_due_idx").on(
      table.assignedUserId,
      table.completedAt,
      table.dueAt,
    ),
  ],
);

// ── Review Requests (post-conversion automation) ─────────────────────────────

export const reviewRequests = pgTable(
  "review_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    referralId: uuid("referral_id").references(() => referrals.id, {
      onDelete: "set null",
    }),
    submissionId: uuid("submission_id").references(() => submissions.id, {
      onDelete: "set null",
    }),
    channel: text("channel").$type<CommChannel>().notNull(),
    template: text("template"),
    status: text("status")
      .$type<ReviewRequestStatus>()
      .notNull()
      .default("queued"),
    token: text("token").notNull().unique(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    clickedAt: timestamp("clicked_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("requests_contact_idx").on(table.contactId),
    index("requests_status_idx").on(table.status),
  ],
);

// ── Gift cards (Tremendous fulfilment ledger) ───────────────────────────────

export const giftCards = pgTable(
  "gift_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    reviewRequestId: uuid("review_request_id")
      .unique()
      .references(() => reviewRequests.id, { onDelete: "set null" }),
    source: text("source").$type<GiftCardSource>().notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    currencyCode: varchar("currency_code", { length: 3 }).notNull().default("USD"),
    status: text("status").$type<GiftCardStatus>().notNull().default("created"),
    /** Idempotency key sent to Tremendous as external_id. */
    externalId: text("external_id").notNull().unique(),
    tremendousOrderId: text("tremendous_order_id"),
    tremendousRewardId: text("tremendous_reward_id"),
    redemptionLink: text("redemption_link"),
    campaignId: text("campaign_id"),
    deliveryChannel: text("delivery_channel").$type<GiftDeliveryChannel>(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    failureReason: text("failure_reason"),
    lastWebhookUuid: text("last_webhook_uuid"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("gift_cards_contact_idx").on(table.contactId),
    index("gift_cards_status_idx").on(table.status),
    index("gift_cards_reward_idx").on(table.tremendousRewardId),
  ],
);

// ── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  referrers: many(referrers),
  ownedContacts: many(contacts, { relationName: "contactOwner" }),
  linkedContacts: many(contacts, { relationName: "contactUser" }),
  comms: many(communicationLogs),
  assignedTasks: many(tasks, { relationName: "taskAssignee" }),
}));

export const businessesRelations = relations(businesses, ({ many }) => ({
  contacts: many(contacts),
  campaigns: many(referralCampaigns),
  reviews: many(reviews),
  submissions: many(submissions),
  reviewRequests: many(reviewRequests),
  photos: many(photos),
  giftCards: many(giftCards),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  business: one(businesses, {
    fields: [contacts.businessId],
    references: [businesses.id],
  }),
  owner: one(users, {
    fields: [contacts.ownerUserId],
    references: [users.id],
    relationName: "contactOwner",
  }),
  linkedUser: one(users, {
    fields: [contacts.linkedUserId],
    references: [users.id],
    relationName: "contactUser",
  }),
  comms: many(communicationLogs),
  tasks: many(tasks),
  referralsAsReferred: many(referrals),
  reviewRequests: many(reviewRequests),
}));

export const referralCampaignsRelations = relations(
  referralCampaigns,
  ({ one, many }) => ({
    business: one(businesses, {
      fields: [referralCampaigns.businessId],
      references: [businesses.id],
    }),
    referrers: many(referrers),
    referrals: many(referrals),
  }),
);

export const referrersRelations = relations(referrers, ({ one, many }) => ({
  user: one(users, {
    fields: [referrers.userId],
    references: [users.id],
  }),
  campaign: one(referralCampaigns, {
    fields: [referrers.campaignId],
    references: [referralCampaigns.id],
  }),
  referrals: many(referrals),
  clicks: many(referralClicks),
  rewards: many(referralRewards),
}));

export const referralsRelations = relations(referrals, ({ one, many }) => ({
  referrer: one(referrers, {
    fields: [referrals.referrerId],
    references: [referrers.id],
  }),
  campaign: one(referralCampaigns, {
    fields: [referrals.campaignId],
    references: [referralCampaigns.id],
  }),
  referredContact: one(contacts, {
    fields: [referrals.referredContactId],
    references: [contacts.id],
  }),
  rewards: many(referralRewards),
  tasks: many(tasks),
}));

export const referralClicksRelations = relations(referralClicks, ({ one }) => ({
  referrer: one(referrers, {
    fields: [referralClicks.referrerId],
    references: [referrers.id],
  }),
}));

export const referralRewardsRelations = relations(
  referralRewards,
  ({ one }) => ({
    referrer: one(referrers, {
      fields: [referralRewards.referrerId],
      references: [referrers.id],
    }),
    referral: one(referrals, {
      fields: [referralRewards.referralId],
      references: [referrals.id],
    }),
  }),
);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  business: one(businesses, {
    fields: [reviews.businessId],
    references: [businesses.id],
  }),
  contact: one(contacts, {
    fields: [reviews.contactId],
    references: [contacts.id],
  }),
  photo: one(photos, {
    fields: [reviews.photoId],
    references: [photos.id],
  }),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  business: one(businesses, {
    fields: [submissions.businessId],
    references: [businesses.id],
  }),
  contact: one(contacts, {
    fields: [submissions.contactId],
    references: [contacts.id],
  }),
  review: one(reviews, {
    fields: [submissions.reviewId],
    references: [reviews.id],
  }),
  photo: one(photos, {
    fields: [submissions.photoId],
    references: [photos.id],
  }),
  giftCardProduct: one(giftCardProducts, {
    fields: [submissions.giftCardProductId],
    references: [giftCardProducts.id],
  }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  business: one(businesses, {
    fields: [photos.businessId],
    references: [businesses.id],
  }),
  uploadedBy: one(users, {
    fields: [photos.uploadedByUserId],
    references: [users.id],
  }),
}));

export const communicationLogsRelations = relations(
  communicationLogs,
  ({ one }) => ({
    contact: one(contacts, {
      fields: [communicationLogs.contactId],
      references: [contacts.id],
    }),
    user: one(users, {
      fields: [communicationLogs.userId],
      references: [users.id],
    }),
  }),
);

export const tasksRelations = relations(tasks, ({ one }) => ({
  contact: one(contacts, {
    fields: [tasks.contactId],
    references: [contacts.id],
  }),
  referral: one(referrals, {
    fields: [tasks.referralId],
    references: [referrals.id],
  }),
  assignedTo: one(users, {
    fields: [tasks.assignedUserId],
    references: [users.id],
    relationName: "taskAssignee",
  }),
  createdBy: one(users, {
    fields: [tasks.createdByUserId],
    references: [users.id],
  }),
}));

export const reviewRequestsRelations = relations(reviewRequests, ({ one }) => ({
  business: one(businesses, {
    fields: [reviewRequests.businessId],
    references: [businesses.id],
  }),
  contact: one(contacts, {
    fields: [reviewRequests.contactId],
    references: [contacts.id],
  }),
  referral: one(referrals, {
    fields: [reviewRequests.referralId],
    references: [referrals.id],
  }),
  submission: one(submissions, {
    fields: [reviewRequests.submissionId],
    references: [submissions.id],
  }),
  giftCard: one(giftCards, {
    fields: [reviewRequests.id],
    references: [giftCards.reviewRequestId],
  }),
}));

export const giftCardsRelations = relations(giftCards, ({ one }) => ({
  business: one(businesses, {
    fields: [giftCards.businessId],
    references: [businesses.id],
  }),
  contact: one(contacts, {
    fields: [giftCards.contactId],
    references: [contacts.id],
  }),
  reviewRequest: one(reviewRequests, {
    fields: [giftCards.reviewRequestId],
    references: [reviewRequests.id],
  }),
}));

// suppress unused-import warnings for utilities reserved for later phases
void primaryKey;
