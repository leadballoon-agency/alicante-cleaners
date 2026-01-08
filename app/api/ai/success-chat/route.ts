/**
 * Cleaner Success Coach Chat Endpoint
 *
 * POST /api/ai/success-chat
 *
 * Authenticated endpoint for cleaners to chat with their Success Coach AI.
 * Provides profile analysis, stats, and personalized growth advice.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { chatWithSuccessAgent, getSuccessGreeting, SuccessChatMessage } from '@/lib/ai/success-agent'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get cleaner record
    const cleaner = await db.cleaner.findFirst({
      where: { userId: session.user.id },
      select: { id: true, slug: true },
    })

    if (!cleaner) {
      return NextResponse.json(
        { error: 'Cleaner profile not found' },
        { status: 403 }
      )
    }

    // Parse request
    const body = await req.json()
    const { messages } = body as { messages: SuccessChatMessage[] }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      )
    }

    // Chat with success agent
    const { response, toolsUsed, unlocked } = await chatWithSuccessAgent(
      messages,
      cleaner.id
    )

    // Log for debugging
    console.log('[Success Agent]', {
      cleanerId: cleaner.id,
      action: 'CHAT',
      toolsUsed,
      unlocked,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      message: response,
      toolsUsed,
      unlocked,
      agentName: 'Success Coach',
    })
  } catch (error) {
    console.error('Error in success chat:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai/success-chat
 *
 * Get initial greeting and stats for the success dashboard
 */
export async function GET() {
  try {
    // Auth check
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get cleaner record
    const cleaner = await db.cleaner.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!cleaner) {
      return NextResponse.json(
        { error: 'Cleaner profile not found' },
        { status: 403 }
      )
    }

    // Get greeting and stats
    const { greeting, stats } = await getSuccessGreeting(cleaner.id)

    return NextResponse.json({
      greeting,
      stats,
    })
  } catch (error) {
    console.error('Error getting success greeting:', error)
    return NextResponse.json(
      { error: 'Failed to load success data' },
      { status: 500 }
    )
  }
}
