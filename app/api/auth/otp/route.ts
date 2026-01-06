import { NextRequest, NextResponse } from 'next/server'
import { sendOTP } from '@/lib/whatsapp'

// In-memory store for OTP codes (in production, use Redis or database)
const otpStore = new Map<string, { code: string; expires: Date }>()

// Normalize phone number to E.164 format
function normalizePhone(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')

  // Handle Spanish numbers (starting with 6 or 7, or +34)
  if (cleaned.startsWith('34')) {
    cleaned = '+' + cleaned
  } else if (cleaned.match(/^[67]\d{8}$/)) {
    cleaned = '+34' + cleaned
  }

  // Handle UK numbers (starting with 07 or +44)
  if (cleaned.startsWith('07') && cleaned.length === 11) {
    cleaned = '+44' + cleaned.slice(1)
  } else if (cleaned.startsWith('44')) {
    cleaned = '+' + cleaned
  }

  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned
  }

  return cleaned
}

// POST /api/auth/otp - Send OTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, action, code } = body

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhone(phone)

    if (action === 'send') {
      // Generate 4-digit code
      const otpCode = Math.floor(1000 + Math.random() * 9000).toString()

      // Store code with 10-minute expiry
      otpStore.set(normalizedPhone, {
        code: otpCode,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      })

      // Send OTP via WhatsApp
      const result = await sendOTP(normalizedPhone, otpCode)

      if (!result.success) {
        console.error('Failed to send WhatsApp OTP:', result.error)
        // Fall back to console log in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`OTP for ${normalizedPhone}: ${otpCode}`)
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Verification code sent via WhatsApp',
        // Include code in development for testing (fallback)
        ...(process.env.NODE_ENV === 'development' && !result.success && { code: otpCode }),
      })
    }

    if (action === 'verify') {
      if (!code) {
        return NextResponse.json(
          { error: 'Verification code is required' },
          { status: 400 }
        )
      }

      // Check for test code (always works in development)
      if (process.env.NODE_ENV === 'development' && (code === '1234' || code === '123456')) {
        return NextResponse.json({
          success: true,
          verified: true,
        })
      }

      // Check stored code
      const storedOtp = otpStore.get(normalizedPhone)

      if (!storedOtp) {
        return NextResponse.json(
          { error: 'No verification code found. Please request a new one.' },
          { status: 400 }
        )
      }

      if (new Date() > storedOtp.expires) {
        otpStore.delete(normalizedPhone)
        return NextResponse.json(
          { error: 'Verification code has expired. Please request a new one.' },
          { status: 400 }
        )
      }

      if (storedOtp.code !== code) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 400 }
        )
      }

      // Code is valid - clean up
      otpStore.delete(normalizedPhone)

      return NextResponse.json({
        success: true,
        verified: true,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
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
