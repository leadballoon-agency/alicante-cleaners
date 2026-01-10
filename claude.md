# VillaCare (Alicante Cleaners) - Technical Reference

> **Starting with cleaning. Expanding to all villa services. Ending in real estate.**
>
> AI-native platform connecting villa owners with trusted service providers.
> Building the trusted relationship layer with Europe's villa owners.
>
> **Live Platform:** https://alicantecleaners.com
> **Investor Site:** https://villacare.app

---

## Related Projects

| Project | Path | Description |
|---------|------|-------------|
| Alicante Cleaners | `/Users/marktaylor/Desktop/Alicante-Cleaners` | Main platform (this repo) |
| VillaCare App | `/Users/marktaylor/Desktop/villacare-app` | Investor pitch site with AI demo |

### villacare-app (Investor Site)
Single-page pitch site for investors with:
- AI Investor Agent chat (Claude Opus 4.5)
- Real estate endgame visualization
- 10 AI agents showcase grid
- Platform metrics ("Where We Are Now")
- Security as competitive moat section
- Links to live platform demos

**Tech:** Next.js 14, Tailwind CSS, Vercel
**Key File:** `app/page.tsx` - Single page with all sections

---

## Documentation

For detailed documentation, see the `docs/` folder:

### Core Technical Docs
| Document | Description |
|----------|-------------|
| [README.md](docs/README.md) | Executive summary - problem, solution, business model |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, tech stack rationale, data flow diagrams |
| [DATABASE.md](docs/DATABASE.md) | Prisma schema, all models, relationships, queries |
| [API.md](docs/API.md) | 90+ REST endpoints with request/response examples |
| [INTEGRATIONS.md](docs/INTEGRATIONS.md) | Twilio, OpenAI, Anthropic, Resend configuration |
| [FRONTEND.md](docs/FRONTEND.md) | Pages, components, design system, Owner/Cleaner JobCards |
| [DEVELOPER.md](docs/DEVELOPER.md) | Setup guide, deployment, common tasks, handoff checklist |

### AI & Features
| Document | Description |
|----------|-------------|
| [AI-SALES-ASSISTANT.md](docs/AI-SALES-ASSISTANT.md) | AI chat assistant, booking flow, security features |
| [TEAM-JOBS.md](docs/TEAM-JOBS.md) | Team management, job assignment, calendar sync |

### Business & Strategy
| Document | Description |
|----------|-------------|
| [CURRENT-STATE.md](docs/CURRENT-STATE.md) | 2-page investor brief - metrics, moat, business model |
| [PITCH.md](docs/PITCH.md) | Investor pitch narrative and positioning |
| [REVENUE.md](docs/REVENUE.md) | Revenue model, pricing strategy, projections |

### Audits & Planning
| Document | Description |
|----------|-------------|
| [SITE-AUDIT-JAN2026.md](docs/SITE-AUDIT-JAN2026.md) | Site audit findings and recommendations |
| [PRIORITY-FIXES-JAN2026.md](docs/PRIORITY-FIXES-JAN2026.md) | Priority fixes and improvements list |

### Assets
| Folder | Description |
|--------|-------------|
| [screenshots/](docs/screenshots/) | 195 UI screenshots for documentation |

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
| AI/Investor | Anthropic Claude Opus 4.5 (villacare.app) |
| Hosting | Vercel (auto-deploy from GitHub) |

---

## The Vision: Real Estate Endgame

**Phase 1: Services** (Current) - Weekly cleaning, trust building. €60/clean
**Phase 2: Management** - Property management, key holder. €200-500/month
**Phase 3: Real Estate** - Buy, sell, invest. €15-25K/sale

**Why this works:** Cleaners visit properties weekly. They know when owners are selling before anyone else. This is the Zillow play, but with a services moat.

**10 AI Agents:**
1. Sales Agent - Handles inquiries 24/7
2. Support Agent - Answers questions
3. Success Coach - Helps cleaners grow
4. Onboarding Agent - Guides setup
5. Admin Agent - 18+ tools
6. Owner Agent - Property owner assistant
7. Cleaner Agent - Booking management
8. Investor Agent - Investment inquiries (villacare.app)
9. Alan Agent - Camp entertainer personality (engagement)
10. Amanda Agent - Warm & reassuring personality (conversion)

