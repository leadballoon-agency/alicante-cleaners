import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/schema'
import { formatAreasSentence } from '@/lib/format-areas'
import { OwnersLandingClient, type CleanerCard, type TrustStats, type OwnerReview } from './OwnersLandingClient'

// Revalidate hourly so the trust bar / cleaner cards stay fresh without
// hitting the database on every request (this is a paid-ads landing page).
export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://alicantecleaners.com'

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

async function getOwnerLandingData(): Promise<{
  cleaners: CleanerCard[]
  stats: TrustStats
  areas: string[]
  reviews: OwnerReview[]
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

    const cleaners: CleanerCard[] = activeCleaners.slice(0, 6).map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.user.name || 'Cleaner',
      photo: c.user.image,
      rating: Number(c.rating) || 0,
      reviewCount: c.reviewCount,
      serviceAreas: c.serviceAreas,
      teamLeader: c.teamLeader,
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
        booking: { include: { property: { select: { address: true } } } },
      },
    })

    const reviews: OwnerReview[] = approvedReviews
      .filter((r) => r.rating > 0 && r.text.trim().length > 0)
      .map((r) => {
        const address = r.booking?.property?.address || ''
        const parts = address
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean)
        const location = parts.length > 1 ? parts[parts.length - 1] : 'Alicante'

        return {
          id: r.id,
          rating: r.rating,
          text: r.text,
          authorName: r.owner.user.name || 'Villa Owner',
          location,
        }
      })

    return { cleaners, stats, areas, reviews }
  } catch (error) {
    console.error('Error loading owners landing data:', error)
    return {
      cleaners: [],
      stats: { vettedCleaners: 0, areasCovered: 0, avgRating: null, totalReviews: 0 },
      areas: [],
      reviews: [],
    }
  }
}

export default async function OwnersLandingPage() {
  const { cleaners, stats, areas, reviews } = await getOwnerLandingData()

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
      <OwnersLandingClient cleaners={cleaners} stats={stats} areas={areas} reviews={reviews} />
    </>
  )
}
