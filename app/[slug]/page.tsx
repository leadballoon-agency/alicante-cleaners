'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type Cleaner = {
  id: string
  slug: string
  name: string
  photo: string | null
  rating: number
  reviewCount: number
  areas: string[]
  hourlyRate: number
  bio: string
  services: { type: string; name: string; price: number; hours: number; description: string }[]
  testimonial: { text: string; author: string; location: string; rating: number } | null
}

export default function CleanerProfile() {
  const params = useParams()
  const slug = params.slug as string

  const [cleaner, setCleaner] = useState<Cleaner | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCleaner() {
      try {
        const response = await fetch(`/api/cleaners/${slug}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('not_found')
          } else {
            setError('error')
          }
          return
        }
        const data = await response.json()
        setCleaner(data)
      } catch {
        setError('error')
      } finally {
        setLoading(false)
      }
    }

    fetchCleaner()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C4785A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error === 'not_found' || !cleaner) {
    return (
      <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">&#128269;</div>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Cleaner not found</h1>
          <p className="text-[#6B6B6B] mb-6">This profile doesn&apos;t exist or has been removed.</p>
          <Link href="/" className="text-[#1A1A1A] font-medium underline">
            Go to homepage
          </Link>
        </div>
      </div>
    )
  }

  if (error === 'error') {
    return (
      <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">&#9888;</div>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Something went wrong</h1>
          <p className="text-[#6B6B6B] mb-6">Please try again later.</p>
          <Link href="/" className="text-[#1A1A1A] font-medium underline">
            Go to homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] font-sans pb-safe">
      {/* Header */}
      <header className="px-6 py-4 pt-safe bg-white border-b border-[#EBEBEB]">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#C4785A] rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">V</span>
            </div>
            <span className="font-semibold text-[#1A1A1A]">VillaCare</span>
          </Link>
        </div>
      </header>

      <main className="px-6 py-6 max-w-lg mx-auto">
        {/* Profile Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden flex-shrink-0">
            {cleaner.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cleaner.photo} alt={cleaner.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">&#128100;</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-[#1A1A1A] mb-1">{cleaner.name}</h1>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#C4785A]">&#9733;</span>
              <span className="font-medium text-[#1A1A1A]">{cleaner.rating.toFixed(1)}</span>
              <span className="text-[#6B6B6B]">&middot; {cleaner.reviewCount} reviews</span>
            </div>
            <p className="text-sm text-[#6B6B6B]">{cleaner.areas.join(' · ')}</p>
          </div>
        </div>

        {/* Bio */}
        {cleaner.bio && (
          <p className="text-[#6B6B6B] text-sm mb-6">{cleaner.bio}</p>
        )}

        {/* Services */}
        <div className="space-y-3 mb-8">
          <h2 className="text-sm font-medium text-[#1A1A1A]">Services</h2>
          {cleaner.services.map((service) => (
            <ServiceCard key={service.type} service={service} slug={slug} />
          ))}
        </div>

        {/* Testimonial */}
        {cleaner.testimonial && (
          <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className={`text-sm ${i <= cleaner.testimonial!.rating ? 'text-[#C4785A]' : 'text-[#DEDEDE]'}`}>&#9733;</span>
              ))}
            </div>
            <p className="text-[#1A1A1A] mb-3">&ldquo;{cleaner.testimonial.text}&rdquo;</p>
            <p className="text-sm text-[#6B6B6B]">
              &mdash; {cleaner.testimonial.author}, {cleaner.testimonial.location}
            </p>
          </div>
        )}
      </main>

      {/* Trust badges */}
      <div className="px-6 py-6 border-t border-[#EBEBEB]">
        <div className="max-w-lg mx-auto flex justify-center gap-6 text-center">
          <div>
            <div className="text-lg mb-1">&#128274;</div>
            <p className="text-xs text-[#6B6B6B]">Verified</p>
          </div>
          <div>
            <div className="text-lg mb-1">&#128179;</div>
            <p className="text-xs text-[#6B6B6B]">Secure payment</p>
          </div>
          <div>
            <div className="text-lg mb-1">&#128247;</div>
            <p className="text-xs text-[#6B6B6B]">Photo proof</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ServiceCard({ service, slug }: {
  service: { type: string; name: string; price: number; hours: number; description: string }
  slug: string
}) {
  const icons: Record<string, string> = {
    regular: '&#129529;',
    deep: '&#10024;',
    arrival: '&#127968;',
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#EBEBEB]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span dangerouslySetInnerHTML={{ __html: icons[service.type] || '&#129529;' }} />
            <h3 className="font-medium text-[#1A1A1A]">{service.name}</h3>
          </div>
          <p className="text-sm text-[#6B6B6B] mb-2">{service.description}</p>
          <p className="text-xs text-[#9B9B9B]">{service.hours} hours</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-semibold text-[#1A1A1A] mb-2">&euro;{service.price}</p>
          <Link
            href={`/${slug}/booking?service=${service.type}`}
            className="inline-block bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all"
          >
            Book
          </Link>
        </div>
      </div>
    </div>
  )
}
