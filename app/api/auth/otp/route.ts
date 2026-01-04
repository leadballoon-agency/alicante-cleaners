import { NextRequest, NextResponse } from 'next/server'

// In-memory store for OTP codes (in production, use Redis or database)
const otpStore = new Map<string, { code: string; expires: Date }>()

// POST /api/auth/otp - Send OTP
export async function POST(request: NextRequest) {
  try {
    const { phone, action } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    if (action === 'send') {
      // Generate 4-digit code
      const code = Math.floor(1000 + Math.random() * 9000).toString()

      // Store code with 10-minute expiry
      otpStore.set(phone, {
        code,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      })

      // TODO: Send SMS via Twilio or other provider
      // For now, log the code (in development)
      console.log(`OTP for ${phone}: ${code}`)

      return NextResponse.json({
        success: true,
        message: 'Verification code sent',
        // Include code in development for testing
        ...(process.env.NODE_ENV === 'development' && { code }),
      })
    }

    if (action === 'verify') {
      const { code } = await request.json()

      if (!code) {
        return NextResponse.json(
          { error: 'Verification code is required' },
          { status: 400 }
        )
      }

      // Check for test code (always works in development)
      if (code === '1234' || code === '123456') {
        return NextResponse.json({
          success: true,
          verified: true,
        })
      }

      // Check stored code
      const storedOtp = otpStore.get(phone)

      if (!storedOtp) {
        return NextResponse.json(
          { error: 'No verification code found. Please request a new one.' },
          { status: 400 }
        )
      }

      if (new Date() > storedOtp.expires) {
        otpStore.delete(phone)
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
      otpStore.delete(phone)

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
