'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { OwnerBooking } from '../page'

type Props = {
  bookings: OwnerBooking[]
  onLeaveReview?: (bookingId: string, cleanerId: string, cleanerName: string) => void
  onMessage?: (cleanerId: string, cleanerName: string, propertyId?: string) => void
}

type Filter = 'all' | 'upcoming' | 'completed'

export default function BookingsTab({ bookings, onLeaveReview, onMessage }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const now = new Date()

  const filteredBookings = bookings
    .filter(b => {
      if (filter === 'upcoming') return new Date(b.date) > now && b.status !== 'completed'
      if (filter === 'completed') return b.status === 'completed'
      return true
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Past' },
  ]

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

  // Calculate total spent
  const totalSpent = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.price, 0)

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">Total bookings</p>
          <p className="text-2xl font-semibold text-[#1A1A1A]">{bookings.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">Total spent</p>
          <p className="text-2xl font-semibold text-[#1A1A1A]">€{totalSpent}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.98] ${
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
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-2xl p-4 border border-[#EBEBEB]">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-[#1A1A1A]">{booking.service}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[booking.status]}`}>
                      {statusLabels[booking.status]}
                    </span>
                  </div>
                  <p className="text-sm text-[#6B6B6B]">
                    {formatDate(booking.date)} · {booking.time}
                  </p>
                </div>
                <span className="font-semibold text-[#1A1A1A]">€{booking.price}</span>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-[#EBEBEB]">
                <div className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden relative">
                  {booking.cleaner.photo ? (
                    <Image src={booking.cleaner.photo} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    <span className="text-sm">👤</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1A1A1A]">{booking.cleaner.name}</p>
                  <p className="text-xs text-[#6B6B6B]">{booking.property.name}</p>
                </div>
                <div className="flex gap-2">
                  {onMessage && (
                    <button
                      onClick={() => onMessage(booking.cleaner.id, booking.cleaner.name, booking.property.id)}
                      className="text-sm bg-[#F5F5F3] px-3 py-1.5 rounded-lg text-[#1A1A1A] font-medium active:scale-[0.98] transition-all flex items-center gap-1"
                    >
                      <span>💬</span>
                      Message
                    </button>
                  )}
                  {booking.status === 'completed' && (
                    <>
                      {onLeaveReview && (
                        <button
                          onClick={() => onLeaveReview(booking.id, booking.cleaner.id, booking.cleaner.name)}
                          className="text-sm bg-[#C4785A] px-3 py-1.5 rounded-lg text-white font-medium active:scale-[0.98] transition-all"
                        >
                          Review
                        </button>
                      )}
                      <Link
                        href={`/${booking.cleaner.slug}`}
                        className="text-sm bg-[#F5F5F3] px-3 py-1.5 rounded-lg text-[#1A1A1A] font-medium active:scale-[0.98] transition-all"
                      >
                        Book again
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
