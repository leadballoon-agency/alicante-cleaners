# VillaCare Revenue Model (Beta)

## Overview

Platform is **free to use** for both owners and cleaners. We make money when bookings happen.

---

## Fee Structure

### New Clients (Platform-Acquired)

When an owner discovers a cleaner through VillaCare and makes their **first booking**:

| Item | Amount |
|------|--------|
| Platform fee | 20% of booking value |
| Payment processing | ~2.5% + €0.25 |

**Example**: €90 deep clean
- Owner pays: €90
- Platform fee: €18 (20%)
- Processing: ~€2.50
- Cleaner receives: ~€69.50

### Returning Clients

All subsequent bookings from the same owner-cleaner pair:

| Item | Amount |
|------|--------|
| Platform fee | €0 |
| Payment processing | ~2.5% + €0.25 |

**Example**: €90 deep clean (repeat customer)
- Owner pays: €90
- Cleaner receives: ~€87.25

### Cleaner's Own Clients

If a cleaner brings their existing clients to book through VillaCare:

| Item | Amount |
|------|--------|
| Platform fee | €0 |
| Payment processing | ~2.5% + €0.25 |

We only charge the platform fee when **we** bring them the business.

---

## How We Track "New Client"

A booking is considered "platform-acquired" when:

1. Owner discovered cleaner via VillaCare marketplace (homepage, search)
2. Owner came through cleaner's public profile page (villacare.com/clara)
3. AI sales agent created the booking

We track the `firstBooking` flag per owner-cleaner relationship.

If a cleaner manually adds an existing client, no platform fee applies.

---

## Implementation Requirements

### Database Changes

```prisma
// Track owner-cleaner relationships
model OwnerCleanerRelationship {
  id              String   @id @default(cuid())
  ownerId         String
  cleanerId       String
  firstBookingId  String?  // The booking that established this relationship
  source          String   // MARKETPLACE, PROFILE_PAGE, AI_AGENT, CLEANER_ADDED
  platformFeeApplied Boolean @default(false)
  createdAt       DateTime @default(now())

  owner           Owner    @relation(fields: [ownerId], references: [id])
  cleaner         Cleaner  @relation(fields: [cleanerId], references: [id])

  @@unique([ownerId, cleanerId])
}

// Add to Booking model
model Booking {
  // ... existing fields
  platformFee       Decimal?  @db.Decimal(10, 2)
  processingFee     Decimal?  @db.Decimal(10, 2)
  cleanerPayout     Decimal?  @db.Decimal(10, 2)
  stripePaymentId   String?
  stripeTranferId   String?
  paidAt            DateTime?
  paidOutAt         DateTime?
}
```

### Stripe Connect Integration

We need **Stripe Connect** for marketplace payments:

1. **Connected Accounts**: Each cleaner has a Stripe Connect account
2. **Direct Charges**: Owner pays, we split automatically
3. **Platform Fee**: Deducted before transfer to cleaner
4. **Payouts**: Automatic daily/weekly to cleaner's bank

### Cleaner Onboarding Flow

Add Stripe Connect onboarding:

1. Cleaner signs up (existing flow)
2. Cleaner completes profile (existing flow)
3. **NEW**: Cleaner connects Stripe account
4. Cleaner goes live and can receive payments

### Payment Flow

```
Owner books €90 clean
        ↓
Stripe checkout (€90 charge)
        ↓
Is this first booking with this cleaner?
   YES → Calculate 20% platform fee (€18)
   NO  → Platform fee = €0
        ↓
Processing fee calculated (~€2.50)
        ↓
Stripe splits payment:
   - VillaCare: €18 + €2.50 = €20.50
   - Cleaner: €69.50
        ↓
Cleaner receives payout (T+2 days)
```

---

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `lib/stripe.ts` | Stripe client, Connect helpers |
| `app/api/stripe/connect/route.ts` | Create Connect account |
| `app/api/stripe/connect/callback/route.ts` | OAuth callback |
| `app/api/stripe/checkout/route.ts` | Create checkout session |
| `app/api/stripe/webhook/route.ts` | Handle payment events |
| `app/dashboard/tabs/payments.tsx` | Cleaner payment dashboard |
| `components/stripe/connect-button.tsx` | Onboarding button |

---

## Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...
```

---

## Pricing Display

On cleaner profile pages, show:

> "Book securely through VillaCare. Pay online, no cash needed."

We don't need to show the fee breakdown to owners - they just pay the listed price.

For cleaners in their dashboard:

> "First booking from new clients: 20% platform fee
> Repeat bookings: Processing only (~2.5%)
> Your existing clients: Processing only"

---

## Future Considerations

- **Tipping**: Allow owners to add tips (100% to cleaner)
- **Deposits**: Require deposit for bookings (refundable)
- **Cancellation fees**: Charge for late cancellations
- **Subscription tier**: Premium features for high-volume cleaners

---

## Crypto-Ready Architecture

> **Internal only** - Not for public messaging. Subtle nod when asked.

We're building with crypto payments in mind from day one. The goal is to make adding crypto a drop-in, not a rebuild.

### Design Principles

1. **Abstract payment providers** - Stripe is one implementation, not the only one
2. **Store wallet addresses** - Optional field in User model, ready when needed
3. **Points-based rewards** - Internal credits that can tokenize later
4. **Event-driven** - Webhooks pattern works for Stripe and on-chain events

### Payment Provider Interface

```typescript
interface PaymentProvider {
  createCheckout(booking: Booking, options: CheckoutOptions): Promise<CheckoutSession>
  processRefund(paymentId: string, amount: number): Promise<Refund>
  getPayoutStatus(transferId: string): Promise<PayoutStatus>
  onPaymentComplete(callback: (event: PaymentEvent) => void): void
}

// Implementations
class StripeProvider implements PaymentProvider { ... }
class CryptoProvider implements PaymentProvider { ... }  // Future
```

### Database Fields (Add Now, Use Later)

```prisma
model User {
  // ... existing fields
  walletAddress    String?   // ETH/EVM address
  preferredPayout  String    @default("bank") // bank | crypto
}

model Booking {
  // ... existing fields
  paymentMethod    String    @default("card") // card | crypto
  cryptoTxHash     String?   // On-chain transaction hash
}
```

### Crypto Payment Options (Future)

| Type | Use Case | Settlement |
|------|----------|------------|
| **EURC/USDC** | Stable payments, no volatility | Instant |
| **ETH/SOL** | Crypto-native users | Instant |
| **Lightning** | Fast BTC payments | Instant |

### Rewards System (Tokenizable)

Build rewards as internal points now, tokenize later:

```
Cleaner completes job → Earns VillaCare Credits
Credits can be:
  - Cashed out (EUR via Stripe)
  - Converted to crypto (future)
  - Spent on platform perks
  - Converted to $VILLA token (future)
```

### Why This Matters

Large legacy platforms have:
- Outdated payment infrastructure
- Millions of users to migrate
- Risk-averse decision making
- Slow adoption cycles

We have:
- Greenfield architecture
- Beta users who expect innovation
- Feedback tool for rapid iteration
- Ability to move fast

**Crypto readiness is a competitive moat.**
