import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// PATCH /api/dashboard/cleaner/bookings/[id] - Accept/decline/assign booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { action, assignToCleanerId } = body

    if (!action || !['accept', 'decline', 'complete', 'assign'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "accept", "decline", "complete", or "assign"' },
        { status: 400 }
      )
    }

    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      include: {
        ledTeam: {
          include: {
            members: { select: { id: true } },
          },
        },
      },
    })

    if (!cleaner) {
      return NextResponse.json(
        { error: 'Cleaner profile not found' },
        { status: 404 }
      )
    }

    // Verify the booking belongs to this cleaner
    const booking = await db.booking.findFirst({
      where: {
        id,
        cleanerId: cleaner.id,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Handle assign action separately (reassigns to team member and accepts)
    if (action === 'assign') {
      if (!assignToCleanerId) {
        return NextResponse.json(
          { error: 'Must specify team member to assign to' },
          { status: 400 }
        )
      }

      // Verify current cleaner is a team leader
      if (!cleaner.ledTeam) {
        return NextResponse.json(
          { error: 'Only team leaders can assign bookings' },
          { status: 403 }
        )
      }

      // Verify the target cleaner is a team member
      const isTeamMember = cleaner.ledTeam.members.some(m => m.id === assignToCleanerId)
      if (!isTeamMember) {
        return NextResponse.json(
          { error: 'Can only assign to your team members' },
          { status: 403 }
        )
      }

      if (booking.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Can only assign pending bookings' },
          { status: 400 }
        )
      }

      // Reassign and confirm the booking
      const updatedBooking = await db.booking.update({
        where: { id },
        data: {
          cleanerId: assignToCleanerId,
          status: 'CONFIRMED',
        },
        include: {
          cleaner: {
            include: { user: { select: { name: true } } },
          },
        },
      })

      return NextResponse.json({
        success: true,
        booking: {
          id: updatedBooking.id,
          status: updatedBooking.status.toLowerCase(),
          assignedTo: updatedBooking.cleaner.user.name,
        },
      })
    }

    // Determine new status for accept/decline/complete
    let newStatus: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
    switch (action) {
      case 'accept':
        if (booking.status !== 'PENDING') {
          return NextResponse.json(
            { error: 'Can only accept pending bookings' },
            { status: 400 }
          )
        }
        newStatus = 'CONFIRMED'
        break
      case 'decline':
        if (booking.status !== 'PENDING') {
          return NextResponse.json(
            { error: 'Can only decline pending bookings' },
            { status: 400 }
          )
        }
        newStatus = 'CANCELLED'
        break
      case 'complete':
        if (booking.status !== 'CONFIRMED') {
          return NextResponse.json(
            { error: 'Can only complete confirmed bookings' },
            { status: 400 }
          )
        }
        newStatus = 'COMPLETED'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Update the booking
    const updatedBooking = await db.booking.update({
      where: { id },
      data: { status: newStatus },
    })

    // Update cleaner's total bookings if completed
    if (newStatus === 'COMPLETED') {
      await db.cleaner.update({
        where: { id: cleaner.id },
        data: { totalBookings: { increment: 1 } },
      })
      // Also update owner's total bookings
      await db.owner.update({
        where: { id: booking.ownerId },
        data: { totalBookings: { increment: 1 } },
      })
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status.toLowerCase(),
      },
    })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}