---

## Current Live Features

### Public Pages
- **Homepage** (`/`) - Owner-focused landing, cleaner directory with area filtering, social proof activity feed
- **Cleaner Landing** (`/join`) - Conversion page for cleaner recruitment with app screenshots
- **Onboarding Guides** - Step-by-step visual guides with phone mockups, ES/EN bilingual:
  - `/join/guide` - Getting started guide
  - `/join/booking-guide` - How to manage bookings
  - `/join/calendar-guide` - Google Calendar sync setup
  - `/join/team-leader-guide` - How to grow your team (for leaders)
  - `/join/team-guide` - How to join a team (for members)
  - `/join/services-guide` - How to add custom services (for team leaders)
- **About page** (`/about`) - Origin story
- **Cleaner profiles** (`/{slug}`) - Public pages with reviews, services, AI chat assistant, booking

### Booking Flow
- 4-step booking process: Service → Date/Time → Details → Confirm
- Guest bookings (no account required) or authenticated
- WhatsApp notifications to cleaner and owner on booking
- AI-powered onboarding via magic links for new users

### Cleaner Features
- **Onboarding** - Phone OTP verification, profile setup, area selection, pricing, team selection
- **Dashboard** - 7-tab layout with SmartWidget navigation:
  - **Home** - Calendar timeline with all jobs grouped by day, peek-to-lock booking cards
  - **Bookings** - All bookings with filters, assign to team members
  - **Success** - AI Success Coach with profile analytics, personalized tips, chat
  - **Promote** - Stats (weekly/monthly/all-time), shareable profile card, WhatsApp share, tips
  - **Messages** - Conversations with owners (auto-translated, markdown formatting for bold/links)
  - **Team** - Team management (Team Leaders only), applicant review, fully localized (ES/EN)
  - **Profile** - Edit profile, settings, Google Calendar sync
- **Team Management** - Create team, manage members, review applicants with AI chat summaries
  - Team leader can refer cleaners and manage team members
  - Fully localized Team tab with Spanish/English translations
- **Booking Assignment** - Assign bookings to team members
- **Google Calendar Sync** - OAuth integration with FreeBusy API for availability
- **WhatsApp notifications** - New bookings, can reply ACCEPT/DECLINE directly
- **AI Sales Assistant** - On profile pages, handles inquiries and bookings
- **Account Management** - Pause or delete account with 30-day retention
- **Language Sync** - Dashboard syncs language preference from database for consistent localization across all tabs

### Owner Features
- **Dashboard** - 5-tab layout: Home, Bookings, Properties, Messages, Account
  - **Home** - Timeline of bookings as JobCards, Getting Started checklist, "I'm Coming Home" for remote owners
  - **Bookings** - Full booking timeline with all past and upcoming bookings
  - **JobCards** - Peek-to-lock interaction (300ms peek, 1.5s lock for quick actions)
  - **Quick Actions** - Cancel, reschedule, message cleaner, edit access notes, leave review
  - **Edit Access Notes** - Update property access details and special instructions directly from booking cards
- **Owner Type** - REMOTE (away most of year) or RESIDENT (lives in villa) - affects dashboard features
- **Arrival Prep** - "I'm Coming Home" feature for pre-arrival services (remote owners only)
- **AI Assistant** - Contextual help in dashboard, opens with context from booking cards
- **WhatsApp notifications** - Booking confirmations, status updates, completion with review links
- **Account Management** - Pause or delete account with 30-day retention

### Admin Features
- **Dashboard** - Platform stats, cleaner management, owner CRM, review approval (10 tabs)
- **Live Feed** - Real-time activity stream (bookings, reviews, signups, cleaner logins, messages, service requests), pending counts, page view analytics
- **Audit Log** - Track all admin actions (login, impersonate, approve, reject, etc.)
- **Last Login Tracking** - See when cleaners/owners last logged in
- **Support Center** - AI-powered support conversations with escalation
- **Feedback Management** - View and track user feedback with voting
- **Platform Settings** - Configure team leader requirements, scripts & tracking
- **Script Management** - GTM, Facebook Pixel, GA4, ConvertBox (admin configurable)
- **GA4 Real-time** - Live visitor counts from Google Analytics (optional)
- **Impersonation** - Login as user for support
- **AI Agent** - Claude-powered assistant with 20+ tools for platform management
- **Knowledge Base** - Markdown documentation for AI context

