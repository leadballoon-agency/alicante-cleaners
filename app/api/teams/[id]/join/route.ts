import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// POST - Request to join a team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'CLEANER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: teamId } = await params
    const body = await request.json().catch(() => ({}))
    const { message } = body

    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      include: {
        memberOfTeam: true,
        ledTeam: true,
      },
    })

    if (!cleaner) {
      return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 })
    }

    // Can't join if already in a team
    if (cleaner.memberOfTeam || cleaner.ledTeam) {
      return NextResponse.json(
        { error: 'You are already in a team. Leave your current team first.' },
        { status: 400 }
      )
    }

    // Verify team exists
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: { leader: true },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Can't join your own team (if you're the leader)
    if (team.leaderId === cleaner.id) {
      return NextResponse.json(
        { error: 'You cannot join your own team' },
        { status: 400 }
      )
    }

    // Check for existing pending request
    const existingRequest = await db.teamJoinRequest.findUnique({
      where: {
        teamId_cleanerId: {
          teamId,
          cleanerId: cleaner.id,
        },
      },
    })

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return NextResponse.json(
          { error: 'You already have a pending request for this team' },
          { status: 400 }
        )
      }
      if (existingRequest.status === 'REJECTED') {
        // Allow re-requesting after rejection - update existing request
        await db.teamJoinRequest.update({
          where: { id: existingRequest.id },
          data: {
            status: 'PENDING',
            message: message || null,
            respondedAt: null,
            createdAt: new Date(),
          },
        })

        return NextResponse.json({
          success: true,
          message: 'Join request submitted',
        })
      }
    }

    // Create new join request
    await db.teamJoinRequest.create({
      data: {
        teamId,
        cleanerId: cleaner.id,
        message: message || null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Join request submitted. The team leader will review your request.',
    })
  } catch (error) {
    console.error('Error requesting to join team:', error)
    return NextResponse.json(
      { error: 'Failed to submit join request' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel a pending join request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'CLEANER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: teamId } = await params

    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
    })

    if (!cleaner) {
      return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 })
    }

    // Find and delete the pending request
    const request_record = await db.teamJoinRequest.findUnique({
      where: {
        teamId_cleanerId: {
          teamId,
          cleanerId: cleaner.id,
        },
      },
    })

    if (!request_record || request_record.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'No pending request found for this team' },
        { status: 404 }
      )
    }

    await db.teamJoinRequest.delete({
      where: { id: request_record.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Join request cancelled',
    })
  } catch (error) {
    console.error('Error cancelling join request:', error)
    return NextResponse.json(
      { error: 'Failed to cancel join request' },
      { status: 500 }
    )
  }
}
