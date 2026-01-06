import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// PATCH /api/admin/support/[id] - Update support conversation status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { status, note } = body

    if (!status || !['ACTIVE', 'RESOLVED', 'ESCALATED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const conversation = await db.supportConversation.findUnique({
      where: { id },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const updateData: {
      status: 'ACTIVE' | 'RESOLVED' | 'ESCALATED'
      resolvedBy?: string
    } = { status }

    if (status === 'RESOLVED') {
      updateData.resolvedBy = session.user.id
    }

    const updated = await db.supportConversation.update({
      where: { id },
      data: updateData,
    })

    // If there's a note, add it as an admin message
    if (note && status === 'RESOLVED') {
      await db.supportMessage.create({
        data: {
          conversationId: id,
          role: 'assistant',
          content: `[Admin: ${session.user.name}] ${note}`,
          isAI: false,
        },
      })
    }

    return NextResponse.json({
      success: true,
      status: updated.status.toLowerCase(),
    })
  } catch (error) {
    console.error('[Admin Support API] Error updating:', error)
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    )
  }
}
