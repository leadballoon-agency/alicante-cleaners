import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasStaffAccess } from '@/lib/staff-access'
import { db } from '@/lib/db'

// Canonical service areas (display name + match keys for normalised cleaner areas)
const AREAS: { name: string; keys: string[] }[] = [
  { name: 'Alicante City', keys: ['alicante', 'alicantecity'] },
  { name: 'San Juan', keys: ['sanjuan'] },
  { name: 'Playa de San Juan', keys: ['playadesanjuan', 'playasanjuan'] },
  { name: 'El Campello', keys: ['elcampello'] },
  { name: 'Mutxamel', keys: ['mutxamel'] },
  { name: 'San Vicente', keys: ['sanvicente'] },
  { name: 'Jijona', keys: ['jijona'] },
]
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

// GET /api/admin/today — the manager "Today" home: flywheel pulse + highest-leverage actions
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !hasStaffAccess(session.user.staffLevel, 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [activeCleaners, pendingCleaners, approvedReviews, bookingsThisWeek, pendingBookings, completedNoReview, coverageCleaners] =
      await Promise.all([
        db.cleaner.count({ where: { status: 'ACTIVE' } }),
        db.cleaner.count({ where: { status: 'PENDING' } }),
        db.review.findMany({ where: { approved: true }, select: { rating: true } }),
        db.booking.count({ where: { createdAt: { gte: weekStart } } }),
        db.booking.count({ where: { status: 'PENDING' } }),
        db.booking.count({ where: { status: 'COMPLETED', review: null } }),
        db.cleaner.findMany({ where: { status: 'ACTIVE' }, select: { serviceAreas: true } }),
      ])

    const averageRating = approvedReviews.length
      ? Number((approvedReviews.reduce((s, r) => s + r.rating, 0) / approvedReviews.length).toFixed(1))
      : 0

    // Coverage: which canonical areas have at least one active cleaner
    const coveredTokens = new Set<string>()
    for (const c of coverageCleaners) for (const a of c.serviceAreas || []) coveredTokens.add(norm(a))
    const uncovered = AREAS.filter((area) => !area.keys.some((k) => coveredTokens.has(k))).map((a) => a.name)
    const areasCovered = AREAS.length - uncovered.length

    // Build the "needs you now" action list, only including items that actually exist
    type Action = { key: string; lever: string; icon: string; title: string; sub: string; count: number }
    const actions: Action[] = []

    if (pendingCleaners > 0) {
      actions.push({
        key: 'pending_cleaners', lever: 'Supply · approvals', icon: '🧹', count: pendingCleaners,
        title: `${pendingCleaners} cleaner${pendingCleaners > 1 ? 's' : ''} waiting for approval`,
        sub: 'Vetted, vouched-for cleaners are the supply side of the flywheel. Review and approve.',
      })
    }
    if (completedNoReview > 0) {
      actions.push({
        key: 'chase_reviews', lever: 'Trust · reviews', icon: '⭐', count: completedNoReview,
        title: `${completedNoReview} clean${completedNoReview > 1 ? 's' : ''} done, no review yet`,
        sub: 'Reviews are how the next owner learns to trust us. Chase them while the clean is fresh.',
      })
    }
    if (pendingBookings > 0) {
      actions.push({
        key: 'pending_bookings', lever: 'Match · bookings', icon: '🗓️', count: pendingBookings,
        title: `${pendingBookings} booking${pendingBookings > 1 ? 's' : ''} awaiting a cleaner`,
        sub: 'An unfilled booking is a customer waiting. Get it accepted or reassigned.',
      })
    }
    if (uncovered.length > 0) {
      actions.push({
        key: 'coverage_gap', lever: 'Supply · coverage', icon: '📍', count: uncovered.length,
        title: uncovered.length === 1 ? `No cleaner covers ${uncovered[0]}` : `${uncovered.length} areas have no cleaner`,
        sub: `Uncovered: ${uncovered.join(', ')}. Recruit or extend a nearby cleaner to grow reach.`,
      })
    }

    return NextResponse.json({
      manager: session.user.name || 'there',
      pulse: { activeCleaners, averageRating, bookingsThisWeek, areasCovered, totalAreas: AREAS.length },
      actions,
    })
  } catch (error) {
    console.error('Error building today view:', error)
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 })
  }
}
