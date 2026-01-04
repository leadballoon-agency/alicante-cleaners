'use client'

import { OnboardingData } from '../page'
import Link from 'next/link'
import Image from 'next/image'

type Props = {
  data: OnboardingData
}

export default function Success({ data }: Props) {
  const bookingUrl = `alicantecleaners.com/${data.slug}`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Book ${data.name} for villa cleaning`,
          text: 'Trusted villa cleaning in Alicante',
          url: `https://${bookingUrl}`,
        })
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`https://${bookingUrl}`)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <div className="text-center">
      <div className="text-6xl mb-6">🎉</div>

      <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
        You&apos;re all set, {data.name.split(' ')[0]}!
      </h1>
      <p className="text-[#6B6B6B] mb-8">
        Your booking page is live and ready for clients
      </p>

      {/* Preview card */}
      <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB] mb-6 text-left">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden relative">
            {data.photoUrl ? (
              <Image src={data.photoUrl} alt={data.name} fill className="object-cover" unoptimized />
            ) : (
              <span className="text-2xl">👤</span>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-[#1A1A1A]">{data.name}</h2>
            <p className="text-sm text-[#6B6B6B]">
              {data.serviceAreas.length} areas · From €{data.hourlyRate * 3}
            </p>
          </div>
        </div>

        <div className="bg-[#F5F5F3] rounded-xl p-4">
          <p className="text-xs text-[#6B6B6B] mb-1">Your booking link</p>
          <p className="font-medium text-[#1A1A1A] break-all">{bookingUrl}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleShare}
          className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all"
        >
          Share my link
        </button>

        <Link
          href={`/${data.slug}`}
          className="w-full bg-white border border-[#DEDEDE] text-[#1A1A1A] py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all block"
        >
          View my page
        </Link>

        <Link
          href="/dashboard"
          className="w-full text-[#6B6B6B] py-3 font-medium text-sm active:opacity-70 block"
        >
          Go to dashboard →
        </Link>
      </div>

      <p className="text-[#9B9B9B] text-xs mt-8">
        Share your link with villa owners to start receiving bookings
      </p>
    </div>
  )
}
