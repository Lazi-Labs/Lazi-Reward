-- Create rewards schema
CREATE SCHEMA IF NOT EXISTS rewards;

-- Tiers configuration
CREATE TABLE IF NOT EXISTS rewards.tiers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  points_threshold BIGINT NOT NULL,
  benefits TEXT[],
  points_multiplier NUMERIC(3,2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Extended customer rewards profile
CREATE TABLE IF NOT EXISTS rewards.customers (
  id UUID PRIMARY KEY,
  customer_id BIGINT NOT NULL UNIQUE,
  current_points BIGINT DEFAULT 0,
  lifetime_points BIGINT DEFAULT 0,
  current_tier_id INTEGER REFERENCES rewards.tiers(id),
  last_activity TIMESTAMP,
  points_expire_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Points transaction audit trail
CREATE TABLE IF NOT EXISTS rewards.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES rewards.customers(id) ON DELETE CASCADE,
  points_amount BIGINT NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'earned', 'redeemed', 'adjusted', 'expired'
  reason VARCHAR(255),
  external_ref VARCHAR(100), -- Job ID, Referral ID, etc.
  created_by VARCHAR(100), -- Customer, Admin, System
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tier upgrade history
CREATE TABLE IF NOT EXISTS rewards.tier_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES rewards.customers(id) ON DELETE CASCADE,
  old_tier_id INTEGER REFERENCES rewards.tiers(id),
  new_tier_id INTEGER REFERENCES rewards.tiers(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Redemptions
CREATE TABLE IF NOT EXISTS rewards.redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES rewards.customers(id) ON DELETE CASCADE,
  points_redeemed BIGINT NOT NULL,
  discount_amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'claimed', 'fulfilled', 'cancelled'
  redemption_code VARCHAR(100) UNIQUE,
  expires_at TIMESTAMP,
  claimed_at TIMESTAMP,
  fulfilled_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Referrals (P1 feature, structure for future)
CREATE TABLE IF NOT EXISTS rewards.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_customer_id UUID NOT NULL REFERENCES rewards.customers(id) ON DELETE CASCADE,
  referred_customer_id UUID REFERENCES rewards.customers(id) ON DELETE SET NULL,
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'claimed', 'completed', 'expired'
  referred_email VARCHAR(255),
  bonus_points_referrer BIGINT DEFAULT 500,
  bonus_points_referred BIGINT DEFAULT 250,
  claimed_at TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON rewards.customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON rewards.customers(current_tier_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_customer ON rewards.points_transactions(customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_redemptions_customer ON rewards.redemptions(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_redemptions_code ON rewards.redemptions(redemption_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON rewards.referrals(referrer_customer_id, status);

-- Insert default tiers
INSERT INTO rewards.tiers (name, points_threshold, benefits, points_multiplier) VALUES
  ('Bronze', 0, '{"Member since benefits"}', 1.0),
  ('Silver', 1000, '{"5% bonus points", "Priority support"}', 1.05),
  ('Gold', 5000, '{"10% bonus points", "Free shipping", "Early access to rewards"}', 1.1),
  ('Platinum', 15000, '{"15% bonus points", "Free shipping", "Exclusive perks", "Dedicated account manager"}', 1.15)
ON CONFLICT (name) DO NOTHING;
