# AI Sales Assistant

> Intelligent chat assistant on cleaner profile pages that handles inquiries, answers questions in multiple languages, and guides visitors through booking.

---

## Overview

Each cleaner's public profile page (`/{slug}`) includes an AI-powered chat assistant that acts as their virtual sales representative. The assistant:

- Answers questions about pricing, availability, and services
- Responds in the visitor's language (multilingual support)
- Guides interested visitors through the booking process
- Collects property details for seamless onboarding
- Creates magic link bookings when all details are collected

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    VISITOR JOURNEY                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Visitor lands on cleaner profile (/clara)               │
│                    ↓                                         │
│  2. Clicks "Chat with Clara" button                         │
│                    ↓                                         │
│  3. Welcome message appears with capabilities               │
│                    ↓                                         │
│  4. Visitor asks questions (any language)                   │
│                    ↓                                         │
│  5. AI responds with accurate, personalized info            │
│                    ↓                                         │
│  6. When ready to book, AI collects details                 │
│                    ↓                                         │
│  7. Magic link sent via SMS → booking confirmed             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Architecture

### Component: `components/ai/public-chat-widget.tsx`

The chat widget is a React component that:
- Floats in the bottom-right corner of profile pages
- Opens as a modal dialog on click
- Maintains conversation history in state
- Sends messages to `/api/ai/public-chat`

### API Endpoint: `/api/ai/public-chat`

**Request:**
```json
{
  "cleanerSlug": "clara",
  "message": "What's your pricing?",
  "history": [
    { "role": "assistant", "content": "Hi! I'm Clara's assistant..." },
    { "role": "user", "content": "Previous message" }
  ]
}
```

**Response:**
```json
{
  "response": "For a 3-bedroom villa, here are the options...",
  "magicLinkCreated": false
}
```

### AI Model

- **Provider:** OpenAI
- **Model:** GPT-4o-mini
- **Temperature:** 0.7 (balanced creativity/accuracy)
- **Max Tokens:** 500

---

## Capabilities

### 1. Pricing Information

The assistant knows the cleaner's exact pricing based on their hourly rate:

| Service | Hours | Formula |
|---------|-------|---------|
| Regular Clean | 3 | hourlyRate × 3 |
| Deep Clean | 5 | hourlyRate × 5 |
| Arrival Prep | 4 | hourlyRate × 4 |

**Example (€18/hr cleaner):**
- Regular: €54
- Deep: €90
- Arrival: €72

### 2. Availability Checking

The assistant has real-time access to:
- Booked dates (from database)
- Available dates (next 14 days)
- Can suggest specific available dates

### 3. Service Area Validation

The assistant knows which areas each cleaner covers and will:
- Confirm if visitor's location is covered
- Politely decline if outside service area
- Suggest contacting the cleaner directly for edge cases

### 4. Multilingual Support

**Supported Languages:**
| Language | Detection | Response Quality |
|----------|-----------|------------------|
| English | ✅ | Native |
| Spanish | ✅ | Fluent |
| German | ✅ | Fluent |
| French | ✅ | Good |
| Dutch | ✅ | Good |
| Portuguese | ✅ | Good |
| Italian | ✅ | Good |

The assistant automatically detects the visitor's language and responds in the same language.

### 5. Booking Guidance

When a visitor wants to book, the assistant collects:

1. **Service type** - Regular, deep, or arrival prep
2. **Property details:**
   - Number of bedrooms
   - Number of bathrooms
   - Outdoor areas (optional)
   - Access details (key location, gate code)
3. **Scheduling:**
   - Preferred date
   - Preferred time
4. **Contact info:**
   - Name
   - Phone number

### 6. Magic Link Creation

Once all details are collected, the assistant:
1. Calls `create_magic_link` tool function
2. Creates pre-filled booking in database
3. Sends SMS with magic link to visitor
4. Visitor clicks link to confirm booking

---

## Test Results

### Test 1: Basic Pricing
**Question:** "What's your pricing for a 3-bedroom villa?"
**Result:** ✅ Accurate pricing for all 3 services

### Test 2: Availability
**Question:** "Are you available this Saturday morning?"
**Result:** ✅ Confirmed specific date, asked follow-up questions

### Test 3: Spanish Language
**Question:** "¿cuánto cuesta una limpieza profunda para mi casa en San Juan?"
**Result:** ✅ Responded in fluent Spanish with correct pricing

