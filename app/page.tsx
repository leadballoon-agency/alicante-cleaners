'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ActivityFeed from '@/components/activity-feed'
import LanguageSwitcher from '@/components/language-switcher'
import { useLanguage } from '@/components/language-context'
import { PhoneMockup } from '@/components/ui/phone-mockup'

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
            Your villa, ready<br />when you are
          </h1>
          <p className="text-[#6B6B6B] text-lg max-w-lg mx-auto mb-6">
            Vetted cleaners. Photo proof. Auto-translation. No passwords, no apps, no hassle.
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

      {/* Problem Section - Pain Points */}
      <section className="px-6 py-12 bg-[#FFF8F5]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-[#1A1A1A] text-center mb-8">
            Sound familiar?
          </h2>
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 border-l-4 border-[#C4785A]">
              <div className="flex items-start gap-4">
                <span className="text-2xl">✈️</span>
                <p className="text-[#6B6B6B]">
                  You&apos;re 2,000km away wondering if the villa is ready for your guests arriving tomorrow
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border-l-4 border-[#C4785A]">
              <div className="flex items-start gap-4">
                <span className="text-2xl">💬</span>
                <p className="text-[#6B6B6B]">
                  Google Translate isn&apos;t quite getting your cleaning instructions across
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border-l-4 border-[#C4785A]">
              <div className="flex items-start gap-4">
                <span className="text-2xl">📅</span>
                <p className="text-[#6B6B6B]">
                  Your usual cleaner is sick and you have no backup - guests arrive in 48 hours
                </p>
              </div>
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
            {/* Phone Mockup */}
            <div className="flex-shrink-0 order-1 lg:order-2">
              <PhoneMockup
                src="/screenshots/messaging-translation.png"
                alt="Auto-translation messaging"
              />
            </div>
          </div>
        </div>
      </section>

      {/* For Cleaners Section */}
      <section className="px-6 py-12 bg-[#1A1A1A] overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Phone Mockup */}
            <div className="flex-shrink-0">
              <PhoneMockup
                src="/screenshots/cleaner-dashboard.png"
                alt="Cleaner dashboard"
              />
            </div>
            {/* Content */}
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
                Built for cleaning professionals
              </h2>
              <p className="text-white/70 mb-6">
                Tools to grow your business, not more admin work.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>📱</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Sign up with your phone</h4>
                    <p className="text-sm text-white/70">No email needed. Just your mobile number + a code</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>📈</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">See your earnings</h4>
                    <p className="text-sm text-white/70">Track this week, this month, and what&apos;s coming up</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>✅</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Accept bookings instantly</h4>
                    <p className="text-sm text-white/70">One tap to confirm. Decline if you&apos;re busy. Simple</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>📅</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Sync to your calendar</h4>
                    <p className="text-sm text-white/70">Google Calendar, Apple Calendar, Outlook - automatic</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>👥</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Build your team</h4>
                    <p className="text-sm text-white/70">Invite trusted colleagues. Cover for each other. Never let clients down</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>🤖</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">AI assistant included</h4>
                    <p className="text-sm text-white/70">Handles inquiries while you focus on cleaning</p>
                  </div>
                </div>
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
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mb-3">
              Speak your language. They&apos;ll understand.
            </h2>
            <p className="text-[#6B6B6B] max-w-2xl mx-auto">
              Write in English, German, French, Dutch, Italian, or Portuguese. Your cleaner reads it in Spanish.
              They reply in Spanish, you read it in yours. No more Google Translate screenshots.
            </p>
          </div>

          {/* Language Flags */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#EBEBEB]">
              <span className="text-xl">🇬🇧</span>
              <span className="text-sm text-[#6B6B6B]">English</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#EBEBEB]">
              <span className="text-xl">🇪🇸</span>
              <span className="text-sm text-[#6B6B6B]">Español</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#EBEBEB]">
              <span className="text-xl">🇩🇪</span>
              <span className="text-sm text-[#6B6B6B]">Deutsch</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#EBEBEB]">
              <span className="text-xl">🇫🇷</span>
              <span className="text-sm text-[#6B6B6B]">Français</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#EBEBEB]">
              <span className="text-xl">🇳🇱</span>
              <span className="text-sm text-[#6B6B6B]">Nederlands</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#EBEBEB]">
              <span className="text-xl">🇮🇹</span>
              <span className="text-sm text-[#6B6B6B]">Italiano</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#EBEBEB]">
              <span className="text-xl">🇵🇹</span>
              <span className="text-sm text-[#6B6B6B]">Português</span>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🇬🇧</span>
                <span className="text-sm text-[#6B6B6B]">You write in English</span>
              </div>
              <span className="text-[#C4785A] font-bold">→</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                <span className="text-sm text-[#6B6B6B]">Auto-translated</span>
              </div>
              <span className="text-[#C4785A] font-bold">→</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🇪🇸</span>
                <span className="text-sm text-[#6B6B6B]">Cleaner reads in Spanish</span>
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
                href="/onboarding/cleaner"
                className="inline-block bg-[#C4785A] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#B56A4F] transition-colors w-full sm:w-auto"
              >
                Apply to join
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
                  How two villa owners in Alicante built the service they wished existed
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
            <div className="flex items-center gap-4 text-xs text-[#9B9B9B]">
              <Link href="/privacy" className="hover:text-[#1A1A1A] transition-colors">
                Privacy
              </Link>
              <span className="text-[#DEDEDE]">·</span>
              <Link href="/terms" className="hover:text-[#1A1A1A] transition-colors">
                Terms
              </Link>
              <span className="text-[#DEDEDE]">·</span>
              <a href="mailto:hello@alicantecleaners.com" className="hover:text-[#1A1A1A] transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
