import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/cleaners - Get all active cleaners for homepage
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const area = searchParams.get('area')

    const cleaners = await db.cleaner.findMany({
      where: {
        status: 'ACTIVE',
        ...(area && area !== 'all' ? {
          serviceAreas: {
            has: area,
          },
        } : {}),
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { rating: 'desc' },
        { reviewCount: 'desc' },
      ],
    })

    const formattedCleaners = cleaners.map(c => ({
      id: c.id,
      slug: c.slug,
      name: c.user.name || 'Cleaner',
      photo: c.user.image,
      bio: c.bio,
      serviceAreas: c.serviceAreas,
      hourlyRate: Number(c.hourlyRate),
      rating: Number(c.rating) || 0,
      reviewCount: c.reviewCount,
      featured: c.featured,
      teamLeader: c.teamLeader,
      createdAt: c.createdAt,
    }))

    // Photo-first: cleaners with a profile photo lead, so the directory
    // doesn't open with a wall of placeholder cards. `user.image` nullness
    // can't be expressed in the Prisma orderBy above (it's a relation
    // field), so it's applied here in JS — cheap at this row count (~25).
    formattedCleaners.sort((a, b) => {
      const photoDiff = (b.photo ? 1 : 0) - (a.photo ? 1 : 0)
      if (photoDiff !== 0) return photoDiff
      if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount
      return b.rating - a.rating
    })

    // Get unique areas from all cleaners
    const allCleaners = await db.cleaner.findMany({
      where: { status: 'ACTIVE' },
      select: { serviceAreas: true },
    })
    const areas = Array.from(new Set(allCleaners.flatMap(c => c.serviceAreas))).sort()

    return NextResponse.json({
      cleaners: formattedCleaners,
      areas,
    })
  } catch (error) {
    console.error('Error fetching cleaners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cleaners' },
      { status: 500 }
    )
  }
}
