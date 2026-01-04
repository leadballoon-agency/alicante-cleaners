import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/dashboard/owner/bookings - Get owner's bookings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const owner = await db.owner.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!owner) {
      return NextResponse.json(
        { error: 'Owner profile not found' },
        { status: 404 }
      )
    }

    const bookings = await db.booking.findMany({
      where: { ownerId: owner.id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            bedrooms: true,
          },
        },
        cleaner: {
          include: {
            user: {
              select: {
                name: true,
                image: true,
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
      date: b.date,
      time: b.time,
      property: {
        id: b.property.id,
        name: b.property.name,
        address: b.property.address,
        bedrooms: b.property.bedrooms,
      },
      cleaner: {
        id: b.cleaner.id,
        name: b.cleaner.user.name || 'Unknown',
        photo: b.cleaner.user.image,
        slug: b.cleaner.slug,
      },
      hasReviewedCleaner: !!b.review,
    }))

    return NextResponse.json({ bookings: formattedBookings })
  } catch (error) {
    console.error('Error fetching owner bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
