# VillaCare Current State Brief

> Last updated: 10 January 2026 | For investors, developers, and partners

---

## Executive Summary

**VillaCare** is an AI-native platform connecting villa owners with trusted service providers in Spain's vacation property market.

| Metric | Value |
|--------|-------|
| **Live Platform** | alicantecleaners.com |
| **Investor Site** | villacare.app |
| **Cleaners Onboarded** | 6+ vetted professionals |
| **AI Agents** | 10 in production |
| **Codebase** | 45,000+ lines TypeScript |
| **Status** | Beta - Direct payments |

---

## What's Live Now

### Core Marketplace (Complete)

| Feature | Status |
|---------|--------|
| Browse cleaners by area | Live |
| Public cleaner profiles with reviews | Live |
| 4-step booking flow | Live |
| Booking lifecycle (pending → confirmed → completed → cancelled) | Live |
| WhatsApp notifications (Twilio) | Live |
| Review system with moderation | Live |

### Owner Dashboard (Complete)

| Feature | Status |
|---------|--------|
| Timeline view with JobCards | Live |
| Peek-to-lock booking interaction (300ms peek, 1.5s lock) | Live |
| Quick actions: message, reschedule, cancel, review | Live |
| Edit access notes & special instructions | Live |
| "I'm Coming Home" arrival prep (remote owners) | Live |
| Property management | Live |
| Auto-translated messaging | Live |

### Cleaner Dashboard (Complete)

| Feature | Status |
|---------|--------|
| Peek-to-lock booking cards | Live |
| Accept/decline/complete bookings | Live |
| Team management (team leaders) | Live |
| Applicant review system | Live |
| Success Coach (AI growth tips) | Live |
| Calendar sync (Google/Apple/Outlook) | Live |
| Profile management | Live |

### Admin Dashboard (Complete)

| Feature | Status |
|---------|--------|
| Unified live activity feed | Live |
| Peek-to-lock card interactions | Live |
| Deep linking (`?card=xxx`, `?search=xxx`) | Live |
| Urgent filter ("⚡ X need attention") | Live |
| Hamburger menu navigation | Live |
| AI Admin Agent (18+ tools) | Live |
| Cleaner management & approval | Live |
| Owner CRM with notes | Live |
| Review moderation | Live |
| Audit logging | Live |

### AI Infrastructure (Complete)

| Agent | Function | Status |
|-------|----------|--------|
| Sales Agent | 24/7 booking assistance on profiles | Live |
| Support Agent | Contextual help across platform | Live |
| Success Coach | Cleaner growth recommendations | Live |
| Onboarding Agent | Guides new cleaner signup | Live |
| Admin Agent | 18+ database tools for management | Live |
| Owner Agent | Villa management assistance | Live |
| Cleaner Agent | Booking & schedule help | Live |
| Investor Agent | Pitch chat on villacare.app | Live |
| Alan Agent | Personality demo (entertainment) | Live |
| Amanda Agent | Personality demo (warmth) | Live |

---

## The Moat: Why This Scales

### 1. WhatsApp-Native in a WhatsApp Market
Spain runs on WhatsApp. We're the only platform that meets users where they are - OTP via WhatsApp, booking notifications, photo proof, reply commands (ACCEPT/DECLINE).

### 2. AI from Day One
Not bolted on - designed around it. 10 agents handle sales, support, coaching, and operations without human intervention. Cleaners can work while AI books for them.

### 3. Trust Network
Referral-only cleaner network. Every cleaner is vouched for by someone already on the platform. No strangers with keys to your villa.

### 4. Just-In-Time Security
Access codes and key holder details are encrypted (AES-256), only visible 24 hours before bookings, automatically revoked after. Enterprise-grade security for consumer product.

### 5. Multilingual by Default
7 languages, auto-translated messaging. Write in English, cleaner reads Spanish. No friction.

### 6. Teams = Business Building
Cleaners become team leaders, recruit specialists (pool cleaners, gardeners), build real businesses. Platform enables vertical expansion.

### 7. Data Advantage
Weekly villa visits = early intel on property sales. Future real estate play built on service relationships.

---

## Business Model

### Beta Phase (Now): Direct Payments
- Owner pays cleaner directly (cash/Bizum)
- Platform is free to use
- Focus: Build trust, prove product-market fit

### Post-Beta: Stripe Connect
| Revenue Stream | Rate |
|----------------|------|
| First booking (platform-acquired) | 20% |
| Repeat bookings | 2.5% processing |
| Cleaner's own clients | 2.5% processing only |
| Property management | 10-15% monthly |
| Real estate (future) | 3% commission |

**We only charge platform fees when we bring the business.**

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Database | Neon PostgreSQL + Prisma |
| Auth | NextAuth (magic links + phone OTP) |
| Messaging | Twilio WhatsApp Business API |
| AI | Claude (Opus + Haiku) + GPT-4o-mini |
| Hosting | Vercel (auto-deploy) |

### Database: 30+ Models
Users, Owners, Cleaners, Properties, Bookings, Reviews, Conversations, Messages, Teams, AI Usage Logs, Audit Logs, and more.

### API: 90+ Endpoints
Role-protected REST endpoints for all marketplace operations.

---

## What's Planned (Not Built Yet)

| Feature | Priority | Dependency |
|---------|----------|------------|
| Stripe Connect integration | High | Engineering |
| Photo uploads (before/after) | Medium | Storage solution |
| Recurring bookings | Medium | Schema update |
| Email notifications (beyond auth) | Low | Resend templates |
| Mobile app wrapper | Low | PWA first |

---

## Competitive Position

| Competitor | Weakness | Our Advantage |
|------------|----------|---------------|
| TaskRabbit | Generic, no villa focus | Purpose-built for vacation properties |
| Hassle.com | UK-only, no multilingual | 7 languages, Spain-native |
| Local WhatsApp groups | No trust, no tools | Vetted network + platform features |
| Property managers | Expensive, overkill | À la carte services, owner control |

---

## The Endgame: Real Estate

```
Phase 1: Services          Phase 2: Management       Phase 3: Real Estate
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Weekly cleaning visits     Property management       Buy, sell, invest
Trust building            Key holder services        AI-powered transactions
€60/clean                 €200-500/month            €15-25K/sale
```

**Cleaners visit villas weekly.** They know when owners are thinking of selling before anyone else. This is the Zillow play, but with a services moat.

One villa sale = 1,250 cleans worth of revenue.

---

## Links

| Resource | URL |
|----------|-----|
| Live Platform | https://alicantecleaners.com |
| Investor Site | https://villacare.app |
| AI Demo | https://villacare.app/demo |
| Owner Guide | https://alicantecleaners.com/guide/dashboard |
| Cleaner Guide | https://alicantecleaners.com/join/guide |

---

## Contact

**Mark Taylor** - Product & Development
- Email: mark@leadballoon.co.uk
- Company: Lead Balloon Ltd (UK)
