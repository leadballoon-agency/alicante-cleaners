'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CleanerPhotoPlaceholder } from './CleanerPhotoPlaceholder'
import { useOwnCleanerSlug } from '@/lib/hooks/use-own-cleaner-slug'

export type SliderChip = {
  label: string
  className: string
}

export type SliderCleaner = {
  id: string
  slug: string
  name: string
  photo: string | null
  rating: number
  reviewCount: number
  serviceAreas: string[]
  /** Rendered top-to-bottom under the areas line. Caller decides content/priority/limit. */
  chips: SliderChip[]
}

type Props = {
  cleaners: SliderCleaner[]
  /** Plural review word, e.g. "reviews" */
  reviewsLabel: string
  /** Singular review word, e.g. "review" */
  reviewLabel: string
  /** Shown instead of the rating line when a cleaner has no reviews yet */
  newCleanerLabel: string
  /** Caption shown on a photo-less cleaner's card, e.g. "Photo coming soon" */
  photoComingSoonLabel?: string
  /** CTA label shown only on the logged-in cleaner's own photo-less card, e.g. "📷 Add your photo" */
  addPhotoCtaLabel?: string
}

/**
 * Horizontal swipeable row of cleaner cards. Shared between the /owners
 * ad landing page, the homepage "Featured cleaners" showcase, and area
 * landing pages.
 */
export function CleanerSlider({
  cleaners,
  reviewsLabel,
  reviewLabel,
  newCleanerLabel,
  photoComingSoonLabel = 'Photo coming soon',
  addPhotoCtaLabel = '📷 Add your photo',
}: Props) {
  const ownSlug = useOwnCleanerSlug()

  if (cleaners.length === 0) return null

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {cleaners.map((cleaner) => {
        const isOwnCard = ownSlug !== null && ownSlug === cleaner.slug
        return (
          <div
            key={cleaner.id}
            className="relative flex-none w-[158px] bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden shadow-[0_2px_14px_rgba(26,26,26,0.06)] hover:border-[#C4785A] transition-colors"
          >
            <Link href={`/${cleaner.slug}`} className="absolute inset-0 z-0" aria-label={cleaner.name} />
            <div className="h-[120px] relative pointer-events-none">
              {cleaner.photo ? (
                <Image src={cleaner.photo} alt={cleaner.name} fill className="object-cover" unoptimized />
              ) : (
                <CleanerPhotoPlaceholder
                  name={cleaner.name}
                  initialClassName="text-4xl"
                  caption={isOwnCard ? undefined : photoComingSoonLabel}
                  cta={isOwnCard ? { label: addPhotoCtaLabel, href: '/dashboard?tab=profile' } : undefined}
                />
              )}
            </div>
            <div className="p-3 pointer-events-none">
              <div className="text-[15px] font-bold text-[#1A1A1A]">{cleaner.name}</div>
              <div className="text-[12.5px] text-[#C4785A] my-0.5">
                {cleaner.reviewCount > 0 ? (
                  <>
                    ★ {cleaner.rating.toFixed(1)} · {cleaner.reviewCount}{' '}
                    {cleaner.reviewCount === 1 ? reviewLabel : reviewsLabel}
                  </>
                ) : (
                  newCleanerLabel
                )}
              </div>
              <div className="text-[11.5px] text-[#9B9B9B] truncate">
                {cleaner.serviceAreas.slice(0, 2).join(' · ')}
              </div>
              {cleaner.chips.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap mt-1.5">
                  {cleaner.chips.map((chip) => (
                    <span key={chip.label} className={chip.className}>
                      {chip.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
