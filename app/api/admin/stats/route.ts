import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/stats - Get platform KPIs
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get cleaner stats
    const [totalCleaners, activeCleaners, pendingCleaners] = await Promise.all([
      db.cleaner.count(),
      db.cleaner.count({ where: { status: 'ACTIVE' } }),
      db.cleaner.count({ where: { status: 'PENDING' } }),
    ])

    // Get booking stats
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    const [totalBookings, thisMonthBookings, bookingsWithPrice] = await Promise.all([
      db.booking.count(),
      db.booking.count({
        where: { createdAt: { gte: monthStart } },
      }),
      db.booking.findMany({
        select: { price: true, createdAt: true, status: true },
      }),
    ])

    const totalRevenue = bookingsWithPrice
      .filter(b => b.status === 'COMPLETED')
      .reduce((sum, b) => sum + Number(b.price), 0)

    const thisMonthRevenue = bookingsWithPrice
      .filter(b => b.status === 'COMPLETED' && b.createdAt >= monthStart)
      .reduce((sum, b) => sum + Number(b.price), 0)

    // Get review stats
    const reviews = await db.review.findMany({
      where: { approved: true },
      select: { rating: true },
    })

    const totalReviews = reviews.length
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0

    return NextResponse.json({
      stats: {
        totalCleaners,
        activeCleaners,
        pendingApplications: pendingCleaners,
        totalBookings,
        thisMonthBookings,
        totalRevenue,
        thisMonthRevenue,
        totalReviews,
        averageRating: Number(averageRating.toFixed(1)),
      },
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
