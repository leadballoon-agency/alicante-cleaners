# VillaCare Revenue Model — Membership

> **Decided 1 Aug 2026 (Mark & advisor session).** This supersedes the earlier
> transaction-fee model (20% first booking + processing fees). The reasoning for
> that change is recorded at the bottom of this document so we don't re-litigate
> it from scratch every six months.

## The Principle

**We never monetize the transaction. We monetize absence.**

- The marketplace is **free, forever, for everyone**.
- Cleaners keep **100% of every clean, always**, paid directly by the owner
  (cash / Bizum / transfer — exactly as today). We never touch their money.
- Revenue comes from **remote owners** — people whose villa sits empty most of
  the year — paying a membership for the thing a WhatsApp thread with one
  cleaner can never give them: eyes and hands on the ground when they're 2,000km
  away.

The customer isn't paying for an introduction. They're paying to never think
about it.

---

## The Three Streams

### 1. Free Marketplace (€0 — growth engine, not revenue)

Everything that exists today stays free for owners and cleaners alike:
browse profiles, book, message (auto-translated), reviews, recurring bookings,
WhatsApp confirmations. Free users are review-fuel, SEO-fuel and the top of the
membership funnel. Resident owners will mostly stay here — that's fine, they
were never the ICP.

**Cleaner pitch this makes possible:** *"VillaCare takes nothing from you.
Not now, not later. 100% of every clean is yours."* Permanently true, because
it's structural — recruiting superpower and the honesty positioning made
concrete.

### 2. VillaCare Plus — the remote-owner membership (~€29/month)

For owners who are away most of the year. What they get:

| Included | What it means |
|----------|---------------|
| Guaranteed cover | Cleaner sick or unavailable → vetted backup from the team network within 48h |
| Managed schedule | Recurring cleans run on autopilot; we chase, you don't |
| Arrival prep priority | "I'm coming home" requests jump the queue |
| Completion confirmation | Notification when the clean is done (photo proof when built) |
| Human concierge | A real person on WhatsApp who knows your villa |

**Launch rule:** Plus goes live area-by-area, only where team density can
honour the backup guarantee. Never promise cover we can't staff.

**Pilot:** hand-managed, zero code. First ~10 remote owners, a Stripe payment
link, Mark & Kerry personally doing the concierge layer (the Kerry-as-customer-
zero method, applied to revenue). Product gets built after the promise is
proven, not before.

### 3. VillaCare Manage — property-management lite (~€99–149/month, later)

Key holding, monthly walk-through with photo report, contractor coordination.
Undercuts traditional local property managers (€200–500/month).

**Staffed by Team Leaders on a revenue split (~50/50).** The leader holds the
keys, does the checks, coordinates the trades; roughly half the fee is hers,
recurring, per member villa in her area. This is what makes the Team Leader
role a real business instead of a favour — and it's the concrete offer for a
business-minded leader. The existing team architecture becomes a franchise
layer.

### The Endgame: Real Estate (Phase 3, unchanged)

Members are the pipeline. A Plus/Manage member whose trust we've held for two
years lists and buys through us: **€15–25K per sale (3%)**. The membership
model exists to *keep* the relationship until that day — which is exactly what
transaction fees failed to do (they reward shallow matches; the asset is deep
retention).

---

## The Math

| Milestone | Monthly revenue |
|-----------|----------------|
| 10 Plus members (pilot) | €290 |
| 50 Plus members | €1,450 |
| 200 Plus members | €5,800 |
| 200 Plus + 20 Manage (net of leader split) | ~€7,000 |

€84K+/year from one province, before a single property sale. For contrast, the
old model produced ~€12–18 **once per relationship** — a hundred successful
matches was worth less than €2,000, ever.

Manage-tier split also creates the leader economy: 10 member villas × €120 ×
50% = **€600/month recurring to a Team Leader** — a real reason to build and
hold a territory.

---

## Sequencing & Triggers

| Step | Trigger |
|------|---------|
| 1. Free everything, ads running | **Now** (campaign live 1 Aug) |
| 2. Start Spanish entity setup | First ad-driven bookings exist |
| 3. Stripe (simple subscriptions — **not Connect**) | Entity live |
| 4. Plus pilot, hand-managed, ~10 remote owners | Stripe live + 15–20 active owner relationships |
| 5. Plus self-serve in product | Pilot promise proven for 2–3 months |
| 6. Manage tier + leader revenue share | First committed Team Leader + key-holding demand |

---

## Implementation (deliberately tiny)

The membership model deletes most of the old build:

- ~~Stripe Connect, cleaner payout accounts, payment splits, webhooks~~ → **one
  vanilla Stripe subscription product**.
- ~~OwnerCleanerRelationship fee tracking, platformFee/payout columns~~ → a
  `membershipTier` + `membershipSince` on Owner (and later a Stripe customer id).
- Cleaners never onboard to payments at all — no formalization burden on a
  cash-culture supply base.

Pilot needs literally none of the above — a payment link and a spreadsheet.

---

## Why we killed transaction fees (decision record)

1. **Disintermediation is structural in recurring home cleaning.** Same two
   people, weekly, personal relationship after two visits. Any per-booking fee
   is a standing invitation to move to WhatsApp; enforcement is impossible and
   the fee ceiling is ~zero. (Homejoy raised $38M and died of exactly this;
   Thumbtack retreated to lead fees; TaskRabbit pivoted to one-offs.)
2. **A membership has no fee to dodge.** Cancelling Plus loses the safety net —
   retention works *for* us.
3. **Finder's-fee economics point the wrong way.** They reward many shallow
   matches; the Phase 3 asset is deep, retained owner relationships.
4. **Stripe Connect was a mountain of engineering** (and forced tax
   formalization onto cleaners, many of whom aren't registered autónomas).
   A subscription is a molehill.
5. **"Cleaners keep 100%" is worth more as a permanent structural truth** than
   the ~€2K/year the fees would have produced.

What was dropped: 20% first-booking fee, 2.5% repeat processing pass-through,
per-booking flat fees (considered 1 Aug, rejected same day).

---

## Future Considerations

- **Tipping** — owners add tips, 100% to cleaner (unchanged, fits the model)
- **Annual membership discount** (e.g. 2 months free) once Plus is self-serve
- **Member referral** — existing €10-credit referral system extends naturally
  to "gift a month of Plus"
- **Crypto-ready** (internal note, unchanged): payment provider stays
  abstracted; a subscription is even easier to settle in stablecoins later
  than marketplace splits would have been.
