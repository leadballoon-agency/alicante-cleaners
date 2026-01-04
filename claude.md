# VillaCare - Project Documentation

> Villa cleaning platform connecting property owners with trusted cleaners in Alicante, Spain.

## Quick Reference

- **Domain**: alicantecleaners.com
- **Brand**: VillaCare
- **Location**: Alicante, Costa Blanca, Spain
- **Currency**: EUR (€)
- **Primary Language**: English (Spanish support planned)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Database | Neon (PostgreSQL) + Prisma ORM |
| Auth | NextAuth.js - *configured* |
| Payments | Stripe - *planned* |
| Notifications | WhatsApp Business API - *planned* |

---

## Design System

### Colors

```
Primary Brand (Terracotta):
- #C4785A - Primary accent, CTAs, stars, badges
- #A66347 - Darker variant for gradients
- #B06B4D - Hover state

Neutrals:
- #1A1A1A - Primary text, dark backgrounds
- #6B6B6B - Secondary text
- #9B9B9B - Muted text, placeholders
- #DEDEDE - Borders, inputs
- #EBEBEB - Light borders, dividers
- #F5F5F3 - Light backgrounds, hover states
- #FAFAF8 - Page background (warm white)

Status Colors:
- #2E7D32 / #E8F5E9 - Success, confirmed, approved (green)
- #E65100 / #FFF3E0 - Warning, pending (orange)
- #C75050 / #FFEBEE - Error, danger (red)
- #1976D2 / #E3F2FD - Info (blue)

Accent Backgrounds:
- #FFF8F5 - Warm highlight (terracotta tint)
- #F5E6E0 - Warm border
```

### Typography

- **Font**: System sans-serif (font-sans)
- **Headings**: font-semibold
- **Body**: text-base (16px)
- **Small**: text-sm (14px), text-xs (12px)

### Spacing & Layout

- **Min width**: 320px (mobile-first)
- **Max content width**: max-w-lg (32rem/512px) for mobile views, max-w-3xl for landing
- **Container padding**: px-6
- **Card padding**: p-4 to p-6
- **Border radius**: rounded-lg (8px), rounded-xl (12px), rounded-2xl (16px)
- **Touch targets**: min 44px height for buttons

### Component Patterns

```tsx
// Primary Button
className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium active:scale-[0.98] transition-all disabled:opacity-50"

// Secondary Button
className="w-full bg-white border border-[#DEDEDE] text-[#1A1A1A] py-3 rounded-xl font-medium"

// Terracotta Button
className="bg-[#C4785A] text-white px-4 py-2 rounded-lg text-sm font-medium"

// Card
className="bg-white rounded-2xl p-4 border border-[#EBEBEB]"

// Input
className="w-full px-4 py-3.5 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors"

// Filter Pill (active)
className="px-4 py-2 rounded-full text-sm font-medium bg-[#1A1A1A] text-white"

// Filter Pill (inactive)
className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-[#EBEBEB] text-[#6B6B6B]"

// Status Badge
const statusColors = {
  pending: 'bg-[#FFF3E0] text-[#E65100]',
  confirmed: 'bg-[#E8F5E9] text-[#2E7D32]',
  completed: 'bg-[#F5F5F3] text-[#6B6B6B]',
}

// Trusted Badge
className="px-1.5 py-0.5 rounded text-xs bg-[#E8F5E9] text-[#2E7D32] font-medium"
```

### Safe Areas (iOS)

```tsx
// Top padding for notch
className="pt-safe"

// Bottom padding for home indicator
className="pb-safe"
```

---

## File Structure

