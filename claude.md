# VillaCare - Claude Code Reference

> Villa cleaning platform for Alicante, Spain. Connects villa owners with trusted cleaners.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Database | Neon PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js (magic links + phone OTP) |
| Email | Resend |
| AI/Translation | OpenAI GPT-4o-mini |
| AI/Admin | Anthropic Claude (Haiku + Sonnet) |
| Hosting | Vercel (auto-deploy from GitHub) |

---

## Current Live Features

- **Homepage** - Cleaner directory with area filtering, social proof activity feed
- **About page** - Origin story at `/about`
- **Cleaner profiles** - Public pages at `/{slug}` with reviews, services, booking
- **Booking flow** - Date/time selection, property details, payment (stub)
- **Cleaner onboarding** - Phone OTP flow, profile setup, pricing
- **Cleaner dashboard** - Bookings, calendar sync (ICS), messaging, profile
- **Owner dashboard** - Properties, booking history, reviews, messaging
- **Admin dashboard** - Platform stats, cleaner management, review approval, owners view
- **Admin AI Agent** - Claude-powered assistant with 18 tools for platform management
- **Knowledge Base** - Markdown-based documentation for AI context injection
- **ICS Calendar feeds** - Cleaners can sync bookings to Google/Apple/Outlook
- **Activity feed** - Social proof showing recent bookings, reviews, completions
- **Multilingual messaging** - Auto-translation between owners and cleaners

---

## Key Files

### Database
- `prisma/schema.prisma` - Data models
- `prisma/seed.ts` - Test data (5 cleaners, reviews, properties, bookings)
- `lib/db.ts` - Prisma client singleton

### Auth
- `lib/auth.ts` - NextAuth configuration
- `app/api/auth/[...nextauth]/route.ts` - Auth endpoints

### Translation
- `lib/translate.ts` - OpenAI translation utilities

### API Routes
```
/api/cleaners              GET - List cleaners (with area filter)
/api/cleaners/[slug]       GET - Single cleaner profile + reviews
/api/activity              GET - Recent platform activity for social proof
/api/bookings              POST - Create booking
/api/calendar/[token]      GET - ICS calendar feed for cleaner

/api/messages              GET - Unread count, POST - Send message
/api/messages/conversations      GET - List conversations, POST - Start new
/api/messages/conversations/[id] GET - Get messages in conversation

/api/user/preferences      GET/PATCH - Language preferences

/api/dashboard/cleaner          GET/POST - Cleaner profile + calendar token
/api/dashboard/cleaner/bookings GET - Cleaner's bookings

/api/dashboard/owner            GET - Owner profile + stats
/api/dashboard/owner/bookings   GET - Owner's bookings
/api/dashboard/owner/properties GET/POST - Properties

/api/admin/stats           GET - Platform KPIs
/api/admin/cleaners        GET - All cleaners
/api/admin/cleaners/[id]   PATCH - Approve/suspend
/api/admin/reviews         GET - All reviews
/api/admin/reviews/[id]    PATCH - Approve/feature
/api/admin/owners          GET - All owners with properties
/api/admin/ai/chat         POST - Admin AI Agent conversation
```

### Pages
```
/                      Homepage with cleaner directory
/about                 Origin story
/[slug]                Public cleaner profile with reviews
/[slug]/booking        Booking flow (4 steps)
/login                 Auth page (magic link or phone)
/onboarding/cleaner    Cleaner signup flow
/dashboard             Cleaner dashboard (5 tabs: Home, Bookings, Messages, Schedule, Profile)
/owner/dashboard       Owner dashboard (5 tabs: Home, Bookings, Messages, Villas, Account)
/admin                 Admin dashboard (7 tabs: Overview, Cleaners, Owners, Bookings, Reviews, Feedback, AI)
```

---

## Database Models (Prisma)

| Model | Purpose |
|-------|---------|
| User | All users (email/phone, role, preferredLanguage) |
| Owner | Owner profile (referralCode, trusted status, adminNotes for CRM) |
| Cleaner | Cleaner profile (slug, bio, areas, rates, stats, calendarToken) |
| Property | Villa details (address, bedrooms, access notes) |
| Booking | Cleaning appointments |
| Review | Ratings and testimonials (with featured flag) |
| Conversation | Links owner and cleaner for messaging |
| Message | Individual messages with translation |
| Feedback | Internal platform feedback |

---

## Multilingual Messaging

### Supported Languages
| Code | Language | Flag |
|------|----------|------|
| en | English | 🇬🇧 |
| es | Español | 🇪🇸 |
| de | Deutsch | 🇩🇪 |
| fr | Français | 🇫🇷 |
| nl | Nederlands | 🇳🇱 |
| it | Italiano | 🇮🇹 |
| pt | Português | 🇵🇹 |

