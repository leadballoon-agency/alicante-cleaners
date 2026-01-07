import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationCode, sendVerificationCodeWithFallback, verifyCode, normalizePhone } from '@/lib/otp'
import { checkRateLimitStrict, getClientIdentifier, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'

// Zod schemas for input validation
const sendOtpSchema = z.object({
  phone: z.string().min(9).max(20),
  action: z.literal('send'),
  channel: z.enum(['sms', 'whatsapp']).optional(), // If not specified, uses SMS (works immediately)
  forceWhatsapp: z.boolean().optional().default(false), // For "Try WhatsApp" button (optional)
})

const verifyOtpSchema = z.object({
  phone: z.string().min(9).max(20),
  action: z.literal('verify'),
  code: z.string().length(6).regex(/^\d{6}$/, 'Code must be 6 digits'),
})

// POST /api/auth/otp - Send or verify OTP
export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP (STRICT: fail-closed to prevent brute-force)
    const clientId = getClientIdentifier(request)
    const rateLimit = await checkRateLimitStrict(clientId, 'otp', RATE_LIMITS.otp)

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      )
    }

    const body = await request.json()
    const { action } = body

    if (action === 'send') {
      // Validate send request
      const parseResult = sendOtpSchema.safeParse(body)
      if (!parseResult.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      const { phone, channel, forceWhatsapp } = parseResult.data
      const normalizedPhone = normalizePhone(phone)

      // Send OTP via Twilio Verify
      let result

      if (forceWhatsapp) {
        // User explicitly requested WhatsApp (optional, may fail if not configured)
        result = await sendVerificationCode(normalizedPhone, 'whatsapp')
      } else if (channel) {
        // Explicit channel specified
        result = await sendVerificationCode(normalizedPhone, channel)
      } else {
        // Default: SMS (works immediately, no WhatsApp template approvals needed)
        result = await sendVerificationCodeWithFallback(normalizedPhone)
      }

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to send verification code' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Verification code sent via ${result.channel}`,
        channel: result.channel,
        phone: normalizedPhone,
      })
    }

    if (action === 'verify') {
      // Validate verify request
      const parseResult = verifyOtpSchema.safeParse(body)
      if (!parseResult.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
          { status: 400 }
        )
      }

      const { phone, code } = parseResult.data
      const normalizedPhone = normalizePhone(phone)

      // Verify OTP via Twilio Verify
      const result = await verifyCode(normalizedPhone, code)

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Verification failed' },
          { status: 500 }
        )
      }

      if (!result.valid) {
        return NextResponse.json(
          { error: result.error || 'Invalid verification code' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        verified: true,
        phone: normalizedPhone,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "send" or "verify".' },
      { status: 400 }
    )
  } catch (error) {
    console.error('OTP error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
