'use client'

import { useState } from 'react'
import {
  AdminFeedItem,
  AdminCardType,
  FeedFilterState,
} from '@/lib/admin/card-types'
import {
  countByType,
  countUrgent,
} from '@/lib/admin/card-transformers'
import AdminCard from '../cards/AdminCard'
import AdminFeedFilters from './AdminFeedFilters'

interface Props {
  items: AdminFeedItem[]
  loading?: boolean
  error?: string | null
  lastUpdated?: Date | null
  isLive?: boolean
  onRefresh?: () => void
  onToggleLive?: () => void
  // Action handlers
  onApprove?: (id: string, type: AdminCardType) => Promise<void>
  onReject?: (id: string, type: AdminCardType) => Promise<void>
  onFeature?: (id: string) => Promise<void>
  onUnfeature?: (id: string) => Promise<void>
  onCancel?: (id: string, type: AdminCardType) => Promise<void>
  onLoginAs?: (userId: string, role: 'cleaner' | 'owner') => void
  onMessage?: (userId: string, type: 'cleaner' | 'owner', phone?: string) => void
  onEmail?: (email: string, name: string) => void
  onViewDetails?: (id: string, type: AdminCardType) => void
  onAddNote?: (id: string, type: 'cleaner' | 'owner') => void
  onResolveAlert?: (id: string) => Promise<void>
  onDismissAlert?: (id: string) => Promise<void>
}

export default function AdminFeed({
  items,
  loading = false,
  error = null,
  lastUpdated,
  isLive = true,
  onRefresh,
  onToggleLive,
  onApprove,
  onReject,
  onFeature,
  onUnfeature,
  onCancel,
  onLoginAs,
  onMessage,
  onEmail,
  onViewDetails,
  onAddNote,
  onResolveAlert,
  onDismissAlert,
}: Props) {
  const [filterState, setFilterState] = useState<FeedFilterState>({
    activeFilter: 'all',
    showAudit: false,
    showTestData: false,
  })

  // Filter items based on current filter state
  const filteredItems = items.filter((item) => {
    // Filter out test data if not showing
    if (!filterState.showTestData && item.isTest) return false

    // Filter out audit entries if not showing
    if (!filterState.showAudit && item.type === 'audit_entry') return false

    // Apply type filter
    if (filterState.activeFilter === 'all') return true
    if (filterState.activeFilter === 'urgent') return item.priority === 'urgent'
    if (filterState.activeFilter === 'bookings') return item.type.startsWith('booking_')
    if (filterState.activeFilter === 'cleaners') return item.type.startsWith('cleaner_')
    if (filterState.activeFilter === 'reviews') return item.type.startsWith('review_')
    if (filterState.activeFilter === 'owners') return item.type.startsWith('owner_')
    if (filterState.activeFilter === 'alerts') return item.type === 'system_alert'

    return true
  })

  // Calculate counts for filter badges
  const typeCounts = countByType(items.filter(i => filterState.showTestData || !i.isTest))
  const counts = {
    total: items.filter(i => filterState.showTestData || !i.isTest).length,
    urgent: countUrgent(items.filter(i => filterState.showTestData || !i.isTest)),
    bookings: (typeCounts['booking_pending'] || 0) + (typeCounts['booking_confirmed'] || 0) + (typeCounts['booking_completed'] || 0),
    cleaners: (typeCounts['cleaner_signup'] || 0) + (typeCounts['cleaner_login'] || 0),
    reviews: (typeCounts['review_pending'] || 0) + (typeCounts['review_approved'] || 0),
    owners: (typeCounts['owner_signup'] || 0) + (typeCounts['owner_dormant'] || 0),
    alerts: typeCounts['system_alert'] || 0,
  }

  // Format last updated time
  const formatLastUpdated = () => {
    if (!lastUpdated) return null
    const diffMs = Date.now() - lastUpdated.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    return lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Handle action wrapper (removes item from list on success)
  const handleApprove = async (id: string, type: AdminCardType) => {
    await onApprove?.(id, type)
  }

  const handleReject = async (id: string, type: AdminCardType) => {
    await onReject?.(id, type)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <button
            onClick={onToggleLive}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              isLive
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${
              isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            {isLive ? 'Live' : 'Paused'}
          </button>

          {/* Last updated */}
          {lastUpdated && (
            <span className="text-xs text-[#9B9B9B]">
              Updated {formatLastUpdated()}
            </span>
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F5F3] rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#EBEBEB] transition-colors disabled:opacity-50"
        >
          <span className={loading ? 'animate-spin' : ''}>↻</span>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <AdminFeedFilters
        filterState={filterState}
        onFilterChange={(filter) => setFilterState(prev => ({ ...prev, activeFilter: filter }))}
        onShowAuditChange={(show) => setFilterState(prev => ({ ...prev, showAudit: show }))}
        onShowTestDataChange={(show) => setFilterState(prev => ({ ...prev, showTestData: show }))}
        counts={counts}
      />

      {/* Error state */}
      {error && (
        <div className="bg-red-50 rounded-xl p-4 flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="text-sm font-medium text-red-700">Error loading feed</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
          <button
            onClick={onRefresh}
            className="ml-auto px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && items.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#EBEBEB]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#EBEBEB] rounded w-3/4" />
                  <div className="h-3 bg-[#EBEBEB] rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">
            {filterState.activeFilter === 'urgent' ? '✨' : '📭'}
          </p>
          <p className="text-lg font-medium text-[#1A1A1A] mb-1">
            {filterState.activeFilter === 'urgent'
              ? 'All caught up!'
              : 'No activity'}
          </p>
          <p className="text-sm text-[#6B6B6B]">
            {filterState.activeFilter === 'urgent'
              ? 'No urgent items need your attention'
              : filterState.activeFilter === 'all'
                ? 'Check back later for new activity'
                : `No ${filterState.activeFilter} to show`}
          </p>
        </div>
      )}

      {/* Feed items */}
      <div className="space-y-2">
        {filteredItems.map((item) => (
          <AdminCard
            key={item.id}
            item={item}
            onApprove={handleApprove}
            onReject={handleReject}
            onFeature={onFeature}
            onUnfeature={onUnfeature}
            onCancel={onCancel}
            onLoginAs={onLoginAs}
            onMessage={onMessage}
            onEmail={onEmail}
            onViewDetails={onViewDetails}
            onAddNote={onAddNote}
            onResolveAlert={onResolveAlert}
            onDismissAlert={onDismissAlert}
          />
        ))}
      </div>

      {/* Load more indicator */}
      {filteredItems.length > 0 && (
        <p className="text-center text-xs text-[#9B9B9B] py-4">
          Showing {filteredItems.length} items
        </p>
      )}
    </div>
  )
}
