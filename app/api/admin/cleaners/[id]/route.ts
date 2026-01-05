import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// PATCH /api/admin/cleaners/[id] - Approve/suspend cleaner
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { action } = await request.json()

    if (!action || !['approve', 'suspend', 'activate', 'makeTeamLeader', 'removeTeamLeader'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    const cleaner = await db.cleaner.findUnique({
      where: { id },
    })

    if (!cleaner) {
      return NextResponse.json(
        { error: 'Cleaner not found' },
        { status: 404 }
      )
    }

    // Handle team leader toggle
    if (action === 'makeTeamLeader' || action === 'removeTeamLeader') {
      const updatedCleaner = await db.cleaner.update({
        where: { id },
        data: { teamLeader: action === 'makeTeamLeader' },
      })

      return NextResponse.json({
        success: true,
        cleaner: {
          id: updatedCleaner.id,
          teamLeader: updatedCleaner.teamLeader,
        },
      })
    }

    // Handle status changes
    let newStatus: 'ACTIVE' | 'SUSPENDED' | 'PENDING'
    switch (action) {
      case 'approve':
        newStatus = 'ACTIVE'
        break
      case 'suspend':
        newStatus = 'SUSPENDED'
        break
      case 'activate':
        newStatus = 'ACTIVE'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const updatedCleaner = await db.cleaner.update({
      where: { id },
      data: { status: newStatus },
    })

    return NextResponse.json({
      success: true,
      cleaner: {
        id: updatedCleaner.id,
        status: updatedCleaner.status.toLowerCase(),
      },
    })
  } catch (error) {
    console.error('Error updating cleaner:', error)
    return NextResponse.json(
      { error: 'Failed to update cleaner' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/cleaners/[id] - Remove cleaner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const cleaner = await db.cleaner.findUnique({
      where: { id },
      include: { bookings: true },
    })

    if (!cleaner) {
      return NextResponse.json(
        { error: 'Cleaner not found' },
        { status: 404 }
      )
    }

    // Check for active bookings
    const activeBookings = cleaner.bookings.filter(
      b => b.status === 'PENDING' || b.status === 'CONFIRMED'
    )

    if (activeBookings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete cleaner with active bookings' },
        { status: 400 }
      )
    }

    // Delete cleaner and user
    await db.$transaction([
      db.cleaner.delete({ where: { id } }),
      db.user.delete({ where: { id: cleaner.userId } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cleaner:', error)
    return NextResponse.json(
      { error: 'Failed to delete cleaner' },
      { status: 500 }
    )
  }
}
