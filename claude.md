# VillaCare (Alicante Cleaners) - Technical Reference

> Villa cleaning platform for Alicante, Spain. Connects villa owners with trusted cleaners.
> **Live:** https://alicantecleaners.com

---

## Documentation

For detailed documentation, see the `docs/` folder:

| Document | Description |
|----------|-------------|
| [README.md](docs/README.md) | Executive summary - problem, solution, business model |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, tech stack rationale, data flow diagrams |
| [DATABASE.md](docs/DATABASE.md) | Prisma schema, all models, relationships, queries |
| [API.md](docs/API.md) | 60+ REST endpoints with request/response examples |
| [INTEGRATIONS.md](docs/INTEGRATIONS.md) | Twilio, OpenAI, Anthropic, Resend configuration |
| [FRONTEND.md](docs/FRONTEND.md) | Pages, components, design system, mobile considerations |
| [DEVELOPER.md](docs/DEVELOPER.md) | Setup guide, deployment, common tasks, handoff checklist |

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
| WhatsApp | Twilio WhatsApp Business API |
| AI/Translation | OpenAI GPT-4o-mini |
| AI/Admin | Anthropic Claude (Haiku + Sonnet) |
| AI/Support | Anthropic Claude (contextual chat widgets) |
| Hosting | Vercel (auto-deploy from GitHub) |

---

## Current Live Features

### Public Pages
- **Homepage** (`/`) - Owner-focused landing, cleaner directory with area filtering, social proof activity feed
- **Cleaner Landing** (`/join`) - Conversion page for cleaner recruitment with app screenshots
- **About page** (`/about`) - Origin story
- **Cleaner profiles** (`/{slug}`) - Public pages with reviews, services, AI chat assistant, booking

### Booking Flow
- 4-step booking process: Service → Date/Time → Details → Confirm
- Guest bookings (no account required) or authenticated
- WhatsApp notifications to cleaner and owner on booking

### Cleaner Features
- **Onboarding** - Phone OTP verification, profile setup, area selection, pricing
- **Dashboard** - Bookings, calendar sync (ICS), messaging, profile management
- **WhatsApp notifications** - New bookings, can reply ACCEPT/DECLINE directly
- **AI Sales Assistant** - On profile pages, handles inquiries and bookings

### Owner Features
- **Dashboard** - Properties, booking history, reviews, messaging
- **WhatsApp notifications** - Booking confirmations, status updates, completion with review links

### Admin Features
- **Dashboard** - Platform stats, cleaner management, owner CRM, review approval
- **AI Agent** - Claude-powered assistant with 18 tools for platform management
- **Knowledge Base** - Markdown documentation for AI context

### Integrations
- **WhatsApp via Twilio** - OTP codes, booking notifications, reply handling
- **ICS Calendar feeds** - Sync to Google/Apple/Outlook
- **Multilingual messaging** - Auto-translation (7 languages)

---

## Key Files

### Database
- `prisma/schema.prisma` - Data models
- `prisma/seed.ts` - Test data (5 cleaners, reviews, properties, bookings)
- `lib/db.ts` - Prisma client singleton

### Auth
- `lib/auth.ts` - NextAuth configuration
- `app/api/auth/[...nextauth]/route.ts` - Auth endpoints
- `app/api/auth/otp/route.ts` - Phone OTP with WhatsApp delivery

### WhatsApp (Twilio)
- `lib/whatsapp.ts` - Twilio WhatsApp service (OTP, booking notifications)
- `app/api/webhooks/twilio/route.ts` - Incoming message handler (ACCEPT/DECLINE)

### Translation
- `lib/translate.ts` - OpenAI translation utilities

### AI
- `lib/ai/admin-agent.ts` - Admin AI agent with tools
- `lib/ai/knowledge.ts` - Knowledge base loader
- `knowledge/*.md` - Documentation for AI context

---

## API Routes

### Public
```
GET  /api/cleaners              List cleaners (with area filter)
GET  /api/cleaners/[slug]       Single cleaner profile + reviews
GET  /api/activity              Recent platform activity for social proof
POST /api/bookings              Create booking (triggers WhatsApp)
GET  /api/calendar/[token]      ICS calendar feed for cleaner
```

