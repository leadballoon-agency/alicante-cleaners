'use client'

import { useState } from 'react'
import { Review } from '../page'

type Props = {
  reviews: Review[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onToggleFeatured: (id: string) => void
}

type Filter = 'all' | 'pending' | 'approved' | 'featured'

export default function ReviewsTab({ reviews, onApprove, onReject, onToggleFeatured }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const filteredReviews = reviews.filter(r => {
    if (filter === 'all') return true
    if (filter === 'pending') return r.status === 'pending'
    if (filter === 'approved') return r.status === 'approved'
    if (filter === 'featured') return r.featured
    return true
  })

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const pendingCount = reviews.filter(r => r.status === 'pending').length
  const featuredCount = reviews.filter(r => r.featured).length
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0'

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={`text-sm ${i < rating ? 'text-[#C4785A]' : 'text-[#DEDEDE]'}`}>
          ★
        </span>
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-[#1A1A1A]">Reviews</h2>
        <p className="text-sm text-[#6B6B6B]">
          {reviews.length} total · ★{averageRating} avg · {featuredCount} featured
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'pending', 'approved', 'featured'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-white border border-[#EBEBEB] text-[#6B6B6B]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && pendingCount > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                filter === f ? 'bg-white/20 text-white' : 'bg-[#C4785A] text-white'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Review Cards */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="bg-[#F5F5F3] rounded-2xl p-8 text-center">
            <p className="text-3xl mb-2">⭐</p>
            <p className="text-[#6B6B6B]">No reviews found</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className={`rounded-2xl p-4 border ${
                review.status === 'pending'
                  ? 'bg-[#FFF8F5] border-[#F5E6E0]'
                  : review.featured
                    ? 'bg-white border-[#C4785A]'
                    : 'bg-white border-[#EBEBEB]'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} />
                  {review.featured && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-[#C4785A] text-white">
                      Featured
                    </span>
                  )}
                  {review.status === 'pending' && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-[#FFF3E0] text-[#E65100]">
                      Pending
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#9B9B9B]">{formatDate(review.createdAt)}</span>
              </div>

              {/* Quote */}
              <p className="text-[#1A1A1A] mb-2 text-sm leading-relaxed">
                &ldquo;{review.text}&rdquo;
              </p>

              {/* Meta */}
              <div className="flex items-center justify-between text-sm text-[#6B6B6B] mb-3">
                <span>By {review.author} · {review.location}</span>
                <span>For {review.cleaner.name}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-[#EBEBEB]/50">
                {review.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => onApprove(review.id)}
                      className="flex-1 py-2.5 bg-[#2E7D32] text-white rounded-xl text-sm font-medium active:scale-[0.98] transition-transform"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onReject(review.id)}
                      className="flex-1 py-2.5 bg-white border border-[#DEDEDE] text-[#6B6B6B] rounded-xl text-sm font-medium active:scale-[0.98] transition-transform"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onToggleFeatured(review.id)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition-all ${
                      review.featured
                        ? 'bg-[#C4785A] text-white'
                        : 'bg-white border border-[#DEDEDE] text-[#6B6B6B]'
                    }`}
                  >
                    {review.featured ? '★ Featured' : 'Make Featured'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
