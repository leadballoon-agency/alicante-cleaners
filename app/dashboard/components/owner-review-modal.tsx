'use client'

import { useState } from 'react'

type Props = {
  ownerName: string
  ownerId: string
  bookingId: string
  onClose: () => void
  onSubmit: (review: {
    rating: number
    workAgain: boolean
    communication: number
    propertyAccuracy: number
    respectfulness: number
    note: string
    ownerId: string
    bookingId: string
  }) => void
}

export default function OwnerReviewModal({ ownerName, ownerId, bookingId, onClose, onSubmit }: Props) {
  const [rating, setRating] = useState(5)
  const [workAgain, setWorkAgain] = useState(true)
  const [communication, setCommunication] = useState(5)
  const [propertyAccuracy, setPropertyAccuracy] = useState(5)
  const [respectfulness, setRespectfulness] = useState(5)
  const [note, setNote] = useState('')
  const [hoveredStar, setHoveredStar] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 800))

    onSubmit({
      rating,
      workAgain,
      communication,
      propertyAccuracy,
      respectfulness,
      note: note.trim(),
      ownerId,
      bookingId,
    })

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md text-center">
          <div className="text-5xl mb-4">👍</div>
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
            Thanks for your feedback!
          </h2>
          <p className="text-[#6B6B6B] mb-6">
            Your review helps other cleaners make informed decisions.
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

  const StarRating = ({
    value,
    onChange,
    label
  }: {
    value: number
    onChange: (v: number) => void
    label: string
  }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#6B6B6B]">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="text-lg transition-transform active:scale-90"
          >
            <span className={star <= value ? 'text-[#C4785A]' : 'text-[#DEDEDE]'}>
              ★
            </span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">
            Rate {ownerName}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center text-[#6B6B6B]"
          >
            ✕
          </button>
        </div>

        {/* Overall Rating */}
        <div className="mb-6">
          <p className="text-sm font-medium text-[#1A1A1A] mb-3">Overall experience</p>
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
        </div>

        {/* Would work again */}
        <div className="mb-6 p-4 bg-[#F5F5F3] rounded-xl">
          <p className="text-sm font-medium text-[#1A1A1A] mb-3">Would you work with this owner again?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setWorkAgain(true)}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                workAgain
                  ? 'bg-[#E8F5E9] text-[#2E7D32] border-2 border-[#2E7D32]'
                  : 'bg-white border border-[#DEDEDE] text-[#6B6B6B]'
              }`}
            >
              Yes, definitely
            </button>
            <button
              onClick={() => setWorkAgain(false)}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                !workAgain
                  ? 'bg-[#FFEBEE] text-[#C62828] border-2 border-[#C62828]'
                  : 'bg-white border border-[#DEDEDE] text-[#6B6B6B]'
              }`}
            >
              Probably not
            </button>
          </div>
        </div>

        {/* Detailed ratings */}
        <div className="mb-6 space-y-3">
          <p className="text-sm font-medium text-[#1A1A1A]">Rate specific areas</p>
          <StarRating label="Communication" value={communication} onChange={setCommunication} />
          <StarRating label="Property as described" value={propertyAccuracy} onChange={setPropertyAccuracy} />
          <StarRating label="Respectfulness" value={respectfulness} onChange={setRespectfulness} />
        </div>

        {/* Private note */}
        <div className="mb-6">
          <label className="text-sm font-medium text-[#1A1A1A] mb-2 block">
            Private note for cleaners <span className="text-[#9B9B9B] font-normal">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any tips or notes for other cleaners..."
            rows={3}
            maxLength={300}
            className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] text-sm focus:outline-none focus:border-[#1A1A1A] transition-colors resize-none"
          />
          <p className="text-xs text-[#9B9B9B] mt-1 text-right">
            {note.length}/300
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>

        <p className="text-xs text-[#9B9B9B] text-center mt-4">
          Only visible to other cleaners on VillaCare
        </p>
      </div>
    </div>
  )
}
