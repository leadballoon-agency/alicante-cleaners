import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendBookingConfirmation } from '@/lib/whatsapp'

// GET /api/admin/bookings - Get all bookings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const bookings = await db.booking.findMany({
      include: {
        cleaner: {
          include: {
            user: {
              select: { name: true, phone: true },
            },
          },
        },
        owner: {
          include: {
            user: {
              select: { name: true, email: true, phone: true },
            },
          },
        },
        property: {
          select: { name: true, address: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 bookings
    })

    const formattedBookings = bookings.map(b => ({
      id: b.id,
      status: b.status.toLowerCase() as 'pending' | 'confirmed' | 'completed' | 'cancelled',
      service: b.service,
      price: Number(b.price),
      date: b.date,
      cleaner: {
        id: b.cleaner.id,
        name: b.cleaner.user.name || 'Unknown',
        phone: b.cleaner.user.phone || null,
      },
      owner: {
        name: b.owner.user.name || 'Unknown',
        email: b.owner.user.email || '',
        phone: b.owner.user.phone || null,
      },
      property: b.property.name || b.property.address,
      createdAt: b.createdAt,
    }))

    return NextResponse.json({ bookings: formattedBookings })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/bookings - Update booking status (accept/decline)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { bookingId, action } = await request.json()

    if (!bookingId || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request. Provide bookingId and action (accept/decline)' },
        { status: 400 }
      )
    }

    // Get the booking with related data
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        cleaner: {
          include: { user: { select: { name: true, phone: true } } },
        },
        owner: {
          include: { user: { select: { name: true, phone: true } } },
        },
        property: { select: { address: true } },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (booking.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Booking is not pending' },
        { status: 400 }
      )
    }

    const newStatus = action === 'accept' ? 'CONFIRMED' : 'CANCELLED'

    // Update the booking
    const updated = await db.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
    })

    // If accepted, send confirmation to owner via WhatsApp
    if (action === 'accept' && booking.owner.user.phone) {
      const formattedDate = new Date(booking.date).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })

      sendBookingConfirmation(booking.owner.user.phone, {
        cleanerName: booking.cleaner.user.name || 'Your cleaner',
        date: formattedDate,
        time: booking.time,
        address: booking.property.address,
        service: booking.service,
        price: `€${Number(booking.price)}`,
      }).catch((err) => console.error('Failed to send confirmation:', err))
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: updated.id,
        status: updated.status.toLowerCase(),
      },
      message: action === 'accept' ? 'Booking confirmed' : 'Booking declined',
    })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}
