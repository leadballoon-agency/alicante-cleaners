import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/dashboard/owner/bookings/[id]/review - Review cleaner (owner reviews cleaner)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: bookingId } = await params
    const { rating, text } = await request.json()

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (!text?.trim()) {
      return NextResponse.json(
        { error: 'Review text is required' },
        { status: 400 }
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

    // Get the booking and verify it belongs to this owner
    const booking = await db.booking.findFirst({
      where: {
        id: bookingId,
        ownerId: owner.id,
        status: 'COMPLETED',
      },
      include: {
        review: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Completed booking not found' },
        { status: 404 }
      )
    }

    if (booking.review) {
      return NextResponse.json(
        { error: 'This booking has already been reviewed' },
        { status: 400 }
      )
    }

    // Create the review
    const review = await db.review.create({
      data: {
        bookingId,
        cleanerId: booking.cleanerId,
        ownerId: owner.id,
        rating,
        text: text.trim(),
        approved: false, // Owner reviews need approval
      },
    })

    // Update cleaner's rating (only counting approved reviews)
    const cleanerReviews = await db.review.findMany({
      where: {
        cleanerId: booking.cleanerId,
        approved: true,
      },
      select: { rating: true },
    })

    if (cleanerReviews.length > 0) {
      const avgRating = cleanerReviews.reduce((sum, r) => sum + r.rating, 0) / cleanerReviews.length

      await db.cleaner.update({
        where: { id: booking.cleanerId },
        data: {
          rating: avgRating,
          reviewCount: cleanerReviews.length,
        },
      })
    }

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        pending: !review.approved,
      },
    })
  } catch (error) {
    console.error('Error creating cleaner review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
