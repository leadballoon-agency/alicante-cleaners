'use client'

import { Stats, Booking } from '../page'

type Props = {
  stats: Stats
  recentBookings: Booking[]
  todayBookings: Booking[]
  pendingReviews: number
  adminName?: string
  onTabChange: (tab: string) => void
}

export default function OverviewTab({
  stats,
  recentBookings,
  todayBookings,
  pendingReviews,
  adminName = 'there',
  onTabChange
}: Props) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
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

  // Calculate week's bookings (simple approximation)
  const thisWeekBookings = Math.ceil(stats.thisMonthBookings / 4)

  // Check what needs attention
  const needsAttention = []
  if (stats.pendingApplications > 0) {
    needsAttention.push({
      icon: '👥',
      label: `${stats.pendingApplications} pending cleaner application${stats.pendingApplications > 1 ? 's' : ''}`,
      tab: 'cleaners',
      color: 'bg-[#FFF8F5] border-[#F5E6E0]',
    })
  }
  if (pendingReviews > 0) {
    needsAttention.push({
      icon: '⭐',
      label: `${pendingReviews} review${pendingReviews > 1 ? 's' : ''} awaiting approval`,
      tab: 'reviews',
      color: 'bg-[#FFF8F5] border-[#F5E6E0]',
    })
  }

  return (
    <div className="space-y-6 pb-4">
      {/* Hero Greeting */}
      <div className="pt-2">
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">
          {getGreeting()}, {adminName.split(' ')[0]}
        </h1>
        <p className="text-[#6B6B6B] mt-1">Here&apos;s what&apos;s happening today</p>
      </div>

      {/* Big Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#333] rounded-2xl p-5 text-white">
          <p className="text-white/70 text-sm mb-1">This Month</p>
          <p className="text-3xl font-bold">€{stats.thisMonthRevenue.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-[#4ADE80] text-sm">↑ 15%</span>
            <span className="text-white/50 text-xs">vs last month</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
          <p className="text-[#6B6B6B] text-sm mb-1">This Week</p>
          <p className="text-3xl font-bold text-[#1A1A1A]">{thisWeekBookings}</p>
          <p className="text-[#6B6B6B] text-sm mt-2">bookings</p>
        </div>
      </div>

      {/* Needs Attention */}
      {needsAttention.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚡</span>
            <h2 className="font-semibold text-[#1A1A1A]">Needs Attention</h2>
          </div>
          <div className="space-y-2">
            {needsAttention.map((item, index) => (
              <button
                key={index}
                onClick={() => onTabChange(item.tab)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border ${item.color} active:scale-[0.98] transition-transform`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium text-[#1A1A1A]">{item.label}</span>
                </div>
                <svg className="w-5 h-5 text-[#9B9B9B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Today's Bookings */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📅</span>
          <h2 className="font-semibold text-[#1A1A1A]">Today&apos;s Bookings</h2>
          <span className="text-sm text-[#6B6B6B]">({todayBookings.length})</span>
        </div>
        {todayBookings.length === 0 ? (
          <div className="bg-[#F5F5F3] rounded-2xl p-6 text-center">
            <p className="text-3xl mb-2">☀️</p>
            <p className="text-[#6B6B6B]">No bookings scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayBookings.slice(0, 5).map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl p-4 border border-[#EBEBEB] flex items-start gap-4"
              >
                <div className="text-center min-w-[50px]">
                  <p className="text-lg font-semibold text-[#1A1A1A]">{formatTime(booking.date)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-[#1A1A1A] truncate">{booking.cleaner.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${statusColors[booking.status]}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#6B6B6B] truncate">{booking.property} · {booking.service}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Platform Health */}
      <div className="bg-[#FAFAF8] rounded-2xl p-5 border border-[#EBEBEB]">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📊</span>
          <h2 className="font-semibold text-[#1A1A1A]">Platform Health</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFF8F5] rounded-full flex items-center justify-center">
              <span className="text-[#C4785A]">⭐</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-[#1A1A1A]">{stats.averageRating}</p>
              <p className="text-xs text-[#6B6B6B]">avg rating</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E8F5E9] rounded-full flex items-center justify-center">
              <span className="text-[#2E7D32]">👥</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-[#1A1A1A]">{stats.activeCleaners}</p>
              <p className="text-xs text-[#6B6B6B]">cleaners</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E3F2FD] rounded-full flex items-center justify-center">
              <span className="text-[#1565C0]">📋</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-[#1A1A1A]">{stats.totalBookings}</p>
              <p className="text-xs text-[#6B6B6B]">total bookings</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F3E5F5] rounded-full flex items-center justify-center">
              <span className="text-[#7B1FA2]">💬</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-[#1A1A1A]">{stats.totalReviews}</p>
              <p className="text-xs text-[#6B6B6B]">reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentBookings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔔</span>
              <h2 className="font-semibold text-[#1A1A1A]">Recent Activity</h2>
            </div>
            <button
              onClick={() => onTabChange('bookings')}
              className="text-sm text-[#C4785A] font-medium"
            >
              View all
            </button>
          </div>
          <div className="space-y-2">
            {recentBookings.slice(0, 3).map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl p-4 border border-[#EBEBEB]"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-[#1A1A1A]">{booking.service}</p>
                  <span className="font-semibold text-[#1A1A1A]">€{booking.price}</span>
                </div>
                <p className="text-sm text-[#6B6B6B]">
                  {booking.cleaner.name} · {booking.owner.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
