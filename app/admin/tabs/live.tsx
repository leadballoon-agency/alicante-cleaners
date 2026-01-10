'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { AdminFeedItem, AdminCardType } from '@/lib/admin/card-types'
import AdminCard from '../cards/AdminCard'

type Analytics = {
  totalViews: number
  todayViews: number
  topPages: { path: string; views: number; name?: string }[]
  topCleaners: { slug: string; name: string; views: number }[]
}

type GA4Realtime = {
  configured: boolean
  message?: string
  realtime?: {
    activeUsers: number
    topPages: { page: string; users: number }[]
    countries: { country: string; users: number }[]
    timestamp: string
  }
}

type FeedResponse = {
  items: AdminFeedItem[]
  counts: {
    total: number
    byType: Record<string, number>
    urgent: number
  }
  lastUpdated: string
}

type Stats = {
  totalCleaners: number
  activeCleaners: number
  pendingApplications: number
  totalBookings: number
  thisMonthBookings: number
  totalRevenue: number
  thisMonthRevenue: number
  totalReviews: number
  averageRating: number
}

type Props = {
  onTabChange: (tab: string) => void
  onApproveReview: (id: string) => void
  onApproveCleaner: (id: string) => void
  stats?: Stats
  initialCardId?: string | null // Auto-open this card's modal
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

// Date grouping types
type DateGroup = {
  key: string
  label: string
  date: Date
  day: string
  month: string
  weekday: string
  isToday: boolean
  isYesterday: boolean
  items: AdminFeedItem[]
}

// Get date key for grouping (YYYY-MM-DD)
const getDateKey = (timestamp: Date | string): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  return date.toISOString().split('T')[0]
}

// Format date header info
const formatDateInfo = (dateStr: string): Omit<DateGroup, 'key' | 'items'> => {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Reset times for comparison
  today.setHours(0, 0, 0, 0)
  yesterday.setHours(0, 0, 0, 0)
  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)

  const isToday = compareDate.getTime() === today.getTime()
  const isYesterday = compareDate.getTime() === yesterday.getTime()

  let label: string
  if (isToday) {
    label = 'Today'
  } else if (isYesterday) {
    label = 'Yesterday'
  } else {
    // Check if within last 7 days
    const diffDays = Math.floor((today.getTime() - compareDate.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 7) {
      label = date.toLocaleDateString('en-GB', { weekday: 'long' })
    } else {
      label = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    }
  }

  return {
    label,
    date,
    day: date.getDate().toString(),
    month: date.toLocaleDateString('en-GB', { month: 'short' }),
    weekday: date.toLocaleDateString('en-GB', { weekday: 'short' }),
    isToday,
    isYesterday
  }
}

// Group items by date
const groupItemsByDate = (items: AdminFeedItem[]): DateGroup[] => {
  const groups: Map<string, AdminFeedItem[]> = new Map()

  // Group by date
  for (const item of items) {
    const key = getDateKey(item.timestamp)
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(item)
  }

  // Convert to array and sort by date (newest first)
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => b.localeCompare(a))

  return sortedKeys.map(key => ({
    key,
    ...formatDateInfo(key),
    items: groups.get(key)!
  }))
}

