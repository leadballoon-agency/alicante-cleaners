import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { fetchUserContext, chatWithSupportAgent, summarizeConversation } from '@/lib/ai/support-agent'

// POST /api/support/conversations - Send a message to support
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationId, sessionId, page, userType } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Get session if available
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    const userName = session?.user?.name || undefined
    const userEmail = session?.user?.email || undefined

    // Determine user type
    let detectedUserType: 'owner' | 'cleaner' | 'visitor' = userType || 'visitor'
    if (session?.user?.role === 'CLEANER') {
      detectedUserType = 'cleaner'
    } else if (session?.user?.role === 'OWNER' || session?.user?.role === 'ADMIN') {
      detectedUserType = 'owner'
    }

    // Get or create conversation
    let conversation
    if (conversationId) {
      conversation = await db.supportConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      })
    }

    if (!conversation) {
      // Create new conversation
      conversation = await db.supportConversation.create({
        data: {
          userId,
          userType: detectedUserType,
          userName,
          userEmail,
          page: page || '/',
          sessionId,
          status: 'ACTIVE',
        },
        include: {
          messages: true,
        },
      })
    }

    // Save user message
    await db.supportMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
        isAI: false,
      },
    })

    // Build message history for AI
    const messageHistory = [
      ...conversation.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ]

    // Fetch user context for AI
    const context = await fetchUserContext(
      userId,
      detectedUserType,
      page || '/',
      sessionId
    )

    // Get AI response
    const aiResult = await chatWithSupportAgent(messageHistory, context)

    // Save AI response
    await db.supportMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResult.response,
        isAI: true,
      },
    })

    // Update conversation with sentiment and topic
    const updateData: {
      sentiment?: string
      topic?: string
      status?: 'ACTIVE' | 'RESOLVED' | 'ESCALATED'
      summary?: string
      updatedAt: Date
    } = {
      sentiment: aiResult.sentiment,
      topic: aiResult.topic || undefined,
      updatedAt: new Date(),
    }

    if (aiResult.shouldEscalate) {
      updateData.status = 'ESCALATED'
      // Generate summary for admin
      const summary = await summarizeConversation(
        [...messageHistory, { role: 'assistant', content: aiResult.response }],
        context
      )
      updateData.summary = summary
    }

    await db.supportConversation.update({
      where: { id: conversation.id },
      data: updateData,
    })

    return NextResponse.json({
      conversationId: conversation.id,
      response: aiResult.response,
      escalated: aiResult.shouldEscalate,
    })
  } catch (error) {
    console.error('[Support API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

// GET /api/support/conversations - Get conversation history (for resuming)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')
  const conversationId = searchParams.get('conversationId')

  if (!sessionId && !conversationId) {
    return NextResponse.json({ error: 'Session ID or Conversation ID required' }, { status: 400 })
  }

  try {
    let conversation

    if (conversationId) {
      conversation = await db.supportConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      })
    } else if (sessionId) {
      // Get most recent active conversation for this session
      conversation = await db.supportConversation.findFirst({
        where: {
          sessionId,
          status: 'ACTIVE',
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      })
    }

    if (!conversation) {
      return NextResponse.json({ conversation: null, messages: [] })
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        status: conversation.status,
        userType: conversation.userType,
        createdAt: conversation.createdAt,
      },
      messages: conversation.messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    })
  } catch (error) {
    console.error('[Support API] Error fetching conversation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}
