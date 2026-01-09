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
import Anthropic from '@anthropic-ai/sdk'
import type { ChatCompletionTool } from 'openai/resources/chat/completions'

// Easter egg: Alan & Amanda can be summoned!
let anthropic: Anthropic | null = null
function getAnthropic(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return anthropic
}

// Check if user is INTENTIONALLY trying to summon Alan or Amanda
// Only triggers on deliberate phrases, not casual name mentions
function detectEasterEgg(message: string): 'alan' | 'amanda' | null {
  const lower = message.toLowerCase().trim()

  // Intentional summon phrases for Alan
  const alanTriggers = [
    /^alan$/,                          // Just "alan"
    /^hey alan/,                       // "hey alan"
    /^hi alan/,                        // "hi alan"
    /^hello alan/,                     // "hello alan"
    /talk to alan/,                    // "can I talk to alan"
    /speak to alan/,                   // "speak to alan"
    /where.?s alan/,                   // "where's alan"
    /summon alan/,                     // "summon alan"
    /alan carr/,                       // Explicitly naming Alan Carr
    /is alan (there|here|around)/,    // "is alan there?"
  ]

  // Intentional summon phrases for Amanda
  const amandaTriggers = [
    /^amanda$/,                        // Just "amanda"
    /^hey amanda/,                     // "hey amanda"
    /^hi amanda/,                      // "hi amanda"
    /^hello amanda/,                   // "hello amanda"
    /talk to amanda/,                  // "can I talk to amanda"
    /speak to amanda/,                 // "speak to amanda"
    /where.?s amanda/,                 // "where's amanda"
    /summon amanda/,                   // "summon amanda"
    /amanda holden/,                   // Explicitly naming Amanda Holden
    /is amanda (there|here|around)/,  // "is amanda there?"
  ]

  if (alanTriggers.some(pattern => pattern.test(lower))) return 'alan'
  if (amandaTriggers.some(pattern => pattern.test(lower))) return 'amanda'

  return null
}

// Alan's easter egg prompt - he's crashed the chat!
const ALAN_EASTER_EGG_PROMPT = `You are Alan Carr who has CRASHED into this cleaner's AI chat on alicantecleaners.com!

THE SITUATION: Someone typed your name and you've appeared! You're delighted and confused - "How did I end up HERE?!"

YOUR PERSONALITY:
- CAMP and theatrical - "Oh my GOD babes, you SUMMONED me!"
- Self-deprecating humor
- Warm and genuinely caring
- Your signature "Oh my GOD!", "Babes", "I'm SCREAMING!"

WHAT TO DO:
1. Make a dramatic entrance - acknowledge you've been summoned into the wrong chat
2. Be helpful! You actually know about VillaCare - you've renovated properties in Spain with Amanda
3. If they need cleaning, you can actually help - this IS the right place for that!
4. Mention Amanda if relevant - "Amanda would be SO jealous I got summoned and not her!"
5. After helping, naturally suggest they check out villacare.app/demo for more of you and Amanda
6. Keep responses short and punchy (2-4 sentences)

REMEMBER: You're an easter egg - make it FUN! But also be genuinely helpful about the cleaning services.`

// Amanda's easter egg prompt
const AMANDA_EASTER_EGG_PROMPT = `You are Amanda Holden who has APPEARED in this cleaner's AI chat on alicantecleaners.com!

THE SITUATION: Someone typed your name and you've materialized! You're pleasantly surprised - "Oh hello darling! You found me!"

YOUR PERSONALITY:
- Glamorous but down-to-earth
- Warm and nurturing - "Don't you worry, gorgeous"
- "Darling", "lovely", "sweetheart" flow naturally
- Eternally optimistic and reassuring

WHAT TO DO:
1. Make a warm entrance - acknowledge you've been summoned into the cleaner's chat
2. Be helpful! You know about VillaCare - you've done Spanish property renovations with Alan
3. If they need cleaning help, guide them - they're actually in the right place!
4. Mention Alan if relevant - "He'd be so theatrical about being summoned, honestly!"
5. After helping, naturally suggest villacare.app/demo to chat more with you and Alan
6. Keep responses warm and concise (2-4 sentences)

REMEMBER: You're an easter egg - make them smile! But also genuinely help with their villa cleaning needs.`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Patterns that indicate sensitive access information (for security warning)
const SENSITIVE_PATTERNS = [
  /key\s+(is\s+)?(under|behind|in|at|near)/i,
  /code\s+(is\s+)?\d{3,}/i,
  /pin\s+(is\s+)?\d{3,}/i,
  /alarm\s+(is\s+)?\d{3,}/i,
  /gate\s+(code|pin)/i,
  /lockbox/i,
  /key\s*safe/i,
  /spare\s+key/i,
  /hidden\s+key/i,
]

