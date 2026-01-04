# VillaCare — Claude Code Build Spec

> **Purpose:** Everything needed to build a villa cleaning platform for Alicante, Spain. Read fully before writing code.

---

## WHAT WE'RE BUILDING

A platform connecting villa owners (British/European expats) with trusted cleaning professionals in Alicante and surrounding areas.

**One-liner:** Help cleaners become businesses. Help villa owners come home to a ready house.

**Core insight:** This is not a cleaning marketplace. It's a remote ownership control layer — cleaning is the wedge.

**Key differentiator:** Cleaners join by referral only. Quality over quantity.

---

## CURRENT STATUS

**Live now:** Landing page capturing waitlist signups
**Building next:** Full platform (cleaner onboarding, booking, payments)

---

## TECH STACK

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (phone OTP + magic links) |
| Storage | Supabase Storage (photos) |
| Payments | Stripe + Stripe Connect |
| Hosting | Vercel |

---

## DESIGN SYSTEM

### Colors

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'bg-primary': '#FAFAF8',      // Warm white
        'bg-secondary': '#F5F5F3',    // Subtle warm gray
        'bg-card': '#FFFFFF',         // Pure white
        'text-primary': '#1A1A1A',    // Soft black
        'text-secondary': '#6B6B6B',  // Medium gray
        'text-tertiary': '#9B9B9B',   // Light gray
        'accent': '#C4785A',          // Terracotta
        'accent-light': '#F5EDE8',    // Light terracotta
        'success': '#7C8B6F',         // Soft olive
        'error': '#C75050',           // Soft red
        'border-light': '#EBEBEB',
        'border-medium': '#DEDEDE',
      },
      minWidth: {
        'mobile': '320px',
      }
    }
  }
}
```

### Typography

- Font: `Inter` (Google Fonts)
- Minimum body text: 16px
- Weights: 400, 500, 600

### Mobile-First Rules

- Minimum width: 320px (iPhone SE)
- Touch targets: 44px minimum
- Inputs: 48px+ height
- Buttons: 52px+ height
- Active states (not hover) for touch feedback
- Safe area padding for notch/home bar

### Design Feel

- Mediterranean calm
- Boutique hotel, not software
- Warm, confident, elegant
- Mobile-first always

---

## THE TWO USERS

### SANDRA — Villa Owner

| Attribute | Value |
|-----------|-------|
| Age | 55-65 |
| Location | UK/Europe → Villa in Alicante area |
| Situation | 90-day Schengen limit, visits 2-4x per year |
| Tech | iPad, WhatsApp, hates passwords |
| Wants | "Arrive to a home that's ready" |
| Fears | Unreliability, musty house, no one to trust |

### CLARA — Cleaner (Co-founder, First Member)

| Attribute | Value |
|-----------|-------|
| Business | Limpieza Alicante Express |
| Location | Alicante, Spain |
| Reviews | 25+ five-star on Google |
| Team | Already has cleaners working with her |
| Wants | Scale the business, stop admin chaos |
| Role | Quality benchmark, approves new cleaners |

---

## REFERRAL-ONLY MODEL

**Cleaners join by invitation only.**

How it works:
1. Existing cleaner refers someone they trust
2. Referee submits application with referrer's name
3. We verify with referrer: "Do you vouch for them?"
4. If yes → approved, invite sent
5. If no → rejected

**Why this matters:**
- Quality control (Clara only refers people she'd stake her reputation on)
- Built-in accountability (your referral screws up → reflects on you)
- Scarcity creates demand ("by invitation only")
- Trust chain (every cleaner traceable to someone trusted)

**Clara is the seed.** She refers 3 → they each refer 2 → 10 quality cleaners.

---

## LAUNCH AREA

**Alicante and surrounding towns:**
- Alicante City
- San Juan
- El Campello
- Mutxamel
- San Vicente
- Jijona
- Playa de San Juan

Expand later to Costa Blanca (Moraira, Javea, Calpe, etc.)

---

## LANDING PAGE (Already Built)

Located at `/app/page.tsx`

**Two capture flows:**

| Villa Owners | Cleaners |
|--------------|----------|
| "Join the waitlist" | "By invitation only" |
| Email + property area | Name + WhatsApp + referrer name |
| Simple signup | Must name who referred them |

**Key features:**
- Tab switcher between owner/cleaner
- Mobile-first (320px min-width)
- Touch-optimized (48px+ targets)
- Active states for buttons
- Safe area padding
- Success states after submission

---

## DATABASE SCHEMA

Run in Supabase SQL editor:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- WAITLIST (landing page captures)
-- ============================================
create table owner_waitlist (
  id uuid primary key default uuid_generate_v4(),
  email varchar(255) not null,
  town varchar(100) not null,
  created_at timestamp with time zone default now()
);

create table cleaner_applications (
  id uuid primary key default uuid_generate_v4(),
  name varchar(255) not null,
  phone varchar(20) not null,
  referrer_name varchar(255) not null,
  status varchar(20) default 'pending', -- pending, approved, rejected
  notes text,
  created_at timestamp with time zone default now(),
  reviewed_at timestamp with time zone
);

-- ============================================
-- USERS (both cleaners and villa owners)
-- ============================================
create table users (
  id uuid primary key default uuid_generate_v4(),
  phone varchar(20) unique not null,
  email varchar(255),
  name varchar(255),
  photo_url text,
  user_type varchar(20) not null check (user_type in ('cleaner', 'owner')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================
-- CLEANERS
-- ============================================
create table cleaners (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade unique,
  slug varchar(100) unique,
  hourly_rate decimal(10,2),
  bio text,
  is_verified boolean default false,
  verification_level integer default 1, -- 1=basic, 2=verified, 3=trusted_pro
  is_team_leader boolean default false,
  team_id uuid,
  referred_by uuid references cleaners(id), -- who referred this cleaner
  total_cleans integer default 0,
  average_rating decimal(3,2) default 0,
  review_count integer default 0,
  stripe_account_id varchar(255),
  stripe_account_status varchar(20) default 'pending',
  created_at timestamp with time zone default now()
);

-- ============================================
-- CLEANER SERVICE AREAS
-- ============================================
create table cleaner_service_areas (
  id uuid primary key default uuid_generate_v4(),
  cleaner_id uuid references cleaners(id) on delete cascade,
  town varchar(100) not null,
  is_core_area boolean default true,
  travel_fee decimal(10,2) default 0,
  created_at timestamp with time zone default now(),
  unique(cleaner_id, town)
);

-- ============================================
-- SERVICES
-- ============================================
create table services (
  id uuid primary key default uuid_generate_v4(),
  cleaner_id uuid references cleaners(id) on delete cascade,
  service_type varchar(50) not null, -- regular, deep, arrival_prep, departure
  name varchar(255) not null,
  description text,
  base_price decimal(10,2) not null,
  duration_hours decimal(4,2),
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- ============================================
-- TEAMS
-- ============================================
create table teams (
  id uuid primary key default uuid_generate_v4(),
  name varchar(255) not null,
  leader_id uuid references cleaners(id),
  leader_percentage decimal(5,2) default 10.00,
  created_at timestamp with time zone default now()
);

alter table cleaners add constraint fk_cleaner_team 
  foreign key (team_id) references teams(id) on delete set null;

-- ============================================
-- TEAM MEMBERS
-- ============================================
create table team_members (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references teams(id) on delete cascade,
  cleaner_id uuid references cleaners(id) on delete cascade,
  joined_at timestamp with time zone default now(),
  unique(team_id, cleaner_id)
);

-- ============================================
-- PROPERTIES
-- ============================================
create table properties (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references users(id) on delete cascade,
  name varchar(255),
  address_line1 varchar(255) not null,
  address_line2 varchar(255),
  town varchar(100) not null,
  postcode varchar(20),
  country varchar(100) default 'Spain',
  bedrooms integer default 2,
  bathrooms integer default 1,
  has_pool boolean default false,
  size_sqm integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================
-- PROPERTY ACCESS (sensitive)
-- ============================================
create table property_access (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id) on delete cascade unique,
  key_location text,
  alarm_code varchar(50),
  wifi_name varchar(100),
  wifi_password varchar(100),
  gate_code varchar(50),
  parking_notes text,
  bin_day varchar(20),
  notes text,
  updated_at timestamp with time zone default now()
);

-- ============================================
-- PROPERTY PREFERENCES
-- ============================================
create table property_preferences (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id) on delete cascade,
  category varchar(50) not null,
  preference text not null,
  created_at timestamp with time zone default now()
);

-- ============================================
-- PROPERTY PHOTOS
-- ============================================
create table property_photos (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id) on delete cascade,
  photo_url text not null,
  caption varchar(255),
  room varchar(100),
  sort_order integer default 0,
  created_at timestamp with time zone default now()
);

-- ============================================
-- BOOKINGS
-- ============================================
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id),
  owner_id uuid references users(id),
  cleaner_id uuid references cleaners(id),
  assigned_team_member_id uuid references cleaners(id),
  service_id uuid references services(id),
  status varchar(20) default 'pending' check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  scheduled_date date not null,
  scheduled_time_slot varchar(20),
  scheduled_time time,
  actual_start_time timestamp with time zone,
  actual_end_time timestamp with time zone,
  price decimal(10,2) not null,
  platform_fee decimal(10,2),
  leader_fee decimal(10,2),
  cleaner_payout decimal(10,2),
  notes text,
  is_new_client boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================
-- BOOKING PHOTOS
-- ============================================
create table booking_photos (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id) on delete cascade,
  photo_url text not null,
  photo_type varchar(20) check (photo_type in ('before', 'after')),
  room varchar(100),
  uploaded_at timestamp with time zone default now()
);

-- ============================================
-- PAYMENTS
-- ============================================
create table payments (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id),
  stripe_payment_intent_id varchar(255),
  amount decimal(10,2) not null,
  currency varchar(3) default 'EUR',
  status varchar(20) check (status in ('pending', 'held', 'captured', 'refunded', 'failed')),
  card_last_four varchar(4),
  card_brand varchar(20),
  created_at timestamp with time zone default now(),
  captured_at timestamp with time zone
);

-- ============================================
-- PAYOUTS
-- ============================================
create table payouts (
  id uuid primary key default uuid_generate_v4(),
  cleaner_id uuid references cleaners(id),
  booking_id uuid references bookings(id),
  stripe_transfer_id varchar(255),
  amount decimal(10,2) not null,
  status varchar(20) check (status in ('pending', 'paid', 'failed')),
  is_instant boolean default false,
  created_at timestamp with time zone default now(),
  paid_at timestamp with time zone
);

-- ============================================
-- REVIEWS
-- ============================================
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id),
  reviewer_id uuid references users(id),
  cleaner_id uuid references cleaners(id),
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default now()
);

-- ============================================
-- PROPERTY ACCESS LOGS (audit trail)
-- ============================================
create table property_access_logs (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references properties(id) on delete cascade,
  cleaner_id uuid references cleaners(id),
  booking_id uuid references bookings(id),
  action varchar(20) not null check (action in ('started', 'completed', 'accessed', 'reported_issue')),
  latitude decimal(10,8),
  longitude decimal(11,8),
  notes text,
  created_at timestamp with time zone default now()
);

-- ============================================
-- CLEANER VERIFICATIONS
-- ============================================
create table cleaner_verifications (
  id uuid primary key default uuid_generate_v4(),
  cleaner_id uuid references cleaners(id) on delete cascade unique,
  id_document_url text,
  id_verified_at timestamp with time zone,
  selfie_url text,
  selfie_verified_at timestamp with time zone,
  insurance_document_url text,
  insurance_verified_at timestamp with time zone,
  insurance_expiry date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index idx_cleaners_user_id on cleaners(user_id);
create index idx_cleaners_slug on cleaners(slug);
create index idx_cleaners_referred_by on cleaners(referred_by);
create index idx_bookings_cleaner_id on bookings(cleaner_id);
create index idx_bookings_property_id on bookings(property_id);
create index idx_bookings_scheduled_date on bookings(scheduled_date);
create index idx_bookings_status on bookings(status);
create index idx_properties_owner_id on properties(owner_id);
create index idx_properties_town on properties(town);
create index idx_cleaner_service_areas_town on cleaner_service_areas(town);
```

