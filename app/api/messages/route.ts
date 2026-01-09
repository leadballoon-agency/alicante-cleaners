import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  detectAndTranslate,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from '@/lib/translate'
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit'
import { notifyAdminNewMessage } from '@/lib/email'
import { z } from 'zod'

// Zod schema for message validation
const messageSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID'),
  text: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
})

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const role = session.user.role as 'OWNER' | 'CLEANER' | 'ADMIN'

    if (role !== 'OWNER' && role !== 'CLEANER' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Rate limit by user ID (authenticated endpoint)
    const rateLimit = await checkRateLimit(userId, 'message', RATE_LIMITS.message)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many messages. Please slow down.' },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      )
    }

    const body = await request.json()

    // Validate input with Zod
    const parseResult = messageSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { conversationId, text } = parseResult.data

    // Verify user has access to this conversation and get language preferences
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        owner: {
          include: {
            user: { select: { id: true, preferredLanguage: true } },
          },
        },
        cleaner: {
          include: {
            user: { select: { id: true, name: true, preferredLanguage: true } },
          },
        },
        admin: {
          select: { id: true, preferredLanguage: true },
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

    // Get recipient's preferred language
    const recipientLang = isOwner
      ? conversation.cleaner.user.preferredLanguage
      : isAdmin
        ? conversation.cleaner.user.preferredLanguage
        : (conversation.owner?.user.preferredLanguage || conversation.admin?.preferredLanguage || 'en')

    // Validate it's a supported language, default to 'es' for cleaners, 'en' for owners
    const targetLang: LanguageCode = (recipientLang in SUPPORTED_LANGUAGES)
      ? recipientLang as LanguageCode
      : (isOwner ? 'es' : 'en')

    // Detect language and translate
    let originalLang: LanguageCode = 'en'
    let translatedText: string | null = null
    let translatedLang: LanguageCode | null = null

    try {
      const translation = await detectAndTranslate(text, targetLang)
      originalLang = translation.originalLang

      // Only store translation if it's different from original
      if (translation.translatedText !== text) {
        translatedText = translation.translatedText
        translatedLang = targetLang
      }
    } catch (error) {
      console.error('Translation error (continuing without translation):', error)
      // Continue without translation if it fails
    }

    // Create the message
    const message = await db.message.create({
      data: {
        conversationId,
        senderId: userId,
        senderRole: role,
        originalText: text.trim(),
        originalLang,
        translatedText,
        translatedLang,
      },
    })

    // Update conversation's updatedAt timestamp
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    // Trigger AI response for owner messages (async - don't block response)
    if (role === 'OWNER') {
      // Fire and forget - AI will respond asynchronously
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      fetch(`${baseUrl}/api/ai/sales-agent/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          messageId: message.id,
        }),
      }).catch(err => {
        console.error('Failed to trigger AI response:', err)
      })
    }

    // Notify admins when cleaner sends a message (async - don't block response)
    if (role === 'CLEANER') {
      notifyAdminNewMessage({
        cleanerName: conversation.cleaner.user.name || 'Cleaner',
        cleanerSlug: conversation.cleaner.slug,
        messageText: text,
        conversationId,
      }).catch(err => {
        console.error('Failed to send admin notification:', err)
      })
    }

    return NextResponse.json({
      message: {
        id: message.id,
        text: message.originalText,
        originalText: message.originalText,
        translatedText: message.translatedText,
        originalLang: message.originalLang,
        translatedLang: message.translatedLang,
        isMine: true,
        senderRole: message.senderRole,
        isRead: false,
        createdAt: message.createdAt,
      },
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

// GET /api/messages - Get unread message count
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const role = session.user.role

    let unreadCount = 0

    if (role === 'OWNER') {
      const owner = await db.owner.findUnique({
        where: { userId },
      })

      if (owner) {
        unreadCount = await db.message.count({
          where: {
            conversation: { ownerId: owner.id },
            senderRole: 'CLEANER',
            isRead: false,
          },
        })
      }
    } else if (role === 'CLEANER') {
      const cleaner = await db.cleaner.findUnique({
        where: { userId },
      })

      if (cleaner) {
        // Count messages from both owners AND admins
        unreadCount = await db.message.count({
          where: {
            conversation: { cleanerId: cleaner.id },
            senderRole: { in: ['OWNER', 'ADMIN'] },
            isRead: false,
          },
        })
      }
    }

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    )
  }
}
