'use client'

import { useState } from 'react'

type Props = {
  cleanerName: string
  cleanerId: string
  bookingId: string
  onClose: () => void
  onSubmit: (review: {
    rating: number
    text: string
    cleanerId: string
    bookingId: string
  }) => void
}

export default function ReviewModal({ cleanerName, cleanerId, bookingId, onClose, onSubmit }: Props) {
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [hoveredStar, setHoveredStar] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

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
