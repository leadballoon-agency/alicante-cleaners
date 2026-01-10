# API Reference

## Executive Summary

VillaCare exposes **90+ REST API endpoints** via Next.js API Routes. All endpoints are:
- **JSON-based** - Request/response bodies use `application/json`
- **Session authenticated** - Uses NextAuth.js JWT sessions
- **Role-protected** - Middleware enforces OWNER, CLEANER, or ADMIN roles

**Base URL:** `https://alicantecleaners.com/api`

---

## Authentication

### Session Flow

```
1. User requests magic link / OTP
   POST /api/auth/signin/email   (magic link)
   POST /api/auth/otp            (phone OTP)

2. User authenticates
   - Magic link: Click email link
   - OTP: Submit code

3. Session created
   - JWT stored in httpOnly cookie
   - Session available via getServerSession()
```

### Auth Headers

All protected endpoints require the session cookie. No explicit `Authorization` header needed - the cookie is sent automatically.

### Role-Based Access

| Role | Can Access |
|------|------------|
| OWNER | `/api/dashboard/owner/*`, `/api/messages/*` |
| CLEANER | `/api/dashboard/cleaner/*`, `/api/messages/*` |
| ADMIN | `/api/admin/*`, all OWNER/CLEANER endpoints |

---

## Public Endpoints

### GET /api/cleaners

List all active cleaners for homepage directory.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| area | string | Filter by service area (optional) |

**Response:**
```json
{
  "cleaners": [
    {
      "id": "clx123...",
      "slug": "clara-r",
      "name": "Clara R.",
      "photo": "https://...",
      "bio": "Professional cleaner with 5 years experience...",
      "serviceAreas": ["Alicante City", "San Juan"],
      "hourlyRate": 18,
      "rating": 4.8,
      "reviewCount": 12,
      "featured": true,
      "teamLeader": true
    }
  ],
  "areas": ["Alicante City", "El Campello", "San Juan", ...]
}
```

---

### GET /api/cleaners/[slug]

Get detailed cleaner profile with reviews.

**Response:**
```json
{
  "cleaner": {
    "id": "clx123...",
    "slug": "clara-r",
    "name": "Clara R.",
    "photo": "https://...",
    "bio": "...",
    "serviceAreas": ["Alicante City", "San Juan"],
    "languages": ["es", "en"],
    "hourlyRate": 18,
    "rating": 4.8,
    "reviewCount": 12,
    "totalBookings": 45
  },
  "reviews": [
    {
      "id": "rev123...",
      "rating": 5,
      "text": "Excellent service!",
      "ownerName": "Sarah M.",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "services": [
    { "type": "Regular Clean", "hours": 3, "price": 54 },
    { "type": "Deep Clean", "hours": 5, "price": 90 },
    { "type": "Arrival Prep", "hours": 4, "price": 72 }
  ]
}
```

---

### GET /api/cleaners/[slug]/availability

Check cleaner's availability for booking calendar.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| month | string | Month to check (YYYY-MM) |

**Response:**
```json
{
  "availability": {
    "2024-02-15": { "available": true, "slots": ["09:00", "14:00"] },
    "2024-02-16": { "available": false, "slots": [] }
  }
}
```

---

### GET /api/activity

Get recent platform activity for social proof ticker.

**Response:**
```json
{
  "activities": [
    {
      "type": "booking_completed",
      "area": "San Juan",
      "timeAgo": "2 hours ago"
    },
    {
      "type": "review_added",
      "rating": 5,
      "cleanerName": "Clara R.",
      "timeAgo": "4 hours ago"
    }
  ]
}
```

---

### GET /api/calendar/[token]

ICS calendar feed for cleaner's bookings.

**Response:** `text/calendar` (ICS format)

```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//VillaCare//Cleaner Calendar//EN
BEGIN:VEVENT
UID:booking-abc123@villacare.app
DTSTART:20240215T100000
DTEND:20240215T130000
SUMMARY:Regular Clean - Villa Rosa
LOCATION:Calle Example 123, Alicante
DESCRIPTION:3 hours - €54
END:VEVENT
END:VCALENDAR
```

---

## Booking Endpoints

### POST /api/bookings

Create a new booking. Works for both logged-in users and guests.

**Request Body:**
```json
{
  "cleanerSlug": "clara-r",
  "propertyAddress": "Calle Example 123, Alicante",
  "bedrooms": 3,
  "specialInstructions": "Key under mat",
  "service": {
    "type": "Regular Clean",
    "hours": 3,
    "price": 54
  },
  "date": "2024-02-15",
  "time": "10:00",
  "guestName": "John Smith",
  "guestEmail": "john@example.com",
  "guestPhone": "+447123456789"
}
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": "booking123...",
    "status": "PENDING",
    "service": "Regular Clean",
    "price": 54,
    "date": "2024-02-15",
    "time": "10:00"
  },
  "message": "Booking created successfully. The cleaner will confirm shortly."
}
```

