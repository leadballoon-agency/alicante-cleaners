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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const statusColors = {
    pending: 'bg-[#FFF3E0] text-[#E65100]',
    confirmed: 'bg-[#E8F5E9] text-[#2E7D32]',
    completed: 'bg-[#F5F5F3] text-[#6B6B6B]',
    cancelled: 'bg-[#FFEBEE] text-[#C62828]',
  }

  const pendingCount = bookings.filter(b => b.status === 'pending').length
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length
  const completedCount = bookings.filter(b => b.status === 'completed').length
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length

  const totalRevenue = bookings.reduce((sum, b) => sum + b.price, 0)
  const thisMonthRevenue = bookings
    .filter(b => {
      const bookingDate = new Date(b.date)
      const now = new Date()
      return bookingDate.getMonth() === now.getMonth() &&
             bookingDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, b) => sum + b.price, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A]">All Bookings</h2>
          <p className="text-sm text-[#6B6B6B]">
            {bookings.length} total bookings · €{totalRevenue} revenue
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-lg border border-[#DEDEDE] text-sm focus:outline-none focus:border-[#1A1A1A]"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">Pending</p>
          <p className="text-2xl font-semibold text-[#E65100]">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">Confirmed</p>
          <p className="text-2xl font-semibold text-[#2E7D32]">{confirmedCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">Completed</p>
          <p className="text-2xl font-semibold text-[#6B6B6B]">{completedCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">Cancelled</p>
          <p className="text-2xl font-semibold text-[#C62828]">{cancelledCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">This Month</p>
          <p className="text-2xl font-semibold text-[#1A1A1A]">€{thisMonthRevenue}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as Filter[]).map((f) => (
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
          </button>
        ))}
      </div>

      {/* Bookings table */}
      <div className="bg-white rounded-xl border border-[#EBEBEB] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F5F5F3] border-b border-[#EBEBEB]">
            <tr>
              <th className="text-left text-xs font-medium text-[#6B6B6B] px-4 py-3">Service</th>
              <th className="text-left text-xs font-medium text-[#6B6B6B] px-4 py-3">Cleaner</th>
              <th className="text-left text-xs font-medium text-[#6B6B6B] px-4 py-3">Owner</th>
              <th className="text-left text-xs font-medium text-[#6B6B6B] px-4 py-3">Property</th>
              <th className="text-left text-xs font-medium text-[#6B6B6B] px-4 py-3">Date</th>
              <th className="text-left text-xs font-medium text-[#6B6B6B] px-4 py-3">Status</th>
              <th className="text-right text-xs font-medium text-[#6B6B6B] px-4 py-3">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EBEBEB]">
            {filteredBookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-[#F5F5F3]/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-[#1A1A1A] text-sm">{booking.service}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-[#1A1A1A]">{booking.cleaner.name}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-[#1A1A1A]">{booking.owner.name}</p>
                  <p className="text-xs text-[#6B6B6B]">{booking.owner.email}</p>
                </td>
                <td className="px-4 py-3 text-sm text-[#6B6B6B]">{booking.property}</td>
                <td className="px-4 py-3 text-sm text-[#6B6B6B]">{formatDate(booking.date)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[booking.status]}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-[#1A1A1A]">€{booking.price}</td>
              </tr>
            ))}
            {filteredBookings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#6B6B6B]">
                  No bookings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
