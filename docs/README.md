# VillaCare (Alicante Cleaners) - Technical Documentation

## Executive Summary

VillaCare is a two-sided marketplace connecting villa owners in Alicante, Spain with trusted professional cleaners. The platform solves the pain points of managing vacation property cleaning across language barriers, time zones, and trust issues.

### The Problem

Villa owners (primarily UK/EU expats) struggle to:
- Find reliable cleaners in a foreign country
- Communicate across language barriers (English ↔ Spanish)
- Coordinate cleaning before arrivals when they're not present
- Build trust without personal recommendations

Professional cleaners struggle to:
- Find consistent, quality clients
- Manage bookings across WhatsApp, calls, and texts
- Handle admin work while cleaning
- Scale their business beyond word-of-mouth

### The Solution

VillaCare provides:

**For Owners:**
- Vetted cleaner directory with reviews and ratings
- Simple booking flow (no account required)
- Automatic translation of all messages
- WhatsApp notifications for booking updates
- "Arrive to a home that's ready" peace of mind

**For Cleaners:**
- Professional profile page with booking capability
- AI-powered sales assistant that handles inquiries 24/7
- WhatsApp notifications with one-tap ACCEPT/DECLINE
- Calendar sync to Google/Apple/Outlook
- Team management for coverage
- **Custom services** - Team leaders can add pool cleaning, laundry, gardening, etc.
- **Vertical expansion** - Build a full "Villa Services" business, not just cleaning

**Platform Features:**
- Multilingual messaging (7 languages, auto-translated)
- WhatsApp Business integration via Twilio
- Admin dashboard with AI assistant
- Mobile-first, password-free authentication

### Business Model

Currently in **Beta** (free for all users). Planned monetization:
- Commission per booking (10-15%)
- Premium cleaner features (priority listing, analytics)
- Owner subscription for multiple properties

### Traction

- Live at: https://alicantecleaners.com
- 6 vetted cleaners onboarded (including co-founder Clara)
- Real booking flow operational
- WhatsApp notifications live

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [Architecture](./ARCHITECTURE.md) | System design, tech stack, data flow, AI agents |
| [Database](./DATABASE.md) | Prisma schema, models, relationships |
| [API Reference](./API.md) | All endpoints with request/response examples |
| [Integrations](./INTEGRATIONS.md) | Twilio, OpenAI, Anthropic, Resend |
| [Frontend](./FRONTEND.md) | Pages, components, design system |
| [Developer Guide](./DEVELOPER.md) | Setup, deployment, common tasks |
| [AI Sales Assistant](./AI-SALES-ASSISTANT.md) | Public-facing AI booking flow |
| [Revenue Model](./REVENUE.md) | Fee structure, Stripe Connect plans, crypto-ready |
| [Team Jobs](./TEAM-JOBS.md) | Multi-cleaner job assignment design |

---

## Quick Stats

| Metric | Value |
|--------|-------|
| **Codebase** | ~35,000 lines TypeScript |
| **Pages** | 22 routes |
| **API Endpoints** | 90+ endpoints |
| **Database Models** | 30+ tables |
| **Languages Supported** | 7 (EN, ES, DE, FR, NL, IT, PT) |
| **AI Agents** | 7 (Admin, Success, Sales, Onboarding, Support, Owner, Cleaner) |

---

## Technology Decisions

### Why Next.js 14?
- Server components for SEO and performance
- API routes in same codebase
- Vercel deployment with zero config
- React ecosystem for UI components

### Why Prisma + Neon?
- Type-safe database queries
- Serverless PostgreSQL (scales to zero)
- Excellent DX with migrations

### Why Twilio for WhatsApp?
- Simpler than Meta Cloud API directly
- Single SDK for SMS + WhatsApp
- Template approval process is streamlined
- Reliable webhook handling

### Why Claude for AI?
- Superior reasoning for admin tasks
- Tool-use capabilities for database operations
- Haiku model for cost-effective chat

---

## Investment Considerations