### Integrations
- **WhatsApp via Twilio** - OTP codes, booking notifications, reply handling
- **Google Calendar OAuth** - Calendar sync with FreeBusy API (privacy-first)
- **ICS Calendar feeds** - Sync to Google/Apple/Outlook
- **Multilingual messaging** - Auto-translation (7 languages)
- **AI Support Widget** - Contextual help throughout the platform

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
- `lib/ai/success-agent.ts` - Cleaner Success Coach agent
- `lib/ai/success-agent-tools.ts` - Success Coach tool implementations
- `lib/ai/knowledge.ts` - Knowledge base loader
- `knowledge/*.md` - Documentation for AI context

### Analytics & Audit
- `lib/audit.ts` - Server-side audit logging functions
- `lib/audit-utils.ts` - Client-safe audit types and constants
- `components/analytics/script-loader.tsx` - GTM, FB Pixel, GA4, ConvertBox loader
- `components/analytics/page-tracker.tsx` - Page view tracking component
- `app/admin/tabs/live.tsx` - Live Feed with activity and analytics
- `app/admin/tabs/audit.tsx` - Audit log viewer with filters

### Security
- `lib/encryption.ts` - AES-256-GCM encryption for sensitive data (access notes)
- `lib/access-control.ts` - Just-in-time access control (24h window before booking)

### Dashboard Components
- `app/dashboard/page.tsx` - Main cleaner dashboard with tab navigation
- `app/dashboard/tabs/promote.tsx` - Stats and promotional tools tab
- `app/dashboard/components/team-calendar/JobsTimeline.tsx` - Calendar timeline view
- `app/dashboard/components/team-calendar/BookingCard.tsx` - Booking card with peek-to-lock
- `app/dashboard/components/team-calendar/BookingPeekModal.tsx` - Quick actions on hold (owner call, key holder call, access notes)
- `components/smart-widget/SmartWidget.tsx` - Floating navigation button
- `components/smart-widget/NavigationMenu.tsx` - Full navigation menu (long-press)
- `components/smart-widget/QuickActionMenu.tsx` - Context-aware quick actions (tap)

### Owner Dashboard Components
- `app/owner/dashboard/page.tsx` - Main owner dashboard with tab navigation
- `app/owner/dashboard/tabs/home.tsx` - Home tab with JobCards timeline
- `app/owner/dashboard/tabs/bookings.tsx` - Full booking timeline
- `app/owner/dashboard/components/OwnerBookingCard.tsx` - JobCard with peek-to-lock (300ms/1.5s)
- `app/owner/dashboard/components/OwnerBookingPeekModal.tsx` - Quick actions modal
- `app/owner/dashboard/components/OwnerJobsTimeline.tsx` - Timeline grouping by date
- `app/owner/dashboard/components/NewBookingCard.tsx` - Skeleton "+" card for new bookings

---

## API Routes

### Public
```
GET  /api/cleaners                    List cleaners (with area filter)
GET  /api/cleaners/[slug]             Single cleaner profile + reviews
GET  /api/cleaners/[slug]/availability Check availability for month
GET  /api/activity                    Recent platform activity for social proof
POST /api/bookings                    Create booking (triggers WhatsApp)
GET  /api/calendar/[token]            ICS calendar feed for cleaner
GET  /api/teams/leaders               List team leaders for onboarding
POST /api/teams/[id]/join             Request to join a team
```

### Messaging
```
GET  /api/messages                    Unread count
POST /api/messages                    Send message (with translation)
GET  /api/messages/conversations      List conversations
POST /api/messages/conversations      Start new conversation
GET  /api/messages/conversations/[id] Get messages in conversation
```

### Support
```
POST /api/support/conversations       Create/continue support chat
```

### User
```
GET/PATCH /api/user/preferences       Language preferences
GET/PATCH /api/account                Account management (pause/delete)
```

