'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import LanguageSwitcher from '@/components/language-switcher'
import { useLanguage } from '@/components/language-context'
import { LANGUAGES } from '@/lib/i18n'

type Review = {
  id: string
  rating: number
  text: string
  author: string
  createdAt: string
}

type TeamMember = {
  id: string
  slug: string
  name: string
  photo: string | null
  rating: number
  reviewCount: number
}

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
  languages: string[]
  teamLeader: boolean
  teamName: string | null
  teamMembers: TeamMember[]
  services: { type: string; name: string; price: number; hours: number; description: string }[]
  testimonial: { text: string; author: string; location: string; rating: number } | null
  reviews: Review[]
}

export default function CleanerProfile() {
  const params = useParams()
  const slug = params.slug as string
  const { t } = useLanguage()

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
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">{t('profile.notFound')}</h1>
          <p className="text-[#6B6B6B] mb-6">{t('profile.notFoundDesc')}</p>
          <Link href="/" className="text-[#1A1A1A] font-medium underline">
            {t('common.goHome')}
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
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">{t('common.error')}</h1>
          <p className="text-[#6B6B6B] mb-6">{t('common.tryAgain')}</p>
          <Link href="/" className="text-[#1A1A1A] font-medium underline">
            {t('common.goHome')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] font-sans pb-safe">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 bg-white border-b border-[#EBEBEB] sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/">
            <Image
              src="/villacare-horizontal-logo.png"
              alt="VillaCare"
              width={140}
              height={40}
              className="object-contain"
            />
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Hero Profile Section */}
      <div className="bg-gradient-to-b from-[#FFF8F5] to-[#FAFAF8] px-6 py-8">
        <div className="max-w-lg mx-auto">
          {/* Profile Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-24 h-24 rounded-2xl bg-white shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-white">
              {cleaner.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cleaner.photo} alt={cleaner.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">&#128100;</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-2xl font-semibold text-[#1A1A1A]">{cleaner.name}</h1>
                {cleaner.teamLeader && (
                  <span className="px-2 py-0.5 bg-[#C4785A] text-white text-xs font-medium rounded-full">
                    Team Leader
                  </span>
                )}
              </div>
              {cleaner.languages && cleaner.languages.length > 0 && (
                <div className="flex gap-1 mb-2">
                  {cleaner.languages.map(lang => {
                    const langInfo = LANGUAGES.find(l => l.code === lang)
                    return langInfo ? (
                      <span key={lang} className="text-base" title={langInfo.name}>
                        {langInfo.flag}
                      </span>
                    ) : null
                  })}
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-[#C4785A]">&#9733;</span>
                  <span className="font-semibold text-[#1A1A1A]">{cleaner.rating.toFixed(1)}</span>
                  <span className="text-[#6B6B6B] text-sm">({cleaner.reviewCount})</span>
                </div>
                <span className="text-[#DEDEDE]">|</span>
                <span className="font-semibold text-[#C4785A]">&euro;{cleaner.hourlyRate}/hr</span>
              </div>
            </div>
          </div>

          {/* Areas */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {cleaner.areas.map(area => (
              <span key={area} className="px-2.5 py-1 bg-white text-[#6B6B6B] text-xs rounded-full border border-[#EBEBEB]">
                {area}
              </span>
            ))}
          </div>

          {/* Bio */}
          {cleaner.bio && (
            <p className="text-[#6B6B6B] text-sm">{cleaner.bio}</p>
          )}

          {/* Trust badges - inline */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-[#EBEBEB]/50">
            <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B]">
              <span className="text-base">&#9989;</span>
              {t('profile.verified')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B]">
              <span className="text-base">&#128247;</span>
              {t('profile.photoProof')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B]">
              <span className="text-base">&#128179;</span>
              {t('profile.securePayment')}
            </div>
          </div>
        </div>
      </div>

      <main className="px-6 py-6 max-w-lg mx-auto">

        {/* Team Section - Show for team leaders */}
        {cleaner.teamLeader && cleaner.teamName && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-[#FFF8F5] to-white rounded-2xl p-4 border border-[#EBEBEB]">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">&#128081;</span>
                <div>
                  <h2 className="font-semibold text-[#1A1A1A]">{cleaner.teamName}</h2>
                  <p className="text-xs text-[#6B6B6B]">
                    {cleaner.teamMembers && cleaner.teamMembers.length > 0
                      ? `${cleaner.teamMembers.length + 1} cleaners · Coverage guaranteed`
                      : 'Team leader'}
                  </p>
                </div>
              </div>
              <p className="text-sm text-[#6B6B6B] mb-3">
                {t('profile.teamCoverage')}
              </p>
              {cleaner.teamMembers && cleaner.teamMembers.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-3 border-t border-[#EBEBEB]/50">
                  {cleaner.teamMembers.map((member) => (
                    <Link
                      key={member.id}
                      href={`/${member.slug}`}
                      className="flex items-center gap-2 bg-white rounded-full pl-1 pr-3 py-1 hover:bg-[#F5F5F3] transition-colors border border-[#EBEBEB]"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {member.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm">&#128100;</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1A1A1A] truncate">{member.name}</p>
                        <div className="flex items-center gap-1">
                          <span className="text-[#C4785A] text-xs">&#9733;</span>
                          <span className="text-xs text-[#6B6B6B]">{member.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Services */}
        <div className="space-y-3 mb-8">
          <h2 className="text-sm font-medium text-[#1A1A1A]">{t('profile.services')}</h2>
          {cleaner.services.map((service) => (
            <ServiceCard key={service.type} service={service} slug={slug} t={t} />
          ))}
        </div>

        {/* Reviews Section */}
        {cleaner.reviews && cleaner.reviews.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-[#1A1A1A]">
                Reviews ({cleaner.reviewCount})
              </h2>
              <div className="flex items-center gap-1">
                <span className="text-[#C4785A]">&#9733;</span>
                <span className="font-medium text-[#1A1A1A]">{cleaner.rating.toFixed(1)}</span>
              </div>
            </div>
            <div className="space-y-3">
              {cleaner.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </div>
        )}

        {/* Fallback testimonial if no reviews */}
        {(!cleaner.reviews || cleaner.reviews.length === 0) && cleaner.testimonial && (
          <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB] mb-8">
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

    </div>
  )
}

function ServiceCard({ service, slug, t }: {
  service: { type: string; name: string; price: number; hours: number; description: string }
  slug: string
  t: (key: string) => string
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
          <p className="text-xs text-[#9B9B9B]">{service.hours} {t('service.hours')}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-semibold text-[#1A1A1A] mb-2">&euro;{service.price}</p>
          <Link
            href={`/${slug}/booking?service=${service.type}`}
            className="inline-block bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all"
          >
            {t('profile.book')}
          </Link>
        </div>
      </div>
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  const timeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
    if (seconds < 86400) return 'Today'
    if (seconds < 172800) return 'Yesterday'
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`
    return `${Math.floor(seconds / 31536000)} years ago`
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#EBEBEB]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={`text-sm ${i <= review.rating ? 'text-[#C4785A]' : 'text-[#DEDEDE]'}`}
            >
              &#9733;
            </span>
          ))}
        </div>
        <span className="text-xs text-[#9B9B9B]">{timeAgo(review.createdAt)}</span>
      </div>
      <p className="text-sm text-[#1A1A1A] mb-2">{review.text}</p>
      <p className="text-xs text-[#6B6B6B]">&mdash; {review.author}</p>
    </div>
  )
}
