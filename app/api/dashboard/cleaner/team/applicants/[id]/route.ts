import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// PATCH /api/dashboard/cleaner/team/applicants/[id] - Accept or reject an applicant
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: conversationId } = await params
    const { action } = await request.json()

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Get the cleaner profile
    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      include: {
        ledTeam: true,
      },
    })

    if (!cleaner || !cleaner.teamLeader) {
      return NextResponse.json({ error: 'Not a team leader' }, { status: 403 })
    }

    // Get the conversation
    const conversation = await db.applicantConversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation || conversation.teamLeaderId !== cleaner.id) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Conversation already processed' }, { status: 400 })
    }

    // Get the applicant
    const applicant = await db.cleaner.findUnique({
      where: { id: conversation.applicantId },
    })

    if (!applicant || applicant.status !== 'PENDING') {
      return NextResponse.json({ error: 'Applicant not found or not pending' }, { status: 404 })
    }

    if (action === 'accept') {
      // Accept the applicant - activate and add to team
      await db.$transaction(async (tx) => {
        // Update applicant status to ACTIVE and set verification
        await tx.cleaner.update({
          where: { id: applicant.id },
          data: {
            status: 'ACTIVE',
            verifiedByTeamLeaderId: cleaner.id,
            verifiedAt: new Date(),
            teamId: cleaner.ledTeam?.id || null,
          },
        })

        // Update conversation status
        await tx.applicantConversation.update({
          where: { id: conversationId },
          data: { status: 'ACCEPTED' },
        })
      })

      return NextResponse.json({
        success: true,
        message: 'Applicant accepted and activated',
      })
    } else {
      // Reject the applicant
      await db.applicantConversation.update({
        where: { id: conversationId },
        data: { status: 'REJECTED' },
      })

      return NextResponse.json({
        success: true,
        message: 'Applicant rejected',
      })
    }
  } catch (error) {
    console.error('Error processing applicant:', error)
    return NextResponse.json(
      { error: 'Failed to process applicant' },
      { status: 500 }
    )
  }
}

// GET /api/dashboard/cleaner/team/applicants/[id] - Get conversation messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: conversationId } = await params

    // Get the cleaner profile
    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
    })

    if (!cleaner || !cleaner.teamLeader) {
      return NextResponse.json({ error: 'Not a team leader' }, { status: 403 })
    }

    // Get the conversation with messages
    const conversation = await db.applicantConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!conversation || conversation.teamLeaderId !== cleaner.id) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Get applicant details
    const applicant = await db.cleaner.findUnique({
      where: { id: conversation.applicantId },
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

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        status: conversation.status,
        summary: conversation.summary,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      applicant: {
        id: applicant?.id,
        name: applicant?.user.name || 'Unknown',
        photo: applicant?.user.image || null,
        phone: applicant?.user.phone || null,
        serviceAreas: applicant?.serviceAreas || [],
        hourlyRate: applicant?.hourlyRate ? Number(applicant.hourlyRate) : null,
        bio: applicant?.bio || null,
        status: applicant?.status || 'PENDING',
      },
      messages: conversation.messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}
