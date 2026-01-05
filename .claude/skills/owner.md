# Owner Domain Expert

You are a specialized agent for the VillaCare owner domain. When working on owner-related features, use this context to ensure consistency and best practices.

## Domain Overview

Owners are villa/property owners in the Alicante region who use VillaCare to find and book cleaning services. They manage multiple properties, book cleaners, and can request arrival prep services for when they're coming home.

## Key Files

### Dashboard
- `app/owner/dashboard/page.tsx` - Main owner dashboard with tab navigation
- `app/owner/dashboard/tabs/home.tsx` - Dashboard overview with "I'm Coming Home" feature
- `app/owner/dashboard/tabs/bookings.tsx` - Booking history and management
- `app/owner/dashboard/tabs/properties.tsx` - Property CRUD management
- `app/owner/dashboard/tabs/messages.tsx` - Conversations with cleaners
- `app/owner/dashboard/tabs/account.tsx` - Profile, referrals, settings

### API Routes
- `app/api/dashboard/owner/route.ts` - GET owner profile + stats
- `app/api/dashboard/owner/properties/route.ts` - GET/POST properties
- `app/api/dashboard/owner/properties/[id]/route.ts` - PATCH/DELETE property
- `app/api/dashboard/owner/bookings/route.ts` - GET all bookings
- `app/api/dashboard/owner/bookings/[id]/review/route.ts` - POST review cleaner
- `app/api/dashboard/owner/arrival-prep/route.ts` - GET/POST arrival prep requests
- `app/api/dashboard/owner/preferences/route.ts` - GET/PATCH preferred extras
- `app/api/dashboard/owner/referrals/route.ts` - GET referral stats

### Components
- `app/owner/dashboard/components/review-modal.tsx` - Modal for reviewing cleaners

## Database Models

```prisma
model Owner {
  id                 String   @id @default(cuid())
  userId             String   @unique
  trusted            Boolean  @default(false)
  referredBy         String?
  totalBookings      Int      @default(0)
  cleanerRating      Decimal?
  cleanerReviewCount Int      @default(0)
  referralCode       String   @unique
  referralCredits    Decimal  @default(0)
  preferredExtras    String[] @default([])
}

model Property {
  id        String   @id @default(cuid())
  ownerId   String
  name      String
  address   String
  bedrooms  Int
  bathrooms Int
  notes     String?
}

model ArrivalPrep {
  id          String            @id @default(cuid())
  ownerId     String
  propertyId  String
  cleanerId   String
  arrivalDate DateTime
  arrivalTime String            // e.g., "14:00"
  extras      String[]          // ["fridge", "flowers", "linens", "basket"]
  notes       String?
  status      ArrivalPrepStatus @default(PENDING)
}

enum ArrivalPrepStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
}
```

## Current Features (Done)
- Magic link email authentication
- Property management (add/edit/delete)
- Booking history view
- Cleaner reviews with ratings
- "I'm Coming Home" arrival prep requests
- Preferred extras storage (remembered choices)
- Referral program with credits
- Messaging with auto-translation
- Multi-language support (en, es, de, fr, nl, it, pt)

## Planned Features
- Property photos
- Recurring bookings
- Push notifications
- Payment history

## Common Patterns

### Auth Check
```typescript
const session = await getServerSession(authOptions)
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

const owner = await db.owner.findUnique({
  where: { userId: session.user.id },
})

if (!owner) {
  return NextResponse.json({ error: 'Owner profile not found' }, { status: 404 })
}
```

### Property Ownership Verification
```typescript
const property = await db.property.findFirst({
  where: { id: propertyId, ownerId: owner.id },
})

if (!property) {
  return NextResponse.json({ error: 'Property not found' }, { status: 404 })
}
```

### Arrival Prep Extras
```typescript
const EXTRAS = ['fridge', 'flowers', 'linens', 'basket']
// fridge = Stock the fridge with essentials
// flowers = Fresh flowers arrangement
// linens = Fresh premium linens
// basket = Welcome basket with local treats
```

### Referral Code Format
```
{FIRSTNAME}-{4digits}
Example: SANDRA-1234
```

## Instructions

When working on owner features:
1. Check existing patterns in `app/api/dashboard/owner/` for API conventions
2. Update translations in `lib/i18n.ts` for any new UI text
3. Follow the auth pattern shown above
4. Test with owner account: Sandra Mitchell (sandra@villacare.es)
5. Owners are typically English-speaking tourists - default language is "en"
6. Properties are linked to owners via ownerId
7. Each owner has a unique referral code generated on signup
8. "I'm Coming Home" modal is the key UX feature - multi-step wizard
9. Owner preferences (extras) are saved for quick selection next time
