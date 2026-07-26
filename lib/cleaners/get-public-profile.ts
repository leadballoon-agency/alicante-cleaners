import { db } from '@/lib/db'

/**
 * Shared query for the public cleaner profile.
 *
 * Used by BOTH `GET /api/cleaners/[slug]` (client-side refetch / other
 * consumers) and the server-rendered `/[slug]` page, so the two can never
 * drift on filters (e.g. `approved: true` on reviews, `status: 'ACTIVE'`
 * gating). If you change what's fetched or how it's shaped, change it here.
 */

// Service definitions with pricing
const SERVICES = [
  {
    type: 'regular',
    name: 'Regular Clean',
    description: 'Standard cleaning service for maintained homes',
    hoursMultiplier: 3, // hours per cleaning
  },
  {
    type: 'deep',
    name: 'Deep Clean',
    description: 'Thorough deep cleaning including hard-to-reach areas',
    hoursMultiplier: 5,
  },
  {
    type: 'arrival',
    name: 'Arrival Prep',
    description: 'Get your villa ready before you arrive',
    hoursMultiplier: 4,
  },
]

export type PublicService = {
  type: string
  name: string
  description: string
  hours: number | null
  price: number
  isCustom: boolean
  isAddon: boolean
}

export type PublicReview = {
  id: string
  rating: number
  text: string
  author: string
  createdAt: Date
}

export type PublicTeamMember = {
  id: string
  slug: string
  name: string
  photo: string | null
  rating: number
  reviewCount: number
}

export type PublicCleanerProfile = {
  id: string
  slug: string
  name: string | null
  photo: string | null
  rating: number
  reviewCount: number
  areas: string[]
  languages: string[]
  hourlyRate: number
  bio: string | null
  reviewsLink: string | null
  vettedNote: string | null
  vettedNoteLang: string | null
  vettedNoteTranslated: string | null
  vettedByName: string | null
  teamLeader: boolean
  teamName: string | null
  teamMembers: PublicTeamMember[]
  services: PublicService[]
  addons: PublicService[]
  testimonial: { text: string; author: string; location: string; rating: number } | null
  reviews: PublicReview[]
}

/**
 * Fetch the full public profile for a cleaner by slug. Returns null when the
 * cleaner doesn't exist OR isn't `ACTIVE` — non-active cleaners are not
 * publicly visible (mirrors the 404 behavior of the API route).
 */
export async function getPublicCleanerProfile(slug: string): Promise<PublicCleanerProfile | null> {
  const cleaner = await db.cleaner.findUnique({
    where: { slug },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
      ledTeam: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          },
          services: {
            where: { status: 'APPROVED' },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          },
        },
      },
      memberOfTeam: {
        include: {
          services: {
            where: { status: 'APPROVED' },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          },
        },
      },
    },
  })

  if (!cleaner || cleaner.status !== 'ACTIVE') {
    return null
  }

  // Get featured review for this cleaner
  const featuredReview = await db.review.findFirst({
    where: {
      cleanerId: cleaner.id,
      featured: true,
      approved: true,
    },
    include: {
      owner: {
        include: {
          user: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Get all approved reviews for this cleaner
  const reviews = await db.review.findMany({
    where: {
      cleanerId: cleaner.id,
      approved: true,
    },
    include: {
      owner: {
        include: {
          user: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  // Calculate standard services with pricing based on hourly rate
  const standardServices: PublicService[] = SERVICES.map((service) => ({
    type: service.type,
    name: service.name,
    description: service.description,
    hours: service.hoursMultiplier,
    price: Number(cleaner.hourlyRate) * service.hoursMultiplier,
    isCustom: false,
    isAddon: false,
  }))

  // Get custom team services (from led team or member team)
  const teamServices: PublicService[] = (cleaner.ledTeam?.services || cleaner.memberOfTeam?.services || [])
    .map((service) => ({
      type: `custom-${service.id}`,
      name: service.name,
      description: service.description || '',
      hours: service.hours || null,
      price: service.priceType === 'FIXED'
        ? Number(service.price)
        : service.hours
          ? Number(cleaner.hourlyRate) * service.hours
          : 0,
      isCustom: service.type === 'CUSTOM',
      isAddon: service.type === 'ADDON',
    }))

  // Combine services: standard first, then custom, then add-ons
  const customServices = teamServices.filter(s => s.isCustom && !s.isAddon)
  const addons = teamServices.filter(s => s.isAddon)
  const services = [...standardServices, ...customServices]

  // Get team members if this cleaner is a team leader
  const teamMembers: PublicTeamMember[] = cleaner.ledTeam?.members.map(member => ({
    id: member.id,
    slug: member.slug,
    name: member.user.name || 'Team Member',
    photo: member.user.image,
    rating: Number(member.rating) || 0,
    reviewCount: member.reviewCount,
  })) || []

  return {
    id: cleaner.id,
    slug: cleaner.slug,
    name: cleaner.user.name,
    photo: cleaner.user.image,
    rating: Number(cleaner.rating),
    reviewCount: cleaner.reviewCount,
    areas: cleaner.serviceAreas,
    languages: cleaner.languages || ['es'],
    hourlyRate: Number(cleaner.hourlyRate),
    bio: cleaner.bio,
    reviewsLink: cleaner.reviewsLink || null,
    vettedNote: cleaner.vettedNote || null,
    vettedNoteLang: cleaner.vettedNoteLang || null,
    vettedNoteTranslated: cleaner.vettedNoteTranslated || null,
    vettedByName: cleaner.vettedByName || null,
    teamLeader: cleaner.teamLeader || false,
    teamName: cleaner.ledTeam?.name || null,
    teamMembers,
    services,
    addons, // Add-on extras like ironing, fridge cleaning
    testimonial: featuredReview
      ? {
          text: featuredReview.text,
          author: featuredReview.owner.user.name || 'Villa Owner',
          location: 'Alicante',
          rating: featuredReview.rating,
        }
      : null,
    reviews: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      text: review.text,
      author: review.owner.user.name || 'Villa Owner',
      createdAt: review.createdAt,
    })),
  }
}
