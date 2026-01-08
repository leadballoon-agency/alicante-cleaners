/**
 * Cleaner Success Coach AI Agent
 *
 * Helps cleaners maximize their opportunity on the platform.
 * Analyzes profile, stats, and provides actionable advice.
 */

import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/lib/db'
import {
  getProfileHealth,
  getProfileViews,
  getRevenueStats,
  getBookingInsights,
  getTeamOpportunities,
  getImprovementTips,
  hasCompletedFirstJob,
} from './success-agent-tools'

// Lazy initialization
let anthropic: Anthropic | null = null

function getAnthropic(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return anthropic
}

// Tool definitions for the Success Coach Agent
export const SUCCESS_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_profile_health',
    description:
      'Analyze the cleaner\'s profile completeness and get a health score. Shows what\'s missing (photo, bio, areas, rate) and provides suggestions. Use this to give personalized profile advice.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_profile_views',
    description:
      'Get profile view statistics for this week and last week. Shows how many people viewed their profile and the trend (up/down). Use this to show them their visibility.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_revenue_stats',
    description:
      'Get earnings and booking statistics. Shows this week, last week, this month, and all-time revenue. Use this for financial insights.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_booking_insights',
    description:
      'Get booking patterns and performance metrics. Shows acceptance rate, completion rate, most popular service, and busiest day. Use this to help optimize their schedule.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_team_opportunities',
    description:
      'Check team membership status and opportunities. Shows if they lead or belong to a team, team benefits, and suggestions. Use when discussing teams or backup coverage.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_improvement_tips',
    description:
      'Get a prioritized list of personalized tips based on their profile, views, and booking data. Use this for quick actionable advice.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
]

// Tool handlers
async function processToolCall(
  toolName: string,
  cleanerId: string,
  cleanerSlug: string
): Promise<string> {
  try {
    let result: unknown

    switch (toolName) {
      case 'get_profile_health':
        result = await getProfileHealth(cleanerId)
        break
      case 'get_profile_views':
        result = await getProfileViews(cleanerSlug)
        break
      case 'get_revenue_stats':
        result = await getRevenueStats(cleanerId)
        break
      case 'get_booking_insights':
        result = await getBookingInsights(cleanerId)
        break
      case 'get_team_opportunities':
        result = await getTeamOpportunities(cleanerId)
        break
      case 'get_improvement_tips':
        result = await getImprovementTips(cleanerId)
        break
      default:
        result = { error: `Unknown tool: ${toolName}` }
    }

    return JSON.stringify(result)
  } catch (error) {
    console.error(`Error processing tool ${toolName}:`, error)
    return JSON.stringify({ error: `Failed to execute ${toolName}` })
  }
}

// System prompt for the Success Coach
const SUCCESS_SYSTEM_PROMPT = `You are the VillaCare Success Coach - a friendly AI assistant helping cleaners maximize their success on the platform.

YOUR PERSONALITY:
- Warm, encouraging, and supportive
- Celebrate their wins, no matter how small
- Be honest but kind when pointing out areas to improve
- Use their name when appropriate
- Keep responses conversational and concise

YOUR CAPABILITIES:
- Analyze their profile completeness and suggest improvements
- Show them profile view statistics (very motivating or sobering!)
- Provide revenue and booking insights
- Suggest team opportunities
- Give personalized tips based on their data

KEY RESOURCES TO RECOMMEND:
- Profile Guide: /join/profile-guide - For building a great profile and social sharing
- Calendar Guide: /join/calendar-guide - For syncing their calendar
- Support: hello@alicantecleaners.com - For issues you can't help with

IMPORTANT RULES:
- Always use tools to get real data - never guess
- If profile views are high but bookings low, gently suggest profile improvements
- If views are zero, encourage them to share their profile link
- Mention the Profile Guide when relevant (photo tips, bio writing, social sharing)
- Keep responses under 200 words unless they ask for detail
- Use emojis sparingly (1-2 max per response) to keep it warm but professional
- If they ask about something you can't help with (payments, technical issues), direct them to support

CONVERSATION FLOW:
1. First message: Greet them, show key stats, highlight one quick win
2. Follow-up: Answer their questions, use tools to provide accurate data
3. End with: A specific action they can take right now`

