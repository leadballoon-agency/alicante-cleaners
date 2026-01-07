# VillaCare Code Review Package - Round 3

This is a follow-up to your Round 2 review. We've implemented all your recommendations including OTP with Twilio Verify and rate limiting.

## Summary of Implemented Fixes (All Complete)

| Issue | Status | Implementation |
|-------|--------|----------------|
| Twilio URL reconstruction | ✅ FIXED | Uses `x-forwarded-proto` + `host` headers with fallback |
| Webhook idempotency | ✅ FIXED | Insert-first pattern with unique constraint catch (P2002) |
| Phone matching (E.164) | ✅ FIXED | Exact match with normalization |
| Booking reference codes | ✅ FIXED | 4-digit `shortCode` on bookings, supports `ACCEPT 1234` |
| Booking transaction | ✅ FIXED | All creates wrapped in `db.$transaction()` |
| Re-check cleaner ACTIVE | ✅ FIXED | Fresh check inside transaction |
| Server-side pricing | ✅ FIXED | Price calculated from `cleaner.hourlyRate × serviceDef.hours` |
| Zod validation | ✅ FIXED | Booking, messages, and OTP APIs validated |
| OTP Implementation | ✅ FIXED | Twilio Verify service (6-digit codes) |
| Rate Limiting | ✅ FIXED | Database-backed rate limiter for serverless |

---

## 1. Twilio Webhook Handler (UPDATED - Insert-First Pattern)

**File:** `app/api/webhooks/twilio/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import twilio from 'twilio'

// Reconstruct the public URL that Twilio signed (Vercel serverless fix)
function getTwilioSignedUrl(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  // Fallback to URL host if header missing (rare but possible)
  const host = req.headers.get('host') ?? new URL(req.url).host
  const pathname = new URL(req.url).pathname
  return `${proto}://${host}${pathname}`
}

// Validate Twilio webhook signature
function validateTwilioSignature(request: NextRequest, body: string): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!authToken) {
    console.error('TWILIO_AUTH_TOKEN not configured - cannot validate webhooks')
    return false
  }

  const signature = request.headers.get('x-twilio-signature')

  if (!signature) {
    console.error('Missing X-Twilio-Signature header')
    return false
  }

  // Use reconstructed public URL, not internal request.url
  const url = getTwilioSignedUrl(request)

  // Parse form data into params object for validation
  const params: Record<string, string> = {}
  const searchParams = new URLSearchParams(body)
  searchParams.forEach((value, key) => {
    params[key] = value
  })

  // Validate using Twilio's helper
  const isValid = twilio.validateRequest(authToken, signature, url, params)

  if (!isValid) {
    console.error('Invalid Twilio signature - request may be spoofed', { url })
  }

  return isValid
}

// Check if Prisma error is a unique constraint violation
function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  )
}

// Try to claim this webhook for processing (insert-first pattern)
// Returns true if we should process, false if already processed
async function claimWebhook(messageSid: string): Promise<boolean> {
  try {
    await db.webhookEvent.create({
      data: { messageSid, source: 'twilio' },
    })
    return true // We claimed it, proceed with processing
  } catch (error) {
    if (isUniqueViolation(error)) {
      // Already processed by another instance
      return false
    }
    throw error // Re-throw unexpected errors
  }
}

// Normalise phone to E.164 format for exact matching
function normalizePhone(phone: string): string {
  // Remove whatsapp: prefix if present
  let normalized = phone.replace('whatsapp:', '')
  // Ensure it starts with +
  if (!normalized.startsWith('+')) {
    normalized = '+' + normalized
  }
  return normalized
}

