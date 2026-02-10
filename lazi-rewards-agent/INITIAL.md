# LAZI Rewards - Initial Feature Request

## What I Want Built
A customer loyalty rewards platform for LIV Pools and Perfect Catch Electric that integrates with our ServiceTitan data (via ST-LAZI). Customers earn points from completed jobs, referrals, and reviews, then redeem points for discounts on future services.

## Core Features (Priority Order)

### P0 - Must Have
1. **Customer Rewards Dashboard** - Customers log in and see their points balance, tier status, transaction history, and available rewards
2. **Points Engine** - Automatically calculate and award points when jobs complete in ServiceTitan (synced via ST-LAZI)
3. **Tier System** - Bronze/Silver/Gold/Platinum tiers with increasing benefits
4. **Redemption System** - Customers can redeem points for service discounts

### P1 - High Priority
5. **Referral Program** - Unique referral codes, track referrals, award bonus points after referred customer's first completed job
6. **Admin Dashboard** - Internal staff view to manage rewards program, see analytics, adjust points manually
7. **Email Notifications** - Points earned, tier upgrades, redemption confirmations

### P2 - Nice to Have
8. **Review Rewards** - Bonus points for leaving Google/Yelp reviews
9. **Milestone Rewards** - Anniversary bonuses, job count milestones
10. **Gamification** - Badges, streaks, seasonal challenges

## Data Sources (from ST-LAZI)
- `master.customers` - Customer profiles
- `master.jobs` - Job completion data (status, amounts)
- `master.invoices` - Payment verification
- `crm.customer_360` - Aggregated customer analytics (value tier, engagement status, job counts)
- `master.estimates` - Open estimates for upsell opportunities
- `crm.contacts` - Customer contact information

## Business Rules
- 1 point per $1 spent on completed, fully-paid jobs
- Referral bonus: 500 points for referrer + 250 points for new customer
- Review bonus: 100 points per verified review
- Tier thresholds: Bronze (0), Silver (1000), Gold (5000), Platinum (15000) lifetime points
- Redemption rate: 100 points = $1 discount
- Points expire after 24 months of inactivity

## Design Preferences
- Clean, modern UI (think Apple/Stripe level polish)
- Company colors: LIV Pools blue (#1e3a5f), Perfect Catch orange (#ff6b35)
- Mobile-first (most customers will use phones)
- Fast - skeleton loaders, optimistic updates
- Celebratory animations for earning points and tier upgrades

## Examples to Reference
- Starbucks Rewards app (tier progression, points history)
- Airline loyalty programs (tier benefits display)
- Shopify loyalty apps (simple redemption flow)

## Technical Constraints
- Must work with existing ST-LAZI PostgreSQL database (Supabase)
- ServiceTitan is source of truth for customer/job data
- Points transactions must have full audit trail
- Cannot modify ST-LAZI raw/master tables - create new rewards-specific tables