```
prisma/
└── schema.prisma               # Database schema (Neon PostgreSQL)

lib/
├── db.ts                       # Prisma client singleton
└── auth.ts                     # NextAuth.js configuration

types/
└── next-auth.d.ts              # NextAuth type extensions

middleware.ts                   # Route protection (NextAuth)

components/
└── feedback-widget.tsx         # Global "Pulse" feedback widget

app/
├── page.tsx                    # Landing page with waitlist forms
├── layout.tsx                  # Root layout (includes FeedbackWidget)
├── api/
│   └── waitlist/
│       ├── owner/route.ts      # Owner waitlist API
│       └── cleaner/route.ts    # Cleaner waitlist API
│
├── [slug]/                     # Public cleaner profiles
│   ├── page.tsx                # Profile page
│   └── booking/
│       ├── page.tsx            # Booking wizard (4 steps)
│       └── steps/
│           ├── date-time.tsx
│           ├── property-details.tsx
│           ├── payment.tsx
│           └── confirmation.tsx
│
├── onboarding/
│   └── cleaner/
│       ├── page.tsx            # Cleaner signup wizard
│       └── steps/
│           ├── phone-entry.tsx
│           ├── verify-code.tsx
│           ├── name-photo.tsx  # Also has bio & reviews link
│           ├── service-areas.tsx
│           ├── pricing.tsx
│           └── success.tsx
│
├── dashboard/                  # Cleaner dashboard
│   ├── page.tsx                # Main + mock data
│   ├── tabs/
│   │   ├── home.tsx
│   │   ├── bookings.tsx        # Has owner trust indicators
│   │   ├── schedule.tsx
│   │   └── profile.tsx
│   └── components/
│       └── owner-review-modal.tsx
│
├── owner/
│   └── dashboard/
│       ├── page.tsx            # Main + mock data
│       ├── tabs/
│       │   ├── home.tsx        # "I'm Coming Home" + WhatsApp extras
│       │   ├── bookings.tsx
│       │   ├── properties.tsx
│       │   └── account.tsx     # Has referral rewards
│       └── components/
│           └── review-modal.tsx
│
└── admin/
    ├── page.tsx                # Admin dashboard + mock data
    └── tabs/
        ├── overview.tsx
        ├── cleaners.tsx        # Approve/reject applications
        ├── bookings.tsx
        ├── reviews.tsx         # Moderate & feature reviews
        └── feedback.tsx        # User feedback management
```

---

## Data Models

### Cleaner
```typescript
{
  id: string
  name: string
  slug: string                  // URL-friendly: /clara
  phone: string
  email: string
  photo: string | null
  bio: string
  reviewsLink: string | null    // External reviews (Google, etc.)
  serviceAreas: string[]        // ['Alicante City', 'San Juan']
  hourlyRate: number
  status: 'pending' | 'active'
  joinedAt: Date
  totalBookings: number
  rating: number | null
  reviewCount: number
}
```

### Owner
```typescript
{
  id: string
  name: string
  email: string
  phone: string
  trusted: boolean              // Earned via referral or 3+ bookings
  referredBy: string | null     // Who referred them
  memberSince: Date
  totalBookings: number
  cleanerRating: number | null  // Rating FROM cleaners
  cleanerReviewCount: number
  referralCode: string          // e.g., 'MARK2024'
  referrals: Array<{
    name: string
    joinedAt: Date
    hasBooked: boolean
  }>
  referralCredits: number       // €10 per completed referral
}
```

### Booking
```typescript
{
  id: string
  status: 'pending' | 'confirmed' | 'completed'
  service: string               // 'Regular Clean', 'Deep Clean', 'Arrival Prep'
  price: number
  hours: number
  date: Date
  time: string                  // '10:00'
  property: {
    id: string
    address: string
    bedrooms: number
  }
  cleaner: { id, name, slug, photo }
  owner: Owner                  // Full owner object with trust indicators
  hasReviewedOwner: boolean     // For reverse reviews
}
```

### Review (Owner → Cleaner)
```typescript
{
  id: string
  rating: number                // 1-5
  text: string
  author: string
  location: string
  cleaner: { id, name }
  createdAt: Date
  status: 'pending' | 'approved'
  featured: boolean             // Shows on landing page
}
```

### Internal Comment (Cleaner Notes)
```typescript
{
  id: string
  propertyId: string
  ownerId: string
  cleanerId: string
  cleanerName: string
  text: string                  // "Key under blue pot"
  createdAt: Date
}
```

---

