'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Booking, InternalComment, TeamInfo, TeamMember } from '../page'

type Props = {
  bookings: Booking[]
  comments: InternalComment[]
  teamInfo?: TeamInfo | null
  onAddComment: (propertyId: string, ownerId: string, text: string) => void
  onReviewOwner: (bookingId: string, ownerId: string, ownerName: string) => void
  onBookingAction?: (bookingId: string, action: 'accept' | 'decline' | 'complete' | 'assign', assignToCleanerId?: string) => void
}

type Filter = 'all' | 'pending' | 'confirmed' | 'completed'

// Team member selection modal
function AssignModal({
  members,
  onSelect,
  onClose,
}: {
  members: TeamMember[]
  onSelect: (memberId: string) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1A1A1A]">Assign to team member</h3>
          <button onClick={onClose} className="text-[#6B6B6B] text-xl">&times;</button>
        </div>
        <p className="text-sm text-[#6B6B6B] mb-4">
          Select a team member to accept and handle this booking
        </p>
        <div className="space-y-2">
          {members.map((member) => (
            <button
              key={member.id}
              onClick={() => onSelect(member.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#EBEBEB] hover:border-[#C4785A] hover:bg-[#FFF8F5] transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-[#F5F5F3] overflow-hidden relative flex-shrink-0">
                {member.photo ? (
                  <Image src={member.photo} alt={member.name} fill className="object-cover" unoptimized />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-lg">👤</span>
                )}
              </div>
              <span className="font-medium text-[#1A1A1A]">{member.name}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 py-2 text-sm text-[#6B6B6B] hover:text-[#1A1A1A]"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function BookingsTab({ bookings, comments, teamInfo, onAddComment, onReviewOwner, onBookingAction }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)
  const [assignModalBookingId, setAssignModalBookingId] = useState<string | null>(null)

  const isTeamLeader = teamInfo?.role === 'leader' && teamInfo.members && teamInfo.members.length > 0

  const handleAssign = (memberId: string) => {
    if (assignModalBookingId) {
      onBookingAction?.(assignModalBookingId, 'assign', memberId)
      setAssignModalBookingId(null)
    }
  }
  const [newComment, setNewComment] = useState('')

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'completed', label: 'Completed' },
  ]

  const filteredBookings = bookings
    .filter(b => filter === 'all' || b.status === filter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatMemberSince = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    const months = Math.floor((Date.now() - d.getTime()) / (30 * 24 * 60 * 60 * 1000))
    if (months < 1) return 'New member'
    if (months === 1) return '1 month'
    return `${months} months`
  }

  const statusColors = {
    pending: 'bg-[#FFF3E0] text-[#E65100]',
    confirmed: 'bg-[#E8F5E9] text-[#2E7D32]',
    completed: 'bg-[#F5F5F3] text-[#6B6B6B]',
  }

  const statusLabels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
  }

  const getCommentsForProperty = (propertyId: string) => {
    return comments.filter(c => c.propertyId === propertyId)
  }

  const handleAddComment = (propertyId: string, ownerId: string) => {
    if (newComment.trim()) {
      onAddComment(propertyId, ownerId, newComment.trim())
      setNewComment('')
    }
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-[0.98] ${
              filter === f.id
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-white border border-[#EBEBEB] text-[#6B6B6B]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      {filteredBookings.length === 0 ? (
        <div className="bg-[#F5F5F3] rounded-2xl p-8 text-center">
          <p className="text-[#6B6B6B]">No {filter === 'all' ? '' : filter} bookings</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const propertyComments = getCommentsForProperty(booking.property.id)
            const isExpanded = expandedBooking === booking.id

            return (
              <div key={booking.id} className="bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden">
                {/* Main booking info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-[#1A1A1A]">{booking.service}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[booking.status]}`}>
                          {statusLabels[booking.status]}
                        </span>
                      </div>
                      <p className="text-sm text-[#6B6B6B]">
                        {formatDate(booking.date)} · {booking.time} · {booking.hours}h
                      </p>
                    </div>
                    <span className="font-semibold text-[#1A1A1A]">€{booking.price}</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-[#6B6B6B]">
                      <span>📍</span>
                      <span className="truncate">{booking.property.address}</span>
                    </div>

                    {/* Owner info with trust indicators */}
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      <span className="text-[#1A1A1A]">{booking.owner.name}</span>
                      {booking.owner.trusted && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-[#E8F5E9] text-[#2E7D32] font-medium">
                          Trusted
                        </span>
                      )}
                      {booking.owner.cleanerRating && (
                        <span className="flex items-center gap-0.5 text-xs text-[#6B6B6B]">
                          <span className="text-[#C4785A]">★</span>
                          {booking.owner.cleanerRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand button to see more owner details */}
                  <button
                    onClick={() => setExpandedBooking(isExpanded ? null : booking.id)}
                    className="mt-3 text-sm text-[#C4785A] font-medium"
                  >
                    {isExpanded ? 'Hide details' : 'View owner & notes'}
                  </button>
                </div>

                {/* Expanded owner details & comments */}
                {isExpanded && (
                  <div className="border-t border-[#EBEBEB] bg-[#FAFAF8] p-4 space-y-4">
                    {/* Owner details */}
                    <div>
                      <h4 className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-2">
                        Owner Details
                      </h4>
                      <div className="bg-white rounded-xl p-3 border border-[#EBEBEB]">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-[#F5F5F3] flex items-center justify-center">
                            <span className="text-lg">👤</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-[#1A1A1A]">{booking.owner.name}</p>
                              {booking.owner.trusted && (
                                <span className="px-1.5 py-0.5 rounded text-xs bg-[#E8F5E9] text-[#2E7D32] font-medium">
                                  Trusted
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#6B6B6B]">
                              Member for {formatMemberSince(booking.owner.memberSince)} · {booking.owner.totalBookings} bookings
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-[#F5F5F3] rounded-lg p-2">
                            <p className="text-xs text-[#6B6B6B]">Cleaner rating</p>
                            {booking.owner.cleanerRating ? (
                              <p className="font-medium text-[#1A1A1A] flex items-center gap-1">
                                <span className="text-[#C4785A]">★</span>
                                {booking.owner.cleanerRating.toFixed(1)}
                                <span className="text-xs text-[#6B6B6B] font-normal">
                                  ({booking.owner.cleanerReviewCount})
                                </span>
                              </p>
                            ) : (
                              <p className="text-[#6B6B6B] text-xs">No reviews yet</p>
                            )}
                          </div>
                          <div className="bg-[#F5F5F3] rounded-lg p-2">
                            <p className="text-xs text-[#6B6B6B]">Referred by</p>
                            <p className="font-medium text-[#1A1A1A]">
                              {booking.owner.referredBy || 'Waitlist'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Internal comments */}
                    <div>
                      <h4 className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wide mb-2">
                        Cleaner Notes ({propertyComments.length})
                      </h4>

                      {propertyComments.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {propertyComments.map((comment) => (
                            <div key={comment.id} className="bg-white rounded-lg p-3 border border-[#EBEBEB]">
                              <p className="text-sm text-[#1A1A1A]">{comment.text}</p>
                              <p className="text-xs text-[#9B9B9B] mt-1">
                                — {comment.cleanerName} · {formatDate(comment.createdAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add comment */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a note for other cleaners..."
                          className="flex-1 px-3 py-2 rounded-lg border border-[#DEDEDE] text-sm focus:outline-none focus:border-[#1A1A1A]"
                        />
                        <button
                          onClick={() => handleAddComment(booking.property.id, booking.owner.id)}
                          disabled={!newComment.trim()}
                          className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                {booking.status === 'pending' && (
                  <div className="flex gap-2 p-4 pt-0">
                    <button
                      onClick={() => onBookingAction?.(booking.id, 'accept')}
                      className="flex-1 bg-[#1A1A1A] text-white py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all"
                    >
                      Accept
                    </button>
                    {isTeamLeader && (
                      <button
                        onClick={() => setAssignModalBookingId(booking.id)}
                        className="flex-1 bg-[#C4785A] text-white py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all"
                      >
                        Assign
                      </button>
                    )}
                    <button
                      onClick={() => onBookingAction?.(booking.id, 'decline')}
                      className={`${isTeamLeader ? 'px-4' : 'flex-1'} bg-white border border-[#DEDEDE] text-[#1A1A1A] py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all`}
                    >
                      Decline
                    </button>
                  </div>
                )}

                {booking.status === 'confirmed' && (
                  <div className="flex gap-2 p-4 pt-0">
                    <a
                      href={`tel:${booking.owner.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#F5F5F3] text-[#1A1A1A] py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all"
                    >
                      <span>📞</span>
                      <span>Call</span>
                    </a>
                    <button
                      onClick={() => onBookingAction?.(booking.id, 'complete')}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#1A1A1A] text-white py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all"
                    >
                      <span>📸</span>
                      <span>Complete</span>
                    </button>
                  </div>
                )}

                {booking.status === 'completed' && !booking.hasReviewedOwner && (
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => onReviewOwner(booking.id, booking.owner.id, booking.owner.name)}
                      className="w-full flex items-center justify-center gap-2 bg-[#C4785A] text-white py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all"
                    >
                      <span>★</span>
                      <span>Rate this owner</span>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Assign Modal */}
      {assignModalBookingId && teamInfo?.members && (
        <AssignModal
          members={teamInfo.members}
          onSelect={handleAssign}
          onClose={() => setAssignModalBookingId(null)}
        />
      )}
    </div>
  )
}
