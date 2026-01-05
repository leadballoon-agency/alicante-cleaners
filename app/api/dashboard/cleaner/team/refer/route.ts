import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/dashboard/cleaner/team/refer - Submit a cleaner referral
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the cleaner making the referral
    const cleaner = await db.cleaner.findFirst({
      where: { userId: session.user.id },
      include: {
        user: { select: { name: true } },
        ledTeam: true,
      },
    })

    if (!cleaner) {
      return NextResponse.json(
        { error: 'Cleaner profile not found' },
        { status: 404 }
      )
    }

    // Check if cleaner is a team leader
    if (!cleaner.teamLeader || !cleaner.ledTeam) {
      return NextResponse.json(
        { error: 'Only team leaders can refer cleaners' },
        { status: 403 }
      )
    }

    const { name, phone, recommendation } = await request.json()

    if (!name || !phone || !recommendation) {
      return NextResponse.json(
        { error: 'Name, phone, and recommendation are required' },
        { status: 400 }
      )
    }

    // Check if phone already exists
    const existingApplication = await db.cleaner_applications.findFirst({
      where: { phone },
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: 'This phone number has already been referred' },
        { status: 400 }
      )
    }

    // Check if a user with this phone already exists
    const existingUser = await db.user.findFirst({
      where: { phone },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this phone number already exists' },
        { status: 400 }
      )
    }

    // Create the cleaner application with the referral
    const referrerInfo = `${cleaner.user.name || 'Team Leader'} (Team: ${cleaner.ledTeam.name})`

    await db.cleaner_applications.create({
      data: {
        name,
        phone,
        referrer_name: referrerInfo,
        notes: `Recommendation from team leader:\n\n"${recommendation}"`,
        status: 'pending',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Referral submitted successfully',
    })
  } catch (error) {
    console.error('Error submitting referral:', error)
    return NextResponse.json(
      { error: 'Failed to submit referral' },
      { status: 500 }
    )
  }
}
