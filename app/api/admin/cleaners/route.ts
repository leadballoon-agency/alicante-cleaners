import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/cleaners - Get all cleaners
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const cleaners = await db.cleaner.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedCleaners = cleaners.map(c => ({
      id: c.id,
      name: c.user.name || 'Unknown',
      slug: c.slug,
      phone: c.user.phone || '',
      email: c.user.email || '',
      photo: c.user.image || c.photo || null,
      status: c.status.toLowerCase() as 'pending' | 'active' | 'suspended',
      joinedAt: c.createdAt,
      areas: c.serviceAreas,
      hourlyRate: Number(c.hourlyRate),
      totalBookings: c.totalBookings,
      rating: c.rating ? Number(c.rating) : 0,
      reviewCount: c.reviewCount,
      teamLeader: c.teamLeader || false,
    }))

    return NextResponse.json({ cleaners: formattedCleaners })
  } catch (error) {
    console.error('Error fetching cleaners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cleaners' },
      { status: 500 }
    )
  }
}
