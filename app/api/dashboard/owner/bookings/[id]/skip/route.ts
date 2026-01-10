import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// POST - Skip a specific recurring booking instance
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get the owner
    const owner = await db.owner.findFirst({
      where: { user: { email: session.user.email } },
    })

    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
    }

    // Get the booking
    const booking = await db.booking.findFirst({
      where: {
        id,
        ownerId: owner.id,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (!booking.isRecurring) {
      return NextResponse.json(
        { error: 'Can only skip recurring booking instances' },
        { status: 400 }
      )
    }

    if (booking.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only skip pending bookings' },
        { status: 400 }
      )
    }

    // Mark as skipped and cancel
    await db.booking.update({
      where: { id },
      data: {
        recurringSkipped: true,
        status: 'CANCELLED',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Booking instance skipped',
    })
  } catch (error) {
    console.error('Error skipping booking:', error)
    return NextResponse.json(
      { error: 'Failed to skip booking' },
      { status: 500 }
    )
  }
}

// DELETE - Unskip a booking (restore it)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get the owner
    const owner = await db.owner.findFirst({
      where: { user: { email: session.user.email } },
    })

    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
    }

    // Get the booking
    const booking = await db.booking.findFirst({
      where: {
        id,
        ownerId: owner.id,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (!booking.recurringSkipped) {
      return NextResponse.json(
        { error: 'Booking was not skipped' },
        { status: 400 }
      )
    }

    // Restore the booking
    await db.booking.update({
      where: { id },
      data: {
        recurringSkipped: false,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Booking instance restored',
    })
  } catch (error) {
    console.error('Error restoring booking:', error)
    return NextResponse.json(
      { error: 'Failed to restore booking' },
      { status: 500 }
    )
  }
}
