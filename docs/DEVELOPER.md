# Developer Guide

## Executive Summary

This guide covers everything needed to set up, develop, and deploy VillaCare. Whether you're joining the team or taking over development, start here.

**Quick Start:** Clone → Install → Configure env → Push DB → Seed → Run

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Runtime |
| npm | 9+ | Package manager |
| Git | 2+ | Version control |
| VS Code | Latest | Recommended IDE |

---

## Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/leadballoon-agency/alicante-cleaners.git
cd alicante-cleaners
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create `.env.local`:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/villacare?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="VillaCare <noreply@alicantecleaners.com>"

# OpenAI (Translation)
OPENAI_API_KEY="sk-..."

# Anthropic (Admin AI)
ANTHROPIC_API_KEY="sk-ant-..."

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_WHATSAPP_NUMBER="whatsapp:+447414265007"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Google Calendar
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."
```

### 4. Setup Database

```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed with test data
npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
alicante-cleaners/
├── app/                      # Next.js App Router
│   ├── (public)/            # Public pages group
│   ├── [slug]/              # Dynamic cleaner profiles
│   ├── admin/               # Admin dashboard
│   ├── api/                 # API routes
│   │   ├── auth/           # NextAuth endpoints
│   │   ├── bookings/       # Booking CRUD
│   │   ├── cleaners/       # Cleaner endpoints
│   │   ├── dashboard/      # Protected dashboard APIs
│   │   ├── messages/       # Messaging system
│   │   ├── webhooks/       # External webhooks
│   │   └── ai/             # AI endpoints
│   ├── dashboard/           # Cleaner dashboard
│   ├── owner/              # Owner dashboard
│   ├── onboarding/         # Signup flows
│   ├── join/               # Cleaner landing
│   └── login/              # Auth pages
├── components/              # Shared React components
│   ├── ai/                 # AI chat widgets
│   ├── ui/                 # Generic UI components
│   └── seo/                # SEO components
├── lib/                     # Shared utilities
│   ├── ai/                 # AI agents, prompts
│   ├── auth.ts             # NextAuth config
│   ├── db.ts               # Prisma client
│   ├── translate.ts        # Translation utilities
│   └── whatsapp.ts         # Twilio WhatsApp
├── prisma/                  # Database
│   ├── schema.prisma       # Data models
│   └── seed.ts             # Test data
├── public/                  # Static assets
├── knowledge/              # AI knowledge base
└── docs/                   # Documentation
```

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start dev server with hot reload |
| `build` | `npm run build` | Production build |
| `start` | `npm run start` | Start production server |
| `lint` | `npm run lint` | Run ESLint |
| `db:push` | `npm run db:push` | Push schema changes |
| `db:seed` | `npm run db:seed` | Seed test data |
| `db:studio` | `npm run db:studio` | Open Prisma Studio |

---

## Test Accounts

After seeding, these accounts are available:

### Admin Accounts (Magic Link)
- `admin@villacare.com`
- `mark@leadballoon.co.uk`
- `kerry@leadballoon.co.uk`

### Owner Account (Magic Link)
- `mark@example.com`

### Cleaner Accounts (Phone OTP)

| Name | Phone | OTP Code |
|------|-------|----------|
| Clara R. | +34612345678 | 123456 |
| Maria S. | +34623456789 | 123456 |
| Ana L. | +34634567890 | 123456 |
| Sofia M. | +34645678901 | 123456 |
| Carmen G. | +34656789012 | 123456 |

**Note:** OTP code `123456` works for all test accounts in development.

---

## Common Development Tasks

### Adding a New API Endpoint

1. Create route file:
```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Your logic here

  return NextResponse.json({ data: result })
}
```

### Adding a New Database Model

1. Update schema:
```prisma
// prisma/schema.prisma
model NewModel {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
}
```

2. Push changes:
```bash
npx prisma db push
npx prisma generate
```

### Adding a New Page

1. Create page file:
```typescript
// app/new-page/page.tsx
export default function NewPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] p-4">
      <h1 className="text-2xl font-semibold">New Page</h1>
    </div>
  )
}
```

2. For protected pages, add authentication:
```typescript
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return <div>Protected content</div>
}
```

### Adding WhatsApp Templates

1. Create template in Twilio Console
2. Get Content SID after approval
3. Update `lib/whatsapp.ts`:
```typescript
export async function sendNewTemplate(
  phone: string,
  variables: { var1: string; var2: string }
) {
  const message = await client.messages.create({
    from: whatsappNumber,
    to: `whatsapp:${phone}`,
    contentSid: 'HX_NEW_CONTENT_SID',
    contentVariables: JSON.stringify({
      '1': variables.var1,
      '2': variables.var2,
    }),
  })

  return { success: true }
}
```

---

## Database Management

### View Data

```bash
npx prisma studio
```
Opens at http://localhost:5555

### Reset Database

```bash
# Warning: Deletes all data
npx prisma db push --force-reset
npx prisma db seed
```

### Create Migration (Production)

```bash
npx prisma migrate dev --name description_of_change
```

### Query Examples

```typescript
// Find cleaner with relations
const cleaner = await db.cleaner.findUnique({
  where: { slug: 'clara-r' },
  include: {
    user: { select: { name: true, image: true } },
    reviews: { where: { approved: true } },
  },
})

