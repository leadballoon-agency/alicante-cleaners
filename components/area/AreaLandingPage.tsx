import Link from 'next/link'
import Image from 'next/image'
import { PageTracker } from '@/components/analytics/page-tracker'
import { CleanerSlider, type SliderCleaner } from '@/components/CleanerSlider'
import { SchemaScript } from '@/components/seo/schema-script'
import {
  generateAreaServiceSchema,
  generateBreadcrumbSchema,
  generateCleanerListSchema,
  generateFAQSchema,
} from '@/lib/seo/schema'
import { AREA_INTROS, STANDARD_SERVICES, getAreaFaqs } from '@/lib/area/area-content'
import { AREAS, SITE_URL, alternateAreaPath, areaName, areaPath, type Area, type AreaLocale } from '@/lib/area/areas'
import type { AreaCleanerCard, AreaPricing } from '@/lib/area/get-area-page-data'

type Props = {
  area: Area
  locale: AreaLocale
  cleaners: AreaCleanerCard[]
  pricing: AreaPricing
}

const LABELS = {
  es: {
    home: 'Inicio',
    category: 'Limpieza de villas',
    switchLangLabel: 'English',
    heroKicker: 'Limpieza de villas',
    cleanersTitle: (name: string) => `Limpiadoras en ${name}`,
    noCleaners: (name: string) => `Aún no tenemos limpiadoras activas en ${name}.`,
    recruitNote: (name: string) => `¿Limpias en ${name}? Únete a VillaCare`,
    recruitCta: 'Solicitar unirme',
    pricingTitle: 'Precios orientativos',
    pricingSubtitle: 'Calculado a partir de las tarifas reales de las limpiadoras activas en la zona.',
    perClean: 'por limpieza',
    faqTitle: 'Preguntas frecuentes',
    crossLinksTitle: 'Otras zonas',
    directoryLink: 'Ver todas las limpiadoras',
    ownersLink: 'Para propietarios',
    ctaTitle: (name: string) => `Ver limpiadoras en ${name}`,
    ctaSubtitle: 'Reserva directamente desde el perfil, sin llamadas ni formularios.',
    ctaButton: 'Reservar ahora',
    reviewsLabel: 'reseñas',
    reviewLabel: 'reseña',
    newCleanerLabel: 'Nueva en la plataforma',
    privacy: 'Privacidad',
    terms: 'Términos',
  },
  en: {
    home: 'Home',
    category: 'Villa Cleaning',
    switchLangLabel: 'Español',
    heroKicker: 'Villa Cleaning',
    cleanersTitle: (name: string) => `Cleaners in ${name}`,
    noCleaners: (name: string) => `We don't have active cleaners in ${name} yet.`,
    recruitNote: (name: string) => `Clean villas in ${name}? Join VillaCare`,
    recruitCta: 'Apply to join',
    pricingTitle: 'Indicative pricing',
    pricingSubtitle: "Calculated from the real hourly rates of the cleaners currently active in the area.",
    perClean: 'per clean',
    faqTitle: 'Frequently asked questions',
    crossLinksTitle: 'Other areas',
    directoryLink: 'See all cleaners',
    ownersLink: 'For villa owners',
    ctaTitle: (name: string) => `View cleaners in ${name}`,
    ctaSubtitle: 'Book directly from a profile — no calls, no forms.',
    ctaButton: 'Book now',
    reviewsLabel: 'reviews',
    reviewLabel: 'review',
    newCleanerLabel: 'New to the platform',
    privacy: 'Privacy',
    terms: 'Terms',
  },
} as const

function formatPrice(n: number): string {
  return `€${Math.round(n)}`
}

