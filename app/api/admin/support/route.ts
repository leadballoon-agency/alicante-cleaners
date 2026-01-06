import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/support - Get all support conversations for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: {
      status?: 'ACTIVE' | 'RESOLVED' | 'ESCALATED'
    } = {}

    if (status && ['ACTIVE', 'RESOLVED', 'ESCALATED'].includes(status)) {
      where.status = status as 'ACTIVE' | 'RESOLVED' | 'ESCALATED'
    }

    const conversations = await db.supportConversation.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    })

    // Format for admin view
    const formattedConversations = conversations.map(c => ({
      id: c.id,
      userType: c.userType,
      userName: c.userName || c.user?.name || 'Anonymous',
      userEmail: c.userEmail || c.user?.email,
      status: c.status.toLowerCase(),
      sentiment: c.sentiment,
      topic: c.topic,
      summary: c.summary,
      page: c.page,
      messageCount: c.messages.length,
      lastMessage: c.messages[c.messages.length - 1]?.content.substring(0, 100),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messages: c.messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        isAI: m.isAI,
        createdAt: m.createdAt,
      })),
    }))

    // Get stats
    const stats = await db.supportConversation.groupBy({
      by: ['status'],
      _count: true,
    })

    const statsObj = {
      total: conversations.length,
      active: 0,
      escalated: 0,
      resolved: 0,
    }

    stats.forEach(s => {
      const key = s.status.toLowerCase() as keyof typeof statsObj
      if (key in statsObj) {
        statsObj[key] = s._count
      }
    })

    return NextResponse.json({
      conversations: formattedConversations,
      stats: statsObj,
    })
  } catch (error) {
    console.error('[Admin Support API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support conversations' },
      { status: 500 }
    )
  }
}
