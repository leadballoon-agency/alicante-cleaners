import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/dashboard/cleaner/bookings/[id]/review - Review owner (cleaner reviews owner)
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
    const {
      rating,
      workAgain,
      communication,
      propertyAccuracy,
      respectfulness,
      note,
    } = await request.json()

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
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

    // Get the booking and verify it belongs to this cleaner
    const booking = await db.booking.findFirst({
      where: {
        id: bookingId,
        cleanerId: cleaner.id,
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

    // Create the review - storing extra data in the text field as JSON
    const reviewData = {
      workAgain,
      communication,
      propertyAccuracy,
      respectfulness,
      note: note || '',
    }

    const review = await db.review.create({
      data: {
        bookingId,
        cleanerId: cleaner.id,
        ownerId: booking.ownerId,
        rating,
        text: JSON.stringify(reviewData),
        approved: true, // Auto-approve cleaner reviews of owners
      },
    })

    // Update owner's rating
    const ownerReviews = await db.review.findMany({
      where: {
        ownerId: booking.ownerId,
        approved: true,
      },
      select: { rating: true },
    })

    const avgRating = ownerReviews.reduce((sum, r) => sum + r.rating, 0) / ownerReviews.length

    await db.owner.update({
      where: { id: booking.ownerId },
      data: {
        cleanerRating: avgRating,
        cleanerReviewCount: ownerReviews.length,
        // Mark as trusted if they have 3+ reviews with avg 4.5+
        trusted: ownerReviews.length >= 3 && avgRating >= 4.5,
      },
    })

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
      },
    })
  } catch (error) {
    console.error('Error creating owner review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
