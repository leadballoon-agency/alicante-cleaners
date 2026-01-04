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
      year: 'numeric',
    })
  }

  const pendingCount = reviews.filter(r => r.status === 'pending').length
  const approvedCount = reviews.filter(r => r.status === 'approved').length
  const featuredCount = reviews.filter(r => r.featured).length
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Reviews</h2>
          <p className="text-sm text-[#6B6B6B]">
            {reviews.length} total · {averageRating} avg rating · {featuredCount} featured
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">Pending Review</p>
          <p className="text-2xl font-semibold text-[#E65100]">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">Approved</p>
          <p className="text-2xl font-semibold text-[#2E7D32]">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">Featured</p>
          <p className="text-2xl font-semibold text-[#C4785A]">{featuredCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">Avg Rating</p>
          <div className="flex items-center gap-1">
            <span className="text-[#C4785A]">★</span>
            <p className="text-2xl font-semibold text-[#1A1A1A]">{averageRating}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'featured'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-white border border-[#EBEBEB] text-[#6B6B6B] hover:bg-[#F5F5F3]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-[#C4785A] text-white">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pending reviews */}
      {filter !== 'approved' && filter !== 'featured' && pendingCount > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[#6B6B6B]">Pending Approval</h3>
          {filteredReviews
            .filter(r => r.status === 'pending')
            .map((review) => (
              <div key={review.id} className="bg-[#FFF8F5] rounded-xl p-4 border border-[#F5E6E0]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < review.rating ? 'text-[#C4785A]' : 'text-[#DEDEDE]'}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-[#6B6B6B]">for {review.cleaner.name}</span>
                    </div>
                    <p className="text-[#1A1A1A] mb-2">&ldquo;{review.text}&rdquo;</p>
                    <p className="text-sm text-[#6B6B6B]">
                      — {review.author}, {review.location} · {formatDate(review.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onApprove(review.id)}
                      className="px-4 py-2 bg-[#2E7D32] text-white rounded-lg text-sm font-medium hover:bg-[#1B5E20] transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onReject(review.id)}
                      className="px-4 py-2 bg-white border border-[#DEDEDE] text-[#6B6B6B] rounded-lg text-sm font-medium hover:bg-[#F5F5F3] transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Approved reviews */}
      {filter !== 'pending' && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[#6B6B6B]">
            {filter === 'featured' ? 'Featured Reviews' : 'Approved Reviews'}
          </h3>
          {filteredReviews
            .filter(r => filter === 'featured' ? r.featured : r.status === 'approved')
            .map((review) => (
              <div
                key={review.id}
                className={`bg-white rounded-xl p-4 border ${
                  review.featured ? 'border-[#C4785A]' : 'border-[#EBEBEB]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < review.rating ? 'text-[#C4785A]' : 'text-[#DEDEDE]'}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-[#6B6B6B]">for {review.cleaner.name}</span>
                      {review.featured && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-[#C4785A] text-white">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-[#1A1A1A] mb-2">&ldquo;{review.text}&rdquo;</p>
                    <p className="text-sm text-[#6B6B6B]">
                      — {review.author}, {review.location} · {formatDate(review.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => onToggleFeatured(review.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      review.featured
                        ? 'bg-[#C4785A] text-white hover:bg-[#B06B4D]'
                        : 'bg-white border border-[#DEDEDE] text-[#6B6B6B] hover:bg-[#F5F5F3]'
                    }`}
                  >
                    {review.featured ? 'Unfeature' : 'Feature'}
                  </button>
                </div>
              </div>
            ))}
          {filteredReviews.filter(r => filter === 'featured' ? r.featured : r.status === 'approved').length === 0 && (
            <p className="text-center text-[#6B6B6B] py-8">No reviews found</p>
          )}
        </div>
      )}
    </div>
  )
}