**Side Effects:**
- Creates User/Owner/Property if guest booking
- Sends WhatsApp notification to cleaner
- Sends WhatsApp confirmation to owner (if phone provided)

---

## Cleaner Dashboard Endpoints

All require `CLEANER` role.

### GET /api/dashboard/cleaner

Get cleaner profile and stats.

**Response:**
```json
{
  "cleaner": {
    "id": "...",
    "slug": "clara-r",
    "name": "Clara R.",
    "bio": "...",
    "serviceAreas": ["Alicante City"],
    "hourlyRate": 18,
    "rating": 4.8,
    "reviewCount": 12,
    "totalBookings": 45,
    "calendarToken": "cal-abc123",
    "calendarUrl": "https://alicantecleaners.com/api/calendar/cal-abc123"
  },
  "stats": {
    "pendingBookings": 2,
    "confirmedBookings": 5,
    "completedThisMonth": 12,
    "revenueThisMonth": 648
  }
}
```

### POST /api/dashboard/cleaner

Update cleaner profile.

**Request Body:**
```json
{
  "bio": "Updated bio...",
  "hourlyRate": 20,
  "serviceAreas": ["Alicante City", "San Juan"],
  "languages": ["es", "en"]
}
```

---

### GET /api/dashboard/cleaner/bookings

Get cleaner's bookings.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | Filter by status (PENDING, CONFIRMED, COMPLETED) |
| from | string | Start date (YYYY-MM-DD) |
| to | string | End date (YYYY-MM-DD) |

**Response:**
```json
{
  "bookings": [
    {
      "id": "...",
      "status": "PENDING",
      "service": "Regular Clean",
      "price": 54,
      "date": "2024-02-15",
      "time": "10:00",
      "owner": { "name": "Sarah M.", "phone": "+447..." },
      "property": {
        "name": "Villa Rosa",
        "address": "...",
        "bedrooms": 3,
        "accessNotes": "Key code 1234...",
        "accessNotesAvailable": true,
        "keyHolderName": "John (Neighbour)",
        "keyHolderPhone": "+34 612 111 222"
      }
    }
  ]
}
```

**Note:** `accessNotes`, `keyHolderName`, and `keyHolderPhone` are only returned when the booking is within 24 hours (JIT access control). Outside this window, these fields are null.

---

### PATCH /api/dashboard/cleaner/bookings/[id]

Update booking status (accept/decline/complete/assign).

**Request Body:**
```json
{
  "action": "accept"  // "accept", "decline", "complete", "assign"
}
```

For team assignment:
```json
{
  "action": "assign",
  "assignToCleanerId": "cleaner-id-123"
}
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": "...",
    "status": "confirmed"
  }
}
```

**Side Effects:**
- WhatsApp notification to owner on accept/decline
- Updates cleaner/owner stats on completion

---

### GET/POST /api/dashboard/cleaner/team

Manage team (for team leaders).

**GET Response:**
```json
{
  "team": {
    "id": "team123",
    "name": "Clara's Team",
    "referralCode": "TEAM-clara-1234",
    "members": [
      { "id": "...", "name": "Maria S.", "rating": 4.5 }
    ]
  },
  "pendingRequests": [
    { "id": "...", "cleanerName": "Ana L.", "createdAt": "..." }
  ]
}
```

**POST (Create Team):**
```json
{
  "name": "Clara's Team"
}
```

---

## Owner Dashboard Endpoints

All require `OWNER` role.

### GET /api/dashboard/owner

Get owner profile and stats.

**Response:**
```json
{
  "owner": {
    "id": "...",
    "name": "Sarah M.",
    "referralCode": "SARA2024123",
    "referralCredits": 25.00,
    "totalBookings": 8
  },
  "stats": {
    "activeProperties": 2,
    "upcomingBookings": 1,
    "totalSpent": 432
  }
}
```

---

### GET /api/dashboard/owner/bookings

Get owner's bookings.

**Response:** Same structure as cleaner bookings, but from owner perspective.

---

### POST /api/dashboard/owner/bookings/[id]/cancel

