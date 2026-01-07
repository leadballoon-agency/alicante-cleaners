/**
 * Applicant Chat Endpoint
 *
 * POST /api/ai/applicant-chat
 *
 * Handles chat messages from PENDING cleaners (applicants) on team leader profile pages.
 * Stores conversations for team leader review and generates summaries.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOpenAI } from '@/lib/ai/agents'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: Request) {
  try {
    const { teamLeaderSlug, applicantId, message, history = [] } = await request.json()

    if (!teamLeaderSlug || !applicantId || !message) {
      return NextResponse.json(
        { error: 'Missing teamLeaderSlug, applicantId, or message' },
        { status: 400 }
      )
    }

    // Get team leader info
    const teamLeader = await db.cleaner.findUnique({
      where: { slug: teamLeaderSlug },
      include: {
        user: { select: { name: true } },
        ledTeam: { select: { name: true } },
      },
    })

    if (!teamLeader || !teamLeader.teamLeader) {
      return NextResponse.json(
        { error: 'Team leader not found' },
        { status: 404 }
      )
    }

    // Get applicant info
    const applicant = await db.cleaner.findUnique({
      where: { id: applicantId },
      include: {
        user: { select: { name: true, phone: true } },
      },
    })

    if (!applicant || applicant.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Applicant not found or not pending' },
        { status: 404 }
      )
    }

    // Get or create conversation
    let conversation = await db.applicantConversation.findUnique({
      where: {
        applicantId_teamLeaderId: {
          applicantId,
          teamLeaderId: teamLeader.id,
        },
      },
    })

    if (!conversation) {
      conversation = await db.applicantConversation.create({
        data: {
          applicantId,
          teamLeaderId: teamLeader.id,
        },
      })
    }

    // Store user message
    await db.applicantMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    })

    // Build system prompt for applicant chat
    const systemPrompt = `You are Clara, the AI assistant representing ${teamLeader.user.name}, a team leader at VillaCare cleaning service in Alicante, Spain.

YOUR ROLE:
- You're speaking with ${applicant.user.name}, a new cleaner who wants to join the platform
- Help ${teamLeader.user.name} learn about this applicant's experience and background
- Be warm and welcoming, but gather useful information for the team leader
- The team leader will review this conversation later and decide whether to accept the applicant

TEAM LEADER INFO:
- Name: ${teamLeader.user.name}
${teamLeader.ledTeam ? `- Team: ${teamLeader.ledTeam.name}` : ''}
- Service Areas: ${teamLeader.serviceAreas.join(', ')}

APPLICANT INFO:
- Name: ${applicant.user.name}
- Service Areas: ${applicant.serviceAreas.join(', ')}
- Hourly Rate: €${applicant.hourlyRate}
${applicant.bio ? `- Bio: ${applicant.bio}` : ''}

THINGS TO LEARN ABOUT THE APPLICANT:
1. Their cleaning experience (years, types of properties)
2. Why they want to join VillaCare
3. Their availability and schedule flexibility
4. Whether they have their own transport
5. Languages they speak (important for villa owners)
6. Any existing reviews they have (Google, TripAdvisor, Airbnb, etc.) - ask for links if they have them
7. Any questions they have about working with the team

IMPORTANT RULES:
- Be conversational and friendly - this should feel like a casual chat
- Answer in the language the applicant uses (Spanish or English most likely)
- Don't make promises about acceptance - that's ${teamLeader.user.name}'s decision
- If they ask when they'll hear back, say the team leader will review conversations when they have time
- Keep the conversation focused on learning about them as a cleaner
- Be encouraging but professional`

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
      max_tokens: 400,
      messages,
    })

    const assistantMessage = response.choices[0]?.message?.content ||
      'Sorry, I had trouble responding. Please try again.'

    // Store assistant message
    await db.applicantMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: assistantMessage,
      },
    })

    // Update conversation timestamp
    await db.applicantConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    })

    // Generate summary after meaningful conversation
    // Check if we should generate/update summary (after 4+ messages, then every 4 more)
    const messageCount = await db.applicantMessage.count({
      where: { conversationId: conversation.id },
    })

    // Generate first summary at 4 messages, then update every 4 messages
    if (messageCount >= 4 && messageCount % 4 === 0) {
      // Generate summary in background (don't wait for it)
      generateConversationSummary(conversation.id, teamLeader.user.name || 'Team Leader').catch(console.error)
    }

    // Log usage
    await db.aIUsageLog.create({
      data: {
        cleanerId: teamLeader.id,
        conversationId: conversation.id,
        action: 'APPLICANT_CHAT',
        tokensUsed: response.usage?.total_tokens || 0,
      },
    })

    return NextResponse.json({
      response: assistantMessage,
      conversationId: conversation.id,
    })
  } catch (error) {
    console.error('Applicant chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

async function generateConversationSummary(conversationId: string, teamLeaderName: string) {
  try {
    const messages = await db.applicantMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    })

    if (messages.length < 3) return // Not enough context for summary

    const conversation = await db.applicantConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: false,
      },
    })

    if (!conversation) return

    const applicant = await db.cleaner.findUnique({
      where: { id: conversation.applicantId },
      include: {
        user: { select: { name: true } },
      },
    })

    const openai = getOpenAI()

    const summaryPrompt = `Summarize this conversation between an applicant cleaner and a team leader's AI assistant. Focus on:
1. Key information learned about the applicant (experience, skills, availability)
2. Their motivations for joining
3. Any concerns or red flags
4. Overall impression

Applicant: ${applicant?.user.name || 'Unknown'}

Conversation:
${messages.map(m => `${m.role === 'user' ? 'Applicant' : 'AI'}: ${m.content}`).join('\n')}

Write a concise 2-3 sentence summary for ${teamLeaderName} to review:`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 200,
      messages: [{ role: 'user', content: summaryPrompt }],
    })

    const summary = response.choices[0]?.message?.content

    if (summary) {
      await db.applicantConversation.update({
        where: { id: conversationId },
        data: {
          summary,
          lastSummarizedAt: new Date(),
        },
      })
    }
  } catch (error) {
    console.error('Error generating conversation summary:', error)
  }
}