## Business Logic

### Service Pricing
```typescript
const SERVICES = [
  { type: 'regular', name: 'Regular Clean', hours: 3, basePrice: 54 },
  { type: 'deep', name: 'Deep Clean', hours: 5, basePrice: 90 },
  { type: 'arrival', name: 'Arrival Prep', hours: 4, basePrice: 72 },
]
// Price = cleaner.hourlyRate × hours
```

### Service Areas (Alicante Region)
```typescript
const AREAS = [
  'Alicante City',
  'San Juan',
  'Playa de San Juan',
  'El Campello',
  'Mutxamel',
  'San Vicente',
  'Jijona',
]
```

### Trust System

**Trusted Owner Badge** - Earned by:
- Being referred by another owner, OR
- Completing 3+ bookings with good behavior

**Cleaner Rating of Owners** - Cleaners rate owners on:
- Overall experience (1-5 stars)
- Would work again (yes/no)
- Communication (1-5)
- Property accuracy (1-5)
- Respectfulness (1-5)

### Referral System

**Owner Referrals:**
- Each owner gets unique code (e.g., `MARK2024`)
- Share link: `alicantecleaners.com/join?ref=CODE`
- Earn €10 credit when referral completes first booking

**Cleaner Referrals:**
- Cleaners are invite-only (referred by existing members)
- Referrer's name shown on application
- Future: Referrer writes endorsement for cleaner's profile

### WhatsApp Extras Flow

"I'm Coming Home" feature in owner dashboard:
1. Select property, arrival date/time
2. Choose extras (groceries, welcome basket, flowers, linens)
3. Generates WhatsApp deep link with pre-filled message
4. Payment handled via Bizum (Spanish bank transfer)

```typescript
const EXTRAS = [
  { id: 'groceries', icon: '🛒', label: 'Stock the fridge' },
  { id: 'welcome', icon: '🍷', label: 'Welcome basket' },
  { id: 'flowers', icon: '🌸', label: 'Fresh flowers' },
  { id: 'linens', icon: '🛏️', label: 'Fresh linens' },
]

// WhatsApp link format
`https://wa.me/${phone}?text=${encodeURIComponent(message)}`
```

---

## API Routes

### Waitlist APIs (Implemented)
```
POST /api/waitlist/owner
Body: { email: string, town: string }

POST /api/waitlist/cleaner
Body: { name: string, phone: string, referrer_name: string }
```

### Future APIs (To Build)
```
# Auth
POST /api/auth/phone-verify
POST /api/auth/verify-code

# Cleaners
GET  /api/cleaners/:slug
POST /api/cleaners (create profile)
PUT  /api/cleaners/:id

# Bookings
GET  /api/bookings
POST /api/bookings
PUT  /api/bookings/:id/status

# Reviews
POST /api/reviews
PUT  /api/reviews/:id/approve
PUT  /api/reviews/:id/feature
```

---

## What's Built vs. Mocked

### Built (Frontend Complete)
- [x] Landing page with waitlist
- [x] Cleaner onboarding flow
- [x] Public cleaner profiles
- [x] Booking flow (4 steps)
- [x] Cleaner dashboard (4 tabs)
- [x] Owner dashboard (4 tabs)
- [x] Admin dashboard (4 tabs)
- [x] Review system (both directions)
- [x] Trust indicators
- [x] Internal comments
- [x] Referral tracking
- [x] WhatsApp extras flow

### Mocked (Needs Backend)
- [x] Authentication (NextAuth.js) - *configured, needs NEXTAUTH_SECRET*
- [x] Database schema (Prisma) - *defined, run prisma migrate*
- [ ] Payment processing (Stripe)
- [ ] WhatsApp notifications
- [ ] Photo uploads (storage)
- [ ] Email notifications
- [ ] SMS verification

---

## Conventions

### File Naming
- Components: `kebab-case.tsx` (e.g., `owner-review-modal.tsx`)
- Pages: `page.tsx` in route folders
- Tabs: named by function (e.g., `home.tsx`, `bookings.tsx`)

### Component Structure
```tsx
'use client'

