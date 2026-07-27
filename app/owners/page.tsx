import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/schema'
import { formatAreasSentence } from '@/lib/format-areas'
import { cleanerAreaLabel } from '@/lib/area/areas'
import {
  OwnersLandingClient,
  type CleanerCard,
  type TrustStats,
  type OwnerReview,
  type FeaturedStory,
} from './OwnersLandingClient'

// Revalidate hourly so the trust bar / cleaner cards stay fresh without
// hitting the database on every request (this is a paid-ads landing page).
export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://alicantecleaners.com'

// Owner-consented urbanization-level place names for specific reviews,
// keyed by review id. ONLY add entries here with the reviewing owner's
// explicit consent (these override the town-level cleanerAreaLabel).
const FOUNDER_REVIEW_PLACES: Record<string, string> = {
  // Kerry & Mark's own review of Mara — they asked for their urbanization.
  cms234evf0001avhgthql1aup: 'Bonalba',
}

const OG_TITLE = 'Trusted villa cleaners on the Costa Blanca'
const OG_SUBTITLE = 'Vetted, reviewed local cleaners — booked in minutes, in any language'

export const metadata: Metadata = {
  title: 'VillaCare — Trusted villa cleaners on the Costa Blanca',
  description:
    'Vetted, reviewed local cleaners who treat your villa like their own. Booked in minutes, in any language. No platform fees, real reviews from real owners.',
  alternates: {
    canonical: `${SITE_URL}/owners`,
  },
  openGraph: {
    title: 'VillaCare — Trusted villa cleaners on the Costa Blanca',
    description: 'Vetted, reviewed local cleaners for your villa — booked in minutes, in any language.',
    url: `${SITE_URL}/owners`,
    siteName: 'VillaCare',
    images: [
      {
        url: `/api/og?title=${encodeURIComponent(OG_TITLE)}&subtitle=${encodeURIComponent(OG_SUBTITLE)}`,
        width: 1200,
        height: 630,
        alt: 'VillaCare - Trusted villa cleaners on the Costa Blanca',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VillaCare — Trusted villa cleaners on the Costa Blanca',
    description: 'Vetted, reviewed local cleaners for your villa — booked in minutes, in any language.',
  },
}

// Static Q&A shared by the visible FAQ accordion and the JSON-LD schema.
// The "which areas do you cover?" question is appended after data fetch so
// its answer always matches the live `areas` list (see OwnersLandingPage
// below) — falling back to this list only when the query returns no areas.
const STATIC_FAQS = [
  {
    question: 'Do I need to be in Spain?',
    answer: "No — most of our owners live abroad. Everything's arranged remotely, in your language.",
  },
  {
    question: 'How do I pay?',
    answer: 'You pay your cleaner directly. VillaCare charges you no platform fees on bookings.',
  },
  {
    question: 'Are the cleaners really vetted?',
    answer: 'Yes. We meet and verify every cleaner, and you see genuine reviews before booking.',
  },
  {
    question: 'What about my keys?',
    answer: 'Access details are encrypted and only shown to your cleaner around the time of the booking.',
  },
]

const AREAS_QUESTION = 'Which areas do you cover?'
const AREAS_FALLBACK_ANSWER =
  'Alicante City, San Juan, Playa de San Juan, El Campello, Mutxamel, San Vicente and Jijona.'

// The one cleaner whose real photo + real 5-star review anchor the hero and
// story section (see OwnersLandingClient's `stories` section and hero — the
// "trust is the product" rebuild). Hardcoded by slug because this is a
// specific, deliberately-chosen real person, same as the hardcoded "Mark &
// Kerry · Founders" quote below it — not a general query. If she's ever
// deactivated, loses her photo, or her review is unapproved, the lookup
// below degrades gracefully (see the `if (featuredCleaner?.user.image)`
// check) rather than fabricating anything.
const FEATURED_CLEANER_SLUG = 'nilmara'

async function getOwnerLandingData(): Promise<{
  cleaners: CleanerCard[]
  stats: TrustStats
  areas: string[]
  reviews: OwnerReview[]
  featuredStory: FeaturedStory | null
}> {
  try {
    const activeCleaners = await db.cleaner.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: {
          select: { name: true, image: true },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { rating: 'desc' },
        { reviewCount: 'desc' },
      ],
    })

    const areas = Array.from(new Set(activeCleaners.flatMap((c) => c.serviceAreas))).sort()

    const totalReviews = activeCleaners.reduce((sum, c) => sum + c.reviewCount, 0)
    const ratedCleaners = activeCleaners.filter((c) => c.rating !== null && c.reviewCount > 0)
    const avgRating =
      totalReviews > 0
        ? ratedCleaners.reduce((sum, c) => sum + Number(c.rating) * c.reviewCount, 0) / totalReviews
        : null

    // "Vetted" is an earned badge (see PR #51 / app/[slug]/ProfileClient.tsx)
    // — only cleaners with a manager's vettedNote get it. Never derived from
    // teamLeader or anything else, so the client can't accidentally show it
    // on an unvetted cleaner the way the bespoke chip logic here used to.
    const cleaners: CleanerCard[] = activeCleaners.slice(0, 6).map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.user.name || 'Cleaner',
      photo: c.user.image,
      rating: Number(c.rating) || 0,
      reviewCount: c.reviewCount,
      serviceAreas: c.serviceAreas,
      teamLeader: c.teamLeader,
      vetted: Boolean(c.vettedNote),
    }))

    const stats: TrustStats = {
      vettedCleaners: activeCleaners.length,
      areasCovered: areas.length,
      avgRating,
      totalReviews,
    }

    // Real, admin-approved owner reviews only — this is paid-ads real estate,
    // so we never fall back to invented testimonials here. If none are
    // approved yet, the client hides the reviews section entirely.
    const approvedReviews = await db.review.findMany({
      where: { approved: true },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: 2,
      include: {
        owner: { include: { user: { select: { name: true } } } },
        cleaner: { select: { serviceAreas: true } },
        // PRIVACY: never select the property/address here — a real owner's
        // street address leaked on this exact section once ("Kerry · 21 La
        // Arboleda Bonalba"). The location shown next to a review is the
        // CLEANER's own public service area, never anything derived from
        // the reviewing owner's property.
      },
    })

    const reviews: OwnerReview[] = approvedReviews
      .filter((r) => r.rating > 0 && r.text.trim().length > 0)
      .map((r) => ({
        id: r.id,
        rating: r.rating,
        text: r.text,
        authorName: r.owner.user.name || 'Villa Owner',
        // FOUNDER_REVIEW_PLACES: owner-CONSENTED urbanization-level naming
        // for specific reviews (the founders asked for "Bonalba" on their
        // own — hundreds of villas, good local SEO). The privacy rule above
        // stands: nothing finer than a town is ever DERIVED from data.
        location: FOUNDER_REVIEW_PLACES[r.id] ?? cleanerAreaLabel(r.cleaner.serviceAreas),
      }))

    // Featured story cleaner (hero + "trust is the product" section) — real
    // photo, real review, sourced live so it can never drift into an
    // overclaim if her situation changes (she previously had no review at
    // all, which is what made the old hardcoded "brought me steady
    // bookings" placeholder quote false).
    let featuredStory: FeaturedStory | null = null
    const featuredCleaner = await db.cleaner.findFirst({
      where: { slug: FEATURED_CLEANER_SLUG, status: 'ACTIVE' },
      include: {
        user: { select: { image: true } },
        reviews: {
          where: { approved: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { owner: { include: { user: { select: { name: true } } } } },
        },
      },
    })

    if (featuredCleaner?.user.image) {
      const review = featuredCleaner.reviews[0]
      featuredStory = {
        slug: featuredCleaner.slug,
        photo: featuredCleaner.user.image,
        quote: review?.text ?? null,
        rating: review?.rating ?? (featuredCleaner.rating ? Number(featuredCleaner.rating) : null),
        reviewerFirstName: review ? review.owner.user.name?.split(' ')[0] || null : null,
      }
    }

    return { cleaners, stats, areas, reviews, featuredStory }
  } catch (error) {
    console.error('Error loading owners landing data:', error)
    return {
      cleaners: [],
      stats: { vettedCleaners: 0, areasCovered: 0, avgRating: null, totalReviews: 0 },
      areas: [],
      reviews: [],
      featuredStory: null,
    }
  }
}

export default async function OwnersLandingPage() {
  const { cleaners, stats, areas, reviews, featuredStory } = await getOwnerLandingData()

  const areasSentence = formatAreasSentence(areas, 'and')
  const faqs = [
    ...STATIC_FAQS,
    {
      question: AREAS_QUESTION,
      answer: areasSentence ? `${areasSentence}.` : AREAS_FALLBACK_ANSWER,
    },
  ]

  const faqSchema = generateFAQSchema(faqs)
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'For Villa Owners', url: '/owners' },
  ])

  return (
    <>
      <SchemaScript schema={[faqSchema, breadcrumbSchema]} />
      <OwnersLandingClient
        cleaners={cleaners}
        stats={stats}
        areas={areas}
        reviews={reviews}
        featuredStory={featuredStory}
      />
    </>
  )
}
