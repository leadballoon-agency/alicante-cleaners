'use client'

import { Stats, Booking } from '../page'

type Props = {
  stats: Stats
  recentBookings: Booking[]
}

export default function OverviewTab({ stats, recentBookings }: Props) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
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

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">Active Cleaners</p>
          <p className="text-3xl font-semibold text-[#1A1A1A]">{stats.activeCleaners}</p>
          <p className="text-xs text-[#C4785A]">+{stats.pendingApplications} pending</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">This Month</p>
          <p className="text-3xl font-semibold text-[#1A1A1A]">{stats.thisMonthBookings}</p>
          <p className="text-xs text-[#6B6B6B]">bookings</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">Revenue (Month)</p>
          <p className="text-3xl font-semibold text-[#1A1A1A]">€{stats.thisMonthRevenue}</p>
          <p className="text-xs text-[#6B6B6B]">€{stats.totalRevenue} total</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#EBEBEB]">
          <p className="text-sm text-[#6B6B6B] mb-1">Avg Rating</p>
          <p className="text-3xl font-semibold text-[#1A1A1A]">{stats.averageRating}</p>
          <p className="text-xs text-[#6B6B6B]">{stats.totalReviews} reviews</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#FFF8F5] rounded-xl p-4 border border-[#F5E6E0]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👥</span>
            <div>
              <p className="font-medium text-[#1A1A1A]">{stats.pendingApplications} pending applications</p>
              <p className="text-sm text-[#6B6B6B]">Review new cleaner signups</p>
            </div>
          </div>
        </div>
        <div className="bg-[#E8F5E9] rounded-xl p-4 border border-[#C8E6C9]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📈</span>
            <div>
              <p className="font-medium text-[#1A1A1A]">Platform growing</p>
              <p className="text-sm text-[#6B6B6B]">+15% bookings this month</p>
            </div>
          </div>
        </div>
        <div className="bg-[#E3F2FD] rounded-xl p-4 border border-[#BBDEFB]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="font-medium text-[#1A1A1A]">Great reviews</p>
              <p className="text-sm text-[#6B6B6B]">{stats.averageRating}/5 average rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Recent Bookings</h2>
          <button className="text-sm text-[#C4785A] font-medium">View all</button>
        </div>
        <div className="bg-white rounded-xl border border-[#EBEBEB] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F5F5F3] border-b border-[#EBEBEB]">
              <tr>
                <th className="text-left text-xs font-medium text-[#6B6B6B] px-4 py-3">Booking</th>
                <th className="text-left text-xs font-medium text-[#6B6B6B] px-4 py-3">Cleaner</th>
                <th className="text-left text-xs font-medium text-[#6B6B6B] px-4 py-3">Owner</th>
                <th className="text-left text-xs font-medium text-[#6B6B6B] px-4 py-3">Date</th>
                <th className="text-left text-xs font-medium text-[#6B6B6B] px-4 py-3">Status</th>
                <th className="text-right text-xs font-medium text-[#6B6B6B] px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {recentBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-[#F5F5F3]/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#1A1A1A] text-sm">{booking.service}</p>
                    <p className="text-xs text-[#6B6B6B]">{booking.property}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#1A1A1A]">{booking.cleaner.name}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[#1A1A1A]">{booking.owner.name}</p>
                    <p className="text-xs text-[#6B6B6B]">{booking.owner.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6B6B6B]">{formatDate(booking.date)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[booking.status]}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-[#1A1A1A]">€{booking.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
