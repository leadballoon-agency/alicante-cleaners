import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AreaLandingPage } from '@/components/area/AreaLandingPage'
import { AREA_INTROS } from '@/lib/area/area-content'
import { getAreaPageData } from '@/lib/area/get-area-page-data'
import { AREAS, SITE_URL, alternateAreaPath, areaPath, getArea } from '@/lib/area/areas'

// Areas change rarely (a cleaner joining/leaving covers most updates) — ISR
// keeps the page fast for crawlers without hitting the DB on every request,
// same pattern as the cleaner profile pages (app/[slug]/page.tsx).
export const revalidate = 3600

export async function generateStaticParams() {
  return AREAS.map((area) => ({ area: area.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ area: string }>
}): Promise<Metadata> {
  const { area: slug } = await params
  const area = getArea(slug)

  if (!area) {
    return { title: 'Zona no encontrada' }
  }

  // Root layout applies the "%s | VillaCare" title template — don't append
  // "| VillaCare" here too, or it renders twice.
  const title = `Limpieza de Villas en ${area.es}`
  const description = AREA_INTROS[slug]?.es || `Limpieza de villas profesional en ${area.es}, Alicante.`
  const esPath = areaPath('es', slug)
  const enPath = alternateAreaPath('es', slug)

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${esPath}`,
      languages: {
        es: `${SITE_URL}${esPath}`,
        en: `${SITE_URL}${enPath}`,
        'x-default': `${SITE_URL}${esPath}`,
      },
    },
    openGraph: {
      title: `${title} | VillaCare`,
      description,
      url: `${SITE_URL}${esPath}`,
      siteName: 'VillaCare',
      locale: 'es_ES',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | VillaCare`,
      description,
    },
  }
}

export default async function AreaLimpiezaPage({
  params,
}: {
  params: Promise<{ area: string }>
}) {
  const { area: slug } = await params
  const area = getArea(slug)

  if (!area) {
    notFound()
  }

  const { cleaners, pricing } = await getAreaPageData(slug)

  return <AreaLandingPage area={area} locale="es" cleaners={cleaners} pricing={pricing} />
}
