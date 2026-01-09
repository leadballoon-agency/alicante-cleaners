'use client'

import { useState, useEffect, useCallback } from 'react'

type ActivityItem = {
  id: string
  type: 'booking' | 'review' | 'cleaner_signup' | 'owner_signup' | 'booking_completed' | 'cleaner_approved' | 'cleaner_message' | 'cleaner_login' | 'service_pending' | 'easter_egg'
  title: string
  description: string
  timestamp: string
  status?: string
  actionable?: boolean
  resourceId?: string
  meta?: Record<string, unknown>
}

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

type Props = {
  onTabChange: (tab: string) => void
  onApproveReview: (id: string) => void
  onApproveCleaner: (id: string) => void
}

export default function LiveTab({ onTabChange, onApproveReview, onApproveCleaner }: Props) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [ga4Realtime, setGa4Realtime] = useState<GA4Realtime | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [pendingCount, setPendingCount] = useState({ bookings: 0, reviews: 0, cleaners: 0 })

  const fetchActivity = useCallback(async () => {
    try {
      const [activityRes, analyticsRes, ga4Res] = await Promise.all([
        fetch('/api/admin/activity'),
        fetch('/api/admin/analytics'),
        fetch('/api/admin/ga4-realtime'),
      ])

      if (activityRes.ok) {
        const data = await activityRes.json()
        setActivities(data.activities || [])
        setPendingCount(data.pendingCount || { bookings: 0, reviews: 0, cleaners: 0 })
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

  const getRelativeTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)

    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'booking': return '📅'
      case 'booking_completed': return '✅'
      case 'review': return '⭐'
      case 'cleaner_signup': return '👋'
      case 'cleaner_approved': return '✓'
      case 'owner_signup': return '🏠'
      case 'cleaner_message': return '💬'
      case 'cleaner_login': return '🟢'
      case 'service_pending': return '🛠️'
      case 'easter_egg': return '🎭'
      default: return '📌'
    }
  }

  const getActivityColor = (type: ActivityItem['type'], status?: string) => {
    if (status === 'pending' || status === 'unread') return 'border-l-[#E65100] bg-[#FFF8F5]'
    // Easter egg: Alan = blue, Amanda = pink
    if (type === 'easter_egg') {
      return status === 'alan'
        ? 'border-l-[#3B82F6] bg-blue-50'
        : 'border-l-[#EC4899] bg-pink-50'
    }
    switch (type) {
      case 'booking': return 'border-l-[#1565C0] bg-white'
      case 'booking_completed': return 'border-l-[#2E7D32] bg-white'
      case 'review': return 'border-l-[#C4785A] bg-white'
      case 'cleaner_signup': return 'border-l-[#7B1FA2] bg-white'
      case 'cleaner_approved': return 'border-l-[#2E7D32] bg-white'
      case 'owner_signup': return 'border-l-[#0288D1] bg-white'
      case 'cleaner_message': return 'border-l-[#9C27B0] bg-white'
      case 'cleaner_login': return 'border-l-[#4CAF50] bg-white'
      case 'service_pending': return 'border-l-[#FF9800] bg-white'
      default: return 'border-l-[#9B9B9B] bg-white'
    }
  }

  const handleAction = async (item: ActivityItem) => {
    if (item.type === 'review' && item.resourceId) {
      onApproveReview(item.resourceId)
      // Optimistically update
      setActivities(prev => prev.map(a =>
        a.id === item.id ? { ...a, actionable: false, status: 'approved' } : a
      ))
    } else if (item.type === 'cleaner_signup' && item.resourceId) {
      onApproveCleaner(item.resourceId)
      setActivities(prev => prev.map(a =>
        a.id === item.id ? { ...a, actionable: false, status: 'approved', type: 'cleaner_approved' } : a
      ))
    } else if (item.type === 'cleaner_message') {
      // Navigate to messages tab
      onTabChange('messages')
    } else if (item.type === 'service_pending' && item.resourceId) {
      // Approve service
      try {
        const res = await fetch(`/api/admin/services/${item.resourceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'APPROVED' }),
        })
        if (res.ok) {
          setActivities(prev => prev.filter(a => a.id !== item.id))
        }
      } catch (error) {
        console.error('Failed to approve service:', error)
      }
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
            <div key={i} className="h-16 bg-[#F5F5F3] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#1A1A1A]">Live Feed</h2>
          <p className="text-sm text-[#6B6B6B]">
            {lastUpdated ? `Updated ${getRelativeTime(lastUpdated.toISOString())}` : 'Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <button
            onClick={fetchActivity}
            className="p-2 rounded-lg bg-white border border-[#EBEBEB] text-[#6B6B6B] hover:text-[#1A1A1A] active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => pendingCount.cleaners > 0 && onTabChange('cleaners')}
          className={`p-4 rounded-xl text-left transition-all active:scale-[0.98] ${
            pendingCount.cleaners > 0
              ? 'bg-[#FFF8F5] border border-[#F5E6E0]'
              : 'bg-white border border-[#EBEBEB]'
          }`}
        >
          <p className="text-2xl font-bold text-[#1A1A1A]">{pendingCount.cleaners}</p>
          <p className="text-xs text-[#6B6B6B]">Pending cleaners</p>
        </button>
        <button
          onClick={() => pendingCount.reviews > 0 && onTabChange('reviews')}
          className={`p-4 rounded-xl text-left transition-all active:scale-[0.98] ${
            pendingCount.reviews > 0
              ? 'bg-[#FFF8F5] border border-[#F5E6E0]'
              : 'bg-white border border-[#EBEBEB]'
          }`}
        >
          <p className="text-2xl font-bold text-[#1A1A1A]">{pendingCount.reviews}</p>
          <p className="text-xs text-[#6B6B6B]">Pending reviews</p>
        </button>
        <button
          onClick={() => pendingCount.bookings > 0 && onTabChange('bookings')}
          className={`p-4 rounded-xl text-left transition-all active:scale-[0.98] ${
            pendingCount.bookings > 0
              ? 'bg-[#FFF8F5] border border-[#F5E6E0]'
              : 'bg-white border border-[#EBEBEB]'
          }`}
        >
          <p className="text-2xl font-bold text-[#1A1A1A]">{pendingCount.bookings}</p>
          <p className="text-xs text-[#6B6B6B]">Pending bookings</p>
        </button>
      </div>

      {/* GA4 Real-time Section */}
      {ga4Realtime?.configured && ga4Realtime.realtime && (
        <div className="bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <h3 className="font-semibold">Live Right Now</h3>
            </div>
            <span className="text-xs text-white/70">Google Analytics</span>
          </div>

          <div className="text-center mb-4">
            <p className="text-5xl font-bold">{ga4Realtime.realtime.activeUsers}</p>
            <p className="text-sm text-white/80">active {ga4Realtime.realtime.activeUsers === 1 ? 'user' : 'users'}</p>
          </div>

          {ga4Realtime.realtime.topPages.length > 0 && (
            <div className="pt-4 border-t border-white/20">
              <p className="text-xs text-white/70 mb-2">Pages being viewed</p>
              <div className="space-y-1.5">
                {ga4Realtime.realtime.topPages.slice(0, 4).map((page, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1 mr-2 text-white/90">{page.page}</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{page.users}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ga4Realtime.realtime.countries.length > 0 && (
            <div className="pt-3 mt-3 border-t border-white/20">
              <p className="text-xs text-white/70 mb-2">Countries</p>
              <div className="flex flex-wrap gap-2">
                {ga4Realtime.realtime.countries.slice(0, 5).map((c) => (
                  <span key={c.country} className="text-xs bg-white/20 px-2 py-1 rounded-full">
                    {c.country} ({c.users})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* GA4 Not Configured Notice */}
      {ga4Realtime && !ga4Realtime.configured && (
        <button
          onClick={() => onTabChange('settings')}
          className="w-full bg-white rounded-2xl p-5 border border-[#EBEBEB] text-left hover:border-[#DEDEDE] transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <p className="font-medium text-[#1A1A1A]">Enable Live Analytics</p>
              <p className="text-sm text-[#6B6B6B]">
                Connect Google Analytics to see real-time visitors
              </p>
            </div>
          </div>
        </button>
      )}

      {/* Analytics Section - Internal Tracking */}
      {analytics && (
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#333] rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Page Views</h3>
            <span className="text-xs text-white/50">Last 7 days</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-3xl font-bold">{analytics.totalViews.toLocaleString()}</p>
              <p className="text-xs text-white/70">Total views</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{analytics.todayViews.toLocaleString()}</p>
              <p className="text-xs text-white/70">Today</p>
            </div>
          </div>

          {analytics.topCleaners && analytics.topCleaners.length > 0 && (
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-white/50 mb-2">🔥 Trending Cleaners</p>
              <div className="space-y-2">
                {analytics.topCleaners.slice(0, 3).map((cleaner, idx) => (
                  <div key={cleaner.slug} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-white/50 text-xs w-4">{idx + 1}.</span>
                      <span className="text-sm">{cleaner.name}</span>
                    </div>
                    <span className="text-xs text-white/70">{cleaner.views} views</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Needs Action Banner */}
      {totalPending > 0 && (
        <div className="bg-[#FFF3E0] rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <div className="flex-1">
            <p className="font-medium text-[#1A1A1A]">{totalPending} items need attention</p>
            <p className="text-sm text-[#6B6B6B]">Review and take action below</p>
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div>
        <h3 className="font-semibold text-[#1A1A1A] mb-3">Recent Activity</h3>
        <div className="space-y-2">
          {activities.length === 0 ? (
            <div className="bg-[#F5F5F3] rounded-2xl p-8 text-center">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-[#6B6B6B]">No recent activity</p>
            </div>
          ) : (
            activities.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl p-4 border-l-4 border border-[#EBEBEB] ${getActivityColor(item.type, item.status)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{getActivityIcon(item.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-[#1A1A1A] text-sm">{item.title}</p>
                        <p className="text-xs text-[#6B6B6B] truncate">{item.description}</p>
                      </div>
                      <span className="text-xs text-[#9B9B9B] whitespace-nowrap">
                        {getRelativeTime(item.timestamp)}
                      </span>
                    </div>

                    {/* Quick action button for actionable items */}
                    {item.actionable ? (
                      <div className="mt-2 flex gap-2">
                        {item.type === 'cleaner_message' ? (
                          <button
                            onClick={() => handleAction(item)}
                            className="px-3 py-1.5 bg-[#9C27B0] text-white rounded-lg text-xs font-medium active:scale-95 transition-transform"
                          >
                            View & Reply
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleAction(item)}
                              className="px-3 py-1.5 bg-[#2E7D32] text-white rounded-lg text-xs font-medium active:scale-95 transition-transform"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                if (item.type === 'review') onTabChange('reviews')
                                else if (item.type === 'cleaner_signup') onTabChange('cleaners')
                                else if (item.type === 'booking') onTabChange('bookings')
                              }}
                              className="px-3 py-1.5 bg-white border border-[#DEDEDE] text-[#6B6B6B] rounded-lg text-xs font-medium active:scale-95 transition-transform"
                            >
                              View Details
                            </button>
                          </>
                        )}
                      </div>
                    ) : null}

                    {/* Meta info for bookings */}
                    {item.type === 'booking' && item.meta?.price ? (
                      <p className="mt-1 text-xs font-medium text-[#C4785A]">
                        €{item.meta.price as number}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
