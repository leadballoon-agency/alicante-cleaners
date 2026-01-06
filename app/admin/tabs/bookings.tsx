'use client'

import { useState } from 'react'
import { Booking } from '../page'

type Props = {
  bookings: Booking[]
}

type Filter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'

export default function BookingsTab({ bookings }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const filteredBookings = bookings
    .filter(b => filter === 'all' || b.status === filter)
    .filter(b =>
      b.cleaner.name.toLowerCase().includes(search.toLowerCase()) ||
      b.owner.name.toLowerCase().includes(search.toLowerCase()) ||
      b.property.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const statusColors = {
    pending: 'bg-[#FFF3E0] text-[#E65100]',
    confirmed: 'bg-[#E8F5E9] text-[#2E7D32]',
    completed: 'bg-[#F5F5F3] text-[#6B6B6B]',
    cancelled: 'bg-[#FFEBEE] text-[#C62828]',
  }

  const statusDots = {
    pending: 'bg-[#E65100]',
    confirmed: 'bg-[#2E7D32]',
    completed: 'bg-[#6B6B6B]',
    cancelled: 'bg-[#C62828]',
  }

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }

  const totalRevenue = bookings.reduce((sum, b) => sum + b.price, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-[#1A1A1A]">Bookings</h2>
        <p className="text-sm text-[#6B6B6B]">{bookings.length} total · €{totalRevenue} revenue</p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by cleaner, owner, or property..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] text-sm focus:outline-none focus:border-[#1A1A1A]"
      />

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as Filter[]).map((f) => (
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
            {counts[f] > 0 && (
              <span className={`ml-1.5 text-xs ${filter === f ? 'text-white/70' : 'text-[#9B9B9B]'}`}>
                {counts[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Booking Cards */}
      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="bg-[#F5F5F3] rounded-2xl p-8 text-center">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-[#6B6B6B]">No bookings found</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl p-4 border border-[#EBEBEB]"
            >
              {/* Header Row */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-[#6B6B6B]">
                    {formatDate(booking.date)} · {formatTime(booking.date)}
                  </p>
                  <p className="font-semibold text-[#1A1A1A] text-lg">{booking.service}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${statusDots[booking.status]}`} />
                  <span className="text-sm text-[#6B6B6B] capitalize">{booking.status}</span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#9B9B9B]">🧹</span>
                  <span className="text-[#1A1A1A]">{booking.cleaner.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#9B9B9B]">👤</span>
                  <span className="text-[#1A1A1A]">{booking.owner.name}</span>
                  <span className="text-[#6B6B6B]">({booking.owner.email})</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#9B9B9B]">🏠</span>
                  <span className="text-[#6B6B6B]">{booking.property}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[#EBEBEB]">
                <span className={`text-xs px-2.5 py-1 rounded-full ${statusColors[booking.status]}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
                <span className="font-semibold text-[#1A1A1A]">€{booking.price}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