// Twilio sends webhooks as form-urlencoded
export async function POST(request: NextRequest) {
  try {
    // Read body for validation
    const bodyText = await request.text()

    // Validate webhook signature in production
    if (process.env.NODE_ENV === 'production') {
      if (!validateTwilioSignature(request, bodyText)) {
        console.error('Twilio webhook signature validation failed')
        return new NextResponse('Unauthorized', { status: 403 })
      }
    }

    // Parse form data from body text
    const formData = new URLSearchParams(bodyText)

    // Extract message details from Twilio webhook
    const from = formData.get('From') as string
    const body = (formData.get('Body') as string)?.trim().toUpperCase()
    const messageSid = formData.get('MessageSid') as string

    if (!from || !body || !messageSid) {
      return new NextResponse('OK', { status: 200 })
    }

    // Idempotency: try to claim this webhook (insert-first pattern)
    // If already claimed by another instance, skip processing
    const claimed = await claimWebhook(messageSid)
    if (!claimed) {
      console.log(`Webhook ${messageSid} already processed - skipping`)
      return new NextResponse('OK', { status: 200 })
    }

    // Normalise phone to E.164 for exact matching
    const phone = normalizePhone(from)

    // Find cleaner by exact phone match (E.164)
    const cleaner = await db.cleaner.findFirst({
      where: {
        user: {
          phone: phone, // Exact E.164 match
        },
      },
      include: {
        user: { select: { name: true } },
      },
    })

    // ... rest of handler with ACCEPT/DECLINE/HELP commands
  } catch (error) {
    console.error('Twilio webhook error:', error)
    return new NextResponse('OK', { status: 200 })
  }
}
```

---

## 2. OTP with Twilio Verify (NEW)

**File:** `lib/otp.ts`

```typescript
import Twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

const client = accountSid && authToken ? Twilio(accountSid, authToken) : null

/**
 * Send OTP code via Twilio Verify service
 */
export async function sendVerificationCode(
  phone: string,
  channel: 'sms' | 'whatsapp' = 'whatsapp'
): Promise<{ success: boolean; error?: string }> {
  // Development fallback - log code instead of sending
  if (process.env.NODE_ENV === 'development' && !client) {
    console.log(`[DEV] Would send OTP to ${phone} via ${channel}`)
    return { success: true }
  }

  if (!client || !verifyServiceSid) {
    console.error('Twilio Verify not configured')
    return { success: false, error: 'OTP service not configured' }
  }

  try {
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`

    await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: formattedPhone,
        channel,
      })

    return { success: true }
  } catch (error) {
    console.error('Failed to send OTP:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send verification code',
    }
  }
}

/**
 * Verify OTP code via Twilio Verify service
 */
export async function verifyCode(
  phone: string,
  code: string
): Promise<{ success: boolean; valid: boolean; error?: string }> {
  // Development mode - accept test code "000000"
  if (process.env.NODE_ENV === 'development') {
    if (code === '000000') {
      return { success: true, valid: true }
    }
    if (!client || !verifyServiceSid) {
      return { success: true, valid: false, error: 'Invalid code. Use 000000 in development.' }
    }
  }

  if (!client || !verifyServiceSid) {
    return { success: false, valid: false, error: 'OTP service not configured' }
  }

  try {
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`

    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: formattedPhone,
        code,
      })

    return { success: true, valid: verification.status === 'approved' }
  } catch (error) {
    // Handle specific Twilio errors
    if (error instanceof Error && error.message.includes('not found')) {
      return { success: true, valid: false, error: 'Code expired. Please request a new one.' }
    }
    if (error instanceof Error && error.message.includes('max check attempts')) {
      return { success: true, valid: false, error: 'Too many attempts. Please request a new code.' }
    }

    return { success: false, valid: false, error: 'Verification failed' }
  }
}
```

---

## 3. Rate Limiting (NEW)

**File:** `lib/rate-limit.ts`

```typescript
import { db } from './db'

type RateLimitConfig = {
  maxRequests: number  // Max requests per window
  windowMs: number     // Window size in milliseconds
}

// Default configs for different endpoint types
export const RATE_LIMITS = {
  otp: { maxRequests: 5, windowMs: 15 * 60 * 1000 },    // 5 per 15 minutes
  auth: { maxRequests: 10, windowMs: 15 * 60 * 1000 },  // 10 per 15 minutes
  booking: { maxRequests: 10, windowMs: 60 * 1000 },    // 10 per minute
  message: { maxRequests: 30, windowMs: 60 * 1000 },    // 30 per minute
  api: { maxRequests: 100, windowMs: 60 * 1000 },       // 100 per minute
} as const

type RateLimitResult = {
  success: boolean
  remaining: number
  reset: Date
  retryAfter?: number
}

