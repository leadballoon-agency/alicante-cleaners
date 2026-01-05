/**
 * AI Sales Agent Response Endpoint
 *
 * POST /api/ai/sales-agent/respond
 *
 * Called asynchronously after an owner sends a message.
 * Generates an AI response and saves it to the conversation.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateSalesResponse, enableAIForCleaner } from '@/lib/ai/sales-agent'
import { detectAndTranslate } from '@/lib/translate'

export async function POST(request: Request) {
  try {
    const { conversationId, messageId } = await request.json()

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing conversationId' },
        { status: 400 }
      )
    }

    // Get the conversation and latest message
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        cleaner: {
          include: {
            user: { select: { preferredLanguage: true } },
            aiSettings: true,
          },
        },
        messages: {
          where: messageId ? { id: messageId } : undefined,
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const cleaner = conversation.cleaner
    const latestMessage = conversation.messages[0]

    if (!latestMessage) {
      return NextResponse.json(
        { error: 'No message found' },
        { status: 404 }
      )
    }

    // Auto-enable AI if no settings exist (feature is free for all)
    if (!cleaner.aiSettings) {
      await enableAIForCleaner(cleaner.id)
    } else if (!cleaner.aiSettings.aiEnabled) {
      // AI is explicitly disabled for this cleaner
      return NextResponse.json(
        { message: 'AI is disabled for this cleaner' },
        { status: 200 }
      )
    }

    // Generate AI response
    const result = await generateSalesResponse(
      conversationId,
      latestMessage.originalText
    )

    // Detect language and translate if needed
    const cleanerLang = (cleaner.user.preferredLanguage || 'es') as 'en' | 'es' | 'de' | 'fr' | 'nl' | 'it' | 'pt'
    const translation = await detectAndTranslate(result.response, cleanerLang)

    // Save AI response as a message
    const aiMessage = await db.message.create({
      data: {
        conversationId,
        senderId: cleaner.userId,
        senderRole: 'CLEANER',
        originalText: result.response,
        originalLang: translation.originalLang,
        translatedText: translation.translatedText,
        translatedLang: translation.translatedText ? cleanerLang : null,
        isAIGenerated: true,
        isRead: false,
      },
    })

    // Update conversation timestamp
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      messageId: aiMessage.id,
      tokensUsed: result.tokensUsed,
      bookingCreated: result.bookingCreated,
    })
  } catch (error) {
    console.error('AI Sales Agent error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    )
  }
}