Cancel a pending or confirmed booking.

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully"
}
```

**Errors:**
- `404` - Booking not found or doesn't belong to owner
- `400` - Cannot cancel completed or already cancelled bookings

**Side Effects:**
- Updates booking status to CANCELLED
- (TODO) Sends notification to cleaner about cancellation

---

### GET/POST /api/dashboard/owner/properties

Manage properties.

**GET Response:**
```json
{
  "properties": [
    {
      "id": "...",
      "name": "Villa Rosa",
      "address": "Calle Example 123",
      "bedrooms": 3,
      "bathrooms": 2,
      "notes": "Key under mat..."
    }
  ]
}
```

**POST (Create Property):**
```json
{
  "name": "Villa Rosa",
  "address": "Calle Example 123, Alicante",
  "bedrooms": 3,
  "bathrooms": 2,
  "notes": "Key location details..."
}
```

---

### POST /api/dashboard/owner/arrival-prep

Create "I'm Coming Home" arrival prep request.

**Request Body:**
```json
{
  "propertyId": "...",
  "cleanerId": "...",
  "arrivalDate": "2024-03-01",
  "arrivalTime": "14:00",
  "extras": ["fridge", "flowers", "linens"],
  "notes": "Please stock the fridge with essentials"
}
```

---

## Messaging Endpoints

Require `OWNER` or `CLEANER` role.

### GET /api/messages

Get unread message count.

**Response:**
```json
{
  "unreadCount": 3
}
```

---

### POST /api/messages

Send a message with auto-translation.

**Request Body:**
```json
{
  "conversationId": "conv123...",
  "text": "Hello, what time works for you?"
}
```

**Response:**
```json
{
  "message": {
    "id": "msg123...",
    "text": "Hello, what time works for you?",
    "originalText": "Hello, what time works for you?",
    "translatedText": "Hola, ¿a qué hora te viene bien?",
    "originalLang": "en",
    "translatedLang": "es",
    "isMine": true,
    "createdAt": "2024-02-15T10:00:00Z"
  }
}
```

**Side Effects:**
- Auto-detects language via OpenAI
- Translates to recipient's preferred language
- Triggers AI sales agent response (for owner messages)

---

### GET /api/messages/conversations

List user's conversations.

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv123...",
      "otherParty": { "name": "Clara R.", "image": "..." },
      "lastMessage": {
        "text": "See you tomorrow!",
        "createdAt": "..."
      },
      "unreadCount": 2
    }
  ]
}
```

---

### GET /api/messages/conversations/[id]

Get messages in a conversation.

**Response:**
```json
{
  "conversation": {
    "id": "...",
    "otherParty": { "name": "Clara R." }
  },
  "messages": [
    {
      "id": "...",
      "text": "Hello!",
      "originalText": "Hello!",
      "translatedText": "¡Hola!",
      "originalLang": "en",
      "translatedLang": "es",
      "isMine": true,
      "isAIGenerated": false,
      "createdAt": "..."
    }
  ]
}
```

---

## Admin Endpoints

All require `ADMIN` role.

### GET /api/admin/stats

Platform KPIs for admin dashboard.

**Response:**
```json
{
  "stats": {
    "totalCleaners": 6,
    "activeCleaners": 5,
    "totalOwners": 52,
    "totalBookings": 187,
    "bookingsThisMonth": 34,
    "revenueThisMonth": 1836,
    "pendingReviews": 3
  }
}
```

---

### GET /api/admin/cleaners

List all cleaners with admin details.

**Response:**
```json
{
  "cleaners": [
    {
      "id": "...",
      "name": "Clara R.",
      "status": "ACTIVE",
      "rating": 4.8,
      "totalBookings": 45,
      "createdAt": "..."
    }
  ]
}
```

---

### PATCH /api/admin/cleaners/[id]

Approve/suspend cleaner.

**Request Body:**
```json
{
  "status": "ACTIVE"  // "ACTIVE" or "SUSPENDED"
}
```

---

### GET /api/admin/reviews

List all reviews for moderation.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| approved | boolean | Filter by approval status |

---

### PATCH /api/admin/reviews/[id]

Approve/feature a review.

**Request Body:**
```json
{
  "approved": true,
  "featured": true
}
```

---

### POST /api/admin/impersonate

Login as another user (for support).

**Request Body:**
```json
{
  "userId": "user-id-to-impersonate"
}
```

---

## AI Endpoints

### POST /api/ai/public-chat

AI chat for visitors (pre-signup).

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "How does booking work?" }
  ],
  "cleanerSlug": "clara-r",
  "sessionId": "browser-session-id"
}
```

---

### POST /api/ai/owner/chat

AI assistant for owners.

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "When is my next booking?" }
  ]
}
```

---

### POST /api/ai/cleaner/chat

