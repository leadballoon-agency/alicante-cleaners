# VillaCare Site Audit - January 2026

> External review of all public pages. Identifies critical inconsistencies affecting trust, conversions, and investment readiness.

---

## Critical Issues (Fix First)

### 1. Payment & Fee Messaging Contradictions

**This is the biggest trust leak on the site.**

| Page | Current Claim |
|------|---------------|
| Homepage `/` | "Pay securely online" |
| Owner Guide `/guide` | "Pay cleaner directly / online payments coming soon" |
| Booking Guide `/guide/booking` | "Pay cleaner directly after" |
| Terms `/terms` | Payment at booking via Stripe + 15% platform fee |
| Cleaner Join `/join` | "Sin comisiones / keep what you earn" |
| Cleaner Guide `/join/guide` | "VillaCare is completely free for cleaners" |

**Action Required:** Decide the true model, then align ALL pages:
- If owner pays online, cleaner gets payout minus fee → say it plainly but positively
- If owner pays cleaner directly, no platform fee → update Terms immediately

### 2. Brand Naming Drift

| Page | Brand Used |
|------|------------|
| Homepage, most pages | VillaCare |
| AI Assistant `/features/ai-assistant` | "Alicante Cleaners" in CTA copy |

**Action Required:** Standardize product name globally (domain can stay different).

### 3. "No Passwords" vs Privacy Policy Conflict

| Page | Claim |
|------|-------|
| Homepage | "No passwords ever" / magic link login |
| Privacy Policy `/privacy` | "secure password storage" |

**Action Required:** Update Privacy to reflect magic links / phone OTP reality.

---

## Page-by-Page Review

### Homepage `/`

**Strengths:**
- Clear, premium positioning: "Trusted villa cleaning in Alicante"
- Strong benefit-led structure (problem → solution blocks)
- Villa-specific angle is a great differentiator
- Clear CTAs split by persona (owners vs cleaners)

**Improvements:**
- Payment messaging conflict (see above)
- "Beta – Join 50+ owners" needs meaningful metrics (coverage areas, repeat rate, response time, NPS)
- "Meet your AI assistant" is a feature → turn into promise ("Never wait for replies again")

---

### Owner Guide `/guide`

**Strengths:**
- Simple step-by-step with plain English
- Addresses real owner anxieties (confirmation speed, WhatsApp updates, photo proof)

**Improvements:**
- Outdated operational details conflict with Terms
- Positions closer to "helpful directory" than platform with safeguards
- Should highlight workflow + security features

---

### Owner Booking Guide `/guide/booking`

**Strengths:**
- Clean "2 minutes" framing works well
- Good villa-specific prompts (terraces/pools/outdoor areas)

**Improvements:**
- Payment + cancellation conflicts with Terms
- "No hidden fees" needs explanation if platform fee exists on cleaner side

---

### Cleaner Join Landing `/join`

**Strengths:**
- Spanish-first is exactly right for supply
- Strong feature set: AI assistant, translation, teams, calendar sync, secure access notes
- Invitation-only framing is a quality moat

**Improvements:**
- **Revenue model contradiction:** "Sin comisiones" vs Terms' 15% platform fee - **trust breaker**
- Some AI wording feels like hype - balance with proof + constraints

---

### Cleaner Join Guide `/join/guide`

**Strengths:**
- Spanish version is clear, friendly, non-technical
- "Your number remains private until you accept a job" is strong trust detail

**Improvements:**
- Claims "completely free for cleaners" conflicts with Terms fee structure
- Decide reality, then make all pages consistent

---

### AI Assistant Feature `/features/ai-assistant`

**Strengths:**
- Clear breakdown of what AI does (pricing, availability, languages, areas, guardrails)
- "It won't promise what you don't offer" is perfect risk-reversal

**Improvements:**
- Uses "Alicante Cleaners" instead of "VillaCare" in CTA
- Add "what happens when AI can't help" (escalation process)

---

### Calendar Sync Guide `/join/calendar-guide`

**Strengths:**
- Really good: clear privacy explanation, read-only, "we only see busy blocks"
- Great objections handling + practical tips

**Improvements:**
- "Syncs each night... changes appear in 24 hours" - consider "Usually within 24h (often sooner)"
- Show manual sync button clearly

---

### Booking Management Guide `/join/booking-guide`

**Strengths:**
- Long-press UX explanation is clear and specific
- WhatsApp quick messages are brilliant

**Improvements:**
- WhatsApp reply commands (ACEPTAR/RECHAZAR) should be referenced more prominently on main join page

---

### Team Leader Guide `/join/team-leader-guide`

**Strengths:**
- Strong system: referrals, review applicants, control membership
- Eligibility rule (200 hours + 4.5+ stars) is powerful quality control

**Improvements:**
- Booking assignment workflow needs clearer documentation
- If feature doesn't exist yet, tweak wording to avoid over-promising

---

### Team Member Guide `/join/team-guide`

**Strengths:**
- Simple step flow reduces intimidation for newer cleaners

**Improvements:**
- Ensure final steps cover post-approval workflow + how availability/earnings work in team context

---

### About `/about`

**Strengths:**
- One of the best assets: genuine founder story (owner + Clara)
- "We built this because we live it" is perfect for trust

**Improvements:**
- Add "Where we are now" block: beta metrics, coverage, what's live vs coming

---

### Legal Pages `/terms` `/privacy`

**Strengths:**
- Solid structure, GDPR rights included, Spain jurisdiction stated

**Improvements:**
- Privacy says "secure password storage" but product is passwordless
- Terms conflict with marketing claims (see Critical Issue #1)

---

## Second-Wave Improvements

### For Owners

1. **Add trust block:** "How vetting works" (referral-only is strong but vague)
2. **Add "what happens if..." flows:**
   - Cleaner cancels
   - Arrival prep urgency
   - Key access / neighbour fallback
3. **Replace generic testimonials** with specific proof (area + scenario + outcome)

### For Cleaners

1. **Add "day in the life" section:**
   - Booking comes in → WhatsApp notification → Accept → Calendar sync → Access notes appear 24h before → Mark complete
2. Highlight operational features more (teams, secure access notes, long-press UX)

### For Investment Readiness

Currently lacks:
- Traction metrics
- Unit economics (avg booking value, take rate, repeat rate)
- Supply growth loop explanation (referral network + team leader flywheel)

---

## Top 5 Priority Fixes

| Priority | Fix | Pages Affected |
|----------|-----|----------------|
| 1 | Unify payment + fee messaging | Homepage, guides, join pages, Terms |
| 2 | Unify brand naming (VillaCare) | AI assistant page, any others |
| 3 | Update Privacy for passwordless reality | `/privacy` |
| 4 | Add "Where we are now" + metrics | `/about`, homepage |
| 5 | Align owner guides with current workflow | `/guide`, `/guide/booking` |

---

## Pages Not Fully Reviewed

These require JS/auth and couldn't be crawled:
- Cleaner profiles (`/carmen`, `/clara`, etc.)
- Login page (`/login`)
- Onboarding flow (`/onboarding/cleaner`)

---

## Decision Required

**Before fixing anything, answer this question:**

> Are you currently charging owners online via Stripe, or is it still pay-the-cleaner-directly?

That single truth determines the entire messaging alignment.

---

## Source

External audit performed January 2026 via ChatGPT web crawl of alicantecleaners.com
