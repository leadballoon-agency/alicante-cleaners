import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// PATCH - Approve or reject a join request (leader only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'CLEANER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: requestId } = await params
    const body = await request.json()
    const { action } = body // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      include: { ledTeam: true },
    })

    if (!cleaner?.ledTeam) {
      return NextResponse.json(
        { error: 'You do not lead a team' },
        { status: 403 }
      )
    }

    // Find the join request
    const joinRequest = await db.teamJoinRequest.findUnique({
      where: { id: requestId },
      include: { cleaner: true },
    })

    if (!joinRequest) {
      return NextResponse.json(
        { error: 'Join request not found' },
        { status: 404 }
      )
    }

    // Verify request is for this team
    if (joinRequest.teamId !== cleaner.ledTeam.id) {
      return NextResponse.json(
        { error: 'This request is not for your team' },
        { status: 403 }
      )
    }

    // Verify request is still pending
    if (joinRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This request has already been processed' },
        { status: 400 }
      )
    }

    // Check if cleaner is already in a team
    if (action === 'approve' && joinRequest.cleaner.teamId) {
      return NextResponse.json(
        { error: 'This cleaner is already in a team' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Approve: Update request status, add cleaner to team, and ACTIVATE them
      await db.$transaction([
        db.teamJoinRequest.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
            respondedAt: new Date(),
          },
        }),
        db.cleaner.update({
          where: { id: joinRequest.cleanerId },
          data: {
            teamId: cleaner.ledTeam.id,
            status: 'ACTIVE',
            verifiedByTeamLeaderId: cleaner.id,
            verifiedAt: new Date(),
          },
        }),
      ])

      return NextResponse.json({
        success: true,
        message: 'Request approved. Cleaner activated and added to team.',
      })
    } else {
      // Reject: Just update request status
      await db.teamJoinRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          respondedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Request rejected.',
      })
    }
  } catch (error) {
    console.error('Error processing join request:', error)
    return NextResponse.json(
      { error: 'Failed to process join request' },
      { status: 500 }
    )
  }
}
