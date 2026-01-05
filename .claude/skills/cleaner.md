# Cleaner Domain Expert

You are a specialized agent for the VillaCare cleaner domain. When working on cleaner-related features, use this context to ensure consistency and best practices.

## Domain Overview

Cleaners are service providers who offer villa cleaning services in the Alicante region of Spain. They have public profiles, manage bookings, can form teams, and communicate with villa owners.

## Key Files

### Dashboard
- `app/dashboard/page.tsx` - Main cleaner dashboard with tab navigation
- `app/dashboard/tabs/home.tsx` - Dashboard overview (bookings, earnings, stats)
- `app/dashboard/tabs/bookings.tsx` - Booking management with accept/decline/complete
- `app/dashboard/tabs/messages.tsx` - Conversations with owners
- `app/dashboard/tabs/team.tsx` - Team management (create/join/leave teams)
- `app/dashboard/tabs/profile.tsx` - Profile editing
- `app/dashboard/tabs/schedule.tsx` - Calendar/schedule view

### API Routes
- `app/api/dashboard/cleaner/route.ts` - GET profile + stats, POST generate calendar token
- `app/api/dashboard/cleaner/profile/route.ts` - PATCH update profile
- `app/api/dashboard/cleaner/bookings/route.ts` - GET all bookings
- `app/api/dashboard/cleaner/bookings/[id]/route.ts` - PATCH accept/decline/complete
- `app/api/dashboard/cleaner/bookings/[id]/review/route.ts` - POST review owner
- `app/api/dashboard/cleaner/comments/route.ts` - GET/POST internal property comments
- `app/api/dashboard/cleaner/team/route.ts` - GET/POST/PATCH team CRUD
- `app/api/dashboard/cleaner/team/members/route.ts` - GET team members
- `app/api/dashboard/cleaner/team/members/[id]/route.ts` - DELETE remove member
- `app/api/dashboard/cleaner/team/requests/route.ts` - GET pending join requests
- `app/api/dashboard/cleaner/team/requests/[id]/route.ts` - POST/DELETE approve/reject
- `app/api/dashboard/cleaner/team/leave/route.ts` - DELETE leave team
- `app/api/dashboard/cleaner/team/refer/route.ts` - POST refer new cleaner

### Public Pages
- `app/[slug]/page.tsx` - Public cleaner profile
- `app/[slug]/book/page.tsx` - Booking page for cleaner

### Components
- `app/dashboard/components/owner-review-modal.tsx` - Modal for reviewing owners

## Database Models

```prisma
model Cleaner {
  id             String        @id @default(cuid())
  userId         String        @unique
  slug           String        @unique
  bio            String?
  reviewsLink    String?
  serviceAreas   String[]
  languages      String[]      @default(["es"])
  hourlyRate     Decimal
  status         CleanerStatus @default(PENDING)
  totalBookings  Int           @default(0)
  rating         Decimal?
  reviewCount    Int           @default(0)
  featured       Boolean       @default(false)
  teamLeader     Boolean       @default(false)
  calendarToken  String?       @unique
  teamId         String?
  referredByCode String?
}

enum CleanerStatus {
  PENDING
  ACTIVE
  SUSPENDED
}

model Team {
  id           String   @id @default(cuid())
  name         String
  leaderId     String   @unique
  referralCode String   @unique  // TEAM-{slug}-{4digits}
}

model TeamJoinRequest {
  id          String                @id @default(cuid())
  teamId      String
  cleanerId   String
  status      TeamJoinRequestStatus @default(PENDING)
  message     String?
}
```

## Current Features (Done)
- Phone OTP authentication
- Public profile with slug URL
- Booking management (accept/decline/complete)
- Owner reviews with ratings
- Internal property comments
- Team creation and management
- Team referral system
- Calendar token for ICS sync
- Multi-language profile (es, en, de, fr, nl, it, pt)
- Messaging with auto-translation

## Planned Features
- Coverage/handoff system for teams
- Availability calendar
- Push notifications
- Earnings reports

## Common Patterns

### Auth Check
```typescript
const session = await getServerSession(authOptions)
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

const cleaner = await db.cleaner.findUnique({
  where: { userId: session.user.id },
})

if (!cleaner) {
  return NextResponse.json({ error: 'Cleaner profile not found' }, { status: 404 })
}
```

### Booking Status Flow
```
PENDING → CONFIRMED (cleaner accepts)
CONFIRMED → COMPLETED (cleaner marks done)
Any status → CANCELLED
```

### Team Referral Code Format
```
TEAM-{slug}-{4digits}
Example: TEAM-clara-1234
```

## Instructions

When working on cleaner features:
1. Check existing patterns in `app/api/dashboard/cleaner/` for API conventions
2. Update translations in `lib/i18n.ts` for any new UI text
3. Follow the auth pattern shown above
4. Test with cleaner account: Clara Garcia (+34 612 345 678)
5. Cleaners primarily speak Spanish - default language is "es"
6. All monetary values use Decimal with 2 decimal places
7. Service areas are stored as string arrays (town names)
