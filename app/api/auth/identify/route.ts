import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { normalizePhone } from '@/lib/otp'
import { checkRateLimitStrict, getClientIdentifier, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit'

// POST /api/auth/identify
//
// First step of the unified login flow (app/login/page.tsx). The client
// sends whatever the user typed - phone or email - and this tells it which
// path to take next, WITHOUT creating anything and WITHOUT ever silently
// minting an account. That silent-creation bug is exactly what this replaces:
// previously an unrecognized email went straight into signIn('email', ...),
// which (via the signIn callback in lib/auth.ts) creates a brand-new OWNER
// account for literally any address, including cleaners' personal emails
// that just aren't on file yet.
//
// Deliberate tradeoff: this endpoint reveals whether an identifier has an
// account ({ exists: true/false }) to an unauthenticated caller. For a small
// local platform this is an acceptable enumeration risk - the mitigation is
// the strict per-IP rate limit below (10/hour), matching the otp endpoint's
// posture. It intentionally returns NOTHING else - no role, no name, no id,
// no email/phone echo - so the blast radius of the enumeration is limited to
// "does this identifier exist" and, for phones, "which OTP flow do they use".
const identifySchema = z.object({
  identifier: z.string().trim().min(3).max(254),
})

type IdentifyResponse = {
  exists: boolean
  method: 'phone' | 'email'
  loginProvider?: 'cleaner' | 'general'
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimit = await checkRateLimitStrict(clientId, 'identify', RATE_LIMITS.identify)

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      )
    }

    const body = await request.json()
    const parseResult = identifySchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { identifier } = parseResult.data
    const isEmail = identifier.includes('@')

    if (isEmail) {
      const normalizedEmail = identifier.toLowerCase()
      const user = await db.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      })

      const response: IdentifyResponse = { exists: !!user, method: 'email' }
      return NextResponse.json(response, { headers: rateLimitHeaders(rateLimit) })
    }

    // Phone path
    const normalizedPhone = normalizePhone(identifier)
    const user = await db.user.findUnique({
      where: { phone: normalizedPhone },
      select: { id: true, role: true },
    })

    if (!user) {
      const response: IdentifyResponse = { exists: false, method: 'phone' }
      return NextResponse.json(response, { headers: rateLimitHeaders(rateLimit) })
    }

    // Which credentials provider must verify this phone's OTP - Twilio Verify
    // codes are single-use, so the client has to pick the right provider
    // BEFORE calling signIn(), not retry with a second one after.
    const loginProvider: 'cleaner' | 'general' = user.role === 'CLEANER' ? 'cleaner' : 'general'
    const response: IdentifyResponse = { exists: true, method: 'phone', loginProvider }
    return NextResponse.json(response, { headers: rateLimitHeaders(rateLimit) })
  } catch (error) {
    console.error('Identify error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
