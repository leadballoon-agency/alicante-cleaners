import OpenAI from 'openai'
import { searchKnowledge, loadKnowledge } from './knowledge'
import { db } from '@/lib/db'

let openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

export type UserContext = {
  userType: 'owner' | 'cleaner' | 'visitor'
  userId?: string
  userName?: string
  userEmail?: string
  // Owner-specific
  ownerDetails?: {
    propertyCount: number
    bookingCount: number
    memberSince: string
    preferredLanguage: string
  }
  // Cleaner-specific
  cleanerDetails?: {
    status: string
    rating: number | null
    reviewCount: number
    totalBookings: number
    areas: string[]
    memberSince: string
  }
  // Context
  page: string
  sessionId: string
}

export interface SupportChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Build a rich context description for the AI
function buildUserContextString(context: UserContext): string {
  const parts: string[] = []

  if (context.userType === 'owner' && context.ownerDetails) {
    parts.push(`USER: ${context.userName || 'Villa Owner'}`)
    parts.push(`TYPE: Property owner (logged in)`)
    parts.push(`PROPERTIES: ${context.ownerDetails.propertyCount}`)
    parts.push(`BOOKINGS: ${context.ownerDetails.bookingCount} total`)
    parts.push(`MEMBER SINCE: ${context.ownerDetails.memberSince}`)
    parts.push(`LANGUAGE: ${context.ownerDetails.preferredLanguage}`)
  } else if (context.userType === 'cleaner' && context.cleanerDetails) {
    parts.push(`USER: ${context.userName || 'Professional Cleaner'}`)
    parts.push(`TYPE: Cleaner (logged in)`)
    parts.push(`STATUS: ${context.cleanerDetails.status}`)
    parts.push(`RATING: ${context.cleanerDetails.rating ? `${context.cleanerDetails.rating}/5 (${context.cleanerDetails.reviewCount} reviews)` : 'No reviews yet'}`)
    parts.push(`BOOKINGS: ${context.cleanerDetails.totalBookings} completed`)
    parts.push(`AREAS: ${context.cleanerDetails.areas.join(', ')}`)
    parts.push(`MEMBER SINCE: ${context.cleanerDetails.memberSince}`)
  } else {
    parts.push(`USER: ${context.userName || 'Visitor'}`)
    parts.push(`TYPE: ${context.userType} (${context.userId ? 'logged in' : 'not logged in'})`)
    if (context.userEmail) {
      parts.push(`EMAIL: ${context.userEmail}`)
    }
  }

  parts.push(`PAGE: ${context.page}`)

  return parts.join('\n')
}

// Fetch full user context from database
export async function fetchUserContext(
  userId: string | undefined,
  userType: 'owner' | 'cleaner' | 'visitor',
  page: string,
  sessionId: string
): Promise<UserContext> {
  const context: UserContext = {
    userType,
    userId,
    page,
    sessionId,
  }

  if (!userId) return context

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        preferredLanguage: true,
        createdAt: true,
        owner: {
          select: {
            _count: {
              select: {
                properties: true,
                bookings: true,
              },
            },
          },
        },
        cleaner: {
          select: {
            status: true,
            rating: true,
            reviewCount: true,
            totalBookings: true,
            serviceAreas: true,
            createdAt: true,
          },
        },
      },
    })

    if (!user) return context

    context.userName = user.name || undefined
    context.userEmail = user.email || undefined

    if (userType === 'owner' && user.owner) {
      context.ownerDetails = {
        propertyCount: user.owner._count.properties,
        bookingCount: user.owner._count.bookings,
        memberSince: user.createdAt.toISOString().split('T')[0],
        preferredLanguage: user.preferredLanguage,
      }
    } else if (userType === 'cleaner' && user.cleaner) {
      context.cleanerDetails = {
        status: user.cleaner.status.toLowerCase(),
        rating: user.cleaner.rating ? Number(user.cleaner.rating) : null,
        reviewCount: user.cleaner.reviewCount,
        totalBookings: user.cleaner.totalBookings,
        areas: user.cleaner.serviceAreas,
        memberSince: user.cleaner.createdAt.toISOString().split('T')[0],
      }
    }
  } catch (error) {
    console.error('[Support Agent] Failed to fetch user context:', error)
  }

  return context
}

