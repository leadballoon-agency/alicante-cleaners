import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/teams/leaders - Get all team leaders (public endpoint for onboarding)
export async function GET() {
  try {
    const teamLeaders = await db.cleaner.findMany({
      where: {
        teamLeader: true,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        ledTeam: {
          select: {
            name: true,
            referralCode: true,
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: [
        { rating: 'desc' },
        { reviewCount: 'desc' },
      ],
    })

    const leaders = teamLeaders.map(leader => ({
      id: leader.id,
      slug: leader.slug,
      name: leader.user.name || 'Unknown',
      photo: leader.user.image || null,
      rating: leader.rating ? Number(leader.rating) : 5.0,
      reviewCount: leader.reviewCount,
      serviceAreas: leader.serviceAreas,
      teamName: leader.ledTeam?.name || null,
      memberCount: leader.ledTeam?._count.members || 0,
      referralCode: leader.ledTeam?.referralCode || null,
    }))

    return NextResponse.json({ leaders })
  } catch (error) {
    console.error('Error fetching team leaders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team leaders' },
      { status: 500 }
    )
  }
}