// Create booking
const booking = await db.booking.create({
  data: {
    cleanerId: 'cleaner-id',
    ownerId: 'owner-id',
    propertyId: 'property-id',
    service: 'Regular Clean',
    price: 54,
    hours: 3,
    date: new Date('2024-02-15'),
    time: '10:00',
  },
})

// Update with relation count
const stats = await db.booking.groupBy({
  by: ['status'],
  _count: { id: true },
  where: { cleanerId: 'cleaner-id' },
})
```

---

## Debugging

### Server-Side Logging

```typescript
console.log('Debug:', { variable })
// Shows in terminal running `npm run dev`
```

### Client-Side Logging

```typescript
console.log('Debug:', { state })
// Shows in browser DevTools
```

### API Response Debugging

```typescript
// In API route
return NextResponse.json({
  debug: { session, query, result },
  data: actualResponse,
})
```

### Database Query Logging

```typescript
// lib/db.ts
export const db = new PrismaClient({
  log: ['query', 'error', 'warn'],
})
```

---

## Deployment

### Vercel (Production)

1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy triggers automatically on push to `main`

### Environment Variables (Vercel)

Add all `.env.local` variables to Vercel project settings:
- Settings → Environment Variables
- Add each key/value pair
- Select all environments (Production, Preview, Development)

### Build Command

Vercel uses:
```bash
prisma generate && next build
```

### Domain Configuration

- Production: alicantecleaners.com
- Add CNAME record pointing to Vercel

---

## Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Magic link login for owner
- [ ] Phone OTP login for cleaner
- [ ] Session persists across pages
- [ ] Logout works correctly

**Booking Flow:**
- [ ] Browse cleaners on homepage
- [ ] Filter by area works
- [ ] View cleaner profile
- [ ] Complete 4-step booking
- [ ] Cleaner receives WhatsApp notification

**Dashboard:**
- [ ] Cleaner can accept/decline booking
- [ ] Owner sees booking status update
- [ ] Messages send with translation
- [ ] Calendar sync generates ICS

### Browser Testing

Test on:
- [ ] Chrome (desktop)
- [ ] Safari (desktop)
- [ ] Mobile Safari (iOS)
- [ ] Chrome (Android)
- [ ] Firefox

---

## Architecture Decisions

### Why Next.js App Router?

- Server Components for SEO
- API routes in same codebase
- File-based routing
- Built-in optimization

### Why Prisma + Neon?

- Type-safe database queries
- Serverless PostgreSQL (scales to zero)
- Excellent developer experience
- Connection pooling built-in

### Why Twilio for WhatsApp?

- Simpler than Meta Cloud API
- Template approval streamlined
- Single SDK for SMS + WhatsApp
- Good webhook support

### Why Claude for Admin AI?

- Superior reasoning
- Tool-use capabilities
- Reliable function calling

---

## Known Issues & TODOs

### Security

- [ ] Add Twilio webhook signature validation
- [ ] Implement rate limiting
- [ ] Add input validation with Zod

### Features

- [ ] Stripe payment integration
- [ ] Email notifications
- [ ] Photo uploads (before/after)
- [ ] Push notifications

### Technical Debt

- [ ] Add React Query for server state
- [ ] Add unit tests
- [ ] Add E2E tests with Playwright
- [ ] Migrate to Prisma migrations

---

## Getting Help

### Documentation

- `/docs/README.md` - Executive summary
- `/docs/ARCHITECTURE.md` - System design
- `/docs/DATABASE.md` - Schema reference
- `/docs/API.md` - Endpoint documentation
- `/docs/INTEGRATIONS.md` - External services
- `/docs/FRONTEND.md` - UI components
- `/CLAUDE.md` - Quick reference

### External Docs

- [Next.js](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [NextAuth.js](https://next-auth.js.org)
- [Twilio WhatsApp](https://www.twilio.com/docs/whatsapp)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Contact

- Technical: mark@leadballoon.co.uk
- Operations: kerry@leadballoon.co.uk

---

## Handoff Checklist

When handing off to a new developer:

1. [ ] Share this repository access
2. [ ] Share Vercel project access
3. [ ] Share Neon database access
4. [ ] Share Twilio account access
5. [ ] Share Resend account access
6. [ ] Share OpenAI/Anthropic API keys
7. [ ] Walk through this documentation
8. [ ] Demonstrate local setup
9. [ ] Show production deployment process
10. [ ] Transfer domain management if needed
