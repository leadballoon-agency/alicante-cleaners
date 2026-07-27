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

/**
 * Case-insensitive lookup from any known form of an area — the canonical
 * slug, or either display-name label — to its canonical slug. Exists because
 * `Cleaner.serviceAreas` picked up display-name values from a client bug in
 * the dashboard's Service Areas modal (it submitted labels like "San Juan"
 * instead of the slug "san-juan" — see app/dashboard/tabs/profile.tsx). Used
 * to normalize both writes (profile PATCH, admin AI agent) and reads
 * (homepage/area-page filter matching) so the corrupted historical data
 * doesn't need to be fixed everywhere at once.
 */
const AREA_LOOKUP: ReadonlyMap<string, string> = new Map(
  AREAS.flatMap((area) => [
    [area.slug.toLowerCase(), area.slug],
    [area.es.toLowerCase(), area.slug],
    [area.en.toLowerCase(), area.slug],
  ] as const)
)

/** Resolves any known slug/label form of an area to its canonical slug, or undefined if unrecognized. */
export function normalizeAreaValue(value: string): string | undefined {
  return AREA_LOOKUP.get(value.trim().toLowerCase())
}

/**
 * Normalizes a raw `Cleaner.serviceAreas` list to canonical, deduped slugs.
 * Unrecognized entries are dropped rather than passed through, so junk data
 * can't keep re-accumulating.
 */
export function normalizeServiceAreas(values: string[]): string[] {
  const slugs = new Set<string>()
  for (const value of values) {
    const slug = normalizeAreaValue(value)
    if (slug) slugs.add(slug)
  }
  return Array.from(slugs)
}

/**
 * All known raw forms (slug + both display labels) a cleaner's serviceAreas
 * entry could be stored as for a given canonical slug — for matching against
 * not-yet-repaired production data with Prisma's `hasSome`. Falls back to
 * `[slug]` for an unrecognized slug so callers can pass through user input.
 */
export function areaVariants(slug: string): string[] {
  const area = getArea(slug)
  if (!area) return [slug]
  return Array.from(new Set([area.slug, area.es, area.en]))
}

/** Locale-specific URL for a given area's landing page. */
export function areaPath(locale: AreaLocale, slug: string): string {
  return locale === 'es' ? `/limpieza-de-villas/${slug}` : `/en/villa-cleaning/${slug}`
}

/** The same area's page in the other locale — used for the hreflang pair and the in-page language link. */
export function alternateAreaPath(locale: AreaLocale, slug: string): string {
  return areaPath(locale === 'es' ? 'en' : 'es', slug)
}

/**
 * Public-safe locality label for a cleaner: their own (already-public)
 * primary service area — NEVER anything derived from an owner's property or
 * address. Originally introduced for the homepage activity feed (see
 * app/api/activity/route.ts, and the privacy hotfix in PR #56 — a real
 * street address leaked here once via an old extractArea() heuristic) and
 * reused anywhere a public page needs to show "where" without touching
 * owner/property data — e.g. attributing an owner review to a place by
 * showing the CLEANER's area instead of the reviewer's address.
 * Tolerates the known data corruption where serviceAreas may hold display
 * names instead of slugs.
 */
export function cleanerAreaLabel(serviceAreas: string[]): string {
  const first = serviceAreas?.[0]
  if (!first) return ''
  const match = AREAS.find((a) => a.slug === first || a.es === first || a.en === first)
  return match?.es ?? ''
}

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.alicantecleaners.com'