### Cleaner Dashboard
```
GET/POST  /api/dashboard/cleaner                Profile + calendar token
GET/PATCH /api/dashboard/cleaner/profile        Update profile fields
GET       /api/dashboard/cleaner/bookings       Cleaner's bookings
PATCH     /api/dashboard/cleaner/bookings/[id]  Accept/decline/complete/assign
POST      /api/dashboard/cleaner/bookings/[id]/review  Request review
GET/POST  /api/dashboard/cleaner/availability   Manage availability slots
GET/POST  /api/dashboard/cleaner/comments       Internal property comments
GET/PATCH /api/dashboard/cleaner/phone          Update phone number
GET/POST  /api/dashboard/cleaner/team           Create/manage team
GET       /api/dashboard/cleaner/team/members/[id]  Manage team member
POST      /api/dashboard/cleaner/team/leave     Leave team
GET/POST  /api/dashboard/cleaner/team/requests  Team join requests
PATCH     /api/dashboard/cleaner/team/requests/[id]  Accept/reject request
GET/POST  /api/dashboard/cleaner/team/applicants  PENDING cleaner applicants
PATCH     /api/dashboard/cleaner/team/applicants/[id]  Accept/reject applicant
POST      /api/dashboard/cleaner/team/refer     Send team referral
GET       /api/dashboard/cleaner/team/calendar  Team calendar view
POST      /api/dashboard/cleaner/team/calendar/sync  Sync team calendars
GET/POST  /api/dashboard/cleaner/services      List/create team services
GET/PATCH/DEL /api/dashboard/cleaner/services/[id]  Manage service
```

### Google Calendar
```
GET  /api/calendar/google/connect     Start OAuth flow
GET  /api/calendar/google/callback    OAuth callback
POST /api/calendar/google/sync        Sync calendar now
POST /api/calendar/google/disconnect  Disconnect calendar
```

### Owner Dashboard
```
GET       /api/dashboard/owner              Profile + stats
GET       /api/dashboard/owner/bookings     Owner's bookings
POST      /api/dashboard/owner/bookings/[id]/cancel  Cancel booking (with optional reason)
POST      /api/dashboard/owner/bookings/[id]/review  Leave review (triggers POST_REVIEW_REBOOK email for 4+ stars)
POST      /api/dashboard/owner/bookings/[id]/rebook  1-click rebook (same cleaner, next week)
POST      /api/dashboard/owner/bookings/[id]/recurring  Make booking recurring (weekly/fortnightly/monthly)
POST      /api/dashboard/owner/bookings/[id]/skip    Skip next recurring booking
GET/POST  /api/dashboard/owner/properties   Properties
PATCH/DEL /api/dashboard/owner/properties/[id]  Update/delete property
GET/PATCH /api/dashboard/owner/preferences  Owner preferences
GET       /api/dashboard/owner/referrals    Referral stats
POST      /api/dashboard/owner/arrival-prep "I'm Coming Home" request
```

### Admin
```
GET   /api/admin/stats             Platform KPIs
GET   /api/admin/cleaners          All cleaners (includes lastLoginAt)
PATCH /api/admin/cleaners/[id]     Approve/suspend/update
GET   /api/admin/owners            All owners (includes lastLoginAt)
GET   /api/admin/bookings          All bookings
GET   /api/admin/reviews           All reviews
PATCH /api/admin/reviews/[id]      Approve/feature
GET   /api/admin/feedback          User feedback
PATCH /api/admin/feedback/[id]     Update feedback status
GET   /api/admin/support           Support conversations
PATCH /api/admin/support/[id]      Resolve/escalate support
GET/PATCH /api/admin/settings      Platform settings (includes scripts config)
POST  /api/admin/impersonate       Login as user (support)
POST  /api/admin/ai/chat           Admin AI Agent conversation
GET   /api/admin/activity          Live activity feed (bookings, reviews, signups, logins, services)
GET   /api/admin/analytics         Page view analytics (total, today, trending)
GET   /api/admin/audit             Audit log with filters
GET   /api/admin/services          List all team services (filter by status)
GET/PATCH/DEL /api/admin/services/[id]  Approve/reject/delete service
GET   /api/admin/ga4-realtime      GA4 real-time visitor data (optional)
```