### How It Works
1. User sets preferred language in Account/Profile settings
2. When sending a message, system detects the language
3. Message is translated to recipient's preferred language
4. Both original and translated versions are stored
5. Recipients can toggle "Show original" to see untranslated text

### Key Files
- `lib/translate.ts` - detectLanguage(), translateText(), detectAndTranslate()
- `components/language-selector.tsx` - Language preference UI
- `app/api/messages/route.ts` - Message sending with translation
- `app/dashboard/tabs/messages.tsx` - Cleaner messaging UI (Spanish)
- `app/owner/dashboard/tabs/messages.tsx` - Owner messaging UI (English)

---

## Admin AI Agent

Claude-powered AI assistant for platform administration with tool-use capabilities.

### Capabilities
- Query and manage cleaners, owners, bookings, reviews
- Approve/reject cleaners and reviews
- Send translated messages to cleaners
- Generate WhatsApp invite links for onboarding
- Update cleaner profiles (phone, email, rates, areas)
- View and update owner CRM notes

### Tools Available (18 total)
| Tool | Description |
|------|-------------|
| get_dashboard_stats | Platform KPIs by period |
| query_cleaners | Search cleaners by status/area/name |
| query_owners | Search owners with booking history |
| query_bookings | Filter bookings by status/date |
| query_reviews | Find pending or rated reviews |
| get_cleaner_details | Full cleaner profile with history |
| get_owner_details | Full owner profile with CRM notes |
| approve_cleaner | Activate pending cleaner |
| reject_cleaner | Remove cleaner application |
| approve_review | Publish pending review |
| feature_cleaner | Toggle homepage featured status |
| update_cleaner | Modify profile fields |
| update_owner_notes | Add/update CRM notes |
| send_message_to_cleaner | Auto-translated in-app message |
| generate_whatsapp_invite | Pre-filled WhatsApp links |

### Optimization
- Dynamic tool selection based on query keywords
- Haiku model for simple queries (faster, cheaper)
- Sonnet model for complex operations
- Conversation history limited to 6 messages
- Compact JSON responses

### Key Files
- `lib/ai/admin-agent.ts` - Agent implementation with all tools
- `app/api/admin/ai/chat/route.ts` - Chat API endpoint
- `app/admin/tabs/ai.tsx` - Admin chat UI

---

## Knowledge Base

Markdown-based documentation that AI agents can dynamically load for context.

### Files
- `knowledge/cleaner.md` - Cleaner app guide, booking workflow, team features
- `knowledge/owner.md` - Owner app guide, services, "I'm Coming Home" feature
- `knowledge/admin.md` - Platform stats, approval process, common issues

### Features
- 5-minute cache with auto-refresh
- Keyword-based section search
- Role-appropriate knowledge injection
- Version-controlled documentation

### Key Files
- `lib/ai/knowledge.ts` - loadKnowledge(), searchKnowledge()

---

## Test Accounts

After running `npx prisma db seed`:

| Role | Login | Notes |
|------|-------|-------|
| Admin | admin@villacare.com | Magic link |
| Admin | mark@leadballoon.co.uk | Magic link |
| Admin | kerry@leadballoon.co.uk | Magic link |
| Owner | mark@example.com | Magic link |
| Cleaner | +34612345678 (Clara) | OTP code: 123456 |
| Cleaner | +34623456789 (Maria) | OTP code: 123456 |
| Cleaner | +34634567890 (Ana) | OTP code: 123456 |
| Cleaner | +34645678901 (Sofia) | OTP code: 123456 |
| Cleaner | +34656789012 (Carmen) | OTP code: 123456 |

---

## Common Tasks

### Run locally
```bash
npm run dev
```

### Update database schema
```bash
npx prisma db push
npx prisma generate
```

### Reset and seed database
```bash
npx prisma db push --force-reset
npx prisma db seed
```

### Add admin user
```bash
npx tsx -e "
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
prisma.user.upsert({
  where: { email: 'new@admin.com' },
  update: { role: 'ADMIN' },
  create: { email: 'new@admin.com', name: 'New Admin', role: 'ADMIN', emailVerified: new Date() }
}).then(console.log).finally(() => prisma.\$disconnect())
"
```

### Deploy
Push to `main` branch - Vercel auto-deploys.

---

## Environment Variables

```env
# Database (Neon)
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# Email (Resend)
RESEND_API_KEY="..."

# OpenAI (for message translation)
OPENAI_API_KEY="sk-..."

# Anthropic (for admin AI agent)
ANTHROPIC_API_KEY="sk-ant-..."

# App
NEXT_PUBLIC_APP_URL="https://villacare.app"
```

