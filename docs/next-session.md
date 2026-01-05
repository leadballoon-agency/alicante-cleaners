# Next Session: Landing Page + Payments

## Decisions Made

### Revenue Model (Beta)
- **First booking from new client**: 20% platform fee
- **Repeat bookings**: Processing fee only (~2.5% + €0.25)
- **Cleaner's own clients**: Processing fee only
- Follows Fresha model - we only charge when we deliver value

### Crypto-Ready Architecture
- Build Stripe with abstraction layer
- Add wallet address fields to User model
- Design rewards as points (tokenizable later)
- Stay nimble - be ready to move when crypto payments make sense

---

## Landing Page Redesign

### For Owners
- Find trusted villa cleaners
- Book in minutes
- Verified, reviewed, reliable
- Real people, quality service
- **Free to use**

### For Cleaners
**"Build your business on our platform"**

- We bring you customers, you just clean
- Professional booking page (villacare.com/your-name)
- AI handles enquiries 24/7
- Calendar sync to your phone
- Reviews & reputation that follow you
- Multi-language messaging
- Secure payments (no chasing cash)
- No website needed, no marketing, no admin
- **All free** (we take 20% of first booking only)

**What they'd pay elsewhere:**
| Item | Cost |
|------|------|
| Website | €500-2000 |
| Booking software | €20-50/mo |
| Payment processing | Setup + fees |
| Customer service | Their time |
| Marketing | €100s/mo |

**What we charge: €0 upfront. 20% of first booking only.**

### Key Insight
- Owners don't care about AI - they want trusted humans
- Cleaners get the AI magic - saves them time
- AI is invisible to owners, valuable to cleaners

---

## Implementation Queue

### 1. Landing Page Messaging (Quick Win)
Update translations/copy to reflect:
- Free platform positioning
- Clearer owner vs cleaner value props
- Emphasize human trust for owners
- Emphasize tech/AI for cleaners

### 2. Stripe Connect Integration
Build with PaymentProvider abstraction:
- `lib/payments/types.ts` - Interface definitions
- `lib/payments/stripe.ts` - Stripe implementation
- Stripe Connect for cleaner onboarding
- Checkout flow with platform fee calculation
- Webhook handling for payment events

### 3. Database Updates
```prisma
// Payment tracking
model OwnerCleanerRelationship {
  ownerId, cleanerId, source, platformFeeApplied
}

// Crypto-ready fields
model User {
  walletAddress    String?
  preferredPayout  String @default("bank")
}

model Booking {
  platformFee, processingFee, cleanerPayout
  paymentMethod, stripePaymentId, cryptoTxHash
}
```

### 4. Cleaner Dashboard Updates
- Payment settings tab
- Stripe Connect onboarding
- Earnings breakdown
- Payout history

---

## Feedback Tool

Remember we have the feedback tool in place. Use it to:
- Gather feature requests from beta cleaners
- Understand pain points
- Validate crypto interest
- Prioritize roadmap

---

## Competitive Advantage

What we have that Fresha doesn't:
1. **AI-native** - Built with AI from day one
2. **Crypto-ready** - Architecture supports future payments
3. **Nimble** - Can pivot fast, no legacy
4. **Niche focus** - Villa cleaning in Alicante (for now)
5. **Beta mindset** - Users expect innovation

**We're building the platform so cleaners don't have to.**
