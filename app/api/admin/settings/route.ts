import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/settings - Get platform settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get or create platform settings
    let settings = await db.platformSettings.findUnique({
      where: { id: 'default' },
    })

    if (!settings) {
      // Create default settings if they don't exist
      settings = await db.platformSettings.create({
        data: {
          id: 'default',
          teamLeaderHoursRequired: 50,
          teamLeaderRatingRequired: 5.0,
        },
      })
    }

    return NextResponse.json({
      settings: {
        teamLeaderHoursRequired: settings.teamLeaderHoursRequired,
        teamLeaderRatingRequired: settings.teamLeaderRatingRequired,
        updatedAt: settings.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error fetching platform settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/settings - Update platform settings
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { teamLeaderHoursRequired, teamLeaderRatingRequired } = body

    // Validate inputs
    if (teamLeaderHoursRequired !== undefined) {
      if (typeof teamLeaderHoursRequired !== 'number' || teamLeaderHoursRequired < 1 || teamLeaderHoursRequired > 1000) {
        return NextResponse.json(
          { error: 'teamLeaderHoursRequired must be a number between 1 and 1000' },
          { status: 400 }
        )
      }
    }

    if (teamLeaderRatingRequired !== undefined) {
      if (typeof teamLeaderRatingRequired !== 'number' || teamLeaderRatingRequired < 1 || teamLeaderRatingRequired > 5) {
        return NextResponse.json(
          { error: 'teamLeaderRatingRequired must be a number between 1 and 5' },
          { status: 400 }
        )
      }
    }

    // Update settings
    const settings = await db.platformSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        teamLeaderHoursRequired: teamLeaderHoursRequired ?? 50,
        teamLeaderRatingRequired: teamLeaderRatingRequired ?? 5.0,
      },
      update: {
        ...(teamLeaderHoursRequired !== undefined && { teamLeaderHoursRequired }),
        ...(teamLeaderRatingRequired !== undefined && { teamLeaderRatingRequired }),
      },
    })

    return NextResponse.json({
      settings: {
        teamLeaderHoursRequired: settings.teamLeaderHoursRequired,
        teamLeaderRatingRequired: settings.teamLeaderRatingRequired,
        updatedAt: settings.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error updating platform settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