---

## FILE STRUCTURE

```
/app
  /api
    /waitlist
      /owner/route.ts         # Save owner waitlist signup
      /cleaner/route.ts       # Save cleaner application
    /auth
      /send-code/route.ts
      /verify-code/route.ts
      /magic-link/route.ts
    /cleaners
      /route.ts
      /[id]/route.ts
    /properties
      /route.ts
      /[id]/route.ts
    /bookings
      /route.ts
      /[id]/route.ts
    /upload/route.ts
  /(cleaner)
    /layout.tsx
    /dashboard/page.tsx
    /calendar/page.tsx
    /clients/page.tsx
    /profile/page.tsx
  /(owner)
    /layout.tsx
    /home/page.tsx
    /property/[id]/page.tsx
  /(public)
    /[slug]/page.tsx
  /onboarding
    /cleaner/page.tsx
  /layout.tsx
  /page.tsx                   # Landing page (DONE)
  /globals.css
/components
  /ui
    /button.tsx
    /card.tsx
    /input.tsx
    /phone-input.tsx
    /code-input.tsx
    /slider.tsx
    /photo-upload.tsx
    /town-selector.tsx
  /cleaner
    /job-card.tsx
    /earnings-summary.tsx
  /owner
    /property-card.tsx
  /shared
    /header.tsx
    /bottom-nav.tsx
/lib
  /supabase
    /client.ts
    /server.ts
  /utils
    /format.ts
    /pricing.ts
    /slug.ts
/types
  /database.ts
```