### Analytics & Tracking
```
GET  /api/scripts                  Public scripts config (GTM, pixels)
POST /api/track                    Record page view
GET  /api/og/cleaner/[slug]        Dynamic OG image for cleaner
```

### Webhooks
```
POST /api/webhooks/twilio          Twilio WhatsApp incoming messages
```

### AI Chat
```
POST /api/ai/public-chat           Public cleaner profile chat
POST /api/ai/onboarding-chat       Cleaner onboarding help
POST /api/ai/owner/chat            Owner AI assistant
POST /api/ai/cleaner/chat          Cleaner AI assistant
GET  /api/ai/success-chat          Get Success Coach greeting + stats
POST /api/ai/success-chat          Chat with Success Coach
POST /api/ai/applicant-chat        Team applicant screening chat
POST /api/ai/sales-agent/respond   Auto-respond to owner messages
POST /api/ai/onboarding/create     Create magic link onboarding
GET  /api/ai/onboarding/[token]    Get onboarding data
POST /api/ai/onboarding/[token]/confirm  Complete onboarding
```

### Cron Jobs
```
GET /api/cron/daily-tasks          Combined daily cron (reminders, cleanup)
GET /api/cron/booking-reminders    Booking response reminders
GET /api/cron/cleanup-rate-limits  Clean expired rate limit entries
```

### Uploads
```
POST /api/upload                   General file upload
POST /api/onboarding/upload        Onboarding photo upload
POST /api/onboarding/cleaner       Complete cleaner onboarding
```

---

## Pages

```
/                              Homepage (owner-focused) with cleaner directory
/join                          Cleaner recruitment landing page
/join/guide                    Step-by-step onboarding guide (ES/EN)
/join/calendar-guide           Google Calendar sync guide (ES/EN)
/guide                         General platform guide
/about                         Origin story
/[slug]                        Public cleaner profile with AI chat
/[slug]/booking                Booking flow (4 steps)
/login                         Auth page (magic link or phone)
/login/verify                  Email verification check page
/signout                       Sign out page
/onboarding/cleaner            Cleaner signup flow (5 steps)
/onboarding/cleaner/calendar-callback  Google Calendar OAuth callback
/onboard/[token]               AI onboarding magic link for new owners
/dashboard                     Cleaner dashboard (6 tabs: Home/Calendar, Bookings, Promote, Messages, Team, Profile)
/dashboard/account             Cleaner account settings (pause/delete)
/dashboard/availability        Cleaner availability management
/owner/dashboard               Owner dashboard (5 tabs)
/owner/dashboard/account       Owner account settings (pause/delete)
/admin                         Admin dashboard (10 tabs: Overview, Live, AI, Cleaners, Owners, Bookings, Reviews, Audit, Settings)
/features/rebook               Rebook features showcase (1-click rebook, recurring) - ES/EN
/features/ai-assistant         AI Sales Assistant feature page - ES/EN
/features/success-coach        Success Coach feature page
/privacy                       Privacy policy
/terms                         Terms of service
```

---

## Database Models (Prisma)

| Model | Purpose |
|-------|---------|
| User | All users (email/phone, role, preferredLanguage, accountStatus) |
| Owner | Owner profile (referralCode, trusted status, adminNotes for CRM) |
| Cleaner | Cleaner profile (slug, bio, areas, rates, stats, calendarToken, teamVerification) |
| Property | Villa details (address, bedrooms, access notes, key holder contact) |
| Booking | Cleaning appointments (status: PENDING/CONFIRMED/COMPLETED/CANCELLED) |
| Review | Ratings and testimonials (with featured flag) |
| Conversation | Links owner and cleaner for messaging |
| Message | Individual messages with translation |
| Feedback | Internal platform feedback (mood, votes, status) |
| Team | Cleaner teams (leader + members, requireCalendarSync) |
| TeamService | Custom services and add-ons (PENDING/APPROVED/REJECTED) |
| TeamJoinRequest | Team membership applications |
| CleanerAvailability | Google Calendar synced availability slots |
| TeamAvailabilityCache | Aggregated team calendar view |
| ArrivalPrep | "I'm Coming Home" arrival prep requests |
| SupportConversation | AI-powered support chat sessions |
| SupportMessage | Individual support chat messages |
| ApplicantConversation | PENDING cleaner chats with Team Leaders |
| ApplicantMessage | Messages in applicant conversations |
| PendingOnboarding | AI onboarding magic link data |
| Notification | User notifications (bookings, reviews, AI actions) |
| BookingResponseTracker | Tracks booking response deadlines |
| PlatformSettings | Admin-configurable platform settings (incl. scripts) |
| PageView | Page view analytics (path, cleaner, referrer, session) |
| AuditLog | Admin action audit trail (login, impersonate, approve, etc.) |
| RateLimitEntry | Serverless-compatible rate limiting |
| WebhookEvent | Twilio webhook idempotency tracking |

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

