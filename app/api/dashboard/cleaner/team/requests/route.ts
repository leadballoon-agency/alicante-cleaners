import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Get pending join requests (leader only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'CLEANER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const requests = await db.teamJoinRequest.findMany({
      where: {
        teamId: cleaner.ledTeam.id,
        status: 'PENDING',
      },
      include: {
        cleaner: {
          include: {
            user: {
              select: { name: true, image: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      requests: requests.map((r) => ({
        id: r.id,
        cleanerId: r.cleanerId,
        name: r.cleaner.user.name,
        photo: r.cleaner.user.image,
        slug: r.cleaner.slug,
        rating: r.cleaner.rating ? Number(r.cleaner.rating) : null,
        reviewCount: r.cleaner.reviewCount,
        serviceAreas: r.cleaner.serviceAreas,
        message: r.message,
        createdAt: r.createdAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching join requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch join requests' },
      { status: 500 }
    )
  }
}
