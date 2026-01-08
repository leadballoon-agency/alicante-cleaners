import { db } from '@/lib/db'

/**
 * Link existing chat conversations to a newly signed up owner
 * Matches by email, phone, or sessionId
 */
export async function linkChatConversations(
  userId: string,
  email: string | null,
  phone: string | null,
  sessionId?: string
): Promise<{ linked: number }> {
  try {
    // Find the owner for this user
    const owner = await db.owner.findUnique({
      where: { userId },
    })

    if (!owner) {
      console.log('[Link Conversations] No owner found for user:', userId)
      return { linked: 0 }
    }

    // Build OR conditions for matching
    const orConditions: Array<Record<string, string>> = []
    if (email) orConditions.push({ visitorEmail: email })
    if (phone) orConditions.push({ visitorPhone: phone })
    if (sessionId) orConditions.push({ sessionId })

    if (orConditions.length === 0) {
      return { linked: 0 }
    }

    // Find unlinked conversations matching this owner's identifiers
    const conversations = await db.publicChatConversation.findMany({
      where: {
        ownerId: null, // Not yet linked
        OR: orConditions,
      },
    })

    if (conversations.length === 0) {
      return { linked: 0 }
    }

    // Link all matching conversations
    const result = await db.publicChatConversation.updateMany({
      where: {
        id: { in: conversations.map(c => c.id) },
      },
      data: {
        ownerId: owner.id,
        linkedAt: new Date(),
      },
    })

    console.log(`[Link Conversations] Linked ${result.count} conversations to owner:`, owner.id)
    return { linked: result.count }
  } catch (error) {
    console.error('[Link Conversations] Error:', error)
    return { linked: 0 }
  }
}

/**
 * Link a specific conversation to an owner by conversation ID
 */
export async function linkConversationById(
  conversationId: string,
  ownerId: string
): Promise<boolean> {
  try {
    await db.publicChatConversation.update({
      where: { id: conversationId },
      data: {
        ownerId,
        linkedAt: new Date(),
      },
    })
    return true
  } catch (error) {
    console.error('[Link Conversations] Error linking by ID:', error)
    return false
  }
}
