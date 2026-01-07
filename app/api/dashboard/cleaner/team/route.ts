import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Get my team info (as leader or member)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'CLEANER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      include: {
        ledTeam: {
          include: {
            members: {
              include: {
                user: {
                  select: { name: true, image: true },
                },
              },
            },
            joinRequests: {
              where: { status: 'PENDING' },
              include: {
                cleaner: {
                  include: {
                    user: {
                      select: { name: true, image: true },
                    },
                  },
                },
              },
            },
          },
        },
        memberOfTeam: {
          include: {
            leader: {
              include: {
                user: {
                  select: { name: true, image: true, phone: true },
                },
              },
            },
            members: {
              include: {
                user: {
                  select: { name: true, image: true },
                },
              },
            },
          },
        },
      },
    })

    if (!cleaner) {
      return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 })
    }

    // Get platform settings for team leader thresholds
    const settings = await db.platformSettings.findUnique({
      where: { id: 'default' },
    })
    const TEAM_LEADER_THRESHOLD_HOURS = settings?.teamLeaderHoursRequired ?? 50
    const TEAM_LEADER_MIN_RATING = settings?.teamLeaderRatingRequired ?? 5.0

    // Calculate total hours from completed bookings
    const completedBookings = await db.booking.aggregate({
      where: {
        cleanerId: cleaner.id,
        status: 'COMPLETED',
      },
      _sum: {
        hours: true,
      },
    })
    const totalHoursWorked = completedBookings._sum.hours || 0

    // Get cleaner's current rating
    const cleanerRating = cleaner.rating ? Number(cleaner.rating) : 0
    const hasMinRating = cleanerRating >= TEAM_LEADER_MIN_RATING
    const hasMinHours = totalHoursWorked >= TEAM_LEADER_THRESHOLD_HOURS

    // Cleaner can create team if: already a teamLeader OR (50+ hours AND 5-star rating)
    const canCreateTeam = cleaner.teamLeader || (hasMinHours && hasMinRating)

    // If cleaner is a team leader
    if (cleaner.ledTeam) {
      return NextResponse.json({
        role: 'leader',
        team: {
          id: cleaner.ledTeam.id,
          name: cleaner.ledTeam.name,
          referralCode: cleaner.ledTeam.referralCode,
          createdAt: cleaner.ledTeam.createdAt,
          members: cleaner.ledTeam.members.map((m) => ({
            id: m.id,
            name: m.user.name,
            photo: m.user.image,
            slug: m.slug,
            rating: m.rating ? Number(m.rating) : null,
            reviewCount: m.reviewCount,
            serviceAreas: m.serviceAreas,
          })),
          pendingRequests: cleaner.ledTeam.joinRequests.map((r) => ({
            id: r.id,
            cleanerId: r.cleanerId,
            name: r.cleaner.user.name,
            photo: r.cleaner.user.image,
            slug: r.cleaner.slug,
            message: r.message,
            createdAt: r.createdAt,
          })),
        },
      })
    }

    // If cleaner is a team member
    if (cleaner.memberOfTeam) {
      return NextResponse.json({
        role: 'member',
        team: {
          id: cleaner.memberOfTeam.id,
          name: cleaner.memberOfTeam.name,
          leader: {
            id: cleaner.memberOfTeam.leader.id,
            name: cleaner.memberOfTeam.leader.user.name,
            photo: cleaner.memberOfTeam.leader.user.image,
            phone: cleaner.memberOfTeam.leader.user.phone,
            slug: cleaner.memberOfTeam.leader.slug,
          },
          members: cleaner.memberOfTeam.members.map((m) => ({
            id: m.id,
            name: m.user.name,
            photo: m.user.image,
            slug: m.slug,
          })),
        },
      })
    }

    // Cleaner is independent (no team)
    return NextResponse.json({
      role: 'independent',
      canCreateTeam,
      teamLeaderProgress: {
        totalHoursWorked,
        requiredHours: TEAM_LEADER_THRESHOLD_HOURS,
        hoursRemaining: Math.max(0, TEAM_LEADER_THRESHOLD_HOURS - totalHoursWorked),
        currentRating: cleanerRating,
        requiredRating: TEAM_LEADER_MIN_RATING,
        hasMinHours,
        hasMinRating,
      },
      team: null,
    })
  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
  }
}

// POST - Create a new team (team leaders only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'CLEANER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      include: { ledTeam: true, memberOfTeam: true },
    })

    if (!cleaner) {
      return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 })
    }

    // Get platform settings for team leader thresholds
    const settings = await db.platformSettings.findUnique({
      where: { id: 'default' },
    })
    const TEAM_LEADER_THRESHOLD_HOURS = settings?.teamLeaderHoursRequired ?? 50
    const TEAM_LEADER_MIN_RATING = settings?.teamLeaderRatingRequired ?? 5.0

    // Calculate total hours from completed bookings
    const completedBookings = await db.booking.aggregate({
      where: {
        cleanerId: cleaner.id,
        status: 'COMPLETED',
      },
      _sum: {
        hours: true,
      },
    })
    const totalHoursWorked = completedBookings._sum.hours || 0

    const cleanerRating = cleaner.rating ? Number(cleaner.rating) : 0
    const hasMinRating = cleanerRating >= TEAM_LEADER_MIN_RATING
    const hasMinHours = totalHoursWorked >= TEAM_LEADER_THRESHOLD_HOURS

    // Must be a team leader OR meet thresholds to create a team
    const canCreateTeam = cleaner.teamLeader || (hasMinHours && hasMinRating)
    if (!canCreateTeam) {
      const issues = []
      if (!hasMinHours) {
        issues.push(`${TEAM_LEADER_THRESHOLD_HOURS - totalHoursWorked} more hours of work`)
      }
      if (!hasMinRating) {
        issues.push(`a ${TEAM_LEADER_MIN_RATING}-star rating (currently ${cleanerRating.toFixed(1)})`)
      }
      return NextResponse.json(
        { error: `To create a team you need: ${issues.join(' and ')}` },
        { status: 403 }
      )
    }

    // Can't create team if already leading one
    if (cleaner.ledTeam) {
      return NextResponse.json(
        { error: 'You already lead a team' },
        { status: 400 }
      )
    }

    // Can't create team if member of another
    if (cleaner.memberOfTeam) {
      return NextResponse.json(
        { error: 'You must leave your current team first' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Team name must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Generate unique referral code: TEAM-{slug}-{4digits}
    const randomDigits = Math.floor(1000 + Math.random() * 9000)
    const referralCode = `TEAM-${cleaner.slug.toUpperCase()}-${randomDigits}`

    const team = await db.team.create({
      data: {
        name: name.trim(),
        leaderId: cleaner.id,
        referralCode,
      },
    })

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
        referralCode: team.referralCode,
      },
    })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}

// PATCH - Update team details (leader only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'CLEANER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Team name must be at least 2 characters' },
        { status: 400 }
      )
    }

    const team = await db.team.update({
      where: { id: cleaner.ledTeam.id },
      data: { name: name.trim() },
    })

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
      },
    })
  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 })
  }
}
