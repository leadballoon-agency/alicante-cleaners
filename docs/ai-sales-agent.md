# AI Sales Agent

## Overview
AI automatically handles visitor inquiries on cleaner profile pages, collects booking details, and creates accounts via magic link.

## Flow

```
Visitor lands on /clara → Clicks "Chat with Clara" → AI conversation
                                    ↓
        AI collects: service, property details, date, name, phone
                                    ↓
        AI creates magic link → SMS sent (logged to console for now)
                                    ↓
        Visitor clicks link → /onboard/[token] → Adds email + property name
                                    ↓
        Creates: User, Owner, Property, PENDING Booking
                                    ↓
        Cleaner notified → Must confirm within 6 hours
```

## Reminder Chain

| Time | Action |
|------|--------|
| 0h | Booking created, cleaner notified |
| 1h | Reminder sent to cleaner |
| 2h | Escalated to team members |
| 6h | Auto-declined, owner notified |

## Files

### Frontend
- `components/ai/public-chat-widget.tsx` - Chat UI
- `app/onboard/[token]/page.tsx` - Magic link landing page

### API Routes
- `app/api/ai/public-chat/route.ts` - AI chat with tool calling
- `app/api/ai/onboarding/create/route.ts` - Create magic link
- `app/api/ai/onboarding/[token]/route.ts` - Get onboarding details
- `app/api/ai/onboarding/[token]/confirm/route.ts` - Confirm & create account
- `app/api/cron/booking-reminders/route.ts` - Process reminders (cron)

### Services
- `lib/notifications/booking-notifications.ts` - Notification logic

## Database Models

```prisma
model PendingOnboarding {
  token, cleanerId, visitorName, visitorPhone,
  bedrooms, bathrooms, outdoorAreas, accessNotes,
  serviceType, servicePrice, preferredDate, preferredTime,
  status (PENDING/COMPLETED/EXPIRED), expiresAt
}

model Notification {
  userId, type, title, message, data, read, actionUrl
}

model BookingResponseTracker {
  bookingId, cleanerId,
  reminder1SentAt, reminder2SentAt, escalatedAt, autoDeclinedAt, respondedAt
}
```

## Cron Setup

`vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/booking-reminders",
    "schedule": "*/10 * * * *"
  }]
}
```

## Environment Variables
- `CRON_SECRET` - Optional auth for cron endpoint
- `OPENAI_API_KEY` - Required for AI chat
