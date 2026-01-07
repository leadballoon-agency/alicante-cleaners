# Database Schema

## Executive Summary

VillaCare uses **Neon PostgreSQL** with **Prisma ORM** for type-safe database operations. The schema supports a two-sided marketplace with villa owners, cleaners, teams, bookings, messaging, and AI integrations.

**Key Stats:**
- 25+ tables
- 10 enums
- Full type generation via Prisma Client
- Serverless-ready with connection pooling

---

## Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              USERS & AUTH                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐                           │
│   │  User   │────▶│ Account │     │ Session │                           │
│   └────┬────┘     └─────────┘     └─────────┘                           │
│        │                                                                 │
│        ├──────────────┬──────────────┐                                  │
│        ▼              ▼              ▼                                  │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐                            │
│   │  Owner  │    │ Cleaner │    │  Admin  │                            │
│   └────┬────┘    └────┬────┘    └─────────┘                            │
│        │              │                                                 │
└────────┼──────────────┼─────────────────────────────────────────────────┘
         │              │
         ▼              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                            CORE MARKETPLACE                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐            │
│   │ Property │───▶│ Booking │◀───│ Cleaner │───▶│  Team   │            │
│   └────┬─────┘    └────┬────┘    └────┬────┘    └─────────┘            │
│        │               │              │                                 │
│        │          ┌────▼────┐         │                                 │
│        │          │ Review  │◀────────┘                                 │
│        │          └─────────┘                                           │
│        │                                                                 │
│   ┌────▼────────┐                                                       │
│   │ArrivalPrep  │                                                       │
│   └─────────────┘                                                       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                              MESSAGING                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────┐    ┌─────────┐                                       │
│   │ Conversation │───▶│ Message │ (with translation)                    │
│   └──────────────┘    └─────────┘                                       │
│                                                                          │
│   ┌─────────────────────┐    ┌────────────────┐                         │
│   │SupportConversation  │───▶│ SupportMessage │                         │
│   └─────────────────────┘    └────────────────┘                         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Core Models

### User (Authentication Hub)

The central identity model. All users have a User record, with role-specific profiles (Owner, Cleaner, or Admin privileges).

```prisma
model User {
  id                String    @id @default(cuid())
  name              String?
  email             String?   @unique
  phone             String?   @unique
  role              UserRole  @default(OWNER)  // OWNER, CLEANER, ADMIN
  preferredLanguage String    @default("en")   // For message translation

  // Relations
  cleaner           Cleaner?
  owner             Owner?
}
```

**Key Points:**
- Email OR phone authentication (not both required)
- `preferredLanguage` used for automatic message translation
- Role determines which dashboard they access

---

### Owner (Villa Owner Profile)

```prisma
model Owner {
  id                 String   @id @default(cuid())
  userId             String   @unique
  trusted            Boolean  @default(false)
  referralCode       String   @unique
  referralCredits    Decimal  @default(0)
  totalBookings      Int      @default(0)
  preferredExtras    String[] @default([])  // Remembered preferences
  adminNotes         String?               // CRM notes for admins

  // Relations
  user              User
  properties        Property[]
  bookings          Booking[]
  conversations     Conversation[]
}
```

**Key Points:**
- Every owner gets a unique referral code automatically
- `preferredExtras` remembers their "I'm Coming Home" preferences
- `adminNotes` for internal CRM management

---

### Cleaner (Service Provider Profile)

```prisma
model Cleaner {
  id             String        @id @default(cuid())
  userId         String        @unique
  slug           String        @unique      // URL: /maria-g
  bio            String?
  serviceAreas   String[]                   // ["Alicante City", "San Juan"]
  languages      String[]      @default(["es"])
  hourlyRate     Decimal
  status         CleanerStatus @default(PENDING)  // PENDING, ACTIVE, SUSPENDED

  // Stats
  totalBookings  Int           @default(0)
  rating         Decimal?
  reviewCount    Int           @default(0)
  featured       Boolean       @default(false)

  // Team
  teamLeader     Boolean       @default(false)
  teamId         String?

  // Calendar
  calendarToken  String?       @unique      // For ICS feed
  googleCalendarConnected Boolean @default(false)

  // Relations
  bookings       Booking[]
  reviews        Review[]
  ledTeam        Team?
  memberOfTeam   Team?
  aiSettings     CleanerAISettings?
}
```

