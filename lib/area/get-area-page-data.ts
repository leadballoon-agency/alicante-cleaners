import { db } from '@/lib/db'
import { STANDARD_SERVICES } from './area-content'

export type AreaCleanerCard = {
  id: string
  slug: string
  name: string
  photo: string | null
  rating: number
  reviewCount: number
  serviceAreas: string[]
  hourlyRate: number
  teamLeader: boolean
}

export type AreaServicePriceRange = {
  type: string
  hours: number
  minPrice: number
  maxPrice: number
}

export type AreaPricing = {
  minRate: number
  maxRate: number
  services: AreaServicePriceRange[]
} | null

/**
 * Live data for an area landing page: the ACTIVE cleaners who cover that
 * area (same status/ordering rules as the homepage directory —
 * app/api/cleaners/route.ts — so the two never drift), plus hourly-rate
 * derived pricing for the three standard services. `pricing` is null when
 * there are no active cleaners in the area yet, so the page can hide the
 * pricing block instead of showing a fabricated range.
 *
 * Ordering is photo-first: photo-complete, reviewed cleaners lead, so the
 * page doesn't open with a wall of placeholder cards. Inclusion is
 * untouched by this — every ACTIVE cleaner covering the area still appears,
 * just reordered.
 */
export async function getAreaPageData(slug: string): Promise<{
  cleaners: AreaCleanerCard[]
  pricing: AreaPricing
}> {
  const cleaners = await db.cleaner.findMany({
    where: {
      status: 'ACTIVE',
      serviceAreas: { has: slug },
    },
    include: {
      user: { select: { name: true, image: true } },
    },
    orderBy: [
      { featured: 'desc' },
      { rating: 'desc' },
      { reviewCount: 'desc' },
    ],
  })

  const cards: AreaCleanerCard[] = cleaners.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.user.name || 'Cleaner',
    photo: c.user.image,
    rating: Number(c.rating) || 0,
    reviewCount: c.reviewCount,
    serviceAreas: c.serviceAreas,
    hourlyRate: Number(c.hourlyRate),
    teamLeader: c.teamLeader,
  }))

  // Photo-first (see doc comment above) — `user.image` nullness can't be
  // expressed in the Prisma orderBy above, so it's applied here in JS,
  // same as app/api/cleaners/route.ts.
  cards.sort((a, b) => {
    const photoDiff = (b.photo ? 1 : 0) - (a.photo ? 1 : 0)
    if (photoDiff !== 0) return photoDiff
    if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount
    return b.rating - a.rating
  })

  let pricing: AreaPricing = null
  if (cards.length > 0) {
    const rates = cards.map((c) => c.hourlyRate)
    const minRate = Math.min(...rates)
    const maxRate = Math.max(...rates)
    pricing = {
      minRate,
      maxRate,
      services: STANDARD_SERVICES.map((s) => ({
        type: s.type,
        hours: s.hours,
        minPrice: minRate * s.hours,
        maxPrice: maxRate * s.hours,
      })),
    }
  }

  return { cleaners: cards, pricing }
}