---

## BUILD ORDER

### PHASE 0: Landing Page Backend (Now)

Connect landing page forms to Supabase.

**API Routes:**

```typescript
// /app/api/waitlist/owner/route.ts
// POST { email, town }
// → Insert into owner_waitlist table
// → Return { success: true }

// /app/api/waitlist/cleaner/route.ts
// POST { name, phone, referrer_name }
// → Insert into cleaner_applications table
// → Return { success: true }
```

**Update landing page:**
- Connect form submissions to API routes
- Add loading states to buttons
- Handle errors gracefully

---

### PHASE 1: Cleaner Onboarding

**Goal:** Approved cleaner can sign up and have a live booking page in 90 seconds.

**Prerequisite:** Cleaner must be in `cleaner_applications` with `status = 'approved'`

**5 Screens:**

1. **Phone Entry**
   - Input: +34 phone number
   - Action: Send SMS code via Supabase
   - Check: Phone must match approved application

2. **Verify Code**
   - Input: 4-digit code
   - Action: Verify OTP, create user

3. **Name & Photo**
   - Input: Full name, optional photo
   - Action: Upload photo to Supabase Storage

4. **Service Areas**
   - Input: Tap towns on map/grid (Alicante area)
   - Action: Save to cleaner_service_areas

5. **Pricing**
   - Input: Hourly rate slider (€12-30)
   - Display: Auto-calculated service prices
   - Action: Create cleaner + services, generate slug

