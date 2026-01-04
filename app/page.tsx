'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ActivityFeed from '@/components/activity-feed'
import LanguageSwitcher from '@/components/language-switcher'
import { useLanguage } from '@/components/language-context'

type Cleaner = {
  id: string
  slug: string
  name: string
  photo: string | null
  bio: string | null
  serviceAreas: string[]
  hourlyRate: number
  rating: number
  reviewCount: number
  featured: boolean
}

export default function HomePage() {
  const { t } = useLanguage()
  const [cleaners, setCleaners] = useState<Cleaner[]>([])
  const [areas, setAreas] = useState<string[]>([])
  const [selectedArea, setSelectedArea] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCleaners()
  }, [selectedArea])

  const fetchCleaners = async () => {
    try {
      const res = await fetch(`/api/cleaners${selectedArea !== 'all' ? `?area=${selectedArea}` : ''}`)
      const data = await res.json()
      setCleaners(data.cleaners || [])
      if (data.areas) setAreas(data.areas)
    } catch (error) {
      console.error('Error fetching cleaners:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] font-sans pb-safe">
      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-[#EBEBEB] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#C4785A] rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">V</span>
            </div>
            <span className="font-semibold text-[#1A1A1A]">VillaCare</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/about"
              className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors hidden sm:block"
            >
              {t('nav.ourStory')}
            </Link>
            <Link
              href="/onboarding/cleaner"
              className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors hidden sm:block"
            >
              {t('nav.joinAsCleaner')}
            </Link>
            <Link
              href="/login"
              className="text-sm bg-[#C4785A] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#B56A4F] transition-colors"
            >
              {t('nav.bookClean')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-12 bg-gradient-to-b from-white to-[#FAFAF8]">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A1A1A] mb-4 leading-tight">
            {t('hero.title')}<br />{t('hero.titleLine2')}
          </h1>
          <p className="text-[#6B6B6B] text-lg max-w-md mx-auto mb-6">
            {t('hero.subtitle')}
          </p>

          {/* Activity Feed */}
          <div className="flex justify-center mb-8">
            <ActivityFeed />
          </div>

          {/* Area Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setSelectedArea('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedArea === 'all'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-white border border-[#DEDEDE] text-[#6B6B6B] hover:border-[#1A1A1A]'
              }`}
            >
              {t('filter.all')}
            </button>
            {areas.map(area => (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedArea === area
                    ? 'bg-[#1A1A1A] text-white'
                    : 'bg-white border border-[#DEDEDE] text-[#6B6B6B] hover:border-[#1A1A1A]'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="px-6 py-10 bg-white border-y border-[#EBEBEB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-[#1A1A1A] text-center mb-8">
            {t('howItWorks.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#FFF8F5] rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-[#C4785A] font-bold text-lg">1</span>
              </div>
              <h3 className="font-medium text-[#1A1A1A] mb-1">{t('howItWorks.step1Title')}</h3>
              <p className="text-sm text-[#6B6B6B]">
                {t('howItWorks.step1Desc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#FFF8F5] rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-[#C4785A] font-bold text-lg">2</span>
              </div>
              <h3 className="font-medium text-[#1A1A1A] mb-1">{t('howItWorks.step2Title')}</h3>
              <p className="text-sm text-[#6B6B6B]">
                {t('howItWorks.step2Desc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#FFF8F5] rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-[#C4785A] font-bold text-lg">3</span>
              </div>
              <h3 className="font-medium text-[#1A1A1A] mb-1">{t('howItWorks.step3Title')}</h3>
              <p className="text-sm text-[#6B6B6B]">
                {t('howItWorks.step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="px-6 py-12 bg-[#FAFAF8]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mb-3">
              {t('tech.title')}
            </h2>
            <p className="text-[#6B6B6B] max-w-xl mx-auto">
              {t('tech.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* For Villa Owners */}
            <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-5 flex items-center gap-2">
                <span className="text-xl">🏠</span>
                {t('tech.forOwners')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#FFF8F5] rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">🌍</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A] text-sm">{t('tech.owner1Title')}</h4>
                    <p className="text-sm text-[#6B6B6B]">{t('tech.owner1Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#FFF8F5] rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">📸</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A] text-sm">{t('tech.owner2Title')}</h4>
                    <p className="text-sm text-[#6B6B6B]">{t('tech.owner2Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#FFF8F5] rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">🔒</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A] text-sm">{t('tech.owner3Title')}</h4>
                    <p className="text-sm text-[#6B6B6B]">{t('tech.owner3Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#FFF8F5] rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">✈️</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A] text-sm">{t('tech.owner4Title')}</h4>
                    <p className="text-sm text-[#6B6B6B]">{t('tech.owner4Desc')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Cleaners */}
            <div className="bg-[#1A1A1A] rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <span className="text-xl">✨</span>
                {t('tech.forCleaners')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">📈</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">{t('tech.cleaner1Title')}</h4>
                    <p className="text-sm text-white/70">{t('tech.cleaner1Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">🌍</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">{t('tech.cleaner2Title')}</h4>
                    <p className="text-sm text-white/70">{t('tech.cleaner2Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">💳</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">{t('tech.cleaner3Title')}</h4>
                    <p className="text-sm text-white/70">{t('tech.cleaner3Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">⭐</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">{t('tech.cleaner4Title')}</h4>
                    <p className="text-sm text-white/70">{t('tech.cleaner4Desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">📅</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">{t('tech.cleaner5Title')}</h4>
                    <p className="text-sm text-white/70">{t('tech.cleaner5Desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cleaners Grid */}
      <main className="px-6 py-8 max-w-5xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <span className="w-8 h-8 border-2 border-[#1A1A1A]/20 border-t-[#1A1A1A] rounded-full animate-spin inline-block" />
            <p className="text-[#6B6B6B] mt-3">Loading cleaners...</p>
          </div>
        ) : cleaners.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#EBEBEB]">
            <p className="text-4xl mb-4">🔍</p>
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">No cleaners found</h2>
            <p className="text-[#6B6B6B] mb-4">
              {selectedArea !== 'all'
                ? `No cleaners available in ${selectedArea} yet.`
                : 'No cleaners available yet.'}
            </p>
            {selectedArea !== 'all' && (
              <button
                onClick={() => setSelectedArea('all')}
                className="text-[#C4785A] font-medium hover:underline"
              >
                View all areas
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-[#6B6B6B] mb-4">
              {cleaners.length} cleaner{cleaners.length !== 1 ? 's' : ''} available
              {selectedArea !== 'all' ? ` in ${selectedArea}` : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cleaners.map(cleaner => (
                <Link
                  key={cleaner.id}
                  href={`/${cleaner.slug}`}
                  className="bg-white rounded-2xl p-5 border border-[#EBEBEB] hover:border-[#C4785A] hover:shadow-md transition-all group"
                >
                  {/* Featured badge */}
                  {cleaner.featured && (
                    <div className="mb-3">
                      <span className="px-2 py-1 bg-[#FFF8F5] text-[#C4785A] text-xs font-medium rounded-full">
                        {t('cleaner.featured')}
                      </span>
                    </div>
                  )}

                  {/* Cleaner info */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden relative flex-shrink-0">
                      {cleaner.photo ? (
                        <Image
                          src={cleaner.photo}
                          alt={cleaner.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-2xl">👤</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#1A1A1A] group-hover:text-[#C4785A] transition-colors">
                        {cleaner.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[#C4785A]">★</span>
                        <span className="text-sm font-medium text-[#1A1A1A]">
                          {cleaner.rating.toFixed(1)}
                        </span>
                        <span className="text-sm text-[#6B6B6B]">
                          ({cleaner.reviewCount} review{cleaner.reviewCount !== 1 ? 's' : ''})
                        </span>
                      </div>
                      <p className="text-sm text-[#6B6B6B] mt-1">
                        {t('cleaner.from')} €{cleaner.hourlyRate * 3}/clean
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  {cleaner.bio && (
                    <p className="text-sm text-[#6B6B6B] mt-3 line-clamp-2">
                      {cleaner.bio}
                    </p>
                  )}

                  {/* Areas */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {cleaner.serviceAreas.slice(0, 3).map(area => (
                      <span
                        key={area}
                        className="px-2 py-0.5 bg-[#F5F5F3] text-[#6B6B6B] text-xs rounded-full"
                      >
                        {area}
                      </span>
                    ))}
                    {cleaner.serviceAreas.length > 3 && (
                      <span className="text-xs text-[#6B6B6B]">
                        +{cleaner.serviceAreas.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="mt-4 pt-4 border-t border-[#EBEBEB]">
                    <span className="text-sm font-medium text-[#C4785A] group-hover:underline">
                      {t('cleaner.viewProfile')} →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Built for Villa Life */}
      <section className="px-6 py-12 bg-[#FFF8F5]">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mb-4">
                {t('villa.title')}
              </h2>
              <div className="space-y-4 text-[#6B6B6B]">
                <p>{t('villa.p1')}</p>
                <p>{t('villa.p2')}</p>
                <p className="font-medium text-[#1A1A1A]">{t('villa.p3')}</p>
              </div>
            </div>
            <div className="flex-shrink-0 grid grid-cols-2 gap-3">
              <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center border border-[#EBEBEB]">
                <span className="text-4xl">🏊</span>
              </div>
              <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center border border-[#EBEBEB]">
                <span className="text-4xl">🌴</span>
              </div>
              <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center border border-[#EBEBEB]">
                <span className="text-4xl">☀️</span>
              </div>
              <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center border border-[#EBEBEB]">
                <span className="text-4xl">🏡</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="px-6 py-12 bg-white border-t border-[#EBEBEB]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-[#1A1A1A] text-center mb-8">
            {t('why.title')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="text-center">
              <div className="text-2xl mb-2">🔒</div>
              <h3 className="font-medium text-[#1A1A1A] text-sm mb-1">{t('why.vettedTitle')}</h3>
              <p className="text-xs text-[#6B6B6B]">{t('why.vettedDesc')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📸</div>
              <h3 className="font-medium text-[#1A1A1A] text-sm mb-1">{t('why.photoTitle')}</h3>
              <p className="text-xs text-[#6B6B6B]">{t('why.photoDesc')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">💬</div>
              <h3 className="font-medium text-[#1A1A1A] text-sm mb-1">{t('why.whatsappTitle')}</h3>
              <p className="text-xs text-[#6B6B6B]">{t('why.whatsappDesc')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🌍</div>
              <h3 className="font-medium text-[#1A1A1A] text-sm mb-1">{t('why.translateTitle')}</h3>
              <p className="text-xs text-[#6B6B6B]">{t('why.translateDesc')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📅</div>
              <h3 className="font-medium text-[#1A1A1A] text-sm mb-1">{t('why.calendarTitle')}</h3>
              <p className="text-xs text-[#6B6B6B]">{t('why.calendarDesc')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">💳</div>
              <h3 className="font-medium text-[#1A1A1A] text-sm mb-1">{t('why.paymentTitle')}</h3>
              <p className="text-xs text-[#6B6B6B]">{t('why.paymentDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA for Cleaners */}
      <section className="px-6 py-12 bg-[#1A1A1A]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-semibold text-white mb-2">
            {t('cta.cleanerTitle')}
          </h2>
          <p className="text-white/70 mb-6">
            {t('cta.cleanerSubtitle')}
          </p>
          <Link
            href="/onboarding/cleaner"
            className="inline-block bg-white text-[#1A1A1A] px-6 py-3 rounded-xl font-medium hover:bg-[#F5F5F3] transition-colors"
          >
            {t('cta.applyJoin')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-[#EBEBEB]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#9B9B9B]">
            VillaCare · {t('footer.location')}
          </p>
          <div className="flex items-center gap-4 text-xs text-[#9B9B9B]">
            <Link href="/about" className="hover:text-[#1A1A1A]">
              {t('nav.ourStory')}
            </Link>
            <Link href="/privacy" className="hover:text-[#1A1A1A]">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#1A1A1A]">
              Terms
            </Link>
            <a href="mailto:hello@alicantecleaners.com" className="hover:text-[#1A1A1A]">
              hello@alicantecleaners.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
