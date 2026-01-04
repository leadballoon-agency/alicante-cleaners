import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// PATCH /api/admin/feedback/[id] - Update feedback status
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
    const { status } = await request.json()

    if (!status || !['NEW', 'REVIEWED', 'PLANNED', 'DONE'].includes(status.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid status. Use "new", "reviewed", "planned", or "done"' },
        { status: 400 }
      )
    }

    const feedback = await db.feedback.findUnique({
      where: { id },
    })

    if (!feedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      )
    }

    const updatedFeedback = await db.feedback.update({
      where: { id },
      data: { status: status.toUpperCase() as 'NEW' | 'REVIEWED' | 'PLANNED' | 'DONE' },
    })

    return NextResponse.json({
      success: true,
      feedback: {
        id: updatedFeedback.id,
        status: updatedFeedback.status.toLowerCase(),
      },
    })
  } catch (error) {
    console.error('Error updating feedback:', error)
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    )
  }
}
