import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all owners with user info, properties count, and bookings
    const owners = await db.owner.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            preferredLanguage: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
        properties: {
          select: {
            id: true,
            name: true,
            address: true,
            bedrooms: true,
            bathrooms: true,
          },
        },
        bookings: {
          select: {
            id: true,
            status: true,
            service: true,
            price: true,
            date: true,
            cleaner: {
              select: {
                id: true,
                user: {
                  select: { name: true },
                },
              },
            },
            property: {
              select: { name: true },
            },
          },
          orderBy: { date: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            properties: true,
            bookings: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform the data for the frontend
    const transformedOwners = owners.map((owner) => ({
      id: owner.id,
      name: owner.user.name || 'Unknown',
      email: owner.user.email || '',
      phone: owner.user.phone || '',
      preferredLanguage: owner.user.preferredLanguage,
      trusted: owner.trusted,
      referralCode: owner.referralCode,
      referralCredits: Number(owner.referralCredits),
      totalBookings: owner.totalBookings,
      rating: owner.cleanerRating ? Number(owner.cleanerRating) : null,
      reviewCount: owner.cleanerReviewCount,
      joinedAt: owner.user.createdAt,
      lastLoginAt: owner.user.lastLoginAt,
      propertyCount: owner._count.properties,
      bookingCount: owner._count.bookings,
      reviewsGiven: owner._count.reviews,
      properties: owner.properties.map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
      })),
      recentBookings: owner.bookings.map((b) => ({
        id: b.id,
        status: b.status.toLowerCase(),
        service: b.service,
        price: Number(b.price),
        date: b.date,
        cleanerName: b.cleaner.user.name || 'Unknown',
        propertyName: b.property.name,
      })),
    }))

    return NextResponse.json({ owners: transformedOwners })
  } catch (error) {
    console.error('Error fetching owners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch owners' },
      { status: 500 }
    )
  }
}
