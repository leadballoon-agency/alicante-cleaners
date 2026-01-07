import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendVerificationCode, verifyCode, normalizePhone } from '@/lib/otp'

// POST /api/dashboard/cleaner/phone - Request phone change (sends OTP to current phone)
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user with current phone
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true },
    })

    if (!user?.phone) {
      return NextResponse.json(
        { error: 'No phone number on file. Please contact support.' },
        { status: 400 }
      )
    }

    // Send OTP to current phone
    const result = await sendVerificationCode(user.phone, 'sms')

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send verification code' },
        { status: 500 }
      )
    }

    // Mask phone for display (show last 4 digits only)
    const maskedPhone = user.phone.replace(/.(?=.{4})/g, '*')

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your current phone',
      maskedPhone,
    })
  } catch (error) {
    console.error('Error initiating phone change:', error)
    return NextResponse.json(
      { error: 'Failed to initiate phone change' },
      { status: 500 }
    )
  }
}

// PATCH /api/dashboard/cleaner/phone - Verify OTP and update phone
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code, newPhone } = await request.json()

    if (!code || typeof code !== 'string' || !code.match(/^\d{6}$/)) {
      return NextResponse.json(
        { error: 'Invalid verification code format' },
        { status: 400 }
      )
    }

    if (!newPhone || typeof newPhone !== 'string') {
      return NextResponse.json(
        { error: 'New phone number is required' },
        { status: 400 }
      )
    }

    // Normalize the new phone number
    const normalizedNewPhone = normalizePhone(newPhone)

    if (!normalizedNewPhone.match(/^\+\d{10,15}$/)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Include country code (e.g., +34612345678)' },
        { status: 400 }
      )
    }

    // Get user with current phone
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true },
    })

    if (!user?.phone) {
      return NextResponse.json(
        { error: 'No phone number on file' },
        { status: 400 }
      )
    }

    // Check if new phone is same as current
    if (normalizedNewPhone === user.phone) {
      return NextResponse.json(
        { error: 'New phone number is the same as current' },
        { status: 400 }
      )
    }

    // Check if new phone is already in use by another user
    const existingUser = await db.user.findFirst({
      where: {
        phone: normalizedNewPhone,
        id: { not: session.user.id },
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'This phone number is already registered to another account' },
        { status: 400 }
      )
    }

    // Verify OTP against current phone
    const verifyResult = await verifyCode(user.phone, code)

    if (!verifyResult.success || !verifyResult.valid) {
      return NextResponse.json(
        { error: verifyResult.error || 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Update phone number
    await db.user.update({
      where: { id: session.user.id },
      data: { phone: normalizedNewPhone },
    })

    return NextResponse.json({
      success: true,
      message: 'Phone number updated successfully',
      phone: normalizedNewPhone,
    })
  } catch (error) {
    console.error('Error updating phone:', error)
    return NextResponse.json(
      { error: 'Failed to update phone number' },
      { status: 500 }
    )
  }
}
