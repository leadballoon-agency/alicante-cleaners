import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/dashboard/cleaner/team/applicants - Get applicant conversations for team leader
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the cleaner profile
    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
    })

    if (!cleaner || !cleaner.teamLeader) {
      return NextResponse.json({ error: 'Not a team leader' }, { status: 403 })
    }

    // Get applicant conversations
    const conversations = await db.applicantConversation.findMany({
      where: {
        teamLeaderId: cleaner.id,
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Get applicant details for each conversation
    const applicantIds = conversations.map(c => c.applicantId)
    const applicants = await db.cleaner.findMany({
      where: { id: { in: applicantIds } },
      include: {
        user: {
          select: {
            name: true,
            image: true,
            phone: true,
          },
        },
      },
    })

    const applicantMap = new Map(applicants.map(a => [a.id, a]))

    // Get message counts for each conversation
    const messageCounts = await db.applicantMessage.groupBy({
      by: ['conversationId'],
      _count: { id: true },
      where: {
        conversationId: { in: conversations.map(c => c.id) },
      },
    })

    const messageCountMap = new Map(messageCounts.map(mc => [mc.conversationId, mc._count.id]))

    const formattedConversations = conversations.map(conv => {
      const applicant = applicantMap.get(conv.applicantId)
      return {
        id: conv.id,
        applicantId: conv.applicantId,
        applicantName: applicant?.user.name || 'Unknown',
        applicantPhoto: applicant?.user.image || null,
        applicantPhone: applicant?.user.phone || null,
        applicantServiceAreas: applicant?.serviceAreas || [],
        applicantHourlyRate: applicant?.hourlyRate ? Number(applicant.hourlyRate) : null,
        applicantBio: applicant?.bio || null,
        applicantStatus: applicant?.status || 'PENDING',
        status: conv.status,
        summary: conv.summary,
        messageCount: messageCountMap.get(conv.id) || 0,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }
    })

    return NextResponse.json({ conversations: formattedConversations })
  } catch (error) {
    console.error('Error fetching applicant conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applicant conversations' },
      { status: 500 }
    )
  }
}