### Translation Keys (i18n)
The platform uses translation dictionaries for UI localization:
- `team.*` - Team tab translations (team management, referrals, applicants, member status)
- Dashboard components sync language preference from database on load for consistent localization

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

## Cleaner Success Coach

Claude-powered AI coach that helps cleaners maximize their success on the platform.

### Gamification
- **Teaser Mode**: Before first completed job - shows profile progress bar, checklist, locked preview
- **Full Mode**: After first completed job - unlocks full AI chat, stats, and personalized coaching

### Tools
| Tool | Description |
|------|-------------|
| get_profile_health | Profile completeness score (0-100) with checklist |
| get_profile_views | Weekly view stats from PageView table |
| get_revenue_stats | Earnings breakdown (week/month/all-time) |
| get_booking_insights | Acceptance rate, completion rate, patterns |
| get_team_opportunities | Team status and benefits |
| get_improvement_tips | Personalized recommendations |

### Profile Health Scoring
| Component | Points | Criteria |
|-----------|--------|----------|
| Photo | 20 | Has profile photo |
| Bio | 20 | 100+ characters |
| Service Areas | 15 | 3+ areas with high-demand coverage |
| Hourly Rate | 10 | Rate set (€15-22 is competitive) |
| Reviews | 15 | 5+ reviews |
| Languages | 10 | 2+ languages |
| Calendar | 10 | Google Calendar synced |

### Key Files
- `lib/ai/success-agent.ts` - Main agent with Claude integration
- `lib/ai/success-agent-tools.ts` - Tool implementations
- `app/api/ai/success-chat/route.ts` - API endpoint (GET for greeting, POST for chat)
- `app/dashboard/tabs/success.tsx` - Success tab UI

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

# Encryption (for sensitive data like access notes)
ENCRYPTION_KEY="..."  # 64-char hex string (32 bytes), generate with: openssl rand -hex 32

# Google Analytics (optional - for real-time data in admin)
GA4_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'

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
- Cleaner landing page (`/join`) with onboarding guides
- Area-based filtering
- Social proof activity feed
- Public cleaner profiles with AI chat
- About/origin story page
- 4-step booking flow
- Cleaner onboarding (phone OTP via WhatsApp)
- Cleaner dashboard with calendar sync
- Owner dashboard with arrival prep feature
- Admin dashboard with AI agent
- WhatsApp notifications (Twilio)
- Review system with moderation
- ICS calendar feeds
- Multilingual messaging with auto-translation
- Smart redirects for logged-in users
- Google Calendar OAuth integration (FreeBusy API)
- Team management system (leaders + members)
- Team verification for new cleaners
- Team applicant chat (AI screening)
- Team calendar aggregation view
- Booking assignment to team members
- Account pause/delete with 30-day retention
- AI support chat widget
- Platform settings (admin configurable)
- Rate limiting (serverless-compatible)
- Webhook idempotency for Twilio
- Photo uploads for cleaner profiles
- Internal property comments
- Secure access notes (AES-256 encryption at rest)
- Just-in-time access control (24h visibility window)
- Sensitive info detection in AI chat
- Admin Live Feed (activity stream, pending counts)
- Page view analytics with trending cleaners
- Audit logging for admin actions
- Last login tracking for users
- Configurable scripts (GTM, Facebook Pixel, GA4, ConvertBox)
- GA4 real-time integration (optional)
- Dynamic OG images for cleaner profiles
- Cleaner Success Coach (AI-powered growth tips, profile analytics)
- Profile Guide page (`/join/profile-guide`)
- **Custom Services** - Team leaders can add pool cleaning, laundry, gardening
- **Specialist Recruitment** - Pool cleaners, gardeners, handymen join via teams
- **Vertical Services Expansion** - Platform evolving into "Villa Services" marketplace
- **Team Progression Tracking** - Solo → Team Member → Team Leader → Business Owner
- Expand Guide page (`/join/expand-guide`)
- Services Guide page (`/join/services-guide`)
- **1-Click Rebook** - Owners can rebook same cleaner for next week with one tap
- **Make Recurring** - Set up weekly, fortnightly, or monthly recurring bookings
- **Post-Review Email Sequence** - AI-generated nurturing emails sent after positive reviews (4+ stars)
- **Feature Showcase Pages** - `/features/rebook` (bilingual ES/EN) promotes rebook features
- **Cleaner Education Email System** - 9 automated emails educating cleaners on platform features:
  - CLEANER_WELCOME (onboarding complete)
  - PROFILE_TIPS (24h, profile incomplete)
  - CALENDAR_SYNC_GUIDE (48h, calendar not connected)
  - FIRST_BOOKING_GUIDE (after first booking)
  - SUCCESS_COACH_INTRO (after first completed job)
  - BOOKING_MANAGEMENT_TIPS (1 week after first job)
  - TEAM_OPPORTUNITY (2 weeks, not on team)
  - PROMOTE_PROFILE_TIPS (3 weeks)
  - CLEANER_REACTIVATION (2 weeks no login)

