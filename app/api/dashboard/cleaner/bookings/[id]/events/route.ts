/**
 * Booking Events API
 *
 * POST /api/dashboard/cleaner/bookings/[id]/events
 *
 * Log events like running_late, on_my_way, completed with checklist
 * Also sends completion email to owner when type is COMPLETED
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { BookingEventType } from '@prisma/client'
import { sendCompletionEmail } from '@/lib/email'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: bookingId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get cleaner
    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        user: { select: { name: true } }
      }
    })

    if (!cleaner) {
      return NextResponse.json(
        { error: 'Cleaner profile not found' },
        { status: 404 }
      )
    }

    // Get booking with owner details
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        owner: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                preferredLanguage: true
              }
            }
          }
        },
        property: {
          select: {
            name: true,
            address: true
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verify cleaner has access to this booking (either assigned or team member)
    if (booking.cleanerId !== cleaner.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const { type, data } = await request.json()

    // Validate event type
    const validTypes: BookingEventType[] = [
      'RUNNING_LATE',
      'ON_MY_WAY',
      'ACCESS_HELP',
      'CUSTOM_MESSAGE',
      'COMPLETED'
    ]

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      )
    }

    // Create the event
    const event = await db.bookingEvent.create({
      data: {
        bookingId,
        cleanerId: cleaner.id,
        type,
        data: data || null,
        whatsappOpened: true
      }
    })

    // If completion event, send email to owner
    if (type === 'COMPLETED' && booking.owner.user.email) {
      const cleanerName = cleaner.user.name || 'Your cleaner'
      const ownerName = booking.owner.user.name || 'there'
      const propertyName = booking.property.name || booking.property.address.split(',')[0]
      const ownerLanguage = booking.owner.user.preferredLanguage || 'en'

      // Extract checklist from data
      const checklist = data?.checklist || {}

      await sendCompletionEmail({
        to: booking.owner.user.email,
        ownerName,
        cleanerName,
        propertyName,
        propertyAddress: booking.property.address,
        service: booking.service,
        date: booking.date.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        }),
        checklist,
        language: ownerLanguage,
        bookingId: booking.id
      })
    }

    return NextResponse.json({
      success: true,
      eventId: event.id
    })

  } catch (error) {
    console.error('Error logging booking event:', error)
    return NextResponse.json(
      { error: 'Failed to log event' },
      { status: 500 }
    )
  }
}
