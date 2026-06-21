import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasStaffAccess } from '@/lib/staff-access'
import { db } from '@/lib/db'

// Manager messaging — staff-gated (works for ADMIN founders AND CLEANER+MANAGER
// partners like Ernesto/Jessica, since it keys on the user's id as the admin
// side of an admin↔cleaner conversation, not on their base role).

// GET /api/admin/messages — list this manager's conversations with cleaners
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !hasStaffAccess(session.user.staffLevel, 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const me = session.user.id

    const conversations = await db.conversation.findMany({
      where: { adminId: me },
      include: {
        cleaner: { include: { user: { select: { name: true, image: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Unread = messages from the cleaner not yet read, per conversation
    const list = await Promise.all(
      conversations.map(async (c) => {
        const unread = await db.message.count({
          where: { conversationId: c.id, senderRole: 'CLEANER', isRead: false },
        })
        const last = c.messages[0]
        return {
          id: c.id,
          cleaner: {
            id: c.cleanerId,
            name: c.cleaner.user.name || 'Cleaner',
            image: c.cleaner.user.image,
            slug: c.cleaner.slug,
          },
          lastMessage: last
            ? { text: last.senderRole === 'CLEANER' ? (last.translatedText || last.originalText) : last.originalText, at: last.createdAt, fromCleaner: last.senderRole === 'CLEANER' }
            : null,
          unread,
          updatedAt: c.updatedAt,
        }
      })
    )

    return NextResponse.json({ conversations: list })
  } catch (error) {
    console.error('Error listing manager conversations:', error)
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 })
  }
}

// POST /api/admin/messages — find-or-create a conversation with a cleaner
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !hasStaffAccess(session.user.staffLevel, 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const me = session.user.id

    const { cleanerId } = await request.json()
    if (!cleanerId) return NextResponse.json({ error: 'cleanerId required' }, { status: 400 })

    // Don't let a manager open a thread with their own cleaner profile
    const cleaner = await db.cleaner.findUnique({ where: { id: cleanerId }, select: { userId: true } })
    if (!cleaner) return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 })
    if (cleaner.userId === me) return NextResponse.json({ error: "That's your own cleaner profile" }, { status: 400 })

    let conversation = await db.conversation.findUnique({
      where: { adminId_cleanerId: { adminId: me, cleanerId } },
    })
    if (!conversation) {
      conversation = await db.conversation.create({ data: { adminId: me, cleanerId } })
    }

    return NextResponse.json({ conversationId: conversation.id })
  } catch (error) {
    console.error('Error creating manager conversation:', error)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}