**Key Points:**
- `slug` creates their public profile URL
- `calendarToken` enables ICS calendar subscription
- Team system supports leader + member structure
- AI settings control automated responses

---

### Property (Villa Details)

```prisma
model Property {
  id        String   @id @default(cuid())
  ownerId   String
  name      String                    // "Villa Rosa"
  address   String
  bedrooms  Int
  bathrooms Int
  notes     String?                   // Access codes, parking, etc.

  // Relations
  owner     Owner
  bookings  Booking[]
}
```

---

### Booking (Cleaning Appointment)

```prisma
model Booking {
  id          String        @id @default(cuid())
  cleanerId   String
  ownerId     String
  propertyId  String
  status      BookingStatus @default(PENDING)
  service     String                         // "Regular Clean", "Deep Clean"
  price       Decimal
  hours       Int
  date        DateTime
  time        String                         // "10:00"
  notes       String?
  createdByAI Boolean       @default(false)  // AI sales agent created

  // Relations
  cleaner     Cleaner
  owner       Owner
  property    Property
  review      Review?
}
```

**Status Flow:**
```
PENDING → CONFIRMED → COMPLETED
    ↓
CANCELLED
```

---

### Review

```prisma
model Review {
  id        String   @id @default(cuid())
  bookingId String   @unique
  cleanerId String
  ownerId   String
  rating    Int                    // 1-5
  text      String
  featured  Boolean  @default(false)
  approved  Boolean  @default(false)
}
```

**Key Points:**
- One review per booking (enforced by `@unique`)
- Admin must approve before public display
- Featured reviews shown prominently

---

## Messaging System

### Conversation

Links participants for ongoing communication:

```prisma
model Conversation {
  id         String   @id @default(cuid())
  ownerId    String?                    // Owner-Cleaner chat
  cleanerId  String
  adminId    String?                    // Admin-Cleaner chat
  propertyId String?                    // Context-specific

  messages   Message[]

  @@unique([ownerId, cleanerId])       // One conversation per pair
  @@unique([adminId, cleanerId])
}
```

### Message (with Translation)

```prisma
model Message {
  id             String   @id @default(cuid())
  conversationId String
  senderId       String
  senderRole     UserRole               // OWNER or CLEANER

  // Original message
  originalText   String
  originalLang   String                 // "en", "es", etc.

  // Translated message
  translatedText String?
  translatedLang String?

  isRead         Boolean  @default(false)
  isAIGenerated  Boolean  @default(false)
}
```

**Translation Flow:**
1. Sender writes message in their language
2. System detects language via OpenAI
3. Translates to recipient's `preferredLanguage`
4. Both versions stored for "Show original" toggle

---

## Team Management

### Team

```prisma
model Team {
  id           String   @id @default(cuid())
  name         String                    // "Clara's Team"
  leaderId     String   @unique
  referralCode String   @unique          // TEAM-clara-1234

  leader       Cleaner  @relation("TeamLeader")
  members      Cleaner[] @relation("TeamMembers")
}
```

### TeamJoinRequest

```prisma
model TeamJoinRequest {
  id          String                @id @default(cuid())
  teamId      String
  cleanerId   String
  status      TeamJoinRequestStatus @default(PENDING)
  message     String?

  @@unique([teamId, cleanerId])
}
```

**Team Workflow:**
1. Leader creates team → gets referral code
2. New cleaner applies with referral code
3. Leader approves/rejects via dashboard
4. Members can handle leader's overflow bookings

---

## AI Integration Models

### CleanerAISettings

```prisma
model CleanerAISettings {
  id          String   @id @default(cuid())
  cleanerId   String   @unique
  aiEnabled   Boolean  @default(true)   // AI responds to messages
  autoBooking Boolean  @default(true)   // AI can create bookings
}
```

### AIUsageLog

Tracks AI interactions for billing/analytics:

```prisma
model AIUsageLog {
  id             String   @id @default(cuid())
  cleanerId      String
  conversationId String
  action         String                  // "RESPONSE", "BOOKING_CREATED"
  tokensUsed     Int
  createdAt      DateTime @default(now())
}
```

### PendingOnboarding

For AI-driven guest → owner conversion:

