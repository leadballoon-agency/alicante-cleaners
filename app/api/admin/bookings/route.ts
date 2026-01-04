import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/bookings - Get all bookings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const bookings = await db.booking.findMany({
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
              select: { name: true, email: true },
            },
          },
        },
        property: {
          select: { name: true, address: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 bookings
    })

    const formattedBookings = bookings.map(b => ({
      id: b.id,
      status: b.status.toLowerCase() as 'pending' | 'confirmed' | 'completed' | 'cancelled',
      service: b.service,
      price: Number(b.price),
      date: b.date,
      cleaner: {
        id: b.cleaner.id,
        name: b.cleaner.user.name || 'Unknown',
      },
      owner: {
        name: b.owner.user.name || 'Unknown',
        email: b.owner.user.email || '',
      },
      property: b.property.name || b.property.address,
      createdAt: b.createdAt,
    }))

    return NextResponse.json({ bookings: formattedBookings })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
