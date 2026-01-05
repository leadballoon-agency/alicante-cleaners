/**
 * Public AI Chat Endpoint
 *
 * POST /api/ai/public-chat
 *
 * Handles chat messages from non-authenticated visitors on cleaner profile pages.
 * The AI acts as the cleaner's assistant, answering questions and collecting
 * property details to onboard new owners.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOpenAI } from '@/lib/ai/agents'
import type { ChatCompletionTool } from 'openai/resources/chat/completions'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Tool definition for creating magic link
const createMagicLinkTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_magic_link',
    description: 'Create a magic link to send to the visitor after collecting all their booking details. Call this when you have: service type, bedrooms, bathrooms, outdoor areas, access details, preferred date/time, name, and phone number.',
    parameters: {
      type: 'object',
      properties: {
        visitorName: {
          type: 'string',
          description: 'The visitor\'s full name',
        },
        visitorPhone: {
          type: 'string',
          description: 'The visitor\'s phone number (with country code if provided)',
        },
        bedrooms: {
          type: 'number',
          description: 'Number of bedrooms in the property',
        },
        bathrooms: {
          type: 'number',
          description: 'Number of bathrooms in the property',
        },
        outdoorAreas: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of outdoor areas (e.g., ["pool", "garden", "terrace"])',
        },
        accessNotes: {
          type: 'string',
          description: 'Access details like key location, gate codes, parking instructions',
        },
        serviceType: {
          type: 'string',
          enum: ['regular', 'deep', 'arrival'],
          description: 'Type of cleaning service: regular, deep, or arrival',
        },
        preferredDate: {
          type: 'string',
          description: 'Preferred date in YYYY-MM-DD format',
        },
        preferredTime: {
          type: 'string',
          description: 'Preferred time (e.g., "10:00 AM")',
        },
      },
      required: ['visitorName', 'visitorPhone', 'bedrooms', 'bathrooms', 'serviceType', 'preferredDate', 'preferredTime'],
    },
  },
}

export async function POST(request: Request) {
  try {
    const { cleanerSlug, message, history = [] } = await request.json()

    if (!cleanerSlug || !message) {
      return NextResponse.json(
        { error: 'Missing cleanerSlug or message' },
        { status: 400 }
      )
    }

    // Get cleaner info
    const cleaner = await db.cleaner.findUnique({
      where: { slug: cleanerSlug },
      include: {
        user: { select: { name: true } },
      },
    })

    if (!cleaner) {
      return NextResponse.json(
        { error: 'Cleaner not found' },
        { status: 404 }
      )
    }

    // Get availability for next 2 weeks
    const today = new Date()
    const twoWeeksLater = new Date(today)
    twoWeeksLater.setDate(today.getDate() + 14)

    const bookings = await db.booking.findMany({
      where: {
        cleanerId: cleaner.id,
        date: { gte: today, lte: twoWeeksLater },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: { date: true },
    })

    const busyDates = bookings.map(b => b.date.toISOString().split('T')[0])

    // Find next available dates
    const availableDates: string[] = []
    for (let i = 1; i <= 14 && availableDates.length < 5; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      if (!busyDates.includes(dateStr)) {
        availableDates.push(dateStr)
      }
    }

    // Calculate service prices
    const hourlyRate = Number(cleaner.hourlyRate)
    const services = [
      { name: 'Regular clean', hours: 3, price: hourlyRate * 3 },
      { name: 'Deep clean', hours: 5, price: hourlyRate * 5 },
      { name: 'Arrival prep', hours: 4, price: hourlyRate * 4 },
    ]

    // Build system prompt for public chat
    const systemPrompt = `You are the AI assistant for ${cleaner.user.name}, a professional villa cleaner in Alicante, Spain.

YOUR ROLE:
- Help potential customers learn about ${cleaner.user.name}'s services
- Answer questions about pricing and availability
- Guide them through booking a cleaning
- Collect information to create their booking

CLEANER INFO:
- Name: ${cleaner.user.name}
- Hourly Rate: €${hourlyRate}
- Service Areas: ${cleaner.serviceAreas.join(', ')}
- Rating: ${cleaner.rating ? `${Number(cleaner.rating).toFixed(1)}/5 (${cleaner.reviewCount} reviews)` : 'New cleaner'}
${cleaner.bio ? `- About: ${cleaner.bio}` : ''}

SERVICES & PRICING:
${services.map(s => `- ${s.name}: ${s.hours} hours = €${s.price}`).join('\n')}

AVAILABILITY (next 2 weeks):
- Available: ${availableDates.length > 0 ? availableDates.join(', ') : 'Contact for availability'}
- Booked: ${busyDates.length > 0 ? busyDates.join(', ') : 'None'}

ONBOARDING FLOW:
When someone wants to book, collect this information step by step:
1. Service type (regular, deep, or arrival prep)
2. Property details:
   - Number of bedrooms
   - Number of bathrooms
   - Outdoor areas (terrace, pool, garden) - optional
   - Access details (key location, gate code, parking)
3. Preferred date and time (from available dates above)
4. Their name and phone number

IMPORTANT: Once you have ALL required details (service, bedrooms, bathrooms, access, date, time, name, phone), you MUST call the create_magic_link function immediately. Do NOT just say you will send a link - actually call the function.

IMPORTANT RULES:
- Be warm, helpful, and professional
- Answer in the language the visitor uses
- Don't make up information
- If asked about things you don't know, suggest they contact ${cleaner.user.name} directly
- Guide conversations toward booking when appropriate
- Prices include everything (supplies, travel)
- Parse dates flexibly (e.g., "January 7th" = next January 7th)`

    const openai = getOpenAI()

    // Build messages array
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((m: ChatMessage) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 500,
      messages,
      tools: [createMagicLinkTool],
      tool_choice: 'auto',
    })

    let assistantMessage = response.choices[0]?.message
    let tokensUsed = response.usage?.total_tokens || 0
    let magicLinkCreated = false
    let magicLinkUrl: string | null = null

    // Handle tool calls
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== 'function') continue

        if (toolCall.function.name === 'create_magic_link') {
          const args = JSON.parse(toolCall.function.arguments)

          // Call the onboarding creation API
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          const onboardingResponse = await fetch(`${baseUrl}/api/ai/onboarding/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cleanerSlug,
              visitorName: args.visitorName,
              visitorPhone: args.visitorPhone,
              bedrooms: args.bedrooms,
              bathrooms: args.bathrooms,
              outdoorAreas: args.outdoorAreas || [],
              accessNotes: args.accessNotes,
              serviceType: args.serviceType,
              preferredDate: args.preferredDate,
              preferredTime: args.preferredTime,
            }),
          })

          const onboardingResult = await onboardingResponse.json()

          if (onboardingResult.success) {
            magicLinkCreated = true
            magicLinkUrl = onboardingResult.magicLink

            // Get final response from AI
            const toolResultMessages = [
              ...messages,
              {
                role: 'assistant' as const,
                content: assistantMessage.content || '',
              },
              {
                role: 'user' as const,
                content: `[System: Magic link created successfully! The link is: ${magicLinkUrl}. Tell the visitor that you've sent them an SMS with a link to confirm their booking. They should click the link to complete their account and finalize the booking with ${cleaner.user.name}.]`,
              },
            ]

            const finalResponse = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              temperature: 0.7,
              max_tokens: 300,
              messages: toolResultMessages,
            })

            assistantMessage = finalResponse.choices[0]?.message
            tokensUsed += finalResponse.usage?.total_tokens || 0
          }
        }
      }
    }

    const finalContent = assistantMessage?.content ||
      'Sorry, I had trouble responding. Please try again.'

    // Log usage
    await db.aIUsageLog.create({
      data: {
        cleanerId: cleaner.id,
        conversationId: 'public-chat',
        action: magicLinkCreated ? 'PUBLIC_CHAT_ONBOARDING' : 'PUBLIC_CHAT',
        tokensUsed,
      },
    })

    return NextResponse.json({
      response: finalContent,
      magicLinkCreated,
      magicLinkUrl: magicLinkCreated ? magicLinkUrl : undefined,
    })
  } catch (error) {
    console.error('Public chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