6. **Success**
   - Show: Preview of booking page
   - Actions: Share link, go to dashboard

---

### PHASE 2: Public Booking Page

**URL:** `/[slug]` (e.g., `/clara`)

**Display:**
- Photo, name, rating, areas
- Service cards with prices
- One testimonial (if reviews exist)

**Booking Flow (4 screens):**

1. **Date & Time** — Calendar + morning/afternoon
2. **Property** — Address, bedrooms, name
3. **Payment** — Phone + Apple Pay/Card (hold only)
4. **Confirmation** — Success + add property details CTA

---

### PHASE 3: Cleaner Dashboard

**Home screen:**
- Greeting (time-based)
- Today's jobs as cards
- Earnings: today / week / month
- Bottom nav: Today | Calendar | Clients | Profile

**Job detail:**
- Address + navigate button
- Access details (key, alarm, wifi)
- Preferences highlighted
- Start cleaning → Complete → Upload photos

---

### PHASE 4: Owner Dashboard

**Accessed via magic link (no password)**

**Shows:**
- Properties with next scheduled clean
- "I'm Coming Home" button
- Service history with photos
- Message cleaner

---

### PHASE 5: Teams

**Unlocked at:** 50 cleans + 4.7 rating

- Create team, invite members (up to 4)
- Shared calendar, coverage requests
- Leader earns 10% of team bookings