export default function LiveTab({
  onTabChange,
  onApproveReview,
  onApproveCleaner,
  stats,
  initialCardId,
  searchQuery = '',
  onSearchChange,
}: Props) {
  const [feedItems, setFeedItems] = useState<AdminFeedItem[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [ga4Realtime, setGa4Realtime] = useState<GA4Realtime | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [openedInitialCard, setOpenedInitialCard] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [pendingCount, setPendingCount] = useState({ bookings: 0, reviews: 0, cleaners: 0 })
  const [urgentOnly, setUrgentOnly] = useState(false)

  const fetchActivity = useCallback(async () => {
    try {
      const [activityRes, analyticsRes, ga4Res] = await Promise.all([
        fetch('/api/admin/activity?format=cards'),
        fetch('/api/admin/analytics'),
        fetch('/api/admin/ga4-realtime'),
      ])

      if (activityRes.ok) {
        const data: FeedResponse = await activityRes.json()
        setFeedItems(data.items || [])
        const byType = data.counts?.byType || {}
        setPendingCount({
          bookings: byType['booking_pending'] || 0,
          reviews: byType['review_pending'] || 0,
          cleaners: byType['cleaner_signup'] || 0,
        })
        setLastUpdated(new Date())
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setAnalytics(data)
      }

      if (ga4Res.ok) {
        const data = await ga4Res.json()
        setGa4Realtime(data)
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActivity()
  }, [fetchActivity])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchActivity, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchActivity])

  // Group items by date
  // Filter items by search query and urgent filter
  const filteredItems = useMemo(() => {
    let items = feedItems

    // Filter by urgent/pending only
    if (urgentOnly) {
      items = items.filter(item =>
        item.priority === 'urgent' ||
        item.type === 'booking_pending' ||
        item.type === 'review_pending' ||
        item.type === 'cleaner_signup'
      )
    }

    // Then apply search filter
    if (!searchQuery.trim()) return items

    const query = searchQuery.toLowerCase()
    return items.filter(item => {
      // Search in common fields based on item type
      const searchableText = [
        item.id,
        item.type,
        // Add type-specific fields
        'booking' in item ? (item as { booking?: { cleanerName?: string; ownerName?: string; propertyName?: string; service?: string } }).booking?.cleanerName : '',
        'booking' in item ? (item as { booking?: { cleanerName?: string; ownerName?: string; propertyName?: string; service?: string } }).booking?.ownerName : '',
        'booking' in item ? (item as { booking?: { cleanerName?: string; ownerName?: string; propertyName?: string; service?: string } }).booking?.propertyName : '',
        'cleaner' in item ? (item as { cleaner?: { name?: string; phone?: string; email?: string } }).cleaner?.name : '',
        'cleaner' in item ? (item as { cleaner?: { name?: string; phone?: string; email?: string } }).cleaner?.email : '',
        'review' in item ? (item as { review?: { cleanerName?: string; authorName?: string; text?: string } }).review?.cleanerName : '',
        'review' in item ? (item as { review?: { cleanerName?: string; authorName?: string; text?: string } }).review?.authorName : '',
        'owner' in item ? (item as { owner?: { name?: string; email?: string } }).owner?.name : '',
        'owner' in item ? (item as { owner?: { name?: string; email?: string } }).owner?.email : '',
      ].filter(Boolean).join(' ').toLowerCase()

      return searchableText.includes(query)
    })
  }, [feedItems, searchQuery, urgentOnly])

  const dateGroups = useMemo(() => groupItemsByDate(filteredItems), [filteredItems])

  const getRelativeTime = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
    const diff = Date.now() - date.getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)

    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  // Action handlers for AdminCard
  const handleApprove = async (id: string, type: AdminCardType) => {
    if (type === 'review_pending') {
      const reviewId = id.replace('review-', '')
      onApproveReview(reviewId)
      // Remove from urgent feed after approval
      setFeedItems(prev => prev.filter(item => item.id !== id))
    } else if (type === 'cleaner_signup') {
      const cleanerId = id.replace('cleaner-', '')
      onApproveCleaner(cleanerId)
      setFeedItems(prev => prev.filter(item => item.id !== id))
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleReject = async (id: string, type: AdminCardType) => {
    setFeedItems(prev => prev.filter(item => item.id !== id))
  }

  const handleViewDetails = (id: string, type: AdminCardType) => {
    if (type.startsWith('review_')) onTabChange('reviews')
    else if (type.startsWith('cleaner_')) onTabChange('cleaners')
    else if (type.startsWith('booking_')) onTabChange('bookings')
    else if (type.startsWith('owner_')) onTabChange('owners')
  }

  const handleLoginAs = (userId: string, role: 'cleaner' | 'owner') => {
    // TODO: Implement login as functionality
    console.log('Login as:', userId, role)
  }

  const handleMessage = (userId: string, type: 'cleaner' | 'owner', phone?: string) => {
    if (phone) {
      window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank')
    }
  }

  const totalPending = pendingCount.bookings + pendingCount.reviews + pendingCount.cleaners

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-[#F5F5F3] rounded-lg animate-pulse w-48" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-[#F5F5F3] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-[#F5F5F3] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Compact Header Row: Live • Revenue */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            autoRefresh
              ? 'bg-[#E8F5E9] text-[#2E7D32]'
              : 'bg-[#F5F5F3] text-[#6B6B6B]'
          }`}
        >
          {autoRefresh ? '● Live' : '○ Paused'}
        </button>
        {stats && (
          <span className="text-lg font-bold text-[#1A1A1A]">€{stats.thisMonthRevenue.toLocaleString()}</span>
        )}
        <span className="text-xs text-[#9B9B9B]">
          {lastUpdated ? getRelativeTime(lastUpdated) : '...'}
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search bookings, cleaners, owners..."
          className="w-full px-4 py-2.5 pl-10 rounded-xl border border-[#DEDEDE] bg-white focus:border-[#1A1A1A] focus:outline-none text-sm"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchQuery && (
          <button
            onClick={() => onSearchChange?.('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-[#DEDEDE] rounded-full flex items-center justify-center text-xs text-[#6B6B6B]"
          >
            ×
          </button>
        )}
      </div>

      {/* Search results count */}
      {searchQuery && (
        <p className="text-xs text-[#6B6B6B]">
          {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
        </p>
      )}

      {/* GA4 Real-time - Compact inline */}
      {ga4Realtime?.configured && ga4Realtime.realtime && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#E8F5E9] rounded-lg">
          <span className="w-2 h-2 bg-[#2E7D32] rounded-full animate-pulse" />
          <span className="text-sm font-medium text-[#2E7D32]">{ga4Realtime.realtime.activeUsers} live</span>
        </div>
      )}

      {/* Needs Action Banner - Clickable filter */}
      {totalPending > 0 && (
        <button
          onClick={() => setUrgentOnly(!urgentOnly)}
          className={`w-full rounded-xl p-3 flex items-center gap-3 transition-colors ${
            urgentOnly
              ? 'bg-[#E65100] text-white'
              : 'bg-[#FFF3E0] text-[#1A1A1A]'
          }`}
        >
          <span className="text-lg">⚡</span>
          <p className="font-medium text-sm">{totalPending} need attention</p>
          {urgentOnly && (
            <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">
              Filtered
            </span>
          )}
        </button>
      )}

      {/* Activity Timeline Header */}
      <h3 className="font-semibold text-[#1A1A1A]">Activity</h3>

      {/* Timeline Feed with Date Groups */}
      {feedItems.length === 0 ? (
        <div className="bg-[#F5F5F3] rounded-2xl p-8 text-center">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-[#6B6B6B]">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dateGroups.map((group) => (
            <div key={group.key} className="relative">
              {/* Date Header - Calendar Style */}
              <div className="flex items-center gap-3 mb-2">
                {/* Calendar date marker */}
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                  group.isToday
                    ? 'bg-[#1A1A1A] text-white'
                    : group.isYesterday
                      ? 'bg-[#C4785A] text-white'
                      : 'bg-white border border-[#EBEBEB] text-[#1A1A1A]'
                }`}>
                  <span className="text-lg font-bold leading-none">{group.day}</span>
                  <span className="text-[10px] uppercase leading-none mt-0.5">{group.month}</span>
                </div>

                {/* Date label */}
                <div className="flex-1">
                  <p className={`font-semibold ${group.isToday ? 'text-[#1A1A1A]' : 'text-[#6B6B6B]'}`}>
                    {group.label}
                  </p>
                  <p className="text-xs text-[#9B9B9B]">
                    {group.items.length} {group.items.length === 1 ? 'event' : 'events'}
                  </p>
                </div>
              </div>

              {/* Items for this date */}
              <div className="pl-[60px] space-y-2">
                {/* Timeline line */}
                <div className="absolute left-[23px] top-14 bottom-0 w-0.5 bg-[#EBEBEB]" />

                {group.items.map((item) => (
                  <div key={item.id} className="relative">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[37px] top-4 w-2 h-2 rounded-full ${
                      item.priority === 'urgent' ? 'bg-[#E65100]' : 'bg-[#DEDEDE]'
                    }`} />

                    <AdminCard
                      item={item}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onViewDetails={handleViewDetails}
                      onLoginAs={handleLoginAs}
                      onMessage={handleMessage}
                      autoOpen={!openedInitialCard && initialCardId === item.id}
                      onAutoOpened={() => setOpenedInitialCard(true)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics - Moved to bottom, collapsible style */}
      {analytics && (
        <details className="bg-white border border-[#EBEBEB] rounded-xl">
          <summary className="p-4 cursor-pointer flex items-center justify-between">
            <span className="font-medium text-[#1A1A1A]">Page Analytics</span>
            <span className="text-sm text-[#6B6B6B]">{analytics.totalViews} views this week</span>
          </summary>
          <div className="px-4 pb-4 pt-2 border-t border-[#EBEBEB]">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-2xl font-bold text-[#1A1A1A]">{analytics.totalViews}</p>
                <p className="text-xs text-[#6B6B6B]">Total views</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1A1A1A]">{analytics.todayViews}</p>
                <p className="text-xs text-[#6B6B6B]">Today</p>
              </div>
            </div>
            {analytics.topCleaners && analytics.topCleaners.length > 0 && (
              <div className="pt-3 border-t border-[#F5F5F3]">
                <p className="text-xs text-[#9B9B9B] mb-2">Trending Cleaners</p>
                <div className="space-y-1">
                  {analytics.topCleaners.slice(0, 3).map((cleaner, idx) => (
                    <div key={cleaner.slug} className="flex items-center justify-between text-sm">
                      <span className="text-[#1A1A1A]">{idx + 1}. {cleaner.name}</span>
                      <span className="text-[#9B9B9B]">{cleaner.views}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </details>
      )}

      {/* GA4 Not Configured - At bottom */}
      {ga4Realtime && !ga4Realtime.configured && (
        <button
          onClick={() => onTabChange('settings')}
          className="w-full bg-[#F5F5F3] rounded-xl p-4 text-left hover:bg-[#EBEBEB] transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📊</span>
            <div>
              <p className="font-medium text-sm text-[#1A1A1A]">Enable Live Analytics</p>
              <p className="text-xs text-[#6B6B6B]">Connect Google Analytics</p>
            </div>
          </div>
        </button>
      )}
    </div>
  )
}
