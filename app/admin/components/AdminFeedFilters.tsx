'use client'

import { FeedFilter, FeedFilterState } from '@/lib/admin/card-types'

interface Props {
  filterState: FeedFilterState
  onFilterChange: (filter: FeedFilter) => void
  onShowAuditChange: (show: boolean) => void
  onShowTestDataChange: (show: boolean) => void
  counts?: {
    total: number
    urgent: number
    bookings?: number
    cleaners?: number
    reviews?: number
    owners?: number
    alerts?: number
  }
}

const FILTER_CHIPS: {
  id: FeedFilter
  label: string
  icon?: string
  color?: string
}[] = [
  { id: 'all', label: 'All' },
  { id: 'urgent', label: 'Urgent', icon: '⚡', color: '#E65100' },
  { id: 'bookings', label: 'Bookings', icon: '📅' },
  { id: 'cleaners', label: 'Cleaners', icon: '🧹' },
  { id: 'reviews', label: 'Reviews', icon: '⭐' },
  { id: 'owners', label: 'Owners', icon: '🏠' },
  { id: 'alerts', label: 'Alerts', icon: '🚨' },
]

export default function AdminFeedFilters({
  filterState,
  onFilterChange,
  onShowAuditChange,
  onShowTestDataChange,
  counts,
}: Props) {
  return (
    <div className="sticky top-0 z-10 bg-[#FAFAF8] pt-4 pb-2 -mx-4 px-4">
      {/* Main filter chips - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {FILTER_CHIPS.map((chip) => {
          const isActive = filterState.activeFilter === chip.id
          const count = chip.id === 'all' ? counts?.total :
                        chip.id === 'urgent' ? counts?.urgent :
                        chip.id === 'bookings' ? counts?.bookings :
                        chip.id === 'cleaners' ? counts?.cleaners :
                        chip.id === 'reviews' ? counts?.reviews :
                        chip.id === 'owners' ? counts?.owners :
                        chip.id === 'alerts' ? counts?.alerts : undefined

          return (
            <button
              key={chip.id}
              onClick={() => onFilterChange(chip.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-white text-[#6B6B6B] border border-[#EBEBEB] hover:border-[#1A1A1A]'
              }`}
              style={isActive && chip.color ? { backgroundColor: chip.color } : undefined}
            >
              {chip.icon && <span className="text-sm">{chip.icon}</span>}
              <span>{chip.label}</span>
              {count !== undefined && count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#F5F5F3] text-[#6B6B6B]'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Secondary toggles */}
      <div className="flex items-center gap-4 mt-2 text-xs">
        <label className="flex items-center gap-1.5 text-[#6B6B6B] cursor-pointer">
          <input
            type="checkbox"
            checked={filterState.showAudit}
            onChange={(e) => onShowAuditChange(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-[#DEDEDE] text-[#1A1A1A] focus:ring-[#1A1A1A] cursor-pointer"
          />
          <span className="flex items-center gap-1">
            <span>📜</span> Show Audit Log
          </span>
        </label>

        <label className="flex items-center gap-1.5 text-[#6B6B6B] cursor-pointer">
          <input
            type="checkbox"
            checked={filterState.showTestData}
            onChange={(e) => onShowTestDataChange(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-[#DEDEDE] text-[#1A1A1A] focus:ring-[#1A1A1A] cursor-pointer"
          />
          <span className="flex items-center gap-1">
            <span>🧪</span> Show Test Data
          </span>
        </label>
      </div>
    </div>
  )
}
