import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/dashboard/cleaner/bookings - Get cleaner's bookings
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
      select: { id: true },
    })

    if (!cleaner) {
      return NextResponse.json(
        { error: 'Cleaner profile not found' },
        { status: 404 }
      )
    }

    const bookings = await db.booking.findMany({
      where: { cleanerId: cleaner.id },
      include: {
        property: {
          select: {
            id: true,
            address: true,
            bedrooms: true,
          },
        },
        owner: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        review: {
          select: { id: true },
        },
      },
      orderBy: { date: 'desc' },
    })

    // Transform bookings to match frontend expectations
    const formattedBookings = bookings.map(b => ({
      id: b.id,
      status: b.status.toLowerCase() as 'pending' | 'confirmed' | 'completed',
      service: b.service,
      price: Number(b.price),
      hours: b.hours,
      date: b.date,
      time: b.time,
      property: {
        id: b.property.id,
        address: b.property.address,
        bedrooms: b.property.bedrooms,
      },
      owner: {
        id: b.owner.id,
        name: b.owner.user.name || 'Unknown',
        phone: b.owner.user.phone || '',
        email: b.owner.user.email || '',
        trusted: b.owner.trusted,
        referredBy: b.owner.referredBy,
        memberSince: b.owner.createdAt,
        totalBookings: b.owner.totalBookings,
        cleanerRating: b.owner.cleanerRating ? Number(b.owner.cleanerRating) : null,
        cleanerReviewCount: b.owner.cleanerReviewCount,
      },
      hasReviewedOwner: !!b.review,
    }))

    return NextResponse.json({ bookings: formattedBookings })
  } catch (error) {
    console.error('Error fetching cleaner bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
