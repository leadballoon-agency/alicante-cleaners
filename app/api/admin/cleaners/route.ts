import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasStaffAccess } from '@/lib/staff-access'
import { db } from '@/lib/db'
import { getProfileHealth } from '@/lib/ai/success-agent-tools'

// Short, card-friendly labels for what's blocking a cleaner from looking
// approval-ready / directory-ready. Deliberately narrower than the full
// Success Coach checklist (skips reviews/languages — not meaningful before a
// cleaner has ever worked a job). Computed for every cleaner (~25 at current
// scale) so both PENDING triage cards and ACTIVE directory cards can surface
// it; each call does its own findUnique via getProfileHealth (N+1), which is
// fine at this scale but should move to a single batched query if the roster
// grows into the hundreds.
async function computeCleanerHealth(cleanerIds: string[]) {
  const entries = await Promise.all(
    cleanerIds.map(async (id) => {
      try {
        const health = await getProfileHealth(id)
        const missing: string[] = []
        if (!health.photo.has) missing.push('No photo')
        if (health.bio.quality === 'poor') missing.push('Bio too short')
        else if (health.bio.quality === 'ok') missing.push('Bio could be longer')
        if (health.areas.count === 0) missing.push('No areas set')
        else if (health.areas.count < 3) missing.push('Needs more areas')
        if (health.rate.value === 0) missing.push('No rate set')
        if (!health.calendar.synced) missing.push('No calendar')
        return [id, { score: health.score, missing }] as const
      } catch (err) {
        console.error(`Error computing profile health for ${id}:`, err)
        return [id, null] as const
      }
    })
  )
  return Object.fromEntries(entries) as Record<string, { score: number; missing: string[] } | null>
}

// GET /api/admin/cleaners - Get all cleaners
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !hasStaffAccess(session.user.staffLevel, 'MANAGER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const cleaners = await db.cleaner.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            image: true,
            lastLoginAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Profile health powers the triage strip on PENDING cards (always shown)
    // and the same compact strip on ACTIVE cards (shown only when the
    // profile is still incomplete — the UI gates on score/missing).
    const allIds = cleaners.map(c => c.id)
    const healthByCleanerId = allIds.length > 0 ? await computeCleanerHealth(allIds) : {}

    const formattedCleaners = cleaners.map(c => ({
      id: c.id,
      userId: c.userId, // User ID — used to grant staff access (PLATFORM_MANAGER_IDS)
      name: c.user.name || 'Unknown',
      slug: c.slug,
      phone: c.user.phone || '',
      email: c.user.email || '',
      photo: c.user.image || null,
      status: c.status.toLowerCase() as 'pending' | 'active' | 'suspended',
      joinedAt: c.createdAt,
      bio: c.bio || null,
      languages: c.languages || [],
      areas: c.serviceAreas,
      hourlyRate: Number(c.hourlyRate),
      totalBookings: c.totalBookings,
      rating: c.rating ? Number(c.rating) : 0,
      reviewCount: c.reviewCount,
      teamLeader: c.teamLeader || false,
      lastLoginAt: c.user.lastLoginAt,
      profileHealth: healthByCleanerId[c.id] || null,
      vettedNote: c.vettedNote || null,
      vettedByName: c.vettedByName || null,
    }))

    return NextResponse.json({ cleaners: formattedCleaners })
  } catch (error) {
    console.error('Error fetching cleaners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cleaners' },
      { status: 500 }
    )
  }
}
