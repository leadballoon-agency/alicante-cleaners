import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// PATCH /api/admin/reviews/[id] - Approve/feature review
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { action } = await request.json()

    if (!action || !['approve', 'reject', 'feature', 'unfeature'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve", "reject", "feature", or "unfeature"' },
        { status: 400 }
      )
    }

    const review = await db.review.findUnique({
      where: { id },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    let updateData: { approved?: boolean; featured?: boolean } = {}

    switch (action) {
      case 'approve':
        updateData = { approved: true }
        break
      case 'reject':
        // Delete the review
        await db.review.delete({ where: { id } })
        return NextResponse.json({ success: true, deleted: true })
      case 'feature':
        updateData = { featured: true, approved: true }
        break
      case 'unfeature':
        updateData = { featured: false }
        break
    }

    const updatedReview = await db.review.update({
      where: { id },
      data: updateData,
    })

    // Update cleaner's rating if approving
    if (action === 'approve' || action === 'feature') {
      const cleanerReviews = await db.review.findMany({
        where: {
          cleanerId: review.cleanerId,
          approved: true,
        },
        select: { rating: true },
      })

      if (cleanerReviews.length > 0) {
        const avgRating = cleanerReviews.reduce((sum, r) => sum + r.rating, 0) / cleanerReviews.length

        await db.cleaner.update({
          where: { id: review.cleanerId },
          data: {
            rating: avgRating,
            reviewCount: cleanerReviews.length,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      review: {
        id: updatedReview.id,
        approved: updatedReview.approved,
        featured: updatedReview.featured,
      },
    })
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}
