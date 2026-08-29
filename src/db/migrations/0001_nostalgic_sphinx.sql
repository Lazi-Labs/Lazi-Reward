CREATE TABLE "gift_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"review_request_id" uuid,
	"source" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"external_id" text NOT NULL,
	"tremendous_order_id" text,
	"tremendous_reward_id" text,
	"redemption_link" text,
	"campaign_id" text,
	"delivery_channel" text,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"failure_reason" text,
	"last_webhook_uuid" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gift_cards_review_request_id_unique" UNIQUE("review_request_id"),
	CONSTRAINT "gift_cards_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "gift_amount" numeric(10, 2) DEFAULT '10.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "tremendous_campaign_id" text;--> statement-breakpoint
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_review_request_id_review_requests_id_fk" FOREIGN KEY ("review_request_id") REFERENCES "public"."review_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gift_cards_contact_idx" ON "gift_cards" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "gift_cards_status_idx" ON "gift_cards" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gift_cards_reward_idx" ON "gift_cards" USING btree ("tremendous_reward_id");