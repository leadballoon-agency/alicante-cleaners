import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

// [id] here is the MESSAGE id — a Prisma cuid, NOT a UUID (see commit
// 7ab03ab: a previous .uuid() check on a cuid field silently broke sends).
const reactionSchema = z.object({
  emoji: z.enum(['👍', '❤️', '✅']).nullable(),
})

// POST /api/messages/[id]/reaction - Set/replace/remove the caller's
// reaction on a message. Tapping the same emoji again (or sending
// emoji: null) removes it; tapping a different emoji replaces it.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { id: messageId } = await params

    const parseResult = reactionSchema.safeParse(await request.json())
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { emoji } = parseResult.data

    // Verify the message exists and the caller is a participant of its
    // conversation — same owner/cleaner/admin participant check used by
    // /api/messages/conversations/[id].
    const message = await db.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          select: {
            adminId: true,
            owner: { select: { user: { select: { id: true } } } },
            cleaner: { select: { user: { select: { id: true } } } },
          },
        },
      },
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    const { conversation } = message
    const isOwner = conversation.owner?.user.id === userId
    const isCleaner = conversation.cleaner.user.id === userId
    const isAdmin = conversation.adminId === userId

    if (!isOwner && !isCleaner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!emoji) {
      await db.messageReaction.deleteMany({ where: { messageId, userId } })
      return NextResponse.json({ ok: true, reaction: null })
    }

    const existing = await db.messageReaction.findUnique({
      where: { messageId_userId: { messageId, userId } },
    })

    if (existing && existing.emoji === emoji) {
      // Tapping the same emoji again toggles it off.
      await db.messageReaction.delete({
        where: { messageId_userId: { messageId, userId } },
      })
      return NextResponse.json({ ok: true, reaction: null })
    }

    await db.messageReaction.upsert({
      where: { messageId_userId: { messageId, userId } },
      create: { messageId, userId, emoji },
      update: { emoji },
    })

    return NextResponse.json({ ok: true, reaction: emoji })
  } catch (error) {
    console.error('Error updating message reaction:', error)
    return NextResponse.json(
      { error: 'Failed to update reaction' },
      { status: 500 }
    )
  }
}
