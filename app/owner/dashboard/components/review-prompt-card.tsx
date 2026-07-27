'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OwnerBooking } from '../page'
import { formatMadridDate } from '@/lib/dates'

type Tab = 'home' | 'bookings' | 'properties' | 'messages' | 'account'

type Props = {
  bookings: OwnerBooking[]
  onNavigate?: (tab: Tab) => void
}

const DISMISS_KEY_PREFIX = 'review-prompt-dismissed-'
const MAX_CARDS = 2
const WINDOW_DAYS = 30

// Discoverability fix: the only in-app path to leaving a review used to be
// Bookings tab -> find the completed booking -> its review CTA. A real
// owner reported having to hunt for it. This surfaces a prompt right on
// Home for any COMPLETED booking with no review yet, completed in the
// last 30 days (older completions are unlikely to get a review and would
// just be nagging).
//
// The button pushes `/owner/dashboard?tab=bookings&review={bookingId}` —
// the exact deep link the booking-completion email/WhatsApp message
// already uses (app/api/dashboard/cleaner/bookings/[id]/route.ts). The
// dashboard reads that query string (`page.tsx` -> BookingsTab's
// `initialReviewBookingId`) and auto-opens the existing review modal.
// `onNavigate('bookings')` switches the tab in-place too, since the
// in-memory `activeTab` state only reads the URL on initial mount, not on
// client-side navigation within the already-mounted page.
export default function ReviewPromptCard({ bookings, onNavigate }: Props) {
  const router = useRouter()
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)

  const candidates = useMemo(() => {
    const cutoff = Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000
    return bookings
      .filter(b => b.status === 'completed' && !b.hasReviewedCleaner && new Date(b.date).getTime() >= cutoff)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [bookings])

  // Read per-booking dismissals from localStorage after mount (avoids
  // hydration mismatch — localStorage isn't available during SSR).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const dismissed = new Set(
      candidates
        .map(b => b.id)
        .filter(id => localStorage.getItem(`${DISMISS_KEY_PREFIX}${id}`) === 'true')
    )
    setDismissedIds(dismissed)
    setHydrated(true)
  }, [candidates])

  const visible = candidates.filter(b => !dismissedIds.has(b.id)).slice(0, MAX_CARDS)

  const handleDismiss = (bookingId: string) => {
    localStorage.setItem(`${DISMISS_KEY_PREFIX}${bookingId}`, 'true')
    setDismissedIds(prev => new Set(prev).add(bookingId))
  }

  const handleReview = (bookingId: string) => {
    router.push(`/owner/dashboard?tab=bookings&review=${bookingId}`)
    onNavigate?.('bookings')
  }

  // Nothing to show (or we haven't checked localStorage yet) — render
  // nothing rather than flash the card then hide it.
  if (!hydrated || visible.length === 0) return null

  return (
    <div className="space-y-3">
      {visible.map((booking) => (
        <div
          key={booking.id}
          className="bg-gradient-to-br from-[#FFF8F5] to-[#FDEEE7] rounded-2xl p-4 border border-[#F5E6E0]"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none">⭐</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-[#1A1A1A]">
                How was {booking.cleaner.name.split(' ')[0]}&apos;s clean?
              </h3>
              <p className="text-sm text-[#6B6B6B] mt-0.5">
                {formatMadridDate(booking.date, { day: 'numeric', month: 'long' })} &middot; {booking.property.name}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <button
                  onClick={() => handleReview(booking.id)}
                  className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all"
                >
                  Leave a review
                </button>
                <button
                  onClick={() => handleDismiss(booking.id)}
                  className="text-sm text-[#6B6B6B] font-medium"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
