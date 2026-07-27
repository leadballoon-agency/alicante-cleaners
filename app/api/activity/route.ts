import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cleanerAreaLabel } from '@/lib/area/areas'

// This route uses no request data, so without an explicit revalidate Next
// statically bakes its output AT BUILD TIME — the "live" social-proof feed
// was a snapshot frozen until the next deploy (observed: a 14h-old entry
// persisting after the content was fixed). ISR every 5 minutes keeps it
// fresh AND keeps DB load near zero for homepage traffic.
export const revalidate = 300

// GET /api/activity - Get recent activity for social proof feed
export async function GET() {
  try {
    // Get recent completed bookings (last 7 days)
    const recentBookings = await db.booking.findMany({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        cleaner: {
          select: {
            serviceAreas: true,
            user: { select: { name: true, image: true } },
          },
        },
        // PRIVACY: never select the property here — the owner's address must
        // not reach this public feed in any form (it leaked once: the old
        // extractArea() heuristic showed a real street address on the
        // homepage). Location shown = the CLEANER's own public service area.
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    })

    // Get recent reviews (last 14 days)
    const recentReviews = await db.review.findMany({
      where: {
        approved: true,
        createdAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        cleaner: {
          include: {
            user: { select: { name: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Get recently confirmed bookings (last 3 days)
    const recentConfirmed = await db.booking.findMany({
      where: {
        status: 'CONFIRMED',
        updatedAt: {
          gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        cleaner: {
          include: {
            user: { select: { name: true, image: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    })

    // Build activity feed
    const activities: {
      id: string
      type: 'completed' | 'review' | 'booked'
      message: string
      area: string
      photo: string | null
      timestamp: Date
    }[] = []

    // Add completed cleans
    recentBookings.forEach((booking) => {
      const cleanerName = booking.cleaner.user.name?.split(' ')[0] || 'A cleaner'
      const area = cleanerAreaLabel(booking.cleaner.serviceAreas)
      activities.push({
        id: `completed-${booking.id}`,
        type: 'completed',
        message: `${cleanerName} completed a clean`,
        area,
        photo: booking.cleaner.user.image,
        timestamp: booking.updatedAt,
      })
    })

    // Add reviews
    recentReviews.forEach((review) => {
      const cleanerName = review.cleaner.user.name?.split(' ')[0] || 'A cleaner'
      const stars = '★'.repeat(review.rating)
      activities.push({
        id: `review-${review.id}`,
        type: 'review',
        message: `${cleanerName} received a ${stars} review`,
        area: '',
        photo: review.cleaner.user.image,
        timestamp: review.createdAt,
      })
    })

    // Add new bookings
    recentConfirmed.forEach((booking) => {
      const cleanerName = booking.cleaner.user.name?.split(' ')[0] || 'A cleaner'
      activities.push({
        id: `booked-${booking.id}`,
        type: 'booked',
        message: `${cleanerName} accepted a new booking`,
        area: '',
        photo: booking.cleaner.user.image,
        timestamp: booking.updatedAt,
      })
    })

    // Sort by timestamp and take top 15
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    const feed = activities.slice(0, 15)

    return NextResponse.json({ activities: feed })
  } catch (error) {
    console.error('Error fetching activity feed:', error)
    return NextResponse.json({ activities: [] })
  }
}
