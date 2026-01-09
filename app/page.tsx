'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import ActivityFeed from '@/components/activity-feed'
import LanguageSwitcher from '@/components/language-switcher'
import { useLanguage } from '@/components/language-context'
import { PageTracker } from '@/components/analytics/page-tracker'

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
  teamLeader: boolean
}

export default function HomePage() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [cleaners, setCleaners] = useState<Cleaner[]>([])
  const [areas, setAreas] = useState<string[]>([])
  const [selectedArea, setSelectedArea] = useState('all')
  const [loading, setLoading] = useState(true)

  // Check if user is a cleaner (show them a banner to go to their dashboard)
  const isCleaner = session?.user?.role === 'CLEANER'

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
      <PageTracker />
      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-[#EBEBEB] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image
              src="/villacare-horizontal-logo.png"
              alt="VillaCare"
              width={140}
              height={40}
              className="object-contain"
            />
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/about"
              className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors hidden sm:block"
            >
              {t('nav.ourStory')}
            </Link>
            <Link
              href="/join"
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

      {/* Cleaner Banner */}
      {isCleaner && (
        <div className="bg-[#1A1A1A] text-white px-6 py-3 text-center">
          <span className="text-sm">
            Looking for your dashboard?{' '}
            <Link href="/dashboard" className="text-[#C4785A] font-medium hover:underline">
              Go to Dashboard →
            </Link>
          </span>
        </div>
      )}

      {/* Hero */}
      <section className="px-6 py-12 bg-gradient-to-b from-white to-[#FAFAF8]">
        <div className="max-w-3xl mx-auto text-center">
          {/* Beta Badge */}
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFF8F5] text-[#C4785A] text-sm font-medium rounded-full border border-[#C4785A] mb-6">
            <span className="w-2 h-2 bg-[#C4785A] rounded-full animate-pulse" />
            Beta - Join {cleaners.length || 50}+ owners testing with us
          </span>

          <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A1A1A] mb-4 leading-tight">
            Trusted villa cleaning<br />in Alicante
          </h1>
          <p className="text-[#6B6B6B] text-lg max-w-lg mx-auto mb-4">
            Vetted cleaners. Photo proof. Auto-translation. Whether you&apos;re here year-round or visiting - your villa stays cared for.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <Link
              href="/guide/booking"
              className="inline-flex items-center gap-1 text-[#C4785A] text-sm font-medium hover:underline"
            >
              How booking works →
            </Link>
            <Link
              href="/features/ai-assistant"
              className="inline-flex items-center gap-1 text-[#C4785A] text-sm font-medium hover:underline"
            >
              Meet your AI assistant →
            </Link>
          </div>

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

      {/* Trust Badges Bar */}
      <section className="px-6 py-6 bg-white border-y border-[#EBEBEB]">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 bg-[#FFF8F5] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🔑</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">No passwords</p>
                <p className="text-xs text-[#6B6B6B]">Magic link login</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 bg-[#FFF8F5] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🌐</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">No app needed</p>
                <p className="text-xs text-[#6B6B6B]">Works in browser</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 bg-[#FFF8F5] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🌍</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">Auto-translate</p>
                <p className="text-xs text-[#6B6B6B]">7 languages</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 bg-[#FFF8F5] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg">✅</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">Vetted network</p>
                <p className="text-xs text-[#6B6B6B]">Referral only</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Grid */}
      <main className="px-6 py-8 max-w-5xl mx-auto">
        {loading ? (
          <div>
            <div className="h-5 w-32 bg-[#EBEBEB] rounded mb-4 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#EBEBEB] animate-pulse flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-5 w-24 bg-[#EBEBEB] rounded animate-pulse mb-2" />
                      <div className="h-4 w-32 bg-[#EBEBEB] rounded animate-pulse mb-2" />
                      <div className="h-4 w-20 bg-[#EBEBEB] rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-10 bg-[#EBEBEB] rounded animate-pulse mt-4" />
                  <div className="flex gap-1.5 mt-3">
                    <div className="h-5 w-16 bg-[#EBEBEB] rounded-full animate-pulse" />
                    <div className="h-5 w-20 bg-[#EBEBEB] rounded-full animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : cleaners.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#EBEBEB]">
            <p className="text-4xl mb-4">🏠</p>
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">{t('empty.title')}</h2>
            <p className="text-[#6B6B6B] mb-6 max-w-md mx-auto">
              {t('empty.subtitle')}
            </p>
            <Link
              href="/onboarding/cleaner"
              className="inline-block bg-[#C4785A] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#B56A4F] transition-colors"
            >
              {t('empty.cta')}
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#6B6B6B] mb-4">
              {cleaners.length} partner{cleaners.length !== 1 ? 's' : ''} available
              {selectedArea !== 'all' ? ` in ${selectedArea}` : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cleaners.map(cleaner => (
                <Link
                  key={cleaner.id}
                  href={`/${cleaner.slug}`}
                  className="bg-white rounded-2xl p-5 border border-[#EBEBEB] hover:border-[#C4785A] hover:shadow-md transition-all group"
                >
                  {cleaner.featured && (
                    <div className="mb-3">
                      <span className="px-2 py-1 bg-[#FFF8F5] text-[#C4785A] text-xs font-medium rounded-full">
                        {t('cleaner.featured')}
                      </span>
                    </div>
                  )}
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[#1A1A1A] group-hover:text-[#C4785A] transition-colors">
                          {cleaner.name}
                        </h3>
                        {cleaner.slug === 'clara' && (
                          <span className="px-2 py-0.5 bg-gradient-to-r from-amber-600 to-amber-500 text-white text-xs font-medium rounded-full shadow-sm">
                            Co-fundadora
                          </span>
                        )}
                        {cleaner.teamLeader && (
                          <span className="px-2 py-0.5 bg-[#C4785A] text-white text-xs font-medium rounded-full">
                            Team Leader
                          </span>
                        )}
                      </div>
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
                  {cleaner.bio && (
                    <p className="text-sm text-[#6B6B6B] mt-3 line-clamp-2">
                      {cleaner.bio}
                    </p>
                  )}
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

      {/* Problem → Solution Section */}
      <section className="px-6 py-12 bg-[#FFF8F5]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-[#1A1A1A] text-center mb-3">
            Your problems, solved
          </h2>
          <p className="text-[#6B6B6B] text-center mb-10 max-w-xl mx-auto">
            We built VillaCare to fix the frustrations villa owners told us about
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Problem 1 */}
            <div className="bg-white rounded-xl p-5 border border-[#EBEBEB]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#FFEBEE] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">😫</span>
                </div>
                <div>
                  <p className="text-sm text-[#C75050] font-medium mb-1">The problem</p>
                  <p className="text-[#1A1A1A]">Language barrier with cleaners</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#C4785A]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#FFF8F5] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🌍</span>
                </div>
                <div>
                  <p className="text-sm text-[#C4785A] font-medium mb-1">Our solution</p>
                  <p className="text-[#1A1A1A]">Auto-translation - write English, they read Spanish</p>
                </div>
              </div>
            </div>

            {/* Problem 2 */}
            <div className="bg-white rounded-xl p-5 border border-[#EBEBEB]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#FFEBEE] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">😫</span>
                </div>
                <div>
                  <p className="text-sm text-[#C75050] font-medium mb-1">The problem</p>
                  <p className="text-[#1A1A1A]">2,000km away wondering if it&apos;s clean</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#C4785A]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#FFF8F5] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📸</span>
                </div>
                <div>
                  <p className="text-sm text-[#C4785A] font-medium mb-1">Our solution</p>
                  <p className="text-[#1A1A1A]">Photo proof via WhatsApp before you land</p>
                </div>
              </div>
            </div>

            {/* Problem 3 */}
            <div className="bg-white rounded-xl p-5 border border-[#EBEBEB]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#FFEBEE] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">😫</span>
                </div>
                <div>
                  <p className="text-sm text-[#C75050] font-medium mb-1">The problem</p>
                  <p className="text-[#1A1A1A]">Cleaner sick, guests arriving in 48 hours</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#C4785A]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#FFF8F5] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">👥</span>
                </div>
                <div>
                  <p className="text-sm text-[#C4785A] font-medium mb-1">Our solution</p>
                  <p className="text-[#1A1A1A]">Teams cover each other - always someone available</p>
                </div>
              </div>
            </div>

            {/* Problem 4 */}
            <div className="bg-white rounded-xl p-5 border border-[#EBEBEB]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#FFEBEE] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">😫</span>
                </div>
                <div>
                  <p className="text-sm text-[#C75050] font-medium mb-1">The problem</p>
                  <p className="text-[#1A1A1A]">Endless WhatsApp back-and-forth for bookings</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#C4785A]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#FFF8F5] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🤖</span>
                </div>
                <div>
                  <p className="text-sm text-[#C4785A] font-medium mb-1">Our solution</p>
                  <p className="text-[#1A1A1A]">AI handles booking while cleaner works</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Behind the Scenes */}
      <section className="px-6 py-12 bg-white border-t border-[#EBEBEB]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-3">
              {t('behind.title')}
            </h2>
            <p className="text-[#6B6B6B] max-w-2xl mx-auto">
              {t('behind.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Vetting */}
            <div className="bg-[#FAFAF8] rounded-xl p-5 border border-[#EBEBEB]">
              <div className="w-10 h-10 bg-[#FFF8F5] rounded-lg flex items-center justify-center mb-3">
                <span className="text-lg">🔒</span>
              </div>
              <h3 className="font-medium text-[#1A1A1A] mb-1">{t('behind.vetting.title')}</h3>
              <p className="text-sm text-[#6B6B6B]">{t('behind.vetting.desc')}</p>
            </div>

            {/* Team Coverage */}
            <div className="bg-[#FAFAF8] rounded-xl p-5 border border-[#EBEBEB]">
              <div className="w-10 h-10 bg-[#FFF8F5] rounded-lg flex items-center justify-center mb-3">
                <span className="text-lg">👥</span>
              </div>
              <h3 className="font-medium text-[#1A1A1A] mb-1">{t('behind.team.title')}</h3>
              <p className="text-sm text-[#6B6B6B]">{t('behind.team.desc')}</p>
            </div>

            {/* Real-time Updates */}
            <div className="bg-[#FAFAF8] rounded-xl p-5 border border-[#EBEBEB]">
              <div className="w-10 h-10 bg-[#FFF8F5] rounded-lg flex items-center justify-center mb-3">
                <span className="text-lg">💬</span>
              </div>
              <h3 className="font-medium text-[#1A1A1A] mb-1">{t('behind.whatsapp.title')}</h3>
              <p className="text-sm text-[#6B6B6B]">{t('behind.whatsapp.desc')}</p>
            </div>

            {/* Auto Translation */}
            <div className="bg-[#FAFAF8] rounded-xl p-5 border border-[#EBEBEB]">
              <div className="w-10 h-10 bg-[#FFF8F5] rounded-lg flex items-center justify-center mb-3">
                <span className="text-lg">🌍</span>
              </div>
              <h3 className="font-medium text-[#1A1A1A] mb-1">{t('behind.translate.title')}</h3>
              <p className="text-sm text-[#6B6B6B]">{t('behind.translate.desc')}</p>
            </div>

            {/* Secure Access */}
            <div className="bg-[#FAFAF8] rounded-xl p-5 border border-[#EBEBEB]">
              <div className="w-10 h-10 bg-[#FFF8F5] rounded-lg flex items-center justify-center mb-3">
                <span className="text-lg">🔑</span>
              </div>
              <h3 className="font-medium text-[#1A1A1A] mb-1">{t('behind.access.title')}</h3>
              <p className="text-sm text-[#6B6B6B]">{t('behind.access.desc')}</p>
            </div>

            {/* Support */}
            <div className="bg-[#FAFAF8] rounded-xl p-5 border border-[#EBEBEB]">
              <div className="w-10 h-10 bg-[#FFF8F5] rounded-lg flex items-center justify-center mb-3">
                <span className="text-lg">🛟</span>
              </div>
              <h3 className="font-medium text-[#1A1A1A] mb-1">{t('behind.support.title')}</h3>
              <p className="text-sm text-[#6B6B6B]">{t('behind.support.desc')}</p>
            </div>
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

      {/* For Villa Owners Section */}
      <section className="px-6 py-12 bg-white overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Content */}
            <div className="flex-1 order-2 lg:order-1">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mb-4">
                Arrive to a home that&apos;s ready
              </h2>
              <p className="text-[#6B6B6B] mb-6">
                Everything you need to manage your villa cleaning, from anywhere in the world.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>🏠</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">Add your villas</h4>
                    <p className="text-sm text-[#6B6B6B]">Bedrooms, access notes, special instructions - all saved for every clean</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>📅</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">Book in seconds</h4>
                    <p className="text-sm text-[#6B6B6B]">Pick a date, choose your service, done. No phone calls needed</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>🌍</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">Message in any language</h4>
                    <p className="text-sm text-[#6B6B6B]">Write in yours, they read in theirs. Auto-translation built in</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>📸</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">Get photo proof</h4>
                    <p className="text-sm text-[#6B6B6B]">See your spotless villa via WhatsApp before you even land</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>🔑</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">No passwords ever</h4>
                    <p className="text-sm text-[#6B6B6B]">Magic link login. Tap your email, you&apos;re in. Nothing to remember</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Villa Hero Image */}
            <div className="flex-shrink-0 order-1 lg:order-2 w-full lg:w-auto">
              <div className="relative w-full lg:w-[420px] h-[280px] lg:h-[320px] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/villa-hero-person.jpg"
                  alt="Modern Mediterranean villa with pool"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-12 bg-white border-t border-[#EBEBEB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-[#1A1A1A] text-center mb-8">
            {t('testimonials.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#FAFAF8] rounded-xl p-5">
              <p className="text-[#6B6B6B] text-sm mb-4 italic">
                &ldquo;{t('testimonial1.text')}&rdquo;
              </p>
              <p className="text-sm font-medium text-[#1A1A1A]">
                {t('testimonial1.author')}
              </p>
            </div>
            <div className="bg-[#FAFAF8] rounded-xl p-5">
              <p className="text-[#6B6B6B] text-sm mb-4 italic">
                &ldquo;{t('testimonial2.text')}&rdquo;
              </p>
              <p className="text-sm font-medium text-[#1A1A1A]">
                {t('testimonial2.author')}
              </p>
            </div>
            <div className="bg-[#FAFAF8] rounded-xl p-5">
              <p className="text-[#6B6B6B] text-sm mb-4 italic">
                &ldquo;{t('testimonial3.text')}&rdquo;
              </p>
              <p className="text-sm font-medium text-[#1A1A1A]">
                {t('testimonial3.author')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Translation Spotlight */}
      <section className="px-6 py-12 bg-[#FAFAF8]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mb-3">
              Speak your language. They&apos;ll understand.
            </h2>
            <p className="text-[#6B6B6B] max-w-xl mx-auto">
              Our AI assistant speaks your language fluently. Try asking a question in German, French, or Dutch.
            </p>
          </div>

          {/* Language Flags - Compact */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {['🇬🇧', '🇪🇸', '🇩🇪', '🇫🇷', '🇳🇱', '🇮🇹', '🇵🇹'].map((flag, i) => (
              <span key={i} className="text-2xl">{flag}</span>
            ))}
          </div>

          {/* Try it CTA with Clara's photo */}
          <div className="bg-white rounded-2xl p-8 border border-[#EBEBEB]">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Clara's photo */}
              <div className="flex-shrink-0">
                <Image
                  src="/cleaners/Clara-Rodrigues.jpeg"
                  alt="Clara - Professional Cleaner"
                  width={120}
                  height={120}
                  className="rounded-full object-cover border-4 border-[#FAFAF8]"
                />
              </div>
              {/* CTA content */}
              <div className="text-center sm:text-left flex-1">
                <p className="text-[#6B6B6B] mb-4">
                  Don&apos;t take our word for it — try it yourself.
                </p>
                <Link
                  href="/clara?source=homepage-translation-cta"
                  className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#333] transition-colors"
                >
                  <span>💬</span>
                  <span>Chat with Clara in your language</span>
                </Link>
                <p className="text-xs text-[#9B9B9B] mt-3">
                  Try German, French, Dutch, Italian, or Portuguese — she&apos;ll reply fluently
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      {/* Dual CTA Section */}
      <section className="px-6 py-12 bg-[#1A1A1A]">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* For Owners */}
            <div className="bg-white/10 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Ready to find your cleaner?
              </h3>
              <p className="text-white/70 text-sm mb-6">
                Browse vetted professionals in your area
              </p>
              <Link
                href="/login"
                className="inline-block bg-white text-[#1A1A1A] px-6 py-3 rounded-xl font-medium hover:bg-[#F5F5F3] transition-colors w-full sm:w-auto"
              >
                Find a cleaner
              </Link>
              <Link
                href="/guide"
                className="block text-white/60 hover:text-white text-sm mt-3 transition-colors"
              >
                See how it works →
              </Link>
            </div>
            {/* For Cleaners */}
            <div className="bg-white/10 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Are you a cleaning professional?
              </h3>
              <p className="text-white/70 text-sm mb-6">
                Join our invitation-only network
              </p>
              <Link
                href="/join"
                className="inline-block bg-[#C4785A] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#B56A4F] transition-colors w-full sm:w-auto"
              >
                Learn more
              </Link>
              <Link
                href="/join/guide"
                className="block text-white/60 hover:text-white text-sm mt-3 transition-colors"
              >
                See how it works →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Origin Story Section */}
      <section className="px-6 py-10 bg-gradient-to-b from-[#FAFAF8] to-white">
        <div className="max-w-md mx-auto">
          <Link
            href="/about"
            className="block bg-white rounded-2xl p-6 border border-[#EBEBEB] hover:border-[#C4785A] hover:shadow-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#C4785A] to-[#A66347] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <span className="text-2xl">📖</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#1A1A1A] group-hover:text-[#C4785A] transition-colors">
                  {t('nav.ourStory')}
                </h3>
                <p className="text-sm text-[#6B6B6B]">
                  How a villa owner and a cleaner built the service they both wished existed
                </p>
              </div>
              <div className="flex-shrink-0 text-[#C4785A] group-hover:translate-x-1 transition-transform">
                →
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 bg-white border-t border-[#EBEBEB]">
        <div className="max-w-5xl mx-auto">
          {/* Mobile: Stack vertically */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <Image
                src="/villacare-horizontal-logo.png"
                alt="VillaCare"
                width={100}
                height={28}
                className="object-contain opacity-60"
              />
              <span className="text-xs text-[#9B9B9B]">· {t('footer.location')}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#9B9B9B]">
              <Link href="/privacy" className="hover:text-[#1A1A1A] transition-colors">
                Privacy
              </Link>
              <span className="text-[#DEDEDE]">·</span>
              <Link href="/terms" className="hover:text-[#1A1A1A] transition-colors">
                Terms
              </Link>
            </div>
          </div>
          {/* Powered by badge */}
          <div className="mt-4 pt-4 border-t border-[#EBEBEB] text-center">
            <a
              href="https://villacare.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#9B9B9B] hover:text-[#6B6B6B] transition-colors"
            >
              <span>Powered by</span>
              <span className="font-medium">villacare.app</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