### Planned 📋
- Stripe payment integration
- Email notifications (beyond magic links)
- Referral rewards redemption
- Push notifications
- Before/after photo uploads for bookings

---

## Contact

Built for the Alicante expat community.
- Email: hello@alicantecleaners.com
- Domain: alicantecleaners.com

---

## Recent Work (Session Continuity)

> **Last Updated:** January 2026

### Just Completed ✅
1. **1-Click Rebook & Make Recurring** - Owner dashboard features for easy rebooking
   - `POST /api/dashboard/owner/bookings/[id]/rebook` - Creates new booking for same day next week
   - `POST /api/dashboard/owner/bookings/[id]/recurring` - Creates recurring booking schedule
   - `POST /api/dashboard/owner/bookings/[id]/skip` - Skip a single occurrence in recurring
   - JobCard peek modal updated with Rebook and Make Recurring buttons
   - AI confirmation after rebook with new booking details

2. **Feature Showcase Page** (`/features/rebook`)
   - Bilingual ES/EN page showcasing 1-click rebook and recurring features
   - Phone mockups with screenshots of dashboard features
   - How to Access, Feature sections, FAQ, CTA linking to dashboard

3. **Post-Review Nurturing Email**
   - New `POST_REVIEW_REBOOK` email type added to NurturingEmailType enum
   - Triggered automatically after positive reviews (4+ stars)
   - AI-generated personalized email thanking owner for review
   - Introduces 1-click rebook and recurring booking features
   - CTA links to `/features/rebook` showcase page
   - Admin emails excluded from nurturing campaigns

4. **Owner Dashboard JobCards** - Full implementation of peek-to-lock booking cards for owners
   - `OwnerBookingCard.tsx` - 300ms peek, 1.5s lock gesture
   - `OwnerBookingPeekModal.tsx` - Quick actions by booking status
   - `OwnerJobsTimeline.tsx` - Timeline grouping with date headers
   - `NewBookingCard.tsx` - Skeleton "+" card for new bookings (opens AI)
   - Cancel booking API endpoint with WhatsApp notification
   - Edit access notes directly from booking cards

### Active Plan
Check `/Users/marktaylor/.claude/plans/` for any active implementation plans.

### Development Tools
- **DevUserSwitcher** - `components/dev/DevUserSwitcher.tsx` - Quick user switching in development
- Run `npm run dev` and look for dev panel at bottom of owner dashboard

### Next Steps (Ideas)
- [ ] Universal JobCard component (refactor cleaner + owner into shared)
- [ ] Admin live feed JobCards for booking activities
- [ ] Recurring bookings display (single card with 🔄 badge)
- [ ] Photo uploads for before/after cleaning proof
- [ ] Stripe payment integration
