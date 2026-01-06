import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/messages/conversations/[id] - Get messages in a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const userId = session.user.id

    // Verify user has access to this conversation
    const conversation = await db.conversation.findUnique({
      where: { id },
      include: {
        owner: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
        cleaner: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
        property: {
          select: { name: true, address: true },
        },
        admin: {
          select: { id: true, name: true, image: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Check authorization
    const isOwner = conversation.owner?.user.id === userId
    const isCleaner = conversation.cleaner.user.id === userId
    const isAdmin = conversation.admin?.id === userId

    if (!isOwner && !isCleaner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Mark unread messages as read for the current user
    const myRole = isOwner ? 'OWNER' : isAdmin ? 'ADMIN' : 'CLEANER'
    await db.message.updateMany({
      where: {
        conversationId: id,
        senderRole: { not: myRole },
        isRead: false,
      },
      data: { isRead: true },
    })

    // Get the other party based on role
    const otherParty = isOwner
      ? {
          id: conversation.cleaner.id,
          name: conversation.cleaner.user.name,
          image: conversation.cleaner.user.image,
          role: 'CLEANER' as const,
        }
      : isAdmin
        ? {
            id: conversation.cleaner.id,
            name: conversation.cleaner.user.name,
            image: conversation.cleaner.user.image,
            role: 'CLEANER' as const,
          }
        : conversation.owner
          ? {
              id: conversation.owner.id,
              name: conversation.owner.user.name,
              image: conversation.owner.user.image,
              role: 'OWNER' as const,
            }
          : conversation.admin
            ? {
                id: conversation.admin.id,
                name: conversation.admin.name,
                image: conversation.admin.image,
                role: 'ADMIN' as const,
              }
            : {
                id: 'unknown',
                name: 'Unknown',
                image: null,
                role: 'OWNER' as const,
              }

    // Format messages - show appropriate language version based on viewer role
    const messages = conversation.messages.map((msg) => {
      const isMine = msg.senderRole === myRole

      // If it's my message, show original
      // If it's their message, show translated (or original if same language)
      const displayText = isMine
        ? msg.originalText
        : msg.translatedText || msg.originalText

      return {
        id: msg.id,
        text: displayText,
        originalText: msg.originalText,
        translatedText: msg.translatedText,
        originalLang: msg.originalLang,
        translatedLang: msg.translatedLang,
        isMine,
        senderRole: msg.senderRole,
        isRead: msg.isRead,
        isAIGenerated: msg.isAIGenerated,
        createdAt: msg.createdAt,
      }
    })

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherParty,
        property: conversation.property,
        myRole,
      },
      messages,
    })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}