---

## Design System

### Colors
```
Primary Brand (Terracotta):
- #C4785A - Primary accent, CTAs, stars, badges
- #B56A4F - Hover state

Neutrals:
- #1A1A1A - Primary text, dark backgrounds
- #6B6B6B - Secondary text
- #9B9B9B - Muted text, placeholders
- #DEDEDE - Borders, inputs
- #EBEBEB - Light borders, dividers
- #F5F5F3 - Light backgrounds
- #FAFAF8 - Page background (warm white)

Status Colors:
- #2E7D32 / #E8F5E9 - Success (green)
- #E65100 / #FFF3E0 - Warning (orange)
- #C75050 / #FFEBEE - Error (red)
- #1565C0 / #E3F2FD - Info (blue)

Accent:
- #FFF8F5 - Warm highlight (terracotta tint)
```

### Rules
- Minimum width: 320px (iPhone SE)
- Touch targets: 44px minimum
- Font: System sans-serif, minimum 16px
- Mobile-first, active states not hover
- Safe area padding for iOS notch/home bar

### Component Patterns
```tsx
// Primary Button
className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium active:scale-[0.98] transition-all"

// Terracotta Button
className="bg-[#C4785A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#B56A4F]"

// Card
className="bg-white rounded-2xl p-4 border border-[#EBEBEB]"

// Input
className="w-full px-4 py-3.5 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A]"

// Filter Pill (active)
className="px-4 py-2 rounded-full text-sm font-medium bg-[#1A1A1A] text-white"
```

---

## Service Areas

Alicante region:
- Alicante City
- San Juan
- Playa de San Juan
- El Campello
- Mutxamel
- San Vicente
- Jijona

---

## Services & Pricing

| Service | Hours | Formula |
|---------|-------|---------|
| Regular Clean | 3 | hourlyRate x 3 |
| Deep Clean | 5 | hourlyRate x 5 |
| Arrival Prep | 4 | hourlyRate x 4 |

Default hourly rates: €15-20/hour

---

## User Avatars

### Sandra (Villa Owner)
- Age 55-65, UK/EU expat
- Owns villa in Alicante area
- Visits 2-4x per year (90-day Schengen limit)
- Uses iPad, WhatsApp, hates passwords
- Wants: "Arrive to a home that's ready"

### Clara (Cleaner)
- Professional cleaner in Alicante
- Has existing team/business
- Wants to scale, reduce admin work
- Quality benchmark for platform

---

## Referral Model

Cleaners join by invitation only:
1. Existing cleaner refers someone they trust
2. Referee applies with referrer's name
3. We verify with referrer
4. If vouched for, approved and invited

This ensures quality through social accountability.

---

## Calendar Integration

Cleaners can sync bookings to external calendars:

1. Generate unique calendar token (POST `/api/dashboard/cleaner`)
2. Subscribe to ICS feed: `/api/calendar/{token}`
3. Works with Google Calendar, Apple Calendar, Outlook

ICS feed includes:
- All confirmed/pending bookings
- Property address in location field
- Service type and price in description

---

## Activity Feed (Social Proof)

Homepage displays rotating activity ticker showing:
- Completed cleans: "Clean completed in {area}"
- New reviews: "{rating}-star review for {cleaner}"
- New bookings: "New booking in {area}"

Updates every 4 seconds with fade animation.

---

## What's Built vs. Planned

### Complete
- [x] Homepage with cleaner directory
- [x] Area-based filtering
- [x] Social proof activity feed
- [x] Public cleaner profiles with reviews
- [x] About/origin story page
- [x] 4-step booking flow
- [x] Cleaner onboarding (phone OTP)
- [x] Cleaner dashboard with calendar sync
- [x] Owner dashboard
- [x] Admin dashboard (cleaners, reviews, stats, owners, AI)
- [x] Admin AI Agent with 18 tools
- [x] Knowledge base system
- [x] Owner CRM notes
- [x] Review system with moderation
- [x] ICS calendar feeds
- [x] Multilingual messaging with auto-translation
- [x] Admin-cleaner messaging
- [x] Language preference settings

### In Progress
- [ ] Unified support messaging (AI-first with human escalation)

### Planned
- [ ] Stripe payment integration
- [ ] WhatsApp notifications
- [ ] Photo uploads (before/after)
- [ ] Email notifications (beyond magic links)
- [ ] SMS verification (production)
- [ ] Referral rewards system
- [ ] Voice input for messages
- [ ] Admin-owner messaging

---

## Contact

Built for the Alicante expat community.
- Email: hello@alicantecleaners.com
- Domain: alicantecleaners.com / villacare.app