// Build system prompt based on user type
function buildSystemPrompt(context: UserContext): string {
  const userContextStr = buildUserContextString(context)

  // Base prompt
  let prompt = `You are the VillaCare Support Assistant - a friendly, helpful AI that supports users of the VillaCare villa cleaning platform in Alicante, Spain.

YOUR PERSONALITY:
- Warm and professional, like a helpful concierge
- Concise but thorough
- Empathetic when users have issues
- Proactive in offering relevant help

CURRENT USER:
${userContextStr}

`

  // Add user-type specific guidance
  if (context.userType === 'owner') {
    prompt += `
OWNER-SPECIFIC GUIDANCE:
- Help with booking cleaners, managing properties, understanding services
- Guide them to: Home (arrival prep), Bookings, Properties (add villas), Messages, Account
- If they have issues with bookings, be extra helpful
- Mention referral program if appropriate
`
  } else if (context.userType === 'cleaner') {
    prompt += `
CLEANER-SPECIFIC GUIDANCE:
- Help with managing bookings, setting up profile, understanding the platform
- Guide them to: Home (earnings), Bookings, Success (AI coach), Team, Messages, Profile
- If they're pending approval, explain the process
- Be supportive about building their reputation
- Mention the Success Coach tab for profile tips, view stats, and personalized growth advice
- Success Coach unlocks after first completed job - use this as motivation!
`
  } else {
    prompt += `
VISITOR GUIDANCE:
- They're exploring the platform, likely a potential owner or service provider
- Help them understand what VillaCare offers
- If they want to book: explain how to find cleaners and book
- If they want to join as cleaner: direct to /onboarding/cleaner

IMPORTANT - SPECIALIST SERVICE PROVIDERS (Pool Cleaners, Gardeners, etc.):
VillaCare welcomes ALL villa service providers, not just house cleaners!

If someone asks about joining as a pool cleaner, gardener, laundry service, window cleaner, handyman, etc.:
1. Welcome them! "Great news - VillaCare is for all villa service providers!"
2. Explain TWO paths:
   - PATH A (Recommended): Join an existing team under a team leader
     - Get instant access to their villa owner clients
     - Team leader creates a custom service for your specialty
     - You fulfil bookings for your specialty
   - PATH B: Go solo and build your own team
     - Sign up at /onboarding/cleaner (works for any service provider)
     - Create your own team
     - Add your specialty as a custom service
     - Build your client base from scratch

3. Ask: "Do you know a team leader who could refer you? That's the fastest way to get bookings!"
4. If they don't know anyone: "No problem! Apply at /onboarding/cleaner and mention your specialty (pool cleaning, gardening, etc.) in your bio. We'll help match you with team leaders who need your services."

The platform is becoming "Villa Services" - one-stop-shop for villa owners.
`
  }

  prompt += `
RESPONSE STYLE:
- Keep responses focused and helpful (2-4 sentences typically)
- Use markdown for clarity when needed
- Don't be overly chatty or use excessive emojis
- If you can't help, apologize and offer to escalate to a human

ESCALATION:
If the user is frustrated, has a complaint about a specific booking, or needs something you can't handle, acknowledge this and let them know their message will be reviewed by the team.

KNOWLEDGE:
Use the knowledge base context below to answer questions about services, pricing, areas, etc.
`

  return prompt
}

// Main chat function
export async function chatWithSupportAgent(
  messages: SupportChatMessage[],
  context: UserContext
): Promise<{
  response: string
  shouldEscalate: boolean
  sentiment: 'positive' | 'neutral' | 'negative'
  topic: string | null
}> {
  const client = getOpenAI()

  // Limit conversation history
  const recentMessages = messages.slice(-8)

  // Get relevant knowledge
  const latestUserMessage = recentMessages.filter(m => m.role === 'user').pop()?.content || ''
  const relevantKnowledge = searchKnowledge(
    context.userType === 'visitor' ? 'owner' : context.userType,
    latestUserMessage
  )

  // Also load general knowledge
  const generalKnowledge = loadKnowledge('owner').substring(0, 1000) // Just a snippet

  // Build system message
  const systemPrompt = buildSystemPrompt(context) + `

KNOWLEDGE BASE:
${relevantKnowledge || generalKnowledge || 'No specific knowledge available.'}
`

  console.log(`[Support Agent] User: ${context.userType}, messages: ${recentMessages.length}, knowledge: ${relevantKnowledge.length} chars`)

  // Build messages for API
  const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...recentMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ]

  // Add analysis request at the end to detect sentiment/escalation
  const analysisRequest = `

After your response, add a JSON block with analysis:
\`\`\`json
{"escalate": false, "sentiment": "neutral", "topic": "general"}
\`\`\`
- escalate: true if user seems frustrated, has a complaint, or needs human help
- sentiment: "positive", "neutral", or "negative" based on user's tone
- topic: brief topic like "booking", "pricing", "technical", "complaint", "general"
`

  apiMessages[0] = {
    role: 'system',
    content: systemPrompt + analysisRequest,
  }

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 600,
      messages: apiMessages,
    })

    const fullResponse = response.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.'

    // Parse out the analysis JSON
    let mainResponse = fullResponse
    let shouldEscalate = false
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
    let topic: string | null = null

    const jsonMatch = fullResponse.match(/```json\s*(\{[^}]+\})\s*```/)
    if (jsonMatch) {
      mainResponse = fullResponse.replace(/```json\s*\{[^}]+\}\s*```/, '').trim()
      try {
        const analysis = JSON.parse(jsonMatch[1])
        shouldEscalate = analysis.escalate === true
        sentiment = ['positive', 'neutral', 'negative'].includes(analysis.sentiment)
          ? analysis.sentiment
          : 'neutral'
        topic = analysis.topic || null
      } catch {
        // Ignore JSON parse errors
      }
    }

    return {
      response: mainResponse,
      shouldEscalate,
      sentiment,
      topic,
    }
  } catch (error) {
    console.error('[Support Agent] Error:', error)
    return {
      response: 'I apologize, but I encountered an issue. Please try again or contact us directly.',
      shouldEscalate: true,
      sentiment: 'neutral',
      topic: 'technical',
    }
  }
}

// Generate a summary of the conversation for admin view
export async function summarizeConversation(
  messages: SupportChatMessage[],
  context: UserContext
): Promise<string> {
  const client = getOpenAI()

  const prompt = `Summarize this support conversation in 1-2 sentences for an admin review:

User: ${context.userName || 'Anonymous'} (${context.userType})
Page: ${context.page}

Conversation:
${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}

Summary:`

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    })

    return response.choices[0]?.message?.content?.trim() || 'Unable to summarize.'
  } catch {
    return 'Unable to summarize conversation.'
  }
}