### Messaging
```
GET  /api/messages              Unread count
POST /api/messages              Send message (with translation)
GET  /api/messages/conversations      List conversations
POST /api/messages/conversations      Start new conversation
GET  /api/messages/conversations/[id] Get messages in conversation
```

### User
```
GET/PATCH /api/user/preferences      Language preferences
```

### Cleaner Dashboard
```
GET/POST /api/dashboard/cleaner           Profile + calendar token
GET      /api/dashboard/cleaner/bookings  Cleaner's bookings
PATCH    /api/dashboard/cleaner/bookings/[id]  Accept/decline/complete
```

### Owner Dashboard
```
GET      /api/dashboard/owner            Profile + stats
GET      /api/dashboard/owner/bookings   Owner's bookings
GET/POST /api/dashboard/owner/properties Properties
```

### Admin
```
GET   /api/admin/stats           Platform KPIs
GET   /api/admin/cleaners        All cleaners
PATCH /api/admin/cleaners/[id]   Approve/suspend
GET   /api/admin/reviews         All reviews
PATCH /api/admin/reviews/[id]    Approve/feature
GET   /api/admin/owners          All owners with properties
POST  /api/admin/ai/chat         Admin AI Agent conversation
```

### Webhooks
```
POST /api/webhooks/twilio        Twilio WhatsApp incoming messages
```

### AI Chat
```
POST /api/ai/public-chat         Public cleaner profile chat
POST /api/ai/onboarding-chat     Cleaner onboarding help
POST /api/ai/admin-chat          Admin AI agent
```

---

## Pages

```
/                      Homepage (owner-focused) with cleaner directory
/join                  Cleaner recruitment landing page
/about                 Origin story
/[slug]                Public cleaner profile with AI chat
/[slug]/booking        Booking flow (4 steps)
/login                 Auth page (magic link or phone)
/onboarding/cleaner    Cleaner signup flow (5 steps)
/dashboard             Cleaner dashboard (5 tabs)
/owner/dashboard       Owner dashboard (5 tabs)
/admin                 Admin dashboard (7 tabs)
/privacy               Privacy policy
/terms                 Terms of service
```

---

## Database Models (Prisma)

| Model | Purpose |
|-------|---------|
| User | All users (email/phone, role, preferredLanguage) |
| Owner | Owner profile (referralCode, trusted status, adminNotes for CRM) |
| Cleaner | Cleaner profile (slug, bio, areas, rates, stats, calendarToken) |
| Property | Villa details (address, bedrooms, access notes) |
| Booking | Cleaning appointments (status: PENDING/CONFIRMED/COMPLETED/CANCELLED) |
| Review | Ratings and testimonials (with featured flag) |
| Conversation | Links owner and cleaner for messaging |
| Message | Individual messages with translation |
| Feedback | Internal platform feedback |
| Team | Cleaner teams (leader + members) |

---

## WhatsApp Integration (Twilio)

### Configuration
- **Account SID:** Set in `TWILIO_ACCOUNT_SID`
- **Auth Token:** Set in `TWILIO_AUTH_TOKEN`
- **WhatsApp Number:** Set in `TWILIO_WHATSAPP_NUMBER` (format: `whatsapp:+447414265007`)

### Message Templates (Content SIDs)
WhatsApp requires pre-approved templates for business-initiated messages:

| Template | Content SID | Use |
|----------|-------------|-----|
| OTP | `HX1bf4d7bc921048c623fa47605c777ce1` | Verification codes |
| New Booking | `HX471e05200d0c4dfd136550601d4dd703` | Notify cleaner of booking |

### Webhook
Incoming WhatsApp messages hit `/api/webhooks/twilio`. Cleaners can reply:
- `ACCEPT` / `YES` / `SI` - Accept pending booking
- `DECLINE` / `NO` - Decline pending booking
- `HELP` / `AYUDA` - Show commands

