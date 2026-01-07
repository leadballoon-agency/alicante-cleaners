import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifyCleanerNewBooking, sendBookingConfirmation } from '@/lib/whatsapp'
import { checkRateLimit, getClientIdentifier, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'

// Service definitions with hours - server is source of truth
const SERVICE_DEFINITIONS: Record<string, { hours: number; name: string }> = {
  'Regular Clean': { hours: 3, name: 'Regular Clean' },
  'Deep Clean': { hours: 5, name: 'Deep Clean' },
  'Arrival Prep': { hours: 4, name: 'Arrival Prep' },
}

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

// Generate a unique 4-digit short code for WhatsApp reference
async function generateShortCode(): Promise<string> {
  const maxAttempts = 10
  for (let i = 0; i < maxAttempts; i++) {
    // Generate 4-digit code (1000-9999)
    const code = Math.floor(1000 + Math.random() * 9000).toString()

    // Check if already exists
    const existing = await db.booking.findFirst({
      where: { shortCode: code },
    })

    if (!existing) {
      return code
    }
  }
  // Fallback to longer code if all attempts fail
  return Math.floor(100000 + Math.random() * 900000).toString()
}

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

    // Server-side pricing authority - calculate from cleaner's hourly rate
    const serviceDef = SERVICE_DEFINITIONS[serviceType]
    if (!serviceDef) {
      return NextResponse.json(
        { error: 'Invalid service type', validTypes: Object.keys(SERVICE_DEFINITIONS) },
        { status: 400 }
      )
    }

    const hours = serviceDef.hours
    const price = Number(cleaner.hourlyRate) * hours

    // Check if user is logged in
    const session = await getServerSession(authOptions)

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

      let ownerId: string
      let propertyId: string

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

      // Generate unique short code for WhatsApp reference
      const shortCode = await generateShortCode()

      // Create the booking
      const booking = await tx.booking.create({
        data: {
          cleanerId: cleaner.id,
          ownerId,
          propertyId,
          service: serviceType,
          price, // Server-calculated price
          hours, // Server-defined hours
          shortCode, // For WhatsApp reference
          date: new Date(date),
          time,
          notes: specialInstructions || null,
          status: 'PENDING',
        },
        include: {
          property: true,
        },
      })

      // Get owner for notifications
      const owner = await tx.owner.findUnique({
        where: { id: ownerId },
        include: { user: { select: { name: true, phone: true } } },
      })

      return { booking, owner, ownerId }
    })

    const { booking, owner } = result

    // Format date for notifications
    const formattedDate = new Date(date).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    // Send WhatsApp notification to cleaner (outside transaction)
    const cleanerPhone = cleaner.user.phone
    if (cleanerPhone) {
      notifyCleanerNewBooking(cleanerPhone, {
        ownerName: owner?.user.name || guestName || 'Villa Owner',
        date: formattedDate,
        time,
        address: propertyAddress,
        service: serviceType,
        price: `€${price}`,
        shortCode: booking.shortCode || undefined,
      }).catch((err) => console.error('Failed to notify cleaner:', err))
    }

    // Send WhatsApp confirmation to owner (if they have a phone)
    const ownerPhone = guestPhone || (session?.user as { phone?: string })?.phone
    if (ownerPhone) {
      sendBookingConfirmation(ownerPhone, {
        cleanerName: cleaner.user.name || 'Your cleaner',
        date: formattedDate,
        time,
        address: propertyAddress,
        service: serviceType,
        price: `€${price}`,
      }).catch((err) => console.error('Failed to confirm to owner:', err))
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        shortCode: booking.shortCode,
        status: booking.status,
        service: booking.service,
        price: Number(booking.price),
        hours: booking.hours,
        date: booking.date,
        time: booking.time,
        cleaner: {
          name: cleaner.user.name,
          phone: cleaner.user.phone,
        },
        property: {
          name: booking.property.name,
          address: booking.property.address,
        },
      },
      message: 'Booking created successfully. The cleaner will confirm shortly.',
    })
  } catch (error) {
    console.error('Error creating booking:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message === 'Email is required for guest bookings') {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      if (error.message === 'Cleaner is no longer available') {
        return NextResponse.json(
          { error: 'This cleaner is no longer available. Please try another cleaner.' },
          { status: 409 }
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
