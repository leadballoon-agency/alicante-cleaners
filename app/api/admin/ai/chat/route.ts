import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { chatWithAdminAgent, AdminChatMessage } from '@/lib/ai/admin-agent'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    // Layer 1: Auth check
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Layer 2: Admin role check
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true },
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Parse request
    const body = await req.json()
    const { messages } = body as { messages: AdminChatMessage[] }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      )
    }

    // Get latest user message for logging
    const latestUserMessage = messages.filter(m => m.role === 'user').pop()

    // Chat with admin agent
    const { response, toolsUsed, model, toolCount } = await chatWithAdminAgent(
      messages,
      user.name || 'Admin',
      session.user.id
    )

    // Layer 3: Audit log with optimization stats
    console.log('[Admin AI]', {
      adminId: session.user.id,
      action: 'CHAT',
      input: (latestUserMessage?.content || '').substring(0, 100),
      toolsUsed,
      model,
      toolCount,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      message: response,
      toolsUsed,
      agentName: 'Admin Assistant',
    })
  } catch (error) {
    console.error('Error in admin AI chat:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to process chat request: ${errorMessage}` },
      { status: 500 }
    )
  }
}
