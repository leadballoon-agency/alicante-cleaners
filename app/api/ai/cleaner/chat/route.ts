import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { chatWithAgent, ChatMessage } from '@/lib/ai/agents'
import { buildCleanerContext } from '@/lib/ai/context'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { messages } = body as { messages: ChatMessage[] }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      )
    }

    // Build context for the cleaner
    const userContext = await buildCleanerContext(session.user.id)

    // Get response from agent
    const response = await chatWithAgent('cleaner', messages, userContext)

    return NextResponse.json({
      message: response,
      agentName: 'Pro Assistant',
    })
  } catch (error) {
    console.error('Error in cleaner chat:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}
