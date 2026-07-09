'use client'

import Image from 'next/image'
import Link from 'next/link'

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
  /** Background shown behind (or instead of, when no photo) the cleaner's image, cycled by index */
  avatarGradients?: string[]
}

const DEFAULT_AVATAR_GRADIENTS = [
  'bg-gradient-to-br from-[#d8c3b4] to-[#b1907a]',
  'bg-gradient-to-br from-[#c9b39e] to-[#a07d62]',
  'bg-gradient-to-br from-[#bdb0a0] to-[#8f8273]',
]

/**
 * Horizontal swipeable row of cleaner cards. Shared between the /owners
 * ad landing page and the homepage "Featured cleaners" showcase.
 */
export function CleanerSlider({
  cleaners,
  reviewsLabel,
  reviewLabel,
  newCleanerLabel,
  avatarGradients = DEFAULT_AVATAR_GRADIENTS,
}: Props) {
  if (cleaners.length === 0) return null

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {cleaners.map((cleaner, i) => (
        <Link
          key={cleaner.id}
          href={`/${cleaner.slug}`}
          className="flex-none w-[158px] bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden shadow-[0_2px_14px_rgba(26,26,26,0.06)] hover:border-[#C4785A] transition-colors"
        >
          <div className={`h-[120px] relative ${avatarGradients[i % avatarGradients.length]}`}>
            {cleaner.photo && (
              <Image src={cleaner.photo} alt={cleaner.name} fill className="object-cover" unoptimized />
            )}
          </div>
          <div className="p-3">
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
        </Link>
      ))}
    </div>
  )
}
