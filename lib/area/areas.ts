/**
 * Canonical service-area list for the programmatic area landing pages
 * (`/limpieza-de-villas/[area]` and `/en/villa-cleaning/[area]`).
 *
 * The `slug` values MUST match what's stored in `Cleaner.serviceAreas`
 * (set during onboarding — see the `TOWNS` list in
 * app/onboarding/cleaner/steps/service-areas.tsx) and what the homepage /
 * admin area filters query against (`serviceAreas: { has: area } }`,
 * app/api/cleaners/route.ts). Do not rename a slug here without a data
 * migration — it would silently break the Prisma `has` filter and 404 the
 * page for existing cleaners.
 *
 * Order matches the "Service Areas" list in CLAUDE.md.
 */

export type AreaLocale = 'es' | 'en'

export interface Area {
  slug: string
  es: string
  en: string
}

export const AREAS: Area[] = [
  { slug: 'alicante', es: 'Alicante', en: 'Alicante City' },
  { slug: 'san-juan', es: 'San Juan', en: 'San Juan' },
  { slug: 'playa-san-juan', es: 'Playa de San Juan', en: 'Playa de San Juan' },
  { slug: 'el-campello', es: 'El Campello', en: 'El Campello' },
  { slug: 'mutxamel', es: 'Mutxamel', en: 'Mutxamel' },
  { slug: 'san-vicente', es: 'San Vicente', en: 'San Vicente' },
  { slug: 'jijona', es: 'Jijona', en: 'Jijona' },
]

export function getArea(slug: string): Area | undefined {
  return AREAS.find((a) => a.slug === slug)
}

export function areaName(area: Area, locale: AreaLocale): string {
  return locale === 'es' ? area.es : area.en
}

/** Locale-specific URL for a given area's landing page. */
export function areaPath(locale: AreaLocale, slug: string): string {
  return locale === 'es' ? `/limpieza-de-villas/${slug}` : `/en/villa-cleaning/${slug}`
}

/** The same area's page in the other locale — used for the hreflang pair and the in-page language link. */
export function alternateAreaPath(locale: AreaLocale, slug: string): string {
  return areaPath(locale === 'es' ? 'en' : 'es', slug)
}

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.alicantecleaners.com'
