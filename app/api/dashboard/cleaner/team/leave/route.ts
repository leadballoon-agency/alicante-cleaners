import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// DELETE - Leave current team (members only, not leaders)
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'CLEANER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      include: { ledTeam: true, memberOfTeam: true },
    })

    if (!cleaner) {
      return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 })
    }

    // Can't leave if you're the leader
    if (cleaner.ledTeam) {
      return NextResponse.json(
        { error: 'Team leaders cannot leave their team. Delete the team instead.' },
        { status: 400 }
      )
    }

    // Must be a member of a team to leave
    if (!cleaner.memberOfTeam) {
      return NextResponse.json(
        { error: 'You are not a member of any team' },
        { status: 400 }
      )
    }

    // Check for pending/confirmed bookings with custom team services
    const teamServices = await db.teamService.findMany({
      where: { teamId: cleaner.memberOfTeam.id, status: 'APPROVED' },
      select: { name: true },
    })

    if (teamServices.length > 0) {
      const pendingBookings = await db.booking.findMany({
        where: {
          cleanerId: cleaner.id,
          status: { in: ['PENDING', 'CONFIRMED'] },
          serviceType: { in: teamServices.map(s => s.name) },
        },
        select: { id: true, serviceType: true, date: true },
      })

      if (pendingBookings.length > 0) {
        return NextResponse.json(
          {
            error: 'You have pending bookings with team services',
            bookings: pendingBookings,
            message: `You have ${pendingBookings.length} upcoming booking(s) for team services. Please complete or reassign these before leaving the team.`,
          },
          { status: 400 }
        )
      }
    }

    // Leave the team
    await db.cleaner.update({
      where: { id: cleaner.id },
      data: { teamId: null },
    })

    return NextResponse.json({
      success: true,
      message: 'You have left the team',
    })
  } catch (error) {
    console.error('Error leaving team:', error)
    return NextResponse.json({ error: 'Failed to leave team' }, { status: 500 })
  }
}
