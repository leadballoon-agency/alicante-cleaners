# System Architecture

## Executive Summary

VillaCare is built as a modern serverless application using Next.js 14 with the App Router. The architecture prioritizes:
- **Simplicity** - Single codebase for frontend and backend
- **Scalability** - Serverless functions scale automatically
- **Cost efficiency** - Pay-per-use for all services
- **Developer experience** - TypeScript throughout, hot reload, type safety

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│   Browser   │   Mobile    │  WhatsApp   │   Admin     │  ICS    │
│   (React)   │   (PWA)     │   (Twilio)  │   (React)   │ Clients │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴────┬────┘
       │             │             │             │           │
       ▼             ▼             ▼             ▼           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VERCEL EDGE NETWORK                         │
│                    (CDN, SSL, DDoS protection)                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS APPLICATION                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   App Router    │  │   API Routes    │  │   Middleware    │  │
│  │   (Pages/UI)    │  │   (/api/*)      │  │   (Auth check)  │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
│           ▼                    ▼                    ▼           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    SHARED LIBRARIES                         ││
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           ││
│  │  │  Auth   │ │   DB    │ │WhatsApp │ │   AI    │           ││
│  │  │(NextAuth│ │(Prisma) │ │(Twilio) │ │(Claude) │           ││
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           ││
│  └───────┼──────────┼──────────┼──────────┼────────────────────┘│
└──────────┼──────────┼──────────┼──────────┼─────────────────────┘
           │          │          │          │
           ▼          ▼          ▼          ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│    Neon      │ │  Twilio  │ │ Anthropic│ │  OpenAI  │
│  PostgreSQL  │ │ WhatsApp │ │  Claude  │ │  GPT-4o  │
└──────────────┘ └──────────┘ └──────────┘ └──────────┘
```

---

## Tech Stack Details

### Frontend

| Technology | Purpose | Why |
|------------|---------|-----|
| **Next.js 14** | Framework | App Router, Server Components, API routes |
| **React 18** | UI Library | Component model, hooks, suspense |
| **TypeScript** | Language | Type safety, better DX |
| **Tailwind CSS** | Styling | Utility-first, fast iteration |

### Backend

| Technology | Purpose | Why |
|------------|---------|-----|
| **Next.js API Routes** | REST API | Same codebase as frontend |
| **Prisma** | ORM | Type-safe queries, migrations |
| **NextAuth.js** | Authentication | Magic links, OAuth, sessions |

### Database

| Technology | Purpose | Why |
|------------|---------|-----|
| **Neon** | PostgreSQL | Serverless, scales to zero, branching |
| **Prisma** | ORM | Type generation, migrations |

### External Services

| Service | Purpose | Why |
|---------|---------|-----|
| **Twilio** | WhatsApp | Simpler than Meta API, reliable |
| **Anthropic** | AI (Claude) | Best reasoning, tool-use |
| **OpenAI** | Translation | GPT-4o-mini, fast and cheap |
| **Resend** | Email | Simple API, good deliverability |
| **Vercel** | Hosting | Zero-config, edge network |

---

## Data Flow

### Booking Flow

```
1. Owner visits cleaner profile (/{slug})
   ↓
2. Clicks "Book" → 4-step form
   ↓
3. POST /api/bookings
   ├── Creates User (if guest)
   ├── Creates Owner profile
   ├── Creates Property
   ├── Creates Booking (PENDING)
   ├── Sends WhatsApp to Cleaner (template)
   └── Sends WhatsApp to Owner (if phone)
   ↓
4. Cleaner receives WhatsApp notification
   ↓
5. Cleaner replies "ACCEPT"
   ↓
6. POST /api/webhooks/twilio
   ├── Finds cleaner by phone
   ├── Updates Booking → CONFIRMED
   ├── Sends WhatsApp to Cleaner (confirmation)
   └── Sends WhatsApp to Owner (confirmation)
```

### Authentication Flow

```
Magic Link (Owners/Admins):
1. Enter email on /login
2. POST /api/auth/signin/email
3. Resend sends magic link
4. Click link → session created

Phone OTP (Cleaners):
1. Enter phone on /onboarding/cleaner
2. POST /api/auth/otp {action: 'send'}
3. WhatsApp OTP sent via Twilio template
4. Enter code → POST /api/auth/otp {action: 'verify'}
5. NextAuth credentials provider creates session
```

### Message Translation Flow

```
1. Owner sends message (English)
   ↓
2. POST /api/messages
   ├── detectLanguage(content) → 'en'
   ├── Get recipient's preferredLanguage → 'es'
   ├── translateText(content, 'en', 'es')
   └── Store both original + translated
   ↓
3. Cleaner sees Spanish translation
   ↓
4. Toggle "Show original" → sees English
```

---

## Directory Structure

```
alicante-cleaners/
├── app/                      # Next.js App Router
│   ├── (public)/            # Public pages (home, about)
│   ├── [slug]/              # Dynamic cleaner profiles
│   ├── admin/               # Admin dashboard
│   ├── api/                 # API routes
│   │   ├── auth/           # NextAuth + OTP
│   │   ├── bookings/       # Booking CRUD
│   │   ├── cleaners/       # Cleaner endpoints
│   │   ├── dashboard/      # Protected dashboard APIs
│   │   ├── messages/       # Messaging system
│   │   ├── webhooks/       # Twilio webhooks
│   │   └── ai/             # AI chat endpoints
│   ├── dashboard/           # Cleaner dashboard
│   ├── owner/              # Owner dashboard
│   ├── onboarding/         # Cleaner signup flow
│   ├── join/               # Cleaner landing page
│   └── login/              # Auth page
├── components/              # Shared React components
├── lib/                     # Shared utilities
│   ├── ai/                 # AI agents, knowledge base
│   ├── auth.ts             # NextAuth config
│   ├── db.ts               # Prisma client
│   ├── translate.ts        # OpenAI translation
│   └── whatsapp.ts         # Twilio WhatsApp
├── prisma/                  # Database
│   ├── schema.prisma       # Data models
│   └── seed.ts             # Test data
├── public/                  # Static assets
├── knowledge/              # AI knowledge base (markdown)
└── docs/                   # This documentation
```

---

## Security Architecture

### Authentication Layers

1. **NextAuth.js Session** - JWT in httpOnly cookie
2. **Middleware** - Checks session for protected routes
3. **API Route Guards** - `getServerSession()` validation

### Protected Routes

| Route Pattern | Required Role |
|---------------|---------------|
| `/dashboard/*` | CLEANER |
| `/owner/*` | OWNER |
| `/admin/*` | ADMIN |
| `/api/dashboard/cleaner/*` | CLEANER |
| `/api/dashboard/owner/*` | OWNER |
| `/api/admin/*` | ADMIN |

### API Security

- All mutations require authentication
- Role-based access control
- Input validation with Zod (planned)
- Rate limiting via Vercel (planned)

---

## Scalability Considerations

### Current Architecture Handles

- **1000s of concurrent users** - Vercel serverless scales automatically
- **High database load** - Neon connection pooling
- **WhatsApp volume** - Twilio handles throughput

### Future Considerations

- **Search** - Add Algolia/Meilisearch for cleaner search
- **Caching** - Add Redis for session/query caching
- **Background Jobs** - Add queue for email/notification batching
- **CDN** - Images already on Vercel CDN, could add Cloudinary

---

## Monitoring & Observability

### Current

- **Vercel Analytics** - Page views, web vitals
- **Vercel Logs** - Function logs, errors
- **Console logging** - API request logging

### Recommended Additions

- **Sentry** - Error tracking, performance
- **LogTail/Axiom** - Log aggregation
- **Uptime monitoring** - Pingdom/UptimeRobot
