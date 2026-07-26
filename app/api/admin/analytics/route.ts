import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasStaffAccess } from '@/lib/staff-access'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user || !hasStaffAccess(session.user.staffLevel, 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get page view stats
    const [totalViews, todayViews, topPagesRaw, topCleanersRaw] = await Promise.all([
      // Total views (last 7 days)
      db.pageView.count({
        where: { createdAt: { gte: weekAgo } },
      }),

      // Today's views
      db.pageView.count({
        where: { createdAt: { gte: todayStart } },
      }),

      // Top pages (last 7 days)
      db.pageView.groupBy({
        by: ['path'],
        where: { createdAt: { gte: weekAgo } },
        _count: { path: true },
        orderBy: { _count: { path: 'desc' } },
        take: 10,
      }),

      // Top cleaner profiles (last 7 days)
      db.pageView.groupBy({
        by: ['cleanerSlug'],
        where: {
          createdAt: { gte: weekAgo },
          cleanerSlug: { not: null },
        },
        _count: { cleanerSlug: true },
        orderBy: { _count: { cleanerSlug: 'desc' } },
        take: 5,
      }),
    ])

    // Advocacy loop: visits by share source (last 30 days) — a `ref` is
    // either a static share-surface tag ("cleaner-share", "admin-share",
    // "review-email") or an owner's own referralCode. Kept out of the
    // Promise.all and given its own try/catch: PageView.ref is an additive
    // column applied via a separate `prisma db push` at merge time, not in
    // this deploy — if this route ships first, the rest of this
    // already-working analytics payload must still load.
    type RefGroup = { ref: string | null; _count: { ref: number } }
    const topRefsRaw: RefGroup[] = await db.pageView.groupBy({
      by: ['ref'],
      where: {
        createdAt: { gte: monthAgo },
        ref: { not: null },
      },
      _count: { ref: true },
      orderBy: { _count: { ref: 'desc' } },
      take: 8,
    }).catch((error) => {
      console.error('Error fetching topRefs (PageView.ref may not exist yet):', error)
      return [] as RefGroup[]
    })

    // Get cleaner names for top cleaners
    const cleanerSlugs = topCleanersRaw
      .map(c => c.cleanerSlug)
      .filter((slug): slug is string => slug !== null)

    const cleaners = await db.cleaner.findMany({
      where: { slug: { in: cleanerSlugs } },
      include: { user: { select: { name: true } } },
    })

    const cleanerMap = new Map(cleaners.map(c => [c.slug, c.user.name || 'Unknown']))

    // Format top pages
    const topPages = topPagesRaw.map(p => ({
      path: p.path,
      views: p._count.path,
      name: getPageName(p.path),
    }))

    // Format top cleaners
    const topCleaners = topCleanersRaw
      .filter(c => c.cleanerSlug !== null)
      .map(c => ({
        slug: c.cleanerSlug!,
        name: cleanerMap.get(c.cleanerSlug!) || 'Unknown',
        views: c._count.cleanerSlug,
      }))

    // Format visits by share source
    const topRefs = topRefsRaw
      .filter(r => r.ref !== null)
      .map(r => ({
        ref: r.ref!,
        views: r._count.ref,
      }))

    return NextResponse.json({
      totalViews,
      todayViews,
      topPages,
      topCleaners,
      topRefs,
      period: '7 days',
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

function getPageName(path: string): string {
  if (path === '/') return 'Homepage'
  if (path === '/join') return 'Cleaner Landing'
  if (path === '/about') return 'About'
  if (path === '/login') return 'Login'
  if (path === '/dashboard') return 'Cleaner Dashboard'
  if (path === '/owner/dashboard') return 'Owner Dashboard'
  if (path === '/admin') return 'Admin Dashboard'
  if (path.includes('/booking')) return 'Booking Flow'
  // Cleaner profile pages are just the slug
  if (path.startsWith('/') && !path.includes('/')) {
    return `Profile: ${path.slice(1)}`
  }
  return path
}