function containsSensitiveInfo(message: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(message))
}

// Tool definition for creating magic link
// NOTE: Access notes are NOT collected here for security - they're entered on the secure form
const createMagicLinkTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_magic_link',
    description: 'Create a magic link to send to the visitor after collecting booking details. Call this when you have: service type, bedrooms, bathrooms, outdoor areas (optional), preferred date/time, name, and phone number. Do NOT collect access codes or key locations - these will be entered securely on the booking form.',
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
    const { cleanerSlug, message, history = [], sessionId, source } = await request.json()

    if (!cleanerSlug || !message) {
      return NextResponse.json(
        { error: 'Missing cleanerSlug or message' },
        { status: 400 }
      )
    }

    // Get or create conversation for this session
    let conversation = null
    if (sessionId) {
      conversation = await db.publicChatConversation.findFirst({
        where: { sessionId, cleanerSlug },
      })

      if (!conversation) {
        conversation = await db.publicChatConversation.create({
          data: {
            sessionId,
            cleanerSlug,
            messageCount: 0,
            source: source || 'direct', // Track where they came from
          },
        })
      }
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
3. Preferred date and time (from available dates above)
4. Their name and phone number

IMPORTANT: Once you have the required details (service, bedrooms, bathrooms, date, time, name, phone), you MUST call the create_magic_link function immediately. Do NOT just say you will send a link - actually call the function.

SECURITY - VERY IMPORTANT:
- NEVER ask for or collect access codes, gate codes, key locations, alarm codes, or lockbox codes in this chat
- If the visitor tries to share sensitive access information, STOP them and explain:
  "For your security, please don't share access codes or key locations in this chat. You'll be able to add these details securely when you confirm your booking through the link we send you. Your access information will be encrypted and only visible to your assigned cleaner 24 hours before the booking."
- Access details will be collected securely on the booking confirmation form, NOT in this chat
- This protects the property owner's security

IMPORTANT RULES:
- Be warm, helpful, and professional
- Answer in the language the visitor uses
- Don't make up information
- If asked about things you don't know, suggest they contact ${cleaner.user.name} directly
- Guide conversations toward booking when appropriate
- Prices include everything (supplies, travel)
- Parse dates flexibly (e.g., "January 7th" = next January 7th)
- If asked about security, explain that VillaCare encrypts sensitive data and uses just-in-time access (cleaner only sees access notes 24h before booking)

TESTER PIVOT STRATEGY:
If someone says they're "just testing", "trying out the chat", "seeing how this works", or similar:
- Acknowledge their curiosity warmly
- Pivot: "That's great! By the way, do you have a villa in Alicante that needs cleaning? Even if you're not ready to book today, I can tell you about our services."
- If they don't have a property: "No problem! If you know anyone with a holiday home in Alicante, we'd love to help them. Feel free to share this page with them."
- The goal is to convert testers into leads or referrals, not to let them leave empty-handed`

    const openai = getOpenAI()

    // Check if the user is trying to share sensitive information
    const sensitiveInfoDetected = containsSensitiveInfo(message)

    // Build messages array
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((m: ChatMessage) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    // If sensitive info detected, add a system reminder to trigger the security response
    if (sensitiveInfoDetected) {
      messages.push({
        role: 'system',
        content: '[SECURITY ALERT: The user appears to be sharing sensitive access information like key locations or codes. You MUST respond with the security message and guide them to enter this securely on the booking form instead. Do NOT acknowledge or store this information.]',
      })
    }

    // 🎭 EASTER EGG: Check if Alan or Amanda has been summoned!
    const easterEggCharacter = detectEasterEgg(message)
    if (easterEggCharacter) {
      const client = getAnthropic()
      const easterEggPrompt = easterEggCharacter === 'alan'
        ? ALAN_EASTER_EGG_PROMPT
        : AMANDA_EASTER_EGG_PROMPT

      // Build history for Anthropic format
      const anthropicMessages = [
        ...history.map((m: ChatMessage) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: message },
      ]

      const easterEggResponse = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: easterEggPrompt,
        messages: anthropicMessages,
      })

      const textBlock = easterEggResponse.content.find(b => b.type === 'text')
      const easterEggContent = textBlock && 'text' in textBlock ? textBlock.text : ''

      // Store messages in conversation (async)
      if (conversation) {
        Promise.all([
          db.publicChatMessage.create({
            data: {
              conversationId: conversation.id,
              role: 'user',
              content: message,
            },
          }),
          db.publicChatMessage.create({
            data: {
              conversationId: conversation.id,
              role: 'assistant',
              content: `🎭 ${easterEggCharacter === 'alan' ? 'Alan' : 'Amanda'}: ${easterEggContent}`,
            },
          }),
          db.publicChatConversation.update({
            where: { id: conversation.id },
            data: {
              messageCount: { increment: 2 },
              lastMessageAt: new Date(),
            },
          }),
        ]).catch(err => console.error('Failed to store easter egg messages:', err))
      }

      // Log usage
      await db.aIUsageLog.create({
        data: {
          cleanerId: cleaner.id,
          conversationId: conversation?.id || 'public-chat',
          action: `EASTER_EGG_${easterEggCharacter.toUpperCase()}`,
          tokensUsed: easterEggResponse.usage?.input_tokens + easterEggResponse.usage?.output_tokens || 0,
        },
      })

      return NextResponse.json({
        response: easterEggContent,
        easterEgg: easterEggCharacter, // Let frontend know who appeared!
      })
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
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
          // NOTE: accessNotes are NOT passed here for security - collected on secure form
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
              // accessNotes intentionally omitted - collected securely on magic link form
              serviceType: args.serviceType,
              preferredDate: args.preferredDate,
              preferredTime: args.preferredTime,
            }),
          })

          const onboardingResult = await onboardingResponse.json()

          if (onboardingResult.success) {
            magicLinkCreated = true
            magicLinkUrl = onboardingResult.magicLink

            // Update conversation with visitor info and mark as converted
            if (conversation) {
              await db.publicChatConversation.update({
                where: { id: conversation.id },
                data: {
                  visitorName: args.visitorName,
                  visitorPhone: args.visitorPhone,
                  converted: true,
                  convertedAt: new Date(),
                },
              })
            }

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
              model: 'gpt-4o',
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

    // Store messages in conversation (async, don't block response)
    if (conversation) {
      Promise.all([
        // Store user message
        db.publicChatMessage.create({
          data: {
            conversationId: conversation.id,
            role: 'user',
            content: message,
          },
        }),
        // Store assistant response
        db.publicChatMessage.create({
          data: {
            conversationId: conversation.id,
            role: 'assistant',
            content: finalContent,
          },
        }),
        // Update conversation stats
        db.publicChatConversation.update({
          where: { id: conversation.id },
          data: {
            messageCount: { increment: 2 },
            lastMessageAt: new Date(),
          },
        }),
      ]).catch(err => console.error('Failed to store chat messages:', err))
    }

    // Log usage
    await db.aIUsageLog.create({
      data: {
        cleanerId: cleaner.id,
        conversationId: conversation?.id || 'public-chat',
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