---

## COMPONENT SPECS

### Button

```tsx
// Primary
className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all"

// Secondary
className="w-full bg-white border border-[#DEDEDE] text-[#1A1A1A] py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all"

// Disabled
className="... opacity-50 pointer-events-none"
```

### Input

```tsx
className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors"
```

### Card

```tsx
className="bg-white rounded-2xl p-6 shadow-sm border border-[#EBEBEB]"
```

### Tab Switcher

```tsx
// Container
className="bg-[#F5F5F3] p-1 rounded-xl inline-flex"

// Tab (active)
className="px-5 py-3 rounded-lg text-sm font-medium bg-white text-[#1A1A1A] shadow-sm"

// Tab (inactive)
className="px-5 py-3 rounded-lg text-sm font-medium text-[#6B6B6B] active:bg-white/50"
```

---

## UTILITY FUNCTIONS

### Generate Slug

```typescript
export async function generateSlug(name: string, supabase: SupabaseClient): Promise<string> {
  const base = name.toLowerCase().split(' ')[0] // "Clara García" → "clara"
  
  // Check if exists
  const { data } = await supabase
    .from('cleaners')
    .select('slug')
    .ilike('slug', `${base}%`)
  
  if (!data?.length) return base
  
  // Try clara-g, clara-ga, etc.
  const lastName = name.toLowerCase().split(' ')[1] || ''
  for (let i = 1; i <= lastName.length; i++) {
    const attempt = `${base}-${lastName.slice(0, i)}`
    if (!data.find(d => d.slug === attempt)) return attempt
  }
  
  // Fallback: clara-1, clara-2
  let num = 1
  while (data.find(d => d.slug === `${base}-${num}`)) num++
  return `${base}-${num}`
}
```

### Calculate Prices

```typescript
export function calculateServicePrices(hourlyRate: number) {
  return {
    regular: { price: hourlyRate * 3, hours: 3 },
    deep: { price: hourlyRate * 5, hours: 5 },
    arrival_prep: { price: hourlyRate * 4, hours: 4 },
  }
}
```

---

## ENVIRONMENT VARIABLES

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://villacare.app
```

---

## QUALITY CHECKLIST

Before any screen is complete:

- [ ] Works at 320px width
- [ ] All text ≥16px
- [ ] Touch targets ≥44px
- [ ] Active states (not hover) on interactive elements
- [ ] Loading states on async actions
- [ ] Error states (friendly, not technical)
- [ ] Empty states (helpful, not blank)
- [ ] Safe area padding (notch/home bar)
- [ ] TypeScript strict mode passes
- [ ] No console errors

---

## START HERE

**Immediate next step:**

1. Set up Supabase project
2. Run database schema
3. Create API routes for waitlist forms
4. Connect landing page to API
5. Deploy to Vercel

**Then:**

6. Build cleaner onboarding flow
7. Build public booking page
8. Build cleaner dashboard

---

## BRAND

**Name:** VillaCare (placeholder — may change)
**Domain:** villacare.app (placeholder)
**Tagline:** "Your villa, ready when you arrive"

---

*End of spec. Build it.*
