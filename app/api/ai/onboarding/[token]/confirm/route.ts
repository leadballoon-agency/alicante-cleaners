/**
 * Confirm Onboarding and Create Account
 *
 * POST /api/ai/onboarding/[token]/confirm
 *
 * Creates user account, owner profile, property, and PENDING booking.
 * Signs the user in automatically.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { onBookingCreated } from '@/lib/notifications/booking-notifications'
import { encryptAccessNotes } from '@/lib/encryption'
import { triggerWelcomeEmail } from '@/lib/nurturing/send-email'
import { linkChatConversations } from '@/lib/nurturing/link-conversations'

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { email, propertyName, accessNotes } = await request.json()

    if (!email || !propertyName) {
      return NextResponse.json(
        { error: 'Email and property name are required' },
        { status: 400 }
      )
    }

    // Get onboarding
    const onboarding = await db.pendingOnboarding.findUnique({
      where: { token },
      include: {
        cleaner: {
          include: { user: { select: { name: true } } },
        },
      },
    })

    if (!onboarding) {
      return NextResponse.json(
        { error: 'Onboarding not found' },
        { status: 404 }
      )
    }

    if (onboarding.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Onboarding already completed or expired' },
        { status: 400 }
      )
    }

    if (new Date() > onboarding.expiresAt) {
      await db.pendingOnboarding.update({
        where: { id: onboarding.id },
        data: { status: 'EXPIRED' },
      })
      return NextResponse.json(
        { error: 'Onboarding link expired' },
        { status: 400 }
      )
    }

    // Check if user already exists
    let user = await db.user.findUnique({
      where: { email },
      include: { owner: true },
    })

    let owner = user?.owner
    let isNewUser = false
    let isNewOwner = false

    if (!user) {
      // Create new user
      isNewUser = true
      isNewOwner = true
      user = await db.user.create({
        data: {
          name: onboarding.visitorName,
          email,
          phone: onboarding.visitorPhone,
          role: 'OWNER',
          emailVerified: new Date(), // Auto-verify since they clicked magic link
          phoneVerified: new Date(),
        },
        include: { owner: true },
      })

      // Create owner profile
      owner = await db.owner.create({
        data: {
          userId: user.id,
          referralCode: generateReferralCode(),
        },
      })
    } else if (!owner) {
      // User exists but no owner profile
      isNewOwner = true
      owner = await db.owner.create({
        data: {
          userId: user.id,
          referralCode: generateReferralCode(),
        },
      })
    }

    // Build property address from access notes or use placeholder
    const propertyAddress = onboarding.address || 'Address to be provided'

    // Encrypt access notes if provided (from secure form, not from chat)
    const encryptedNotes = accessNotes ? encryptAccessNotes(accessNotes) : null

    // Create property with encrypted access notes
    const property = await db.property.create({
      data: {
        ownerId: owner.id,
        name: propertyName,
        address: propertyAddress,
        bedrooms: onboarding.bedrooms,
        bathrooms: onboarding.bathrooms,
        notes: encryptedNotes, // Encrypted for security
      },
    })

    // Create PENDING booking (cleaner must confirm)
    // NOTE: Booking notes do NOT contain access details - those are in Property.notes (encrypted)
    const booking = await db.booking.create({
      data: {
        cleanerId: onboarding.cleanerId,
        ownerId: owner.id,
        propertyId: property.id,
        status: 'PENDING', // Cleaner must confirm
        service: onboarding.serviceType,
        price: onboarding.servicePrice,
        hours: onboarding.serviceHours,
        date: onboarding.preferredDate,
        time: onboarding.preferredTime,
        notes: `Property: ${onboarding.bedrooms} bed, ${onboarding.bathrooms} bath. Outdoor: ${onboarding.outdoorAreas.join(', ') || 'None'}.`,
        createdByAI: true,
      },
    })

    // Update onboarding as completed
    await db.pendingOnboarding.update({
      where: { id: onboarding.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        userId: user.id,
        ownerId: owner.id,
        propertyId: property.id,
        bookingId: booking.id,
      },
    })

    // Create notification for cleaner (async - don't block response)
    onBookingCreated({
      id: booking.id,
      cleanerId: onboarding.cleanerId,
      ownerName: onboarding.visitorName,
      propertyName: propertyName,
      service: onboarding.serviceType,
      date: onboarding.preferredDate,
      time: onboarding.preferredTime,
      price: Number(onboarding.servicePrice),
    }).catch(err => console.error('Failed to create booking notification:', err))

    // Create a session for the user (auto sign-in)
    const sessionToken = crypto.randomUUID()
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await db.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires,
      },
    })

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('next-auth.session-token', sessionToken, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    // Trigger welcome email and link chat conversations for new owner
    if (isNewOwner) {
      triggerWelcomeEmail(owner.id).catch(console.error)
      linkChatConversations(user.id, email, onboarding.visitorPhone).catch(console.error)
    }

    return NextResponse.json({
      success: true,
      isNewUser,
      userId: user.id,
      ownerId: owner.id,
      propertyId: property.id,
      bookingId: booking.id,
      cleanerName: onboarding.cleaner.user.name,
    })
  } catch (error) {
    console.error('Onboarding confirmation error:', error)
    return NextResponse.json(
      { error: 'Failed to confirm onboarding' },
      { status: 500 }
    )
  }
}
