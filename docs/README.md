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
| [Architecture](./ARCHITECTURE.md) | System design, tech stack, data flow |
| [Database](./DATABASE.md) | Prisma schema, models, relationships |
| [API Reference](./API.md) | All endpoints with request/response examples |
| [Integrations](./INTEGRATIONS.md) | Twilio, OpenAI, Anthropic, Resend |
| [Frontend](./FRONTEND.md) | Pages, components, design system |
| [Developer Guide](./DEVELOPER.md) | Setup, deployment, common tasks |

---

## Quick Stats

| Metric | Value |
|--------|-------|
| **Codebase** | ~35,000 lines TypeScript |
| **Pages** | 22 routes |
| **API Endpoints** | 80+ endpoints |
| **Database Models** | 30+ tables |
| **Languages Supported** | 7 (EN, ES, DE, FR, NL, IT, PT) |
| **AI Integrations** | 6 (translation, admin agent, sales agent, support, owner, cleaner) |

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
- AI-powered features throughout (6 different AI agents)
- Scalable architecture
- Google Calendar integration (FreeBusy API)
- Team management with verification system
- Account pause/delete with 30-day retention
- AI support chat widget
- Internal property comments
- Arrival prep feature ("I'm Coming Home")

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

---

## Team

**Lead Balloon Ltd** - Digital agency building VillaCare
- Mark Taylor - Product & Development
- Kerry Taylor - Operations
- Clara Rodrigues - Co-founder, Lead Cleaner (domain expertise)

---

## Contact

- **Website:** https://alicantecleaners.com
- **Email:** hello@alicantecleaners.com
- **GitHub:** github.com/leadballoon-agency/alicante-cleaners
