import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/feedback - Get all feedback
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const feedback = await db.feedback.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const formattedFeedback = feedback.map(f => ({
      id: f.id,
      category: f.category.toLowerCase() as 'idea' | 'issue' | 'praise' | 'question',
      mood: f.mood.toLowerCase() as 'love' | 'like' | 'meh' | 'frustrated',
      message: f.message || '',
      page: f.page,
      userType: (f.userType?.toLowerCase() || 'visitor') as 'owner' | 'cleaner' | 'visitor',
      createdAt: f.createdAt,
      status: f.status.toLowerCase() as 'new' | 'reviewed' | 'planned' | 'done',
      votes: f.votes,
    }))

    return NextResponse.json({ feedback: formattedFeedback })
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}