### What's Built
- Full MVP with real users
- WhatsApp integration (differentiator)
- AI-powered features throughout (7 different AI agents)
- Scalable architecture
- Google Calendar integration (FreeBusy API)
- Team management with verification system
- Account pause/delete with 30-day retention
- AI support chat widget
- Internal property comments
- Arrival prep feature ("I'm Coming Home")
- Phone number management (update/verify with OTP)
- Comprehensive onboarding guides (5 bilingual guide pages with 210+ screenshots)
- In-app message markdown formatting with auto-links

### What's Needed
- Payment integration (Stripe)
- Marketing/user acquisition
- Additional service areas
- Push notifications
- Mobile app (optional - PWA works well)

### Competitive Advantages
1. **WhatsApp-native** - Meets users where they are (especially in Spain)
2. **AI throughout** - Not bolted on, designed around AI
3. **Two-sided trust** - Referral model ensures quality
4. **Multilingual** - Removes language barrier completely
5. **Vertical services expansion** - Team leaders can recruit specialists and become full "Villa Services" providers

### Vertical Services Expansion (Villa Services)

The platform is architected to expand beyond cleaning into a full **Villa Services marketplace**:

**The Vision:**
Villa owners need more than cleaning - they need pool maintenance, gardening, laundry, window cleaning, handyman services. By enabling team leaders to recruit specialists and add custom services, we become the one-stop-shop for all villa needs.

**How It Works:**
1. **Team Leader** recruits a specialist (pool cleaner, gardener, etc.)
2. Specialist joins VillaCare using the team's referral code
3. Team Leader creates a **Custom Service** for their specialty (e.g., "Pool Cleaning - €50")
4. Service requires admin approval, then goes live on the team's profile
5. Villa owners can book the specialist service alongside cleaning

**Why This Matters:**
- **For cleaners**: Transforms a cleaning job into a real business with multiple revenue streams
- **For owners**: One trusted team handles everything - no hunting for separate providers
- **For specialists**: Access to villa owner clients they couldn't reach otherwise
- **For platform**: Higher booking volume, stickier relationships, network effects

**Cleaner Journey:**
1. Solo Cleaner (25%) → Join or create a team
2. Team Member (50%) → Learn and build reputation
3. Team Leader (75%) → Create team, invite members
4. Business Owner (100%) → Custom services, specialist team, full villa services

**Guides:**
- `/join/expand-guide` - How team leaders expand with specialists
- `/join/services-guide` - Adding custom services and pricing
- `/join/team-leader-guide` - Growing and managing teams

---

## Team

**Lead Balloon Ltd** - Digital agency building VillaCare
- Mark Taylor - Product & Development
- Kerry Taylor - Operations
- Clara Rodrigues - Co-founder, Lead Cleaner (domain expertise)

---

## Screenshots

All screenshots are stored in `/public/screenshots/` and available at `https://alicantecleaners.com/screenshots/[filename]`

### Key Screenshots

| Screenshot | Path | Description |
|------------|------|-------------|
| Homepage | `homepage.png` | Owner-focused landing with cleaner directory |
| Cleaner Profile | `cleaner-profile.png` | Public profile with reviews, services, booking |
| Booking Flow | `booking-flow.png` | 4-step booking wizard |
| Cleaner Dashboard | `cleaner-dashboard-home.png` | Jobs timeline with calendar view |
| Success Coach | `success-coach-main.png` | AI coaching tab with stats |
| Success Chat | `success-coach-chat.png` | AI coach conversation example |
| Team Tab | `cleaner-team-tab.png` | Team management for leaders |
| Owner Dashboard | `owner-dashboard.png` | Property owner view |
| AI Sales Agent | `ai-sales-assistant.png` | AI handling booking inquiries |
| Auto Translation | `auto-translation.png` | Message translation in action |
| Smart Widget | `smart-widget-tap-quick-actions.png` | Navigation widget |
| Onboarding | `onboarding-step1-phone.png` | Phone verification step |

### Screenshot URLs (Live)

```
https://alicantecleaners.com/screenshots/success-coach-main.png
https://alicantecleaners.com/screenshots/cleaner-dashboard-home.png
https://alicantecleaners.com/screenshots/ai-sales-assistant.png
https://alicantecleaners.com/screenshots/homepage.png
```

---

## Contact

- **Website:** https://alicantecleaners.com
- **Email:** hello@alicantecleaners.com
- **GitHub:** github.com/leadballoon-agency/alicante-cleaners