import { useState } from 'react'
import { SomeType } from '../page'

type Props = {
  // Props definition
}

export default function ComponentName({ prop1, prop2 }: Props) {
  // State
  // Handlers
  // Return JSX
}
```

### Mock Data Pattern
- Mock data defined in `page.tsx` files
- Types exported: `export type Booking = typeof MOCK_BOOKINGS[number]`
- Passed down as props to tab components

### State Management
- Local state with `useState` (no global state library yet)
- Props drilling for now (context can be added later)

### Date Formatting
```typescript
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
```

---

## Feedback Widget ("Pulse")

Global feedback collection widget available on all pages (except admin).

### Component Location
```
components/feedback-widget.tsx
```

### Features
- Floating orb button (bottom-right) with breathing pulse animation
- 3-step flow: Mood → Category → Message
- Context-aware (auto-captures current page)
- Smooth animations and transitions

### Mood Options
```typescript
const MOODS = [
  { id: 'love', emoji: '😍', label: 'Love it!' },
  { id: 'like', emoji: '🙂', label: 'It\'s good' },
  { id: 'meh', emoji: '😐', label: 'Could be better' },
  { id: 'frustrated', emoji: '😤', label: 'Frustrated' },
]
```

### Category Options
```typescript
const CATEGORIES = [
  { id: 'idea', emoji: '💡', label: 'Idea' },      // Feature suggestion
  { id: 'issue', emoji: '🐛', label: 'Issue' },    // Something broken
  { id: 'praise', emoji: '⭐', label: 'Praise' },  // What you love
  { id: 'question', emoji: '❓', label: 'Question' }, // Need help
]
```

### Feedback Data Model
```typescript
{
  id: string
  category: 'idea' | 'issue' | 'praise' | 'question'
  mood: 'love' | 'like' | 'meh' | 'frustrated'
  message: string
  page: string              // Auto-captured pathname
  userType: 'owner' | 'cleaner' | 'visitor' | null
  createdAt: Date
  status: 'new' | 'reviewed' | 'planned' | 'done'
  votes: number
}
```

### Admin Feedback Tab
```
app/admin/tabs/feedback.tsx
```
- Stats: New count, Ideas, Issues, Avg mood score
- Filter by category and status
- Expandable cards with full details
- Status management (New → Reviewed → Planned → Done)

---

## Future Features (Noted)

1. **Livefeed** - Real-time activity feed on landing page for social proof
   - "Clara just completed a clean in San Juan"
   - "New 5-star review for Maria"

2. **Referrer Endorsement** - Person who refers a cleaner writes their profile intro
   - "Vouched by Sandra M." section on cleaner profiles

3. **Photo Proof** - Before/after photos when cleaners complete jobs

4. **Calendar Sync** - Google Calendar / iCal integration

5. **PWA** - Make installable on mobile home screens

---

## Development Notes

### Running Locally
```bash
npm run dev
# Runs on http://localhost:3000
```

### Environment Variables Needed
```
# Neon Database
DATABASE_URL=                 # Connection string from Neon dashboard

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=              # Generate with: openssl rand -base64 32

# Future
STRIPE_SECRET_KEY=            # Stripe secret (when ready)
```

### NextAuth.js

```typescript
// In Server Components / API Routes
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const session = await getServerSession(authOptions)
// session.user.id, session.user.role, session.user.email

// In Client Components
import { useSession } from 'next-auth/react'

const { data: session, status } = useSession()
```

**Protected Routes** (handled by middleware):
- `/dashboard/*` - Cleaner dashboard (requires CLEANER role)
- `/owner/dashboard/*` - Owner dashboard (requires OWNER role)
- `/admin/*` - Admin panel (requires ADMIN role)

### Database
- Neon PostgreSQL (serverless) with Prisma ORM
- Use connection pooler for serverless: add `?sslmode=require` to connection string
- Avoid DDL operations (CREATE TABLE) through pooler

---

## Contact

Built for the Alicante expat community. Questions? hello@alicantecleaners.com
