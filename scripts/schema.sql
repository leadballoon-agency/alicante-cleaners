-- VillaCare Database Schema
-- Run this in your Neon SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- WAITLIST (landing page captures)
-- ============================================
CREATE TABLE owner_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  town VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE cleaner_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  referrer_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- USERS (both cleaners and villa owners)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255),
  photo_url TEXT,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('cleaner', 'owner')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CLEANERS
-- ============================================
CREATE TABLE cleaners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  slug VARCHAR(100) UNIQUE,
  hourly_rate DECIMAL(10,2),
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_level INTEGER DEFAULT 1, -- 1=basic, 2=verified, 3=trusted_pro
  is_team_leader BOOLEAN DEFAULT FALSE,
  team_id UUID,
  referred_by UUID REFERENCES cleaners(id), -- who referred this cleaner
  total_cleans INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  stripe_account_id VARCHAR(255),
  stripe_account_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CLEANER SERVICE AREAS
-- ============================================
CREATE TABLE cleaner_service_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cleaner_id UUID REFERENCES cleaners(id) ON DELETE CASCADE,
  town VARCHAR(100) NOT NULL,
  is_core_area BOOLEAN DEFAULT TRUE,
  travel_fee DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cleaner_id, town)
);

-- ============================================
-- SERVICES
-- ============================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cleaner_id UUID REFERENCES cleaners(id) ON DELETE CASCADE,
  service_type VARCHAR(50) NOT NULL, -- regular, deep, arrival_prep, departure
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  duration_hours DECIMAL(4,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TEAMS
-- ============================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  leader_id UUID REFERENCES cleaners(id),
  leader_percentage DECIMAL(5,2) DEFAULT 10.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE cleaners ADD CONSTRAINT fk_cleaner_team
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- ============================================
-- TEAM MEMBERS
-- ============================================
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  cleaner_id UUID REFERENCES cleaners(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, cleaner_id)
);

-- ============================================
-- PROPERTIES
-- ============================================
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  town VARCHAR(100) NOT NULL,
  postcode VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Spain',
  bedrooms INTEGER DEFAULT 2,
  bathrooms INTEGER DEFAULT 1,
  has_pool BOOLEAN DEFAULT FALSE,
  size_sqm INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PROPERTY ACCESS (sensitive)
-- ============================================
CREATE TABLE property_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE UNIQUE,
  key_location TEXT,
  alarm_code VARCHAR(50),
  wifi_name VARCHAR(100),
  wifi_password VARCHAR(100),
  gate_code VARCHAR(50),
  parking_notes TEXT,
  bin_day VARCHAR(20),
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PROPERTY PREFERENCES
-- ============================================
CREATE TABLE property_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  preference TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PROPERTY PHOTOS
-- ============================================
CREATE TABLE property_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption VARCHAR(255),
  room VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- BOOKINGS
-- ============================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),
  owner_id UUID REFERENCES users(id),
  cleaner_id UUID REFERENCES cleaners(id),
  assigned_team_member_id UUID REFERENCES cleaners(id),
  service_id UUID REFERENCES services(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  scheduled_date DATE NOT NULL,
  scheduled_time_slot VARCHAR(20),
  scheduled_time TIME,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  price DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2),
  leader_fee DECIMAL(10,2),
  cleaner_payout DECIMAL(10,2),
  notes TEXT,
  is_new_client BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- BOOKING PHOTOS
-- ============================================
CREATE TABLE booking_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type VARCHAR(20) CHECK (photo_type IN ('before', 'after')),
  room VARCHAR(100),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id),
  stripe_payment_intent_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(20) CHECK (status IN ('pending', 'held', 'captured', 'refunded', 'failed')),
  card_last_four VARCHAR(4),
  card_brand VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  captured_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- PAYOUTS
-- ============================================
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cleaner_id UUID REFERENCES cleaners(id),
  booking_id UUID REFERENCES bookings(id),
  stripe_transfer_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'paid', 'failed')),
  is_instant BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- REVIEWS
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id),
  reviewer_id UUID REFERENCES users(id),
  cleaner_id UUID REFERENCES cleaners(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PROPERTY ACCESS LOGS (audit trail)
-- ============================================
CREATE TABLE property_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  cleaner_id UUID REFERENCES cleaners(id),
  booking_id UUID REFERENCES bookings(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('started', 'completed', 'accessed', 'reported_issue')),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CLEANER VERIFICATIONS
-- ============================================
CREATE TABLE cleaner_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cleaner_id UUID REFERENCES cleaners(id) ON DELETE CASCADE UNIQUE,
  id_document_url TEXT,
  id_verified_at TIMESTAMP WITH TIME ZONE,
  selfie_url TEXT,
  selfie_verified_at TIMESTAMP WITH TIME ZONE,
  insurance_document_url TEXT,
  insurance_verified_at TIMESTAMP WITH TIME ZONE,
  insurance_expiry DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_cleaners_user_id ON cleaners(user_id);
CREATE INDEX idx_cleaners_slug ON cleaners(slug);
CREATE INDEX idx_cleaners_referred_by ON cleaners(referred_by);
CREATE INDEX idx_bookings_cleaner_id ON bookings(cleaner_id);
CREATE INDEX idx_bookings_property_id ON bookings(property_id);
CREATE INDEX idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_town ON properties(town);
CREATE INDEX idx_cleaner_service_areas_town ON cleaner_service_areas(town);
