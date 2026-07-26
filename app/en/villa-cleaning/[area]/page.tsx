import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AreaLandingPage } from '@/components/area/AreaLandingPage'
import { AREA_INTROS } from '@/lib/area/area-content'
import { getAreaPageData } from '@/lib/area/get-area-page-data'
import { AREAS, SITE_URL, alternateAreaPath, areaPath, getArea } from '@/lib/area/areas'

// Same ISR window as the Spanish counterpart (app/limpieza-de-villas/[area]/page.tsx)
// and the cleaner profile pages (app/[slug]/page.tsx).
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
    return { title: 'Area Not Found' }
  }

  // Root layout applies the "%s | VillaCare" title template — don't append
  // "| VillaCare" here too, or it renders twice.
  const title = `Villa Cleaning in ${area.en}`
  const description = AREA_INTROS[slug]?.en || `Professional villa cleaning in ${area.en}, Alicante.`
  const enPath = areaPath('en', slug)
  const esPath = alternateAreaPath('en', slug)

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${enPath}`,
      languages: {
        es: `${SITE_URL}${esPath}`,
        en: `${SITE_URL}${enPath}`,
        'x-default': `${SITE_URL}${esPath}`,
      },
    },
    openGraph: {
      title: `${title} | VillaCare`,
      description,
      url: `${SITE_URL}${enPath}`,
      siteName: 'VillaCare',
      locale: 'en_GB',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | VillaCare`,
      description,
    },
  }
}

export default async function AreaVillaCleaningPage({
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

  return <AreaLandingPage area={area} locale="en" cleaners={cleaners} pricing={pricing} />
}
