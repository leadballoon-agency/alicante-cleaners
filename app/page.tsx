'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ActivityFeed from '@/components/activity-feed'

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
            <Link
              href="/login"
              className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/onboarding/cleaner"
              className="text-sm bg-[#1A1A1A] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#333] transition-colors"
            >
              Join as cleaner
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-12 bg-gradient-to-b from-white to-[#FAFAF8]">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A1A1A] mb-4 leading-tight">
            Trusted villa cleaning<br />in Alicante
          </h1>
          <p className="text-[#6B6B6B] text-lg max-w-md mx-auto mb-6">
            Book vetted, reliable cleaners for your holiday home. Photo proof included.
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
              All areas
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
                        Featured
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
                        From €{cleaner.hourlyRate * 3}/clean
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
                      View profile & book →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Value Props */}
      <section className="px-6 py-12 bg-white border-t border-[#EBEBEB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-[#1A1A1A] text-center mb-8">
            Why villa owners choose VillaCare
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="font-medium text-[#1A1A1A] mb-1">Vetted cleaners</h3>
              <p className="text-sm text-[#6B6B6B]">Every cleaner is referred and verified by our team</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">📸</div>
              <h3 className="font-medium text-[#1A1A1A] mb-1">Photo proof</h3>
              <p className="text-sm text-[#6B6B6B]">See your villa is ready before you arrive</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="font-medium text-[#1A1A1A] mb-1">WhatsApp updates</h3>
              <p className="text-sm text-[#6B6B6B]">Real-time notifications, no app to download</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA for Cleaners */}
      <section className="px-6 py-12 bg-[#1A1A1A]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-semibold text-white mb-2">
            Are you a cleaner in Alicante?
          </h2>
          <p className="text-white/70 mb-6">
            Join our network of trusted professionals and grow your business
          </p>
          <Link
            href="/onboarding/cleaner"
            className="inline-block bg-white text-[#1A1A1A] px-6 py-3 rounded-xl font-medium hover:bg-[#F5F5F3] transition-colors"
          >
            Apply to join
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-[#EBEBEB]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#9B9B9B]">
            VillaCare · Alicante, Spain
          </p>
          <div className="flex items-center gap-4 text-xs text-[#9B9B9B]">
            <a href="mailto:hello@alicantecleaners.com" className="hover:text-[#1A1A1A]">
              hello@alicantecleaners.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
