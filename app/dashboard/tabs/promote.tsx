'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Booking, Cleaner } from '../page'

type Props = {
  cleaner: Cleaner
  bookings: Booking[]
}

export default function PromoteTab({ cleaner, bookings }: Props) {
  const [copied, setCopied] = useState(false)
  const [whatsappCopied, setWhatsappCopied] = useState(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  // Calculate stats for this week
  const thisWeekBookings = bookings.filter(b => {
    const bookingDate = new Date(b.date)
    return bookingDate >= today && bookingDate < nextWeek
  })

  const thisWeekEarnings = thisWeekBookings
    .filter(b => b.status !== 'completed')
    .reduce((sum, b) => sum + b.price, 0)

  const completedThisMonth = bookings.filter(b => {
    const bookingDate = new Date(b.date)
    return bookingDate.getMonth() === today.getMonth() && b.status === 'completed'
  }).length

  // All-time stats
  const totalCompleted = bookings.filter(b => b.status === 'completed').length
  const totalEarnings = bookings.reduce((sum, b) => sum + b.price, 0)

  const profileUrl = `https://alicantecleaners.com/${cleaner.slug}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const whatsappMessage = `Hi! I'm ${cleaner.name}, a professional cleaner in Alicante. You can book my services here: ${profileUrl}`

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(whatsappMessage)
    setWhatsappCopied(true)
    setTimeout(() => setWhatsappCopied(false), 2000)
  }

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(whatsappMessage)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[#1A1A1A]">Promote Yourself</h2>
        <p className="text-sm text-[#6B6B6B]">Stats and tools to grow your business</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">This week</p>
          <p className="text-2xl font-semibold text-[#1A1A1A]">€{thisWeekEarnings}</p>
          <p className="text-xs text-[#9B9B9B]">{thisWeekBookings.length} booking{thisWeekBookings.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">This month</p>
          <p className="text-2xl font-semibold text-[#1A1A1A]">{completedThisMonth}</p>
          <p className="text-xs text-[#9B9B9B]">completed</p>
        </div>
      </div>

      {/* All-time stats */}
      <div className="bg-gradient-to-br from-[#FFF8F5] to-[#FFF0EA] rounded-2xl p-5 border border-[#F5E6E0]">
        <h3 className="font-medium text-[#1A1A1A] mb-4">All-time Performance</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-[#C4785A]">{totalCompleted}</p>
            <p className="text-xs text-[#6B6B6B]">Jobs Done</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#C4785A]">€{totalEarnings}</p>
            <p className="text-xs text-[#6B6B6B]">Earned</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#C4785A]">{cleaner.rating?.toFixed(1) || '—'}</p>
            <p className="text-xs text-[#6B6B6B]">{cleaner.reviewCount || 0} reviews</p>
          </div>
        </div>
      </div>

      {/* Your Profile Card */}
      <div className="bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden">
        <div className="p-5">
          <h3 className="font-medium text-[#1A1A1A] mb-4">Your Profile Card</h3>

          {/* Mini profile preview */}
          <div className="bg-[#FAFAF8] rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden relative">
                {cleaner.photo ? (
                  <Image src={cleaner.photo} alt={cleaner.name} fill className="object-cover" unoptimized />
                ) : (
                  <span className="text-xl">👤</span>
                )}
              </div>
              <div>
                <p className="font-medium text-[#1A1A1A]">{cleaner.name}</p>
                <p className="text-sm text-[#6B6B6B]">€{cleaner.hourlyRate}/hr</p>
              </div>
              {cleaner.rating && (
                <div className="ml-auto flex items-center gap-1">
                  <span className="text-[#C4785A]">★</span>
                  <span className="font-medium">{cleaner.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-[#6B6B6B] line-clamp-2">
              {cleaner.bio || 'Professional cleaner in Alicante'}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Link
              href={`/${cleaner.slug}`}
              className="flex items-center justify-center gap-2 w-full bg-[#F5F5F3] text-[#1A1A1A] py-3 rounded-xl text-sm font-medium active:scale-[0.98] transition-all"
            >
              <span>👁️</span>
              <span>View Public Profile</span>
            </Link>

            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 w-full bg-[#1A1A1A] text-white py-3 rounded-xl text-sm font-medium active:scale-[0.98] transition-all"
            >
              <span>{copied ? '✓' : '🔗'}</span>
              <span>{copied ? 'Copied!' : 'Copy Profile Link'}</span>
            </button>
          </div>
        </div>

        {/* Profile URL display */}
        <div className="px-5 pb-5">
          <div className="bg-[#F5F5F3] rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-[#6B6B6B] truncate">alicantecleaners.com/{cleaner.slug}</p>
          </div>
        </div>
      </div>

      {/* WhatsApp Share */}
      <div className="bg-[#E8F5E9] rounded-2xl p-5 border border-[#C8E6C9]">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💬</span>
          <div className="flex-1">
            <h3 className="font-medium text-[#1A1A1A] mb-1">Share on WhatsApp</h3>
            <p className="text-sm text-[#6B6B6B] mb-3">
              Send your profile to villa owners with one tap
            </p>

            {/* Pre-written message preview */}
            <div className="bg-white rounded-lg p-3 mb-3 text-sm text-[#6B6B6B]">
              <p className="line-clamp-2">&quot;{whatsappMessage}&quot;</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyWhatsApp}
                className="flex-1 bg-white border border-[#DEDEDE] text-[#1A1A1A] py-2.5 px-3 rounded-lg text-sm font-medium active:scale-[0.98] transition-all"
              >
                {whatsappCopied ? '✓ Copied!' : 'Copy Message'}
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="flex-1 bg-[#25D366] text-white py-2.5 px-3 rounded-lg text-sm font-medium active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
        <h3 className="font-medium text-[#1A1A1A] mb-4">Tips to Get More Bookings</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-lg">📸</span>
            <div>
              <p className="font-medium text-[#1A1A1A] text-sm">Add a great photo</p>
              <p className="text-xs text-[#6B6B6B]">Profiles with photos get 3x more bookings</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">⭐</span>
            <div>
              <p className="font-medium text-[#1A1A1A] text-sm">Ask for reviews</p>
              <p className="text-xs text-[#6B6B6B]">After each job, remind owners to leave a review</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">📱</span>
            <div>
              <p className="font-medium text-[#1A1A1A] text-sm">Share your profile</p>
              <p className="text-xs text-[#6B6B6B]">Post your link in local Facebook groups</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