export function AreaLandingPage({ area, locale, cleaners, pricing }: Props) {
  const t = LABELS[locale]
  const name = areaName(area, locale)
  const intro = AREA_INTROS[area.slug]?.[locale] ?? ''
  const otherAreas = AREAS.filter((a) => a.slug !== area.slug)
  const ownPath = areaPath(locale, area.slug)
  const otherLocalePath = alternateAreaPath(locale, area.slug)

  const priceRangeText = pricing
    ? `${formatPrice(pricing.services[0].minPrice)}–${formatPrice(pricing.services[0].maxPrice)}`
    : null
  const faqs = getAreaFaqs(locale, name, priceRangeText)

  const sliderCleaners: SliderCleaner[] = cleaners.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    photo: c.photo,
    rating: c.rating,
    reviewCount: c.reviewCount,
    serviceAreas: c.serviceAreas,
    chips: c.teamLeader
      ? [
          {
            label: locale === 'es' ? 'Líder de equipo' : 'Team Leader',
            className:
              'inline-block text-[10.5px] bg-[#E8F5E9] text-[#2E7D32] px-1.5 py-0.5 rounded-full font-semibold',
          },
        ]
      : [],
  }))

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.home, url: '/' },
    { name: t.category, url: '/' },
    { name, url: ownPath },
  ])

  const faqSchema = generateFAQSchema(faqs)

  const listSchema =
    cleaners.length > 0
      ? generateCleanerListSchema(
          cleaners.map((c) => ({
            name: c.name,
            slug: c.slug,
            photo: c.photo,
            rating: c.rating,
            reviewCount: c.reviewCount,
            hourlyRate: c.hourlyRate,
          })),
          {
            name: `${t.cleanersTitle(name)} | VillaCare`,
            description: `${locale === 'es' ? 'Limpiadoras de villas verificadas en' : 'Verified villa cleaners in'} ${name}`,
          }
        )
      : null

  const serviceSchemas = pricing
    ? STANDARD_SERVICES.map((service, i) =>
        generateAreaServiceSchema({
          areaName: name,
          serviceName: locale === 'es' ? service.es : service.en,
          description:
            locale === 'es'
              ? `${service.es} de villas en ${name} (${service.hours}h)`
              : `${service.en} for villas in ${name} (${service.hours}h)`,
          minPrice: pricing.services[i].minPrice,
          maxPrice: pricing.services[i].maxPrice,
          url: `${SITE_URL}${ownPath}`,
        })
      )
    : []

  return (
    <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] font-sans">
      <PageTracker />
      <SchemaScript schema={[breadcrumbSchema, faqSchema, ...(listSchema ? [listSchema] : []), ...serviceSchemas]} />

      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-[#EBEBEB] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image
              src="/villacare-horizontal-logo.png"
              alt="VillaCare"
              width={140}
              height={40}
              className="object-contain"
            />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href={otherLocalePath} className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
              {t.switchLangLabel}
            </Link>
            <Link href="/" className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
              {t.home}
            </Link>
          </div>
        </div>
      </header>

      <main className="px-6 py-10 max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs text-[#9B9B9B] mb-6">
          <Link href="/" className="hover:text-[#1A1A1A]">
            {t.home}
          </Link>
          <span className="mx-1.5">/</span>
          <span>{t.category}</span>
          <span className="mx-1.5">/</span>
          <span className="text-[#6B6B6B]">{name}</span>
        </nav>

        {/* Hero */}
        <div className="mb-10">
          <div className="inline-block px-3 py-1 bg-[#FFF8F5] text-[#C4785A] text-xs font-medium rounded-full mb-4">
            {t.heroKicker}
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A1A1A] mb-4">
            {locale === 'es' ? `Limpieza de villas en ${name}` : `Villa cleaning in ${name}`}
          </h1>
          <p className="text-[#6B6B6B] leading-relaxed">{intro}</p>
          <a
            href="#cleaners"
            className="inline-block mt-6 bg-[#1A1A1A] text-white px-5 py-3 rounded-xl text-sm font-medium active:scale-[0.98] transition-all"
          >
            {t.ctaTitle(name)}
          </a>
        </div>

        {/* Cleaner cards */}
        <section id="cleaners" className="mb-10 scroll-mt-20">
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">{t.cleanersTitle(name)}</h2>
          {cleaners.length > 0 ? (
            <CleanerSlider
              cleaners={sliderCleaners}
              reviewsLabel={t.reviewsLabel}
              reviewLabel={t.reviewLabel}
              newCleanerLabel={t.newCleanerLabel}
            />
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB] text-center">
              <p className="text-[#6B6B6B] mb-4">{t.noCleaners(name)}</p>
              <p className="text-[#1A1A1A] font-medium mb-3">{t.recruitNote(name)}</p>
              <Link
                href="/join"
                className="inline-block bg-[#C4785A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#B56A4F] transition-colors"
              >
                {t.recruitCta}
              </Link>
            </div>
          )}
        </section>

        {/* Pricing */}
        {pricing && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-1">{t.pricingTitle}</h2>
            <p className="text-sm text-[#9B9B9B] mb-4">{t.pricingSubtitle}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {STANDARD_SERVICES.map((service, i) => (
                <div key={service.type} className="bg-white rounded-2xl p-4 border border-[#EBEBEB]">
                  <div className="font-semibold text-[#1A1A1A]">
                    {locale === 'es' ? service.es : service.en}
                  </div>
                  <div className="text-xs text-[#9B9B9B] mb-2">{service.hours}h</div>
                  <div className="text-lg font-bold text-[#C4785A]">
                    {formatPrice(pricing.services[i].minPrice)}–{formatPrice(pricing.services[i].maxPrice)}
                  </div>
                  <div className="text-xs text-[#9B9B9B]">{t.perClean}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">{t.faqTitle}</h2>
          <div className="space-y-2">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="bg-white rounded-xl border border-[#EBEBEB] p-4 group"
              >
                <summary className="font-medium text-[#1A1A1A] cursor-pointer list-none flex items-center justify-between">
                  {faq.question}
                  <span className="text-[#9B9B9B] group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-sm text-[#6B6B6B] mt-3 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Cross-links */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-3">{t.crossLinksTitle}</h2>
          <div className="flex flex-wrap gap-2">
            {otherAreas.map((a) => (
              <Link
                key={a.slug}
                href={areaPath(locale, a.slug)}
                className="text-xs bg-white border border-[#EBEBEB] text-[#6B6B6B] px-3 py-1.5 rounded-full hover:border-[#C4785A] hover:text-[#1A1A1A] transition-colors"
              >
                {areaName(a, locale)}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <Link href="/" className="text-[#C4785A] hover:text-[#B56A4F] font-medium">
              {t.directoryLink} →
            </Link>
            <Link href="/owners" className="text-[#C4785A] hover:text-[#B56A4F] font-medium">
              {t.ownersLink} →
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-6">
          <div className="bg-[#1A1A1A] rounded-2xl p-6 sm:p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">{t.ctaTitle(name)}</h2>
            <p className="text-[#9B9B9B] mb-5">{t.ctaSubtitle}</p>
            <a
              href="#cleaners"
              className="inline-block bg-white text-[#1A1A1A] px-5 py-3 rounded-xl text-sm font-medium active:scale-[0.98] transition-all"
            >
              {t.ctaButton}
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 bg-white border-t border-[#EBEBEB]">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/villacare-horizontal-logo.png"
              alt="VillaCare"
              width={100}
              height={28}
              className="object-contain opacity-60"
            />
          </div>
          <div className="flex items-center gap-3 text-xs text-[#9B9B9B]">
            <Link href="/privacy" className="hover:text-[#1A1A1A] transition-colors">
              {t.privacy}
            </Link>
            <span className="text-[#DEDEDE]">·</span>
            <Link href="/terms" className="hover:text-[#1A1A1A] transition-colors">
              {t.terms}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
