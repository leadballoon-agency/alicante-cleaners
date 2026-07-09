import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { checkRateLimit, getClientIdentifier, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit'
import { createBookingCore, resolveServicePrice, BookingCreationError, SERVICE_DEFINITIONS } from '@/lib/bookings/create-booking'
import { z } from 'zod'

// Zod schema for booking validation
const bookingSchema = z.object({
  cleanerSlug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Invalid cleaner slug'),
  propertyAddress: z.string().min(5).max(500),
  bedrooms: z.number().min(1).max(20).optional(),
  specialInstructions: z.string().max(2000).optional().nullable(),
  serviceType: z.string().min(1).max(100), // Service type only - price calculated server-side
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  time: z.string().regex(/^\d{1,2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  guestPhone: z.string().max(20).optional().nullable(),
  guestEmail: z.string().email().max(255).optional().nullable(),
  guestName: z.string().max(100).optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const clientId = getClientIdentifier(request)
    const rateLimit = await checkRateLimit(clientId, 'booking', RATE_LIMITS.booking)

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many booking requests. Please try again later.' },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      )
    }

    const body = await request.json()

    // Validate input with Zod
    const parseResult = bookingSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const {
      cleanerSlug,
      propertyAddress,
      bedrooms,
      specialInstructions,
      serviceType,
      date,
      time,
      guestPhone,
      guestEmail,
      guestName,
    } = parseResult.data

    // Find the cleaner with their hourly rate
    const cleaner = await db.cleaner.findUnique({
      where: { slug: cleanerSlug },
      include: {
        user: { select: { name: true, phone: true } },
      },
    })

    if (!cleaner || cleaner.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cleaner not found or not active' },
        { status: 404 }
      )
    }

    // Server-side pricing authority - calculate from cleaner's hourly rate.
    // Validate up front (before any owner/property writes) same as before the refactor.
    try {
      resolveServicePrice(cleaner.hourlyRate, serviceType)
    } catch {
      return NextResponse.json(
        { error: 'Invalid service type', validTypes: Object.keys(SERVICE_DEFINITIONS) },
        { status: 400 }
      )
    }

    // Check if user is logged in
    const session = await getServerSession(authOptions)

    // Resolve WHO the booking is for: find-or-create the Owner + Property.
    // This is the only part that differs between callers of createBookingCore
    // (guest vs. session), so it stays here rather than in the shared core.
    const resolved = await db.$transaction(async (tx) => {
      let ownerId: string
      let propertyId: string
      let nurturingInfo: { ownerId: string; userId: string; email: string | null; phone: string | null } | null = null

      if (session?.user?.id) {
        // Logged in user - find or create their owner profile
        let owner = await tx.owner.findUnique({
          where: { userId: session.user.id },
        })

        if (!owner) {
          owner = await tx.owner.create({
            data: {
              userId: session.user.id,
              referralCode: generateReferralCode(session.user.name || 'USER'),
              trusted: false,
            },
          })
          // Track for nurturing
          nurturingInfo = { ownerId: owner.id, userId: session.user.id, email: session.user.email || null, phone: null }
        }
        ownerId = owner.id

        // Find or create property for this owner
        let property = await tx.property.findFirst({
          where: {
            ownerId: owner.id,
            address: propertyAddress,
          },
        })

        if (!property) {
          property = await tx.property.create({
            data: {
              ownerId: owner.id,
              name: `Property at ${propertyAddress.split(',')[0]}`,
              address: propertyAddress,
              bedrooms: bedrooms || 2,
              bathrooms: 1,
              notes: specialInstructions || null,
            },
          })
        }
        propertyId = property.id
      } else {
        // Guest booking - create user, owner, and property
        if (!guestEmail) {
          throw new Error('Email is required for guest bookings')
        }

        // Find or create user
        let user = await tx.user.findUnique({
          where: { email: guestEmail },
        })

        if (!user) {
          user = await tx.user.create({
            data: {
              email: guestEmail,
              name: guestName || null,
              phone: guestPhone || null,
              role: 'OWNER',
            },
          })
        }

        // Find or create owner profile
        let owner = await tx.owner.findUnique({
          where: { userId: user.id },
        })

        if (!owner) {
          owner = await tx.owner.create({
            data: {
              userId: user.id,
              referralCode: generateReferralCode(user.name || 'USER'),
              trusted: false,
            },
          })
          // Track for nurturing
          nurturingInfo = { ownerId: owner.id, userId: user.id, email: guestEmail, phone: guestPhone || null }
        }
        ownerId = owner.id

        // Create property
        const property = await tx.property.create({
          data: {
            ownerId: owner.id,
            name: `Property at ${propertyAddress.split(',')[0]}`,
            address: propertyAddress,
            bedrooms: bedrooms || 2,
            bathrooms: 1,
            notes: specialInstructions || null,
          },
        })
        propertyId = property.id
      }

      return { ownerId, propertyId, nurturingInfo }
    })

    const { ownerId, propertyId, nurturingInfo } = resolved

    // Create the booking + fire the full notification chain (shared with the
    // session-aware AI assistant's create_booking tool - see lib/bookings/create-booking.ts)
    const { booking } = await createBookingCore({
      cleaner,
      ownerId,
      propertyId,
      propertyAddress,
      serviceType,
      date,
      time,
      notes: specialInstructions,
      nurturingInfo,
      guestName,
      guestEmail,
      guestPhone,
      sessionEmail: session?.user?.email,
    })

    return NextResponse.json({
      success: true,
      booking,
      message: 'Booking created successfully. The cleaner will confirm shortly.',
    })
  } catch (error) {
    console.error('Error creating booking:', error)

    if (error instanceof BookingCreationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message === 'Email is required for guest bookings') {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

function generateReferralCode(name: string): string {
  const cleanName = name.split(' ')[0].toUpperCase().slice(0, 4).replace(/[^A-Z]/g, 'X')
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${cleanName}${year}${random}`
}
