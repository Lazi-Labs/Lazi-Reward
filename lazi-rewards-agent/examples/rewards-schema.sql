-- ============================================
-- LAZI Rewards - Database Schema
-- Creates rewards-specific tables in the 'rewards' schema
-- References ST-LAZI master.* tables via st_id
-- ============================================

-- Create rewards schema (separate from ST-LAZI schemas)
CREATE SCHEMA IF NOT EXISTS rewards;

-- ============================================
-- TIER DEFINITIONS (reference table)
-- ============================================
CREATE TABLE rewards.tiers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,           -- Bronze, Silver, Gold, Platinum
  min_lifetime_points INT NOT NULL,     -- Minimum lifetime points to qualify
  points_multiplier NUMERIC(3,2) DEFAULT 1.00,  -- e.g., 1.5x for Gold
  benefits JSONB DEFAULT '[]',          -- Array of benefit descriptions
  color_hex TEXT,                        -- For UI display
  icon TEXT,                             -- Icon name for UI
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed tier data
INSERT INTO rewards.tiers (name, min_lifetime_points, points_multiplier, benefits, color_hex, icon, sort_order) VALUES
  ('Bronze',   0,     1.00, '["Standard service pricing"]', '#CD7F32', 'shield', 1),
  ('Silver',   1000,  1.10, '["5% service discount", "Priority scheduling"]', '#C0C0C0', 'shield-check', 2),
  ('Gold',     5000,  1.25, '["10% service discount", "Priority scheduling", "Free annual inspection"]', '#FFD700', 'crown', 3),
  ('Platinum', 15000, 1.50, '["15% service discount", "VIP scheduling", "Free annual inspection", "Dedicated account manager"]', '#E5E4E2', 'gem', 4);

-- ============================================
-- CUSTOMER REWARDS ACCOUNTS
-- Links to ST-LAZI master.customers via st_customer_id
-- ============================================
CREATE TABLE rewards.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  st_customer_id BIGINT NOT NULL UNIQUE,  -- References master.customers.st_id
  email TEXT,                               -- For auth/notifications
  current_points INT NOT NULL DEFAULT 0,
  lifetime_points INT NOT NULL DEFAULT 0,
  current_tier_id INT REFERENCES rewards.tiers(id) DEFAULT 1,
  referral_code TEXT UNIQUE,                -- Auto-generated unique code
  referred_by UUID REFERENCES rewards.accounts(id),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  points_expire_at TIMESTAMPTZ,             -- 24 months from last activity
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rewards_accounts_st_customer ON rewards.accounts(st_customer_id);
CREATE INDEX idx_rewards_accounts_referral ON rewards.accounts(referral_code);
CREATE INDEX idx_rewards_accounts_tier ON rewards.accounts(current_tier_id);

-- ============================================
-- POINTS TRANSACTIONS (full audit trail)
-- ============================================
CREATE TABLE rewards.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES rewards.accounts(id),
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'expire', 'adjust', 'bonus', 'referral')),
  points INT NOT NULL,                      -- Positive for earn, negative for redeem/expire
  balance_after INT NOT NULL,               -- Running balance after this transaction
  
  -- Source tracking
  source TEXT NOT NULL,                     -- 'job_completion', 'referral', 'review', 'manual', 'redemption', 'expiry'
  source_ref_id TEXT,                       -- ST job ID, referral ID, etc.
  source_details JSONB DEFAULT '{}',        -- Additional context
  
  -- Metadata
  description TEXT,                         -- Human-readable description
  initiated_by TEXT,                        -- 'system', 'admin:email', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_points_tx_account ON rewards.points_transactions(account_id);
CREATE INDEX idx_points_tx_type ON rewards.points_transactions(type);
CREATE INDEX idx_points_tx_created ON rewards.points_transactions(created_at DESC);
CREATE INDEX idx_points_tx_source ON rewards.points_transactions(source, source_ref_id);

-- ============================================
-- REDEMPTIONS
-- ============================================
CREATE TABLE rewards.redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES rewards.accounts(id),
  points_spent INT NOT NULL,
  dollar_value NUMERIC(10,2) NOT NULL,      -- points_spent / 100
  reward_type TEXT NOT NULL CHECK (reward_type IN ('service_discount', 'free_service', 'gift_card', 'custom')),
  reward_details JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'applied', 'cancelled', 'expired')),
  
  -- ServiceTitan linkage
  applied_to_job_id BIGINT,                 -- ST job ID where discount was applied
  applied_to_invoice_id BIGINT,             -- ST invoice ID
  
  -- Metadata
  expires_at TIMESTAMPTZ,                   -- Redemption must be used by this date
  approved_by TEXT,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_redemptions_account ON rewards.redemptions(account_id);
CREATE INDEX idx_redemptions_status ON rewards.redemptions(status);

-- ============================================
-- REFERRALS
-- ============================================
CREATE TABLE rewards.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_account_id UUID NOT NULL REFERENCES rewards.accounts(id),
  referred_email TEXT,
  referred_phone TEXT,
  referred_name TEXT,
  referred_account_id UUID REFERENCES rewards.accounts(id),  -- Set when referred customer creates account
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'first_job_complete', 'points_awarded', 'expired')),
  
  -- Points tracking
  referrer_points_awarded INT DEFAULT 0,
  referred_points_awarded INT DEFAULT 0,
  
  -- ServiceTitan linkage
  referred_st_customer_id BIGINT,
  first_job_id BIGINT,                      -- ST job ID of referred customer's first completed job
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ                   -- When points were awarded
);

CREATE INDEX idx_referrals_referrer ON rewards.referrals(referrer_account_id);
CREATE INDEX idx_referrals_status ON rewards.referrals(status);
CREATE INDEX idx_referrals_referred_st ON rewards.referrals(referred_st_customer_id);

-- ============================================
-- REWARDS CATALOG (available rewards to redeem)
-- ============================================
CREATE TABLE rewards.catalog (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points_cost INT NOT NULL,
  dollar_value NUMERIC(10,2),
  reward_type TEXT NOT NULL CHECK (reward_type IN ('service_discount', 'free_service', 'gift_card', 'custom')),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  min_tier_id INT REFERENCES rewards.tiers(id) DEFAULT 1,  -- Minimum tier to redeem
  max_redemptions_per_customer INT,          -- NULL = unlimited
  total_available INT,                       -- NULL = unlimited
  total_redeemed INT DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG (track all admin actions)
-- ============================================
CREATE TABLE rewards.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,                      -- 'points_adjust', 'tier_override', 'redemption_approve', etc.
  entity_type TEXT NOT NULL,                 -- 'account', 'transaction', 'redemption', 'referral'
  entity_id TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  performed_by TEXT NOT NULL,                -- Admin email or 'system'
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON rewards.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON rewards.audit_log(created_at DESC);
