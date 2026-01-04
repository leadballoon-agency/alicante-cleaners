import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/reviews - Get all reviews
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const reviews = await db.review.findMany({
      include: {
        cleaner: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
        owner: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
        booking: {
          include: {
            property: {
              select: { address: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedReviews = reviews.map(r => {
      // Get location from property address
      const address = r.booking?.property?.address || ''
      const locationParts = address.split(',')
      const location = locationParts.length > 1 ? locationParts[locationParts.length - 1].trim() : 'Alicante'

      return {
        id: r.id,
        rating: r.rating,
        text: r.text,
        author: r.owner.user.name || 'Anonymous',
        location,
        cleaner: {
          id: r.cleaner.id,
          name: r.cleaner.user.name || 'Unknown',
        },
        createdAt: r.createdAt,
        status: r.approved ? 'approved' as const : 'pending' as const,
        featured: r.featured,
      }
    })

    return NextResponse.json({ reviews: formattedReviews })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
