import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Browse all teams (for cleaners looking to join)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'CLEANER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current cleaner to check their existing requests
    const currentCleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      include: {
        teamJoinRequests: {
          where: { status: 'PENDING' },
        },
      },
    })

    if (!currentCleaner) {
      return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 })
    }

    // If already in a team, return empty (they need to leave first)
    if (currentCleaner.teamId) {
      return NextResponse.json({
        teams: [],
        message: 'You are already in a team. Leave your current team to browse others.',
      })
    }

    // Get all teams with their leaders and member counts
    const teams = await db.team.findMany({
      include: {
        leader: {
          include: {
            user: {
              select: { name: true, image: true },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get the IDs of teams the cleaner has pending requests for
    const pendingRequestTeamIds = currentCleaner.teamJoinRequests.map(
      (r) => r.teamId
    )

    return NextResponse.json({
      teams: teams.map((team) => ({
        id: team.id,
        name: team.name,
        leader: {
          id: team.leader.id,
          name: team.leader.user.name,
          photo: team.leader.user.image,
          slug: team.leader.slug,
          rating: team.leader.rating ? Number(team.leader.rating) : null,
          reviewCount: team.leader.reviewCount,
          serviceAreas: team.leader.serviceAreas,
        },
        memberCount: team._count.members,
        createdAt: team.createdAt,
        hasPendingRequest: pendingRequestTeamIds.includes(team.id),
      })),
    })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}
