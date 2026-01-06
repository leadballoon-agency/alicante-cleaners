/**
 * AI Sales Agent for Cleaners
 *
 * This module enables AI to respond to villa owner messages on behalf of cleaners.
 * The AI has full knowledge of the cleaner's profile, rates, services, and availability,
 * allowing it to answer questions and even create confirmed bookings.
 *
 * Flow:
 * 1. Owner sends message -> Message saved to DB
 * 2. If cleaner has AI enabled -> Trigger AI response
 * 3. AI builds context (cleaner profile, conversation history, availability)
 * 4. AI responds in owner's language
 * 5. If booking requested -> AI creates confirmed booking
 * 6. Cleaner receives notification of AI actions
 */

import { db } from '@/lib/db'
import { getOpenAI } from './agents'
import { salesAgentTools, executeTool, type ToolResult } from './sales-agent-tools'

export interface SalesAgentContext {
  cleanerId: string
  cleanerName: string
  cleanerPhone: string
  hourlyRate: number
  serviceAreas: string[]
  languages: string[]
  rating: number | null
  reviewCount: number
  bio: string | null

  // Conversation context
  conversationId: string
  ownerName: string
  ownerLanguage: string
  propertyName: string | null

  // Availability summary
  nextAvailableDates: string[]
  busyDates: string[]
}

export interface ConversationMessage {
  role: 'owner' | 'cleaner' | 'ai'
  content: string
  timestamp: Date
}

/**
 * Build context for the sales agent based on cleaner profile and conversation
 */
export async function buildSalesAgentContext(
  conversationId: string
): Promise<SalesAgentContext | null> {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      cleaner: {
        include: {
          user: { select: { name: true, phone: true, preferredLanguage: true } },
        },
      },
      owner: {
        include: {
          user: { select: { name: true, preferredLanguage: true } },
        },
      },
      property: { select: { name: true } },
    },
  })

  if (!conversation) return null

  const cleaner = conversation.cleaner

  // Get next 14 days of availability
  const today = new Date()
  const twoWeeksLater = new Date(today)
  twoWeeksLater.setDate(today.getDate() + 14)

  const availability = await db.cleanerAvailability.findMany({
    where: {
      cleanerId: cleaner.id,
      date: {
        gte: today,
        lte: twoWeeksLater,
      },
    },
    orderBy: { date: 'asc' },
  })

  // Get existing bookings for the same period
  const bookings = await db.booking.findMany({
    where: {
      cleanerId: cleaner.id,
      date: {
        gte: today,
        lte: twoWeeksLater,
      },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    select: { date: true, time: true },
  })

  // Process availability
  const busyDates = [
    ...availability.filter(a => !a.isAvailable).map(a => a.date.toISOString().split('T')[0]),
    ...bookings.map(b => b.date.toISOString().split('T')[0]),
  ]

  // Find next available dates (excluding busy ones)
  const nextAvailableDates: string[] = []
  for (let i = 1; i <= 14 && nextAvailableDates.length < 5; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    if (!busyDates.includes(dateStr)) {
      nextAvailableDates.push(dateStr)
    }
  }

  return {
    cleanerId: cleaner.id,
    cleanerName: cleaner.user.name || 'Cleaner',
    cleanerPhone: cleaner.user.phone || '',
    hourlyRate: Number(cleaner.hourlyRate),
    serviceAreas: cleaner.serviceAreas,
    languages: cleaner.languages,
    rating: cleaner.rating ? Number(cleaner.rating) : null,
    reviewCount: cleaner.reviewCount,
    bio: cleaner.bio,

    conversationId,
    ownerName: conversation.owner?.user.name || 'Owner',
    ownerLanguage: conversation.owner?.user.preferredLanguage || 'en',
    propertyName: conversation.property?.name || null,

    nextAvailableDates,
    busyDates: Array.from(new Set(busyDates)),
  }
}

/**
 * Get recent conversation messages for context
 */
export async function getConversationHistory(
  conversationId: string,
  limit: number = 10
): Promise<ConversationMessage[]> {
  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return messages.reverse().map(m => ({
    role: m.isAIGenerated ? 'ai' as const :
          m.senderRole === 'OWNER' ? 'owner' as const : 'cleaner' as const,
    content: m.originalText,
    timestamp: m.createdAt,
  }))
}

/**
 * Build the system prompt for the sales agent
 */
