import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/messages/conversations - List all conversations for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const role = session.user.role

    let conversations

    if (role === 'OWNER') {
      const owner = await db.owner.findUnique({
        where: { userId },
      })

      if (!owner) {
        return NextResponse.json({ conversations: [] })
      }

      conversations = await db.conversation.findMany({
        where: { ownerId: owner.id },
        include: {
          cleaner: {
            include: {
              user: {
                select: { name: true, image: true },
              },
            },
          },
          property: {
            select: { name: true, address: true },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      })

      // Transform for response
      const result = conversations.map((conv) => ({
        id: conv.id,
        otherParty: {
          id: conv.cleaner.id,
          name: conv.cleaner.user.name,
          image: conv.cleaner.user.image,
          role: 'CLEANER',
        },
        property: conv.property
          ? { name: conv.property.name, address: conv.property.address }
          : null,
        lastMessage: conv.messages[0] || null,
        updatedAt: conv.updatedAt,
      }))

      return NextResponse.json({ conversations: result })
    }

    if (role === 'CLEANER') {
      const cleaner = await db.cleaner.findUnique({
        where: { userId },
      })

      if (!cleaner) {
        return NextResponse.json({ conversations: [] })
      }

      conversations = await db.conversation.findMany({
        where: { cleanerId: cleaner.id },
        include: {
          owner: {
            include: {
              user: {
                select: { name: true, image: true },
              },
            },
          },
          admin: {
            select: { id: true, name: true, image: true },
          },
          property: {
            select: { name: true, address: true },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      })

      // Transform for response - handle both owner and admin conversations
      const result = conversations.map((conv) => {
        const isAdminConversation = conv.adminId && !conv.ownerId
        return {
          id: conv.id,
          otherParty: isAdminConversation
            ? {
                id: conv.admin!.id,
                name: conv.admin!.name || 'VillaCare',
                image: conv.admin!.image,
                role: 'ADMIN' as const,
              }
            : {
                id: conv.owner!.id,
                name: conv.owner!.user.name,
                image: conv.owner!.user.image,
                role: 'OWNER' as const,
              },
          property: conv.property
            ? { name: conv.property.name, address: conv.property.address }
            : null,
          lastMessage: conv.messages[0] || null,
          updatedAt: conv.updatedAt,
          isAdminConversation,
        }
      })

      return NextResponse.json({ conversations: result })
    }

    return NextResponse.json({ conversations: [] })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

// POST /api/messages/conversations - Start a new conversation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const role = session.user.role
    const { cleanerId, ownerId, propertyId } = await request.json()

    let conversation

    if (role === 'OWNER') {
      const owner = await db.owner.findUnique({
        where: { userId },
      })

      if (!owner || !cleanerId) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
      }

      // Check if conversation already exists
      conversation = await db.conversation.findUnique({
        where: {
          ownerId_cleanerId: {
            ownerId: owner.id,
            cleanerId,
          },
        },
      })

      if (!conversation) {
        conversation = await db.conversation.create({
          data: {
            ownerId: owner.id,
            cleanerId,
            propertyId: propertyId || null,
          },
        })
      }
    } else if (role === 'CLEANER') {
      const cleaner = await db.cleaner.findUnique({
        where: { userId },
      })

      if (!cleaner || !ownerId) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
      }

      // Check if conversation already exists
      conversation = await db.conversation.findUnique({
        where: {
          ownerId_cleanerId: {
            ownerId,
            cleanerId: cleaner.id,
          },
        },
      })

      if (!conversation) {
        conversation = await db.conversation.create({
          data: {
            ownerId,
            cleanerId: cleaner.id,
            propertyId: propertyId || null,
          },
        })
      }
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}