### Message Flow
1. **New Booking** → Cleaner gets WhatsApp with details
2. **Cleaner Replies ACCEPT** → Booking confirmed, owner notified
3. **Booking Completed** → Owner gets WhatsApp with review link

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
1. User sets preferred language in settings
2. System detects language when sending
3. Message translated to recipient's language
4. Both original and translated versions stored
5. "Show original" toggle available

---

## Admin AI Agent

Claude-powered AI assistant with 18 tools for platform management.

### Tools
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
EMAIL_FROM="VillaCare <noreply@alicantecleaners.com>"

# OpenAI (for message translation)
OPENAI_API_KEY="sk-..."

# Anthropic (for AI agents)
ANTHROPIC_API_KEY="sk-ant-..."

# Twilio (WhatsApp + OTP)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_WHATSAPP_NUMBER="whatsapp:+447414265007"
TWILIO_VERIFY_SERVICE_SID="VA..."  # For phone OTP verification

# Development (optional)
ALLOW_DEV_OTP_BYPASS="true"  # Only in development - allows test OTP code 000000
CRON_SECRET="..."  # For manual cron triggers

# Google OAuth (Calendar Sync)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# App
NEXT_PUBLIC_APP_URL="https://alicantecleaners.com"
```

---

## Design System

### Colors
```
Primary Brand (Terracotta):
- #C4785A - Primary accent, stars, badges
- #B56A4F - Hover state

Neutrals:
- #1A1A1A - Primary text, dark backgrounds, CTAs
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
```

### Component Patterns
```tsx
// Primary Button (black)
className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium active:scale-[0.98] transition-all"

// Terracotta Button
className="bg-[#C4785A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#B56A4F]"

// Card
className="bg-white rounded-2xl p-4 border border-[#EBEBEB]"

// Input
className="w-full px-4 py-3.5 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A]"
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
| Regular Clean | 3 | hourlyRate × 3 |
| Deep Clean | 5 | hourlyRate × 5 |
| Arrival Prep | 4 | hourlyRate × 4 |

Default hourly rates: €15-20/hour

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

### Deploy
Push to `main` branch - Vercel auto-deploys.

### Test WhatsApp locally
```bash
npx tsx -e "
const Twilio = require('twilio');
const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
client.messages.create({
  from: 'whatsapp:+447414265007',
  to: 'whatsapp:+44YOUR_NUMBER',
  contentSid: 'HX471e05200d0c4dfd136550601d4dd703',
  contentVariables: JSON.stringify({'1':'Test','2':'Today','3':'10:00','4':'Deep Clean','5':'Test Address'})
}).then(m => console.log(m.sid));
"
```

---

## Test Accounts

After running `npx prisma db seed`:

| Role | Login | Notes |
|------|-------|-------|
| Admin | admin@villacare.com | Magic link |
| Admin | mark@leadballoon.co.uk | Magic link |
| Admin | kerry@leadballoon.co.uk | Magic link |
| Owner | mark@example.com | Magic link |
| Cleaner | +34612345678 (Clara) | OTP code: 000000 (requires ALLOW_DEV_OTP_BYPASS=true) |
| Cleaner | +34623456789 (Maria) | OTP code: 000000 (requires ALLOW_DEV_OTP_BYPASS=true) |

---

## What's Built vs. Planned

### Complete ✅
- Homepage with cleaner directory (owner-focused)
- Cleaner landing page (`/join`)
- Area-based filtering
- Social proof activity feed
- Public cleaner profiles with AI chat
- About/origin story page
- 4-step booking flow
- Cleaner onboarding (phone OTP via WhatsApp)
- Cleaner dashboard with calendar sync
- Owner dashboard
- Admin dashboard with AI agent
- WhatsApp notifications (Twilio)
- Review system with moderation
- ICS calendar feeds
- Multilingual messaging with auto-translation
- Smart redirects for logged-in users

### Planned 📋
- Stripe payment integration
- Photo uploads (before/after)
- Email notifications (beyond magic links)
- Referral rewards system
- Team assignment for bookings

---

## Contact

Built for the Alicante expat community.
- Email: hello@alicantecleaners.com
- Domain: alicantecleaners.com