function buildSystemPrompt(context: SalesAgentContext): string {
  const services = [
    { name: 'Regular clean', hours: 3, price: context.hourlyRate * 3 },
    { name: 'Deep clean', hours: 5, price: context.hourlyRate * 5 },
    { name: 'Arrival prep', hours: 4, price: context.hourlyRate * 4 },
  ]

  return `You are the AI assistant responding on behalf of ${context.cleanerName}, a professional villa cleaner in Alicante, Spain.

YOUR ROLE:
- Respond to villa owner messages as if you ARE ${context.cleanerName}
- Use first person ("I", "my") when speaking
- Be warm, professional, and helpful
- You have FULL authority to create bookings

CLEANER PROFILE:
- Name: ${context.cleanerName}
- Hourly Rate: €${context.hourlyRate.toFixed(2)}
- Service Areas: ${context.serviceAreas.join(', ')}
- Languages Spoken: ${context.languages.join(', ')}
- Rating: ${context.rating ? `${context.rating}/5 (${context.reviewCount} reviews)` : 'New cleaner'}
${context.bio ? `- Bio: ${context.bio}` : ''}

SERVICES OFFERED:
${services.map(s => `- ${s.name}: ${s.hours} hours = €${s.price.toFixed(2)}`).join('\n')}

AVAILABILITY (next 2 weeks):
- Available dates: ${context.nextAvailableDates.length > 0 ? context.nextAvailableDates.join(', ') : 'Check calendar'}
- Busy dates: ${context.busyDates.length > 0 ? context.busyDates.join(', ') : 'None'}

CURRENT CONVERSATION:
- Owner: ${context.ownerName}
- Owner's preferred language: ${context.ownerLanguage}
${context.propertyName ? `- Property: ${context.propertyName}` : ''}

INSTRUCTIONS:
1. ALWAYS respond in the owner's preferred language (${context.ownerLanguage})
2. Be helpful and try to close bookings when appropriate
3. Before confirming a booking, verify:
   - Service type (Regular, Deep, or Arrival)
   - Date and preferred time
   - Property address (if not already known)
4. Use the check_availability tool to verify dates before confirming
5. Use the create_booking tool to create confirmed bookings
6. Keep responses conversational and friendly
7. If asked about something you can't do, politely explain

LANGUAGE NOTES:
- If owner writes in English, respond in English
- If owner writes in Spanish, respond in Spanish
- If owner writes in German, respond in German
- Match the owner's language for a seamless experience`
}

/**
 * Generate AI response for a conversation
 */
export async function generateSalesResponse(
  conversationId: string,
  latestMessage: string
): Promise<{ response: string; tokensUsed: number; bookingCreated?: string }> {
  const context = await buildSalesAgentContext(conversationId)
  if (!context) {
    throw new Error('Could not build context for conversation')
  }

  // Check if AI is enabled for this cleaner
  const aiSettings = await db.cleanerAISettings.findUnique({
    where: { cleanerId: context.cleanerId },
  })

  if (!aiSettings?.aiEnabled) {
    throw new Error('AI is not enabled for this cleaner')
  }

  const conversationHistory = await getConversationHistory(conversationId)
  const systemPrompt = buildSystemPrompt(context)

  const openai = getOpenAI()

  // Convert history to OpenAI format
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(m => ({
      role: (m.role === 'owner' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    })),
  ]

  // Add latest message if not already in history
  if (!conversationHistory.some(m => m.content === latestMessage)) {
    messages.push({ role: 'user', content: latestMessage })
  }

  let bookingCreated: string | undefined

  // First call - may request tool use
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 500,
    messages,
    tools: salesAgentTools,
    tool_choice: 'auto',
  })

  let assistantMessage = response.choices[0]?.message
  let tokensUsed = response.usage?.total_tokens || 0

  // Handle tool calls if any
  if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
    // Add assistant message with tool calls
    messages.push({
      role: 'assistant',
      content: assistantMessage.content || '',
    })

    // Execute each tool and collect results
    const toolResults: ToolResult[] = []
    for (const toolCall of assistantMessage.tool_calls) {
      // Only handle function type tool calls
      if (toolCall.type !== 'function') continue

      const result = await executeTool(
        toolCall.function.name,
        JSON.parse(toolCall.function.arguments),
        context
      )
      toolResults.push(result)

      // Check if a booking was created
      if (result.bookingId) {
        bookingCreated = result.bookingId
      }
    }

    // Add tool results to messages (simplified - in real impl, need proper tool response format)
    messages.push({
      role: 'user',
      content: `[Tool results: ${toolResults.map(r => r.message).join('; ')}]`,
    })

    // Get final response after tool execution
    const finalResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 500,
      messages,
    })

    assistantMessage = finalResponse.choices[0]?.message
    tokensUsed += finalResponse.usage?.total_tokens || 0
  }

  // Log usage
  await db.aIUsageLog.create({
    data: {
      cleanerId: context.cleanerId,
      conversationId,
      action: bookingCreated ? 'BOOKING_CREATED' : 'RESPONSE',
      tokensUsed,
    },
  })

  return {
    response: assistantMessage?.content || 'I apologize, I could not generate a response.',
    tokensUsed,
    bookingCreated,
  }
}

/**
 * Enable AI for a cleaner (creates default settings)
 */
export async function enableAIForCleaner(cleanerId: string): Promise<void> {
  await db.cleanerAISettings.upsert({
    where: { cleanerId },
    create: {
      cleanerId,
      aiEnabled: true,
      autoBooking: true,
    },
    update: {
      aiEnabled: true,
    },
  })
}

/**
 * Disable AI for a cleaner
 */
export async function disableAIForCleaner(cleanerId: string): Promise<void> {
  await db.cleanerAISettings.update({
    where: { cleanerId },
    data: { aiEnabled: false },
  })
}