### Test 4: German + Service Area
**Question:** "Guten Tag, ich habe eine Villa in El Campello. Bieten Sie dort auch Reinigungsservices an?"
**Result:** ✅ Responded in German, correctly identified El Campello is outside service area

### Test 5: Edge Cases (Services Not Offered)
**Question:** "Do you do laundry and ironing? Also can you bring your own cleaning supplies?"
**Result:** ✅ Clarified laundry/ironing NOT included, supplies ARE provided

### Test 6: Booking Guidance
**Question:** "I'd like to book a deep clean for next Friday. How do I proceed?"
**Result:** ✅ Provided structured list of required information

### Test 7: Complete Booking with Magic Link
**Question:** "I'd like to book a deep clean for January 15th at 10am. My villa has 3 bedrooms, 2 bathrooms, a pool and terrace. The key is under the plant pot by the front door. My name is John Smith and my phone is +44 7700 900123."
**Result:** ✅ Created magic link, sent SMS, visitor received pre-filled booking page

---

## Magic Link Booking Flow

When a visitor provides ALL required details, the assistant automatically creates a booking:

```
┌─────────────────────────────────────────────────────────────┐
│                 COMPLETE BOOKING FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Visitor provides ALL details in chat:                   │
│     • Service type (deep clean)                             │
│     • Property (3 bed, 2 bath, pool, terrace)              │
│     • Access notes (key under plant pot)                    │
│     • Date/time (Jan 15, 10am)                             │
│     • Name & phone (John Smith, +44...)                    │
│                    ↓                                         │
│  2. Assistant detects complete info                         │
│                    ↓                                         │
│  3. Calls create_magic_link tool                           │
│                    ↓                                         │
│  4. POST /api/ai/onboarding/create                         │
│     • Creates PendingOnboarding record                      │
│     • Generates secure token                                │
│     • Sends SMS with magic link                            │
│                    ↓                                         │
│  5. Visitor receives SMS:                                   │
│     "Click to confirm your booking with Clara..."          │
│                    ↓                                         │
│  6. Visitor clicks link → /onboard/{token}                 │
│     • Sees pre-filled booking details                       │
│     • Just adds: property name + email                     │
│     • Clicks "Confirm Booking"                             │
│                    ↓                                         │
│  7. Booking created, cleaner notified via WhatsApp         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Magic Link Page Shows

| Section | Pre-filled Data |
|---------|-----------------|
| **Booking Details** | Service, Date, Time, Duration, Total Price |
| **Your Property** | Bedrooms, Bathrooms, Outdoor areas, Access notes |
| **Complete Account** | Just needs: Property Name, Email |

### Tool Definition

```typescript
const createMagicLinkTool = {
  name: 'create_magic_link',
  description: 'Create a magic link after collecting all booking details',
  parameters: {
    visitorName: string,      // Required
    visitorPhone: string,     // Required
    bedrooms: number,         // Required
    bathrooms: number,        // Required
    outdoorAreas: string[],   // Optional
    accessNotes: string,      // Optional
    serviceType: 'regular' | 'deep' | 'arrival',  // Required
    preferredDate: string,    // Required (YYYY-MM-DD)
    preferredTime: string,    // Required
  }
}
```

---

## System Prompt

The AI receives this context for each conversation:

```
YOUR ROLE:
- Help potential customers learn about {cleaner}'s services
- Answer questions about pricing and availability
- Guide them through booking a cleaning
- Collect information to create their booking

CLEANER INFO:
- Name, hourly rate, service areas, rating, bio

SERVICES & PRICING:
- Calculated from hourly rate

AVAILABILITY:
- Real-time from database (next 14 days)

IMPORTANT RULES:
- Be warm, helpful, and professional
- Answer in the language the visitor uses
- Don't make up information
- Guide conversations toward booking when appropriate
- Prices include everything (supplies, travel)
```

---

## Branding

The chat widget uses VillaCare's design system:

| Element | Style |
|---------|-------|
| Button background | Terracotta `#C4785A` |
| Button hover | `#B56A4F` |
| Header background | Terracotta `#C4785A` |
| Assistant badge | Terracotta with white text |
| Icon | 💬 (chat bubble) |
| User messages | Dark `#1A1A1A` |
| Assistant messages | White with border |

---

## Usage Logging

Every conversation is logged to `AIUsageLog`:

