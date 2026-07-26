'use client'

import { useState } from 'react'

type Props = {
  cleanerName: string
  cleanerId: string
  cleanerSlug: string
  bookingId: string
  ownerReferralCode: string
  onClose: () => void
  onSubmit: (review: {
    rating: number
    text: string
    cleanerId: string
    bookingId: string
  }) => void
}

// Advocacy loop: after a happy owner leaves a positive review, invite them
// to recommend the cleaner to a friend. Owner dashboard UI stays English
// (matching the rest of this dashboard), but the outgoing WhatsApp message
// is Spanish — same convention as the admin share modal
// (app/admin/tabs/cleaners.tsx), since the people receiving a villa owner's
// recommendation are Spanish-market villa owners themselves.
function buildShareMessage(cleanerName: string, cleanerSlug: string, ownerReferralCode: string): string {
  return `Te recomiendo a ${cleanerName} para la limpieza de tu villa — yo ya le he dejado mi reseña ⭐: https://www.alicantecleaners.com/${cleanerSlug}?ref=${ownerReferralCode}`
}

export default function ReviewModal({ cleanerName, cleanerId, cleanerSlug, bookingId, ownerReferralCode, onClose, onSubmit }: Props) {
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [hoveredStar, setHoveredStar] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const handleSubmit = async () => {
    if (!text.trim()) return

    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))

    onSubmit({
      rating,
      text: text.trim(),
      cleanerId,
      bookingId,
    })

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    const shareMessage = buildShareMessage(cleanerName, cleanerSlug, ownerReferralCode)
    const shareUrl = `https://www.alicantecleaners.com/${cleanerSlug}?ref=${ownerReferralCode}`

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md text-center">
          <div className="text-5xl mb-4">🙏</div>
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
            Thank you!
          </h2>
          <p className="text-[#6B6B6B] mb-6">
            Your review for {cleanerName} has been submitted and will appear after moderation.
          </p>

          {/* Advocacy loop: only nudge happy (4-5★) owners to share, same
              gate as the POST_REVIEW_REBOOK nurturing email. */}
          {rating >= 4 && (
            <div className="bg-[#FFF8F5] border border-[#F5E6E0] rounded-xl p-4 mb-4 text-left">
              <p className="font-medium text-[#1A1A1A] text-sm mb-1">
                Enjoying {cleanerName}&rsquo;s work? Recommend her
              </p>
              <p className="text-xs text-[#6B6B6B] mb-3">
                Know another villa owner who needs a great cleaner? Send them your recommendation.
              </p>
              <div className="space-y-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white py-2.5 rounded-lg text-sm font-medium active:scale-[0.98] transition-all"
                >
                  <span>💬</span>
                  <span>Share on WhatsApp</span>
                </a>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(shareUrl)
                    setLinkCopied(true)
                    setTimeout(() => setLinkCopied(false), 2000)
                  }}
                  className="flex items-center justify-center gap-2 w-full bg-white border border-[#DEDEDE] text-[#1A1A1A] py-2.5 rounded-lg text-sm font-medium active:scale-[0.98] transition-all"
                >
                  <span>{linkCopied ? '✓' : '🔗'}</span>
                  <span>{linkCopied ? 'Copied!' : 'Copy link'}</span>
                </button>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full bg-[#1A1A1A] text-white py-3 rounded-xl font-medium active:scale-[0.98] transition-all"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">
            Review {cleanerName}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center text-[#6B6B6B]"
          >
            ✕
          </button>
        </div>

        {/* Rating */}
        <div className="mb-6">
          <p className="text-sm font-medium text-[#1A1A1A] mb-3">How was your experience?</p>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="text-3xl transition-transform active:scale-90"
              >
                <span className={
                  star <= (hoveredStar || rating)
                    ? 'text-[#C4785A]'
                    : 'text-[#DEDEDE]'
                }>
                  ★
                </span>
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-[#6B6B6B] mt-2">
            {rating === 5 && 'Excellent!'}
            {rating === 4 && 'Very good'}
            {rating === 3 && 'Good'}
            {rating === 2 && 'Fair'}
            {rating === 1 && 'Poor'}
          </p>
        </div>

        {/* Review text */}
        <div className="mb-6">
          <label className="text-sm font-medium text-[#1A1A1A] mb-2 block">
            Share your experience
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`What did you like about ${cleanerName.split(' ')[0]}'s service?`}
            rows={4}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors resize-none"
          />
          <p className="text-xs text-[#9B9B9B] mt-1.5 text-right">
            {text.length}/500
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>

        <p className="text-xs text-[#9B9B9B] text-center mt-4">
          Your review will be visible after moderation
        </p>
      </div>
    </div>
  )
}
