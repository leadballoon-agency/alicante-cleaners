import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

// Regenerate at most once a day — cleaner profiles change slowly and this
// keeps the sitemap off the hot path for the DB.
export const revalidate = 86400

const BASE = 'https://www.alicantecleaners.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/join`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/guide`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/join/guide`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/join/booking-guide`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/join/calendar-guide`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/join/team-leader-guide`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/join/team-guide`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/join/services-guide`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/join/smartwidget-guide`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/join/profile-guide`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/join/expand-guide`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/features/rebook`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/features/ai-assistant`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/features/success-coach`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  const cleaners = await db.cleaner.findMany({
    where: { status: 'ACTIVE' },
    select: { slug: true, updatedAt: true },
  })

  const cleanerPages: MetadataRoute.Sitemap = cleaners.map((c) => ({
    url: `${BASE}/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticPages, ...cleanerPages]
}
