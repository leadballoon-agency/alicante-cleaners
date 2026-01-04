import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/dashboard/cleaner - Get cleaner profile + stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            name: true,
            image: true,
            phone: true,
          },
        },
        bookings: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
          },
          select: {
            id: true,
            price: true,
            date: true,
            status: true,
          },
        },
      },
    })

    if (!cleaner) {
      return NextResponse.json(
        { error: 'Cleaner profile not found' },
        { status: 404 }
      )
    }

    // Calculate stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    const thisWeekBookings = cleaner.bookings.filter(b => {
      const bookingDate = new Date(b.date)
      return bookingDate >= today && bookingDate < nextWeek
    })

    const thisWeekEarnings = thisWeekBookings.reduce(
      (sum, b) => sum + Number(b.price),
      0
    )

    const completedThisMonth = cleaner.bookings.filter(b => {
      const bookingDate = new Date(b.date)
      return bookingDate >= monthStart && b.status === 'COMPLETED'
    }).length

    return NextResponse.json({
      cleaner: {
        id: cleaner.id,
        slug: cleaner.slug,
        bio: cleaner.bio,
        serviceAreas: cleaner.serviceAreas,
        hourlyRate: Number(cleaner.hourlyRate),
        rating: cleaner.rating ? Number(cleaner.rating) : null,
        reviewCount: cleaner.reviewCount,
        totalBookings: cleaner.totalBookings,
        name: cleaner.user.name,
        photo: cleaner.user.image,
        phone: cleaner.user.phone,
      },
      stats: {
        thisWeekEarnings,
        thisWeekBookings: thisWeekBookings.length,
        completedThisMonth,
      },
    })
  } catch (error) {
    console.error('Error fetching cleaner dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
