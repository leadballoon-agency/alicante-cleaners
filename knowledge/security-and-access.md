# Security & Access Notes - Owner Guide

## How VillaCare Protects Your Property Information

VillaCare implements **operational trust infrastructure with data minimisation** — your sensitive property details are protected by system-enforced architecture, not just policies.

**The question owners ask:**
> "Who has my keys, codes, and instructions — and for how long?"

**VillaCare's answer:**
- **Time-limited access** — only 24 hours before your booking
- **Role-limited access** — only your assigned cleaner
- **Automatically revoked** — hidden after the job completes

This is better than WhatsApp, email, or property managers.

---

## Sensitive Access Lifecycle

Your access information follows a strict lifecycle:

```
┌───────────────────────────────────────────────────────┐
│         SENSITIVE ACCESS LIFECYCLE                     │
├───────────────────────────────────────────────────────┤
│                                                        │
│  1. STORED SECURELY BY YOU                            │
│     • Entered via secure form (never chat)            │
│     • AES-256 encrypted in our database               │
│     • Segregated from booking information             │
│                                                        │
│  2. RELEASED 24 HOURS BEFORE ARRIVAL                  │
│     • Just-in-time access for assigned cleaner        │
│     • Time-limited visibility window                  │
│     • Only the cleaner doing your job can see it      │
│                                                        │
│  3. AUTOMATICALLY REVOKED AFTER COMPLETION            │
│     • Hidden once the booking is done                 │
│     • No permanent storage of your credentials        │
│     • Past bookings don't expose your details         │
│                                                        │
└───────────────────────────────────────────────────────┘
```

---

## What Information is Sensitive?

| Type | Examples | Sensitivity |
|------|----------|-------------|
| **Key locations** | "Under the plant pot", "With the neighbor at #5" | High |
| **Gate/door codes** | PIN codes, keypad combinations | High |
| **Alarm codes** | Security system PINs | Very High |
| **Lock box codes** | Key safe combinations | High |
| **WiFi passwords** | Network access | Medium |
| **Parking instructions** | Bay numbers, permits | Low |

---

## Our Security Principles

| Principle | What It Means |
|-----------|---------------|
| **Least-privilege** | Your access notes are kept separate from general booking data |
| **Just-in-time** | Released only 24h before booking, to your assigned cleaner only |
| **Data minimisation** | Auto-revoked after job completion — no permanent storage |
| **System-enforced** | This is built into our architecture, not dependent on staff following rules |

---

## Protection Layers

### 1. Secure Collection (No Chat)
- Access notes are collected through our **secure booking form**, not through chat
- If you try to share codes in chat, we'll stop you and redirect to the secure form
- Sensitive details are **never processed by third-party AI services**

### 2. AES-256 Encryption at Rest
- Your access notes are **encrypted in our database**
- Even if someone accessed our database, they couldn't read your codes
- Industry-standard encryption used by banks and healthcare systems

### 3. Just-In-Time Access (24 Hours Only)
- Your cleaner can only see access details **24 hours before** the scheduled booking
- Before that: "Access notes will be available 24 hours before your booking"
- After that: Hidden permanently for that booking

### 4. Role-Limited Access
- Only your **assigned cleaner** can view your property's access details
- Admin staff cannot see your access codes
- Team members who aren't assigned to your job cannot see your details

### 5. Automatic Revocation
- Once a booking is complete, access notes are **automatically hidden**
- No manual cleanup required — the system enforces this
- Prevents "historic access leakage" from old bookings

---

## Why This Matters

**What most platforms do:**
- Store your access details indefinitely
- Let anyone on the team see them
- Rely on staff to "be careful"

**What VillaCare does:**
- Time-limited access window
- Role-limited to assigned cleaner
- System-enforced automatic revocation

This reduces:
- Legal exposure for you and us
- Risk of details being shared
- "Historic access leakage" from past bookings

---

## Best Practices for Property Owners

### DO:
- **Use our secure form** to provide access details (never chat or messages)
- **Use a lock box or key safe** with a code you can change after each clean
- **Update codes periodically**, especially after staff changes
- **Consider smart locks** that can generate temporary codes per booking

### DON'T:
- **Never share alarm codes in chat messages** — use the secure form
- **Don't use the same code** for gate, door, and alarm
- **Avoid obvious codes** like 1234, 0000, or your address numbers
- **Don't share codes via SMS or WhatsApp** — these can be intercepted

---

## If You're Asked for Sensitive Details in Chat

Our AI assistant will never ask for access codes in chat. If you try to share them, you'll see:

> "For your security, please don't share gate codes or key locations in this chat. You'll be able to add these details securely when you confirm your booking through the secure link we'll send you."

---

## Smart Lock Recommendations

For maximum security, consider installing a smart lock that generates temporary codes:

**Benefits:**
- **Temporary codes**: Generate unique codes per booking
- **Time-limited access**: Codes only work during scheduled times
- **Audit trail**: See exactly when your property was accessed
- **Remote control**: Lock/unlock from anywhere

**Popular options in Spain:**
- Nuki Smart Lock
- Yale Linus
- Tedee

---

## Questions About Security?

If you have any concerns about how we handle your property information:
- Chat with our support team
- Email: hello@alicantecleaners.com
- Review our [Privacy Policy](/privacy)

Your trust is our priority. We've built security into our architecture — not as an afterthought, but as a core principle.