```typescript
await db.aIUsageLog.create({
  data: {
    cleanerId: cleaner.id,
    conversationId: 'public-chat',
    action: magicLinkCreated ? 'PUBLIC_CHAT_ONBOARDING' : 'PUBLIC_CHAT',
    tokensUsed,
  },
})
```

This enables:
- Cost tracking per cleaner
- Conversion analytics
- Performance monitoring

---

## Benefits for Cleaners

1. **24/7 Availability** - Assistant responds instantly, even when cleaner is busy
2. **Consistent Information** - Always provides accurate pricing and availability
3. **Language Barrier Removal** - Serves international clients in their language
4. **Lead Qualification** - Collects all needed info before bothering cleaner
5. **Seamless Onboarding** - Magic links mean less manual data entry

---

## Security Features

### Sensitive Access Lifecycle

VillaCare implements **operational trust infrastructure with data minimisation** — a system-enforced architecture that goes beyond policy-based security.

```
┌─────────────────────────────────────────────────────────────┐
│              SENSITIVE ACCESS LIFECYCLE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. STORED SECURELY BY OWNER                                │
│     • Collected via secure form (not chat)                  │
│     • AES-256 encrypted at rest                             │
│     • Segregated from booking data                          │
│                    ↓                                         │
│  2. RELEASED 24H PRE-ARRIVAL                                │
│     • Just-in-time access for assigned cleaner only         │
│     • Time-limited window                                   │
│     • Role-limited (only assigned cleaner)                  │
│                    ↓                                         │
│  3. REVOKED ON JOB COMPLETION                               │
│     • Auto-revoked after booking time                       │
│     • No permanent storage of access credentials            │
│     • Historical bookings don't expose sensitive info       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Security Principles

| Principle | Implementation |
|-----------|----------------|
| **Least-privilege** | Access notes segregated from general booking data |
| **Just-in-time** | Released only 24h before booking, to assigned cleaner only |
| **Data minimisation** | Auto-revoked after job completion |
| **System-enforced** | Architecture-level, not policy-dependent |

### Protection Layers

#### 1. No Chat Collection (Data Segregation)
- Access notes (key locations, codes) are **NOT** collected in chat
- Sensitive information is only shared when operationally required
- If a user tries to share sensitive info, the assistant warns them:
  > "For your security, please don't share access codes in this chat. You'll be able to add these securely when you confirm your booking."

#### 2. Sensitive Pattern Detection
The system actively detects and intercepts patterns like:
- "key is under...", "key behind..."
- Gate codes, PIN codes, alarm codes
- Lockbox/key safe references

#### 3. Secure Form Collection
Access notes are collected on the **magic link confirmation page**:
- Dedicated secure section with encryption icon
- Clear explanation of security measures
- Optional field (not required to book)

#### 4. AES-256 Encryption at Rest
```typescript
// Access notes encrypted before storage
const encryptedNotes = encryptAccessNotes(notes)
// Format: iv:authTag:ciphertext (base64)
```

#### 5. Time-Limited, Role-Limited Access
Cleaners can only view access notes **24 hours before** the booking:
```typescript
// Just-in-time access window
const accessWindowStart = bookingDateTime - 24 hours
const canView = now >= accessWindowStart && now <= bookingDateTime
```

#### 6. Automatic Revocation
- Access notes hidden after booking completes
- Past bookings don't expose sensitive information
- No manual cleanup required — system-enforced

### Why This Matters

**For Owners:**
> "Who has my keys, codes, and instructions — and for how long?"

VillaCare's answer is better than WhatsApp, email, or property managers:
- Time-limited access
- Role-limited access
- Automatically revoked

**For the Platform:**
- Reduced legal exposure
- Improved GDPR posture
- Lower insurance friction
- Prevents "historic access leakage"

### Security Knowledge Base

The AI has access to `/knowledge/security-and-access.md` which contains:
- Explanation of security measures for owners
- Best practices for property access
- Smart lock recommendations
- Privacy policy references

---

## Future Enhancements

- [ ] WhatsApp integration (continue conversation via WhatsApp)
- [ ] Photo sharing (visitor can send property photos)
- [ ] Calendar integration (show visual availability)
- [ ] Follow-up reminders (if visitor doesn't complete booking)
- [ ] Custom FAQs per cleaner (personalized knowledge base)
- [ ] Key rotation for encryption
- [ ] Access audit log (track when access notes are viewed/revoked)