AI assistant for cleaners.

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Show me my pending bookings" }
  ]
}
```

---

### GET /api/ai/success-chat

Get Success Coach greeting and stats for cleaner dashboard.

**Authentication:** Required (cleaner only)

**Response:**
```json
{
  "greeting": "Hey Clara! 47 people checked out your profile this week.",
  "stats": {
    "profileScore": 75,
    "profileViews": 47,
    "completedJobs": 12,
    "unlocked": true
  }
}
```

---

### POST /api/ai/success-chat

Chat with the AI Success Coach.

**Authentication:** Required (cleaner only)

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "How can I get more bookings?" }
  ]
}
```

**Response:**
```json
{
  "message": "I've analyzed your profile. Here's what I found...",
  "toolsUsed": ["get_profile_health", "get_profile_views"],
  "unlocked": true,
  "agentName": "Success Coach"
}
```

**Gamification:**
- `unlocked: false` = Teaser mode (before first job) - only profile health tool available
- `unlocked: true` = Full mode (after first job) - all tools available

---

### POST /api/ai/admin/chat

AI assistant for admins (with database tools).

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "How many bookings this week?" }
  ]
}
```

---

### POST /api/ai/sales-agent/respond

AI sales agent auto-response (internal).

Called automatically when owner sends message.

**Request Body:**
```json
{
  "conversationId": "conv123...",
  "messageId": "msg123..."
}
```

---

## Webhook Endpoints

### POST /api/webhooks/twilio

Incoming WhatsApp messages from Twilio.

**Expects:** `application/x-www-form-urlencoded`

**Twilio Payload:**
```
From=whatsapp:+447123456789
Body=ACCEPT
MessageSid=SM123...
```

**Behavior:**
- Parses cleaner phone number
- Handles ACCEPT/DECLINE/HELP commands
- Updates booking status
- Sends confirmation WhatsApp messages

---

## Cron Endpoints

### GET /api/cron/booking-reminders

Send booking response reminders (called by Vercel Cron).

**Behavior:**
1. Find bookings pending > 1 hour → send reminder
2. Find bookings pending > 2 hours → escalate to team
3. Find bookings pending > 6 hours → auto-decline

---

## User Preferences

### GET/PATCH /api/user/preferences

Get or update user language preference.

**PATCH Request:**
```json
{
  "preferredLanguage": "es"
}
```

**Response:**
```json
{
  "preferredLanguage": "es"
}
```

---

## Support Endpoints

### POST /api/support/conversations

Create or continue a support chat conversation.

**Request Body:**
```json
{
  "message": "How do I connect my Google Calendar?",
  "sessionId": "browser-session-id",
  "page": "/dashboard"
}
```

**Response:**
```json
{
  "conversationId": "...",
  "response": "I can help you connect your Google Calendar! Here's how...",
  "status": "ACTIVE"
}
```

---

## Google Calendar Endpoints

### GET /api/calendar/google/connect

Start Google Calendar OAuth flow.

**Response:** Redirects to Google OAuth consent page.

---

### GET /api/calendar/google/callback

OAuth callback from Google.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| code | string | OAuth authorization code |
| state | string | CSRF token |

**Response:** Redirects to dashboard with success/error message.

---

### POST /api/calendar/google/sync

Manually trigger calendar sync.

**Response:**
```json
{
  "success": true,
  "synced": 15,
  "lastSynced": "2024-02-15T10:00:00Z"
}
```

---

### POST /api/calendar/google/disconnect

Disconnect Google Calendar integration.

**Response:**
```json
{
  "success": true
}
```

---

## Team Management Endpoints

### GET /api/teams/leaders

List active team leaders for onboarding selection.

**Response:**
```json
{
  "leaders": [
    {
      "id": "...",
      "name": "Clara R.",
      "teamName": "Clara's Team",
      "memberCount": 3,
      "rating": 4.8
    }
  ]
}
```

---

### POST /api/teams/[id]/join

Request to join a team.

**Request Body:**
```json
{
  "message": "I'd love to join your team!"
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "..."
}
```

---

### GET /api/dashboard/cleaner/team/calendar

Get aggregated team calendar view.

> **Note:** The Team Calendar UI was removed from the Team tab in the cleaner dashboard. This endpoint still exists for potential future use or backend operations.

**Response:**
```json
{
  "members": [
    {
      "id": "...",
      "name": "Maria S.",
      "availability": [
        { "date": "2024-02-15", "slots": [...] }
      ]
    }
  ]
}
```

---

### POST /api/dashboard/cleaner/team/calendar/sync

Sync all team member calendars.

> **Note:** The Team Calendar UI was removed from the Team tab in the cleaner dashboard. This endpoint still exists for potential future use or backend operations.

**Response:**
```json
{
  "success": true,
  "synced": 4
}
```

---

## Phone Management Endpoints

### POST /api/dashboard/cleaner/phone

Request phone number change. Sends OTP to current phone for verification.

**Request:**
```json
{
  "newPhone": "+34698765432"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to your current phone"
}
```

---

### PATCH /api/dashboard/cleaner/phone

Verify OTP and update phone number.

**Request:**
```json
{
  "newPhone": "+34698765432",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "phone": "+34698765432"
}
```

---

## Upload Endpoints

### POST /api/upload

Upload a file (profile photo, etc).

**Request:** `multipart/form-data` with `file` field

**Response:**
```json
{
  "url": "https://res.cloudinary.com/..."
}
```

---

### POST /api/onboarding/upload

Upload profile photo during onboarding flow.

**Request:** `multipart/form-data` with `file` field

**Response:**
```json
{
  "url": "https://res.cloudinary.com/..."
}
```

---

## Account Management Endpoints

### GET /api/account

Get account status and settings.

**Response:**
```json
{
  "status": "ACTIVE",
  "pausedAt": null,
  "deletionScheduledFor": null
}
```

---

### PATCH /api/account

Update account status (pause/delete).

**Pause Account:**
```json
{
  "action": "pause",
  "reason": "Taking a break"
}
```

**Request Deletion:**
```json
{
  "action": "delete",
  "reason": "not_using",
  "feedback": "Moved to a different area"
}
```

**Reactivate:**
```json
{
  "action": "reactivate"
}
```

---

## Admin Analytics & Audit Endpoints

### GET /api/admin/activity

Get live activity feed for admin dashboard.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| limit | number | Max items (default 50) |

**Response:**
```json
{
  "activities": [
    {
      "id": "act_123",
      "type": "BOOKING_CREATED",
      "description": "New booking for Clara",
      "createdAt": "2024-01-09T12:00:00Z"
    }
  ]
}
```

---

### GET /api/admin/analytics

Get page view analytics.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| period | string | "day", "week", "month" |

**Response:**
```json
{
  "pageViews": [
    { "path": "/clara-r", "views": 156 },
    { "path": "/maria-g", "views": 89 }
  ],
  "totalViews": 1234
}
```

---

### GET /api/admin/audit

Get audit log entries.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| action | string | Filter by action type |
| adminId | string | Filter by admin |
| limit | number | Max items (default 50) |

**Response:**
```json
{
  "entries": [
    {
      "id": "aud_123",
      "action": "CLEANER_APPROVED",
      "adminId": "usr_456",
      "adminEmail": "admin@villacare.com",
      "targetType": "CLEANER",
      "targetId": "cln_789",
      "details": { "cleanerName": "Clara" },
      "createdAt": "2024-01-09T12:00:00Z"
    }
  ]
}
```

---

### POST /api/admin/email

Send email to user.

**Request:**
```json
{
  "to": "user@example.com",
  "subject": "Welcome to VillaCare",
  "body": "Hello..."
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_123"
}
```

---

### POST /api/admin/test-whatsapp

Send test WhatsApp message (development/testing).

**Request:**
```json
{
  "phone": "+34612345678",
  "message": "Test message"
}
```

**Response:**
```json
{
  "success": true,
  "sid": "SM123..."
}
```

---

## Admin Settings Endpoints

### GET /api/admin/settings

Get platform settings.

**Response:**
```json
{
  "teamLeaderHoursRequired": 50,
  "teamLeaderRatingRequired": 5.0
}
```

---

### PATCH /api/admin/settings

Update platform settings.

**Request Body:**
```json
{
  "teamLeaderHoursRequired": 40,
  "teamLeaderRatingRequired": 4.5
}
```

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "error": "Error message here"
}
```

**Common Status Codes:**
| Code | Meaning |
|------|---------|
| 400 | Bad request (validation failed) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (wrong role) |
| 404 | Not found |
| 500 | Server error |

---

## Rate Limiting

**Implemented:**
- OTP requests: 5 per minute per phone/IP
- API endpoints: Serverless-compatible rate limiting via `RateLimitEntry` table
- Cleanup: Expired entries cleaned daily via cron

**Per-endpoint limits:**
| Endpoint | Limit |
|----------|-------|
| `/api/auth/otp` | 5/min per phone |
| `/api/ai/*` | 20/min per user |
| `/api/messages` | 30/min per user |

---

## Pagination

Endpoints returning lists support pagination (planned):

```
GET /api/admin/bookings?page=1&limit=20
```

Response includes:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 187,
    "pages": 10
  }
}
```
