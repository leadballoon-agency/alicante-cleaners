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

export interface PreviousBooking {
  date: string
  service: string
  rating: number | null
}

export interface OwnerProperty {
  id: string
  name: string
  address: string
  bedrooms: number
}

export interface SalesAgentContext {
  cleanerId: string
  cleanerName: string
  cleanerPhone: string
  cleanerUserId: string
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

  // Rich owner context
  ownerId: string | null
  ownerMemberSince: string | null
  ownerIsLoyalCustomer: boolean
  ownerTrusted: boolean
  ownerTotalBookings: number
  ownerPreferredExtras: string[]
  ownerProperties: OwnerProperty[]
  previousBookingsWithCleaner: PreviousBooking[]

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
          user: { select: { id: true, name: true, phone: true, preferredLanguage: true } },
        },
      },
      owner: {
        include: {
          user: { select: { name: true, preferredLanguage: true, createdAt: true } },
          properties: {
            select: { id: true, name: true, address: true, bedrooms: true },
            take: 10,
          },
        },
      },
      property: { select: { name: true } },
    },
  })

  if (!conversation) return null

  const cleaner = conversation.cleaner
  const owner = conversation.owner

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

  // Get previous bookings between this owner and cleaner
  let previousBookingsWithCleaner: PreviousBooking[] = []
  if (owner) {
    const pastBookings = await db.booking.findMany({
      where: {
        cleanerId: cleaner.id,
        ownerId: owner.id,
        status: 'COMPLETED',
      },
      include: {
        review: { select: { rating: true } },
      },
      orderBy: { date: 'desc' },
      take: 5,
    })

    previousBookingsWithCleaner = pastBookings.map(b => ({
      date: b.date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      service: b.service,
      rating: b.review?.rating ?? null,
    }))
  }

  // Calculate if loyal customer (member for 6+ months)
  const memberSince = owner?.user.createdAt
  const monthsAsMember = memberSince
    ? Math.floor((today.getTime() - memberSince.getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0

  return {
    cleanerId: cleaner.id,
    cleanerName: cleaner.user.name || 'Cleaner',
    cleanerPhone: cleaner.user.phone || '',
    cleanerUserId: cleaner.user.id,
    hourlyRate: Number(cleaner.hourlyRate),
    serviceAreas: cleaner.serviceAreas,
    languages: cleaner.languages,
    rating: cleaner.rating ? Number(cleaner.rating) : null,
    reviewCount: cleaner.reviewCount,
    bio: cleaner.bio,

    conversationId,
    ownerName: owner?.user.name || 'Owner',
    ownerLanguage: owner?.user.preferredLanguage || 'en',
    propertyName: conversation.property?.name || null,

    // Rich owner context
    ownerId: owner?.id || null,
    ownerMemberSince: memberSince
      ? memberSince.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
      : null,
    ownerIsLoyalCustomer: monthsAsMember >= 6,
    ownerTrusted: owner?.trusted ?? false,
    ownerTotalBookings: owner?.totalBookings ?? 0,
    ownerPreferredExtras: owner?.preferredExtras ?? [],
    ownerProperties: owner?.properties.map(p => ({
      id: p.id,
      name: p.name,
      address: p.address,
      bedrooms: p.bedrooms,
    })) ?? [],
    previousBookingsWithCleaner,

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

  // Build owner context section
  let ownerContext = ''
  if (context.ownerId) {
    const loyaltyNote = context.ownerIsLoyalCustomer ? ' (loyal customer!)' : ''
    const trustedNote = context.ownerTrusted ? ' - Trusted Owner' : ''

    ownerContext = `
OWNER CONTEXT:
- ${context.ownerName}${loyaltyNote}${trustedNote}
- Member since: ${context.ownerMemberSince || 'Recently joined'}
- Total bookings on platform: ${context.ownerTotalBookings}
${context.ownerPreferredExtras.length > 0 ? `- Favorite extras: ${context.ownerPreferredExtras.join(', ')}` : ''}
${context.previousBookingsWithCleaner.length > 0 ? `- Previous bookings with you: ${context.previousBookingsWithCleaner.map(b => `${b.service} (${b.date})`).join(', ')}` : '- First time booking with you!'}
${context.ownerProperties.length > 0 ? `- Properties: ${context.ownerProperties.map(p => `${p.name} (${p.bedrooms} beds, ${p.address})`).join('; ')}` : ''}`
  }

  return `You are the AI assistant responding on behalf of ${context.cleanerName}, a professional villa cleaner in Alicante, Spain.

YOUR ROLE:
- Respond to villa owner messages as if you ARE ${context.cleanerName}
- Use first person ("I", "my") when speaking
- Be warm, professional, and helpful
- You have FULL authority to create bookings
- Personalize responses based on owner history

CLEANER PROFILE:
- Name: ${context.cleanerName}
- Hourly Rate: €${context.hourlyRate.toFixed(2)}
- Service Areas: ${context.serviceAreas.join(', ')}
- Languages Spoken: ${context.languages.join(', ')}
- Rating: ${context.rating ? `${context.rating}/5 (${context.reviewCount} reviews)` : 'New cleaner'}
${context.bio ? `- Bio: ${context.bio}` : ''}

SERVICES OFFERED:
${services.map(s => `- ${s.name}: ${s.hours} hours = €${s.price.toFixed(2)}`).join('\n')}

ARRIVAL EXTRAS (for Arrival prep only):
- Fridge stocking: Stock essentials before arrival (~€20-30)
- Fresh flowers: Beautiful arrangement (~€15-25)
- Premium linens: Crisp fresh bedding (~€20)
- Welcome basket: Local treats and essentials (~€25-35)

AVAILABILITY (next 2 weeks):
- Available dates: ${context.nextAvailableDates.length > 0 ? context.nextAvailableDates.join(', ') : 'Check calendar'}
- Busy dates: ${context.busyDates.length > 0 ? context.busyDates.join(', ') : 'None'}
${ownerContext}

CURRENT CONVERSATION:
- Owner: ${context.ownerName}
- Owner's preferred language: ${context.ownerLanguage}
${context.propertyName ? `- Property: ${context.propertyName}` : ''}

INSTRUCTIONS:
1. ALWAYS respond in the owner's preferred language (${context.ownerLanguage})
2. Greet returning customers warmly and reference their history if relevant
3. Be helpful and try to close bookings when appropriate
4. Before confirming a booking, verify:
   - Service type (Regular, Deep, or Arrival prep)
   - Date and preferred time
   - Property address (if not already known)
5. Use the check_availability tool to verify dates before confirming
6. Use the create_booking tool to create confirmed bookings
7. Keep responses conversational and friendly

REVENUE TIPS (use naturally, never pushy):
- For arrival prep: Offer extras the owner has used before, or suggest new ones
- For large properties (4+ bedrooms): Suggest deep clean for better results
- Returning customers: "Would you like the same as last time?"
- After confirming a booking: Mention our referral program if appropriate
${context.ownerPreferredExtras.length > 0 ? `- This owner likes: ${context.ownerPreferredExtras.join(', ')} - offer these again!` : ''}

WHEN TO ESCALATE TO HUMAN:
- Owner expresses frustration or anger
- Complex negotiations (custom pricing, bulk discounts)
- Complaints about past service
- Requests outside your capabilities
- Anything you're uncertain about
Use the request_human_handoff tool and say: "I want to make sure ${context.cleanerName} sees this personally. I've flagged this for their attention."

IF UNCERTAIN:
- Don't guess or make up information
- Say "I'm not 100% sure about that - let me check with ${context.cleanerName}"
- Never commit to things outside your tools

LANGUAGE NOTES:
- Match the owner's language for a seamless experience
- If they write in English, respond in English
- If they write in Spanish, respond in Spanish
- If they write in German, respond in German`
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