```prisma
model PendingOnboarding {
  id           String            @id @default(cuid())
  cleanerId    String
  token        String            @unique  // Magic link token

  // Collected info
  visitorName  String
  visitorPhone String
  visitorEmail String?

  // Property
  bedrooms     Int
  bathrooms    Int
  address      String?

  // Booking
  serviceType  String
  servicePrice Decimal
  preferredDate DateTime

  status       OnboardingStatus @default(PENDING)
  expiresAt    DateTime                  // 24 hours
}
```

---

## Notifications

```prisma
model Notification {
  id          String           @id @default(cuid())
  userId      String
  type        NotificationType
  title       String
  message     String
  data        Json?                    // { bookingId: "...", etc }
  read        Boolean  @default(false)
  actionUrl   String?                  // Deep link
}
```

**Notification Types:**
- `BOOKING_REQUEST` - New booking needs response
- `BOOKING_REMINDER` - Reminder to respond
- `BOOKING_ESCALATED` - Escalated to team
- `BOOKING_CONFIRMED` - Booking confirmed
- `BOOKING_COMPLETED` - Booking completed
- `NEW_REVIEW` - Review received
- `AI_ACTION` - AI took action on your behalf

---

## Enums

```prisma
enum UserRole {
  OWNER
  CLEANER
  ADMIN
}

enum CleanerStatus {
  PENDING      // Awaiting admin approval
  ACTIVE       // Can receive bookings
  SUSPENDED    // Temporarily disabled
}

enum BookingStatus {
  PENDING      // Awaiting cleaner response
  CONFIRMED    // Cleaner accepted
  COMPLETED    // Work done
  CANCELLED    // Declined or cancelled
}

enum FeedbackCategory {
  IDEA
  ISSUE
  PRAISE
  QUESTION
}

enum NotificationType {
  BOOKING_REQUEST
  BOOKING_REMINDER
  BOOKING_ESCALATED
  BOOKING_CONFIRMED
  BOOKING_COMPLETED
  NEW_REVIEW
  AI_ACTION
}
```

---

## Indexes

Key indexes for performance:

```prisma
// Message queries
@@index([conversationId, createdAt])

// Notification queries
@@index([userId, read, createdAt])

// Availability queries
@@index([cleanerId, date])
@@index([cleanerId, date, isAvailable])

// AI usage tracking
@@index([cleanerId, createdAt])
```

---

## Database Operations

### Connection (lib/db.ts)

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
```

### Common Queries

**Get cleaner with stats:**
```typescript
const cleaner = await db.cleaner.findUnique({
  where: { slug },
  include: {
    user: { select: { name: true, image: true } },
    reviews: { where: { approved: true }, take: 5 },
  },
})
```

**Create booking with relations:**
```typescript
const booking = await db.booking.create({
  data: {
    cleanerId,
    ownerId,
    propertyId,
    service: 'Regular Clean',
    price: 45.00,
    hours: 3,
    date: new Date('2024-02-15'),
    time: '10:00',
  },
})
```

**Find pending bookings for cleaner:**
```typescript
const pending = await db.booking.findMany({
  where: {
    cleanerId,
    status: 'PENDING',
  },
  orderBy: { createdAt: 'desc' },
})
```

---

## Migrations

### Push Schema Changes

```bash
# Development - push changes directly
npx prisma db push

# Generate types
npx prisma generate
```

### Reset Database

```bash
# Force reset (deletes all data)
npx prisma db push --force-reset

# Re-seed test data
npx prisma db seed
```

### View Database

```bash
# Open Prisma Studio
npx prisma studio
```

---

## Seed Data

The seed script (`prisma/seed.ts`) creates:

- 3 Admin users
- 5 Cleaner profiles with different service areas
- 1 Owner with property
- Sample bookings across all statuses
- Reviews with ratings
- Conversations with messages

Run with:
```bash
npx prisma db seed
```

---

## Data Integrity Rules

1. **User deletion** cascades to Owner/Cleaner profiles
2. **Booking deletion** cascades to Review
3. **One conversation per owner-cleaner pair** (enforced by unique constraint)
4. **One review per booking** (enforced by unique constraint)
5. **Cleaner slug must be unique** (URL-safe identifier)
6. **Team leader can only lead one team** (enforced by unique constraint)
