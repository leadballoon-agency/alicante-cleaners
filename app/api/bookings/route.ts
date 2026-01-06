import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifyCleanerNewBooking, sendBookingConfirmation } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      cleanerSlug,
      propertyAddress,
      bedrooms,
      specialInstructions,
      service,
      date,
      time,
      guestPhone,
      guestEmail,
      guestName,
    } = body

    // Validate required fields
    if (!cleanerSlug || !propertyAddress || !service || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find the cleaner
    const cleaner = await db.cleaner.findUnique({
      where: { slug: cleanerSlug },
    })

    if (!cleaner || cleaner.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cleaner not found or not active' },
        { status: 404 }
      )
    }

    // Check if user is logged in
    const session = await getServerSession(authOptions)
    let ownerId: string
    let propertyId: string

    if (session?.user?.id) {
      // Logged in user - find or create their owner profile
      let owner = await db.owner.findUnique({
        where: { userId: session.user.id },
      })

      if (!owner) {
        // Create owner profile for this user
        owner = await db.owner.create({
          data: {
            userId: session.user.id,
            referralCode: generateReferralCode(session.user.name || 'USER'),
            trusted: false,
          },
        })
      }
      ownerId = owner.id

      // Find or create property for this owner
      let property = await db.property.findFirst({
        where: {
          ownerId: owner.id,
          address: propertyAddress,
        },
      })

      if (!property) {
        property = await db.property.create({
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
        return NextResponse.json(
          { error: 'Email is required for guest bookings' },
          { status: 400 }
        )
      }

      // Check if user already exists
      let user = await db.user.findUnique({
        where: { email: guestEmail },
      })

      if (!user) {
        // Create new user
        user = await db.user.create({
          data: {
            email: guestEmail,
            name: guestName || null,
            phone: guestPhone || null,
            role: 'OWNER',
          },
        })
      }

      // Find or create owner profile
      let owner = await db.owner.findUnique({
        where: { userId: user.id },
      })

      if (!owner) {
        owner = await db.owner.create({
          data: {
            userId: user.id,
            referralCode: generateReferralCode(user.name || 'USER'),
            trusted: false,
          },
        })
      }
      ownerId = owner.id

      // Create property
      const property = await db.property.create({
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

    // Create the booking
    const booking = await db.booking.create({
      data: {
        cleanerId: cleaner.id,
        ownerId,
        propertyId,
        service: service.type,
        price: service.price,
        hours: service.hours,
        date: new Date(date),
        time,
        notes: specialInstructions || null,
        status: 'PENDING',
      },
      include: {
        cleaner: {
          include: {
            user: {
              select: { name: true, phone: true },
            },
          },
        },
        property: true,
      },
    })

    // Format date for notifications
    const formattedDate = new Date(date).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    // Send WhatsApp notification to cleaner
    const cleanerPhone = booking.cleaner.user.phone
    if (cleanerPhone) {
      // Get owner details for the notification
      const owner = await db.owner.findUnique({
        where: { id: ownerId },
        include: { user: { select: { name: true, phone: true } } },
      })

      notifyCleanerNewBooking(cleanerPhone, {
        ownerName: owner?.user.name || guestName || 'Villa Owner',
        date: formattedDate,
        time,
        address: propertyAddress,
        service: service.type,
        price: `€${service.price}`,
      }).catch((err) => console.error('Failed to notify cleaner:', err))
    }

    // Send WhatsApp confirmation to owner (if they have a phone)
    const ownerPhone = guestPhone || (session?.user as { phone?: string })?.phone
    if (ownerPhone) {
      sendBookingConfirmation(ownerPhone, {
        cleanerName: booking.cleaner.user.name || 'Your cleaner',
        date: formattedDate,
        time,
        address: propertyAddress,
        service: service.type,
        price: `€${service.price}`,
      }).catch((err) => console.error('Failed to confirm to owner:', err))
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        service: booking.service,
        price: Number(booking.price),
        date: booking.date,
        time: booking.time,
        cleaner: {
          name: booking.cleaner.user.name,
          phone: booking.cleaner.user.phone,
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