/**
 * Check if a request is within rate limits
 * Uses database for state (works in serverless)
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - config.windowMs)
  const key = `${endpoint}:${identifier}`

  try {
    // Count requests in current window
    const requestCount = await db.rateLimitEntry.count({
      where: {
        key,
        createdAt: { gte: windowStart },
      },
    })

    if (requestCount >= config.maxRequests) {
      // Rate limited
      const oldestInWindow = await db.rateLimitEntry.findFirst({
        where: { key, createdAt: { gte: windowStart } },
        orderBy: { createdAt: 'asc' },
      })

      const resetTime = oldestInWindow
        ? new Date(oldestInWindow.createdAt.getTime() + config.windowMs)
        : new Date(now.getTime() + config.windowMs)

      return {
        success: false,
        remaining: 0,
        reset: resetTime,
        retryAfter: Math.ceil((resetTime.getTime() - now.getTime()) / 1000),
      }
    }

    // Record this request
    await db.rateLimitEntry.create({ data: { key } })

    // Clean up old entries (async, don't wait)
    cleanupOldEntries(key, windowStart).catch(console.error)

    return {
      success: true,
      remaining: config.maxRequests - requestCount - 1,
      reset: new Date(now.getTime() + config.windowMs),
    }
  } catch (error) {
    // If rate limiting fails, allow the request (fail open)
    console.error('Rate limit check failed:', error)
    return { success: true, remaining: config.maxRequests, reset: new Date() }
  }
}

async function cleanupOldEntries(key: string, windowStart: Date): Promise<void> {
  await db.rateLimitEntry.deleteMany({
    where: { key, createdAt: { lt: windowStart } },
  })
}

export function getClientIdentifier(request: Request): string {
  const headers = new Headers(request.headers)
  return headers.get('x-forwarded-for')?.split(',')[0].trim()
    || headers.get('x-real-ip')
    || headers.get('x-vercel-forwarded-for')?.split(',')[0].trim()
    || 'unknown'
}
```

**Usage in OTP endpoint:**

```typescript
// app/api/auth/otp/route.ts
export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const clientId = getClientIdentifier(request)
    const rateLimit = await checkRateLimit(clientId, 'otp', RATE_LIMITS.otp)

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      )
    }

    // ... rest of handler
  }
}
```

---

## 4. Booking API with Transaction & Re-check (UPDATED)

**File:** `app/api/bookings/route.ts`

```typescript
// Rate limiting added
const clientId = getClientIdentifier(request)
const rateLimit = await checkRateLimit(clientId, 'booking', RATE_LIMITS.booking)

if (!rateLimit.success) {
  return NextResponse.json(
    { error: 'Too many booking requests. Please try again later.' },
    { status: 429, headers: rateLimitHeaders(rateLimit) }
  )
}

// ... validation ...

// Use transaction for atomic creation
const result = await db.$transaction(async (tx) => {
  // Re-check cleaner is still ACTIVE inside transaction (race condition guard)
  const freshCleaner = await tx.cleaner.findUnique({
    where: { id: cleaner.id },
    select: { status: true },
  })

  if (!freshCleaner || freshCleaner.status !== 'ACTIVE') {
    throw new Error('Cleaner is no longer available')
  }

  // ... create owner, property, booking ...
})
```

---

## 5. Database Schema Additions

**File:** `prisma/schema.prisma`

```prisma
// Webhook idempotency
model WebhookEvent {
  id         String   @id @default(cuid())
  messageSid String   @unique // Twilio MessageSid for deduplication
  source     String   @default("twilio")
  processedAt DateTime @default(now())

  @@index([messageSid])
}

// Rate limiting
model RateLimitEntry {
  id        String   @id @default(cuid())
  key       String   // Format: "endpoint:identifier"
  createdAt DateTime @default(now())

  @@index([key, createdAt])
}

// Booking short codes
model Booking {
  // ... existing fields ...
  shortCode   String?       @unique // 4-digit reference for WhatsApp
}
```

---

## 6. Environment Variables Required

```env
# Twilio (WhatsApp + OTP)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_WHATSAPP_NUMBER="whatsapp:+447414265007"
TWILIO_VERIFY_SERVICE_SID="VA..."  # For phone OTP verification
```

---

## Questions for Review

1. **Rate limiting design**: Is database-backed rate limiting appropriate for our scale, or should we use Redis/Upstash?

2. **OTP channel**: We're defaulting to WhatsApp for OTP delivery. Should we fall back to SMS if WhatsApp fails?

3. **Cleanup strategy**: Rate limit entries are cleaned up lazily. Should we add a cron job for more aggressive cleanup?

4. **Test code in dev**: We allow "000000" in development mode. Is this acceptable or should we require Twilio even in dev?

Please identify any remaining security issues or improvements needed.
