import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// DELETE - Remove a member from the team (leader only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'CLEANER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: memberId } = await params

    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      include: { ledTeam: true },
    })

    if (!cleaner?.ledTeam) {
      return NextResponse.json(
        { error: 'You do not lead a team' },
        { status: 403 }
      )
    }

    // Find the member
    const member = await db.cleaner.findUnique({
      where: { id: memberId },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Verify member is in this team
    if (member.teamId !== cleaner.ledTeam.id) {
      return NextResponse.json(
        { error: 'This cleaner is not in your team' },
        { status: 400 }
      )
    }

    // Check for pending/confirmed bookings with custom team services
    const teamServices = await db.teamService.findMany({
      where: { teamId: cleaner.ledTeam.id, status: 'APPROVED' },
      select: { name: true },
    })

    if (teamServices.length > 0) {
      const pendingBookings = await db.booking.findMany({
        where: {
          cleanerId: memberId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          service: { in: teamServices.map(s => s.name) },
        },
        select: { id: true, service: true, date: true },
      })

      if (pendingBookings.length > 0) {
        return NextResponse.json(
          {
            error: 'Member has pending bookings with team services',
            bookings: pendingBookings,
            message: `This member has ${pendingBookings.length} upcoming booking(s) for team services. Please reassign or complete these before removing them.`,
          },
          { status: 400 }
        )
      }
    }

    // Remove member from team
    await db.cleaner.update({
      where: { id: memberId },
      data: { teamId: null },
    })

    return NextResponse.json({
      success: true,
      message: 'Member removed from team',
    })
  } catch (error) {
    console.error('Error removing team member:', error)
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    )
  }
}