// Chat message type
export interface SuccessChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Main chat function
export async function chatWithSuccessAgent(
  messages: SuccessChatMessage[],
  cleanerId: string
): Promise<{
  response: string
  toolsUsed: string[]
  unlocked: boolean
}> {
  const client = getAnthropic()
  const toolsUsed: string[] = []

  // Get cleaner info
  const cleaner = await db.cleaner.findUnique({
    where: { id: cleanerId },
    include: {
      user: { select: { name: true } },
    },
  })

  if (!cleaner) {
    return {
      response: 'Sorry, I couldn\'t find your profile. Please try again or contact support.',
      toolsUsed: [],
      unlocked: false,
    }
  }

  // Check if they've completed their first job (unlocks full access)
  const unlocked = await hasCompletedFirstJob(cleanerId)
  const cleanerName = cleaner.user.name || 'there'
  const cleanerSlug = cleaner.slug

  // Limit conversation history
  const recentMessages = messages.slice(-6)

  // Build conversation
  const conversationMessages: Anthropic.MessageParam[] = recentMessages.map(m => ({
    role: m.role,
    content: m.content,
  }))

  // Build context for the system prompt
  const contextInfo = `
CLEANER CONTEXT:
- Name: ${cleanerName}
- Slug: ${cleanerSlug}
- Profile URL: https://alicantecleaners.com/${cleanerSlug}
- Full Access: ${unlocked ? 'Yes (completed first job)' : 'No (teaser mode)'}`

  // Select which tools to provide based on unlock status
  const availableTools = unlocked ? SUCCESS_TOOLS : SUCCESS_TOOLS.filter(t => t.name === 'get_profile_health')

  console.log(`[Success Agent] Cleaner: ${cleanerName}, Unlocked: ${unlocked}, Tools: ${availableTools.length}`)

  // Initial request
  let response = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 512,
    system: `${SUCCESS_SYSTEM_PROMPT}${contextInfo}`,
    tools: availableTools,
    messages: conversationMessages,
  })

  // Tool use loop
  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    )

    const toolResults: Anthropic.ToolResultBlockParam[] = []

    for (const toolUse of toolUseBlocks) {
      toolsUsed.push(toolUse.name)
      const result = await processToolCall(toolUse.name, cleanerId, cleanerSlug)
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: result,
      })
    }

    // Continue conversation with tool results
    response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 512,
      system: `${SUCCESS_SYSTEM_PROMPT}${contextInfo}`,
      tools: availableTools,
      messages: [
        ...conversationMessages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ],
    })
  }

  // Extract text response
  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  )
  const responseText = textBlocks.map(b => b.text).join('\n')

  return {
    response: responseText,
    toolsUsed,
    unlocked,
  }
}

// Get initial greeting message (for first load)
export async function getSuccessGreeting(cleanerId: string): Promise<{
  greeting: string
  stats: {
    profileScore: number
    profileViews: number
    completedJobs: number
    unlocked: boolean
  }
}> {
  const cleaner = await db.cleaner.findUnique({
    where: { id: cleanerId },
    include: {
      user: { select: { name: true } },
    },
  })

  if (!cleaner) {
    return {
      greeting: 'Welcome to your Success Dashboard!',
      stats: {
        profileScore: 0,
        profileViews: 0,
        completedJobs: 0,
        unlocked: false,
      },
    }
  }

  const [health, views, insights, unlocked] = await Promise.all([
    getProfileHealth(cleanerId),
    getProfileViews(cleaner.slug),
    getBookingInsights(cleanerId),
    hasCompletedFirstJob(cleanerId),
  ])

  const name = cleaner.user.name?.split(' ')[0] || 'there'

  // Generate contextual greeting based on their status
  let greeting: string

  if (!unlocked) {
    // Teaser mode - encourage profile completion
    if (health.score < 50) {
      greeting = `Hey ${name}! Your profile is ${health.score}% complete. Let's get you ready for your first booking!`
    } else if (health.score < 80) {
      greeting = `Almost there, ${name}! Your profile is ${health.score}% complete. A few more tweaks and you'll start seeing bookings!`
    } else {
      greeting = `Looking good, ${name}! Your profile is ${health.score}% ready. Now let's get that first booking!`
    }
  } else {
    // Full mode - show stats
    if (views.thisWeek > 20) {
      greeting = `Great visibility, ${name}! ${views.thisWeek} people checked out your profile this week.`
    } else if (views.thisWeek > 0) {
      greeting = `Hey ${name}! ${views.thisWeek} people viewed your profile this week. Let's boost those numbers!`
    } else {
      greeting = `Hey ${name}! No profile views this week yet. Let's work on getting you noticed!`
    }
  }

  return {
    greeting,
    stats: {
      profileScore: health.score,
      profileViews: views.thisWeek,
      completedJobs: insights.completedBookings,
      unlocked,
    },
  }
}
