'use client'

import { useState, useMemo } from 'react'
import OwnerBookingCard, { OwnerBookingCardData } from './OwnerBookingCard'
import NewBookingCard from './NewBookingCard'

interface Props {
  bookings: OwnerBookingCardData[]
  filter?: 'upcoming' | 'past' | 'all'
  showNewBookingCard?: boolean
  hasExistingBookings?: boolean
  onBookingClick?: (bookingId: string) => void
  onMessage?: (bookingId: string) => void
  onReschedule?: (bookingId: string) => void
  onCancel?: (bookingId: string) => void
  onReview?: (bookingId: string) => void
  onBookAgain?: (bookingId: string, cleanerSlug: string) => void
  onMakeRecurring?: (bookingId: string) => void
  onRebook?: (bookingId: string) => void
  onNewBooking?: () => void
}

// Group bookings by date
interface DateGroup {
  dateKey: string
  dateLabel: string
  bookings: OwnerBookingCardData[]
}

// Format date for grouping header
const formatDateHeader = (dateStr: string): string => {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Reset times for comparison
  today.setHours(0, 0, 0, 0)
  tomorrow.setHours(0, 0, 0, 0)
  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)

  if (compareDate.getTime() === today.getTime()) {
    return 'Today'
  }
  if (compareDate.getTime() === tomorrow.getTime()) {
    return 'Tomorrow'
  }

  // If within next 7 days, show weekday
  const daysUntil = Math.ceil((compareDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (daysUntil > 0 && daysUntil <= 7) {
    return date.toLocaleDateString('en-GB', { weekday: 'long' })
  }

  // Otherwise show full date
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

// Get date key for grouping (YYYY-MM-DD)
const getDateKey = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toISOString().split('T')[0]
}

// Check if date is in the past
const isDatePast = (dateStr: string): boolean => {
  const date = new Date(dateStr)
  const today = new Date()
  date.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return date < today
}

// Check if date is today or future
const isDateUpcoming = (dateStr: string): boolean => {
  const date = new Date(dateStr)
  const today = new Date()
  date.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return date >= today
}

export default function OwnerJobsTimeline({
  bookings,
  filter = 'upcoming',
  showNewBookingCard = true,
  hasExistingBookings = false,
  onBookingClick,
  onMessage,
  onReschedule,
  onCancel,
  onReview,
  onBookAgain,
  onMakeRecurring,
  onRebook,
  onNewBooking
}: Props) {
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'past' | 'all'>(filter)

  // Filter and group bookings
  const dateGroups = useMemo(() => {
    // Filter based on active filter
    let filtered = bookings
    if (activeFilter === 'upcoming') {
      filtered = bookings.filter(b => isDateUpcoming(b.date))
    } else if (activeFilter === 'past') {
      filtered = bookings.filter(b => isDatePast(b.date))
    }

    // Group by date
    const groups = new Map<string, OwnerBookingCardData[]>()
    filtered.forEach(booking => {
      const key = getDateKey(booking.date)
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(booking)
    })

    // Convert to array and sort
    const sortedGroups: DateGroup[] = Array.from(groups.entries())
      .map(([dateKey, bookings]) => ({
        dateKey,
        dateLabel: formatDateHeader(bookings[0].date),
        bookings: bookings.sort((a, b) => {
          // Sort by time within same date
          const timeA = a.time.split(':').map(Number)
          const timeB = b.time.split(':').map(Number)
          return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1])
        })
      }))
      .sort((a, b) => {
        // For upcoming, sort ascending (nearest first)
        // For past, sort descending (most recent first)
        const dateA = new Date(a.dateKey)
        const dateB = new Date(b.dateKey)
        if (activeFilter === 'past') {
          return dateB.getTime() - dateA.getTime()
        }
        return dateA.getTime() - dateB.getTime()
      })

    return sortedGroups
  }, [bookings, activeFilter])

  const upcomingCount = useMemo(() => bookings.filter(b => isDateUpcoming(b.date)).length, [bookings])
  const pastCount = useMemo(() => bookings.filter(b => isDatePast(b.date)).length, [bookings])

  return (
    <div className="space-y-4">
      {/* Filter tabs - only show if we have bookings in both categories or in 'all' mode */}
      {(upcomingCount > 0 && pastCount > 0) || filter === 'all' ? (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveFilter('upcoming')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'upcoming'
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-[#F5F5F3] text-[#6B6B6B] hover:bg-[#EBEBEB]'
            }`}
          >
            Upcoming {upcomingCount > 0 && `(${upcomingCount})`}
          </button>
          <button
            onClick={() => setActiveFilter('past')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === 'past'
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-[#F5F5F3] text-[#6B6B6B] hover:bg-[#EBEBEB]'
            }`}
          >
            Past {pastCount > 0 && `(${pastCount})`}
          </button>
          {filter === 'all' && (
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-[#F5F5F3] text-[#6B6B6B] hover:bg-[#EBEBEB]'
              }`}
            >
              All ({bookings.length})
            </button>
          )}
        </div>
      ) : null}

      {/* New booking card at top for upcoming view */}
      {showNewBookingCard && activeFilter !== 'past' && onNewBooking && (
        <NewBookingCard
          hasExistingBookings={hasExistingBookings}
          onClick={onNewBooking}
        />
      )}

      {/* Timeline */}
      {dateGroups.length > 0 ? (
        <div className="space-y-6">
          {dateGroups.map(group => (
            <div key={group.dateKey}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#C4785A]" />
                <h3 className="text-sm font-semibold text-[#1A1A1A]">{group.dateLabel}</h3>
                <div className="flex-1 h-px bg-[#EBEBEB]" />
              </div>

              {/* Bookings for this date */}
              <div className="space-y-3 pl-4 ml-0.5 border-l-2 border-[#EBEBEB]">
                {group.bookings.map(booking => (
                  <OwnerBookingCard
                    key={booking.id}
                    booking={booking}
                    onClick={() => onBookingClick?.(booking.id)}
                    onMessage={onMessage}
                    onReschedule={onReschedule}
                    onCancel={onCancel}
                    onReview={onReview}
                    onBookAgain={onBookAgain}
                    onMakeRecurring={onMakeRecurring}
                    onRebook={onRebook}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="bg-white rounded-2xl p-8 border border-[#EBEBEB] text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#F5F5F3] rounded-full flex items-center justify-center">
            <span className="text-2xl">
              {activeFilter === 'past' ? '📋' : '✨'}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
            {activeFilter === 'past'
              ? 'No past bookings'
              : 'No upcoming bookings'}
          </h3>
          <p className="text-sm text-[#6B6B6B] mb-4">
            {activeFilter === 'past'
              ? 'Your completed bookings will appear here.'
              : 'Book a clean to keep your villa spotless!'}
          </p>
          {activeFilter !== 'past' && onNewBooking && (
            <button
              onClick={onNewBooking}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white rounded-xl font-medium hover:bg-[#333] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Book a Clean
            </button>
          )}
        </div>
      )}
    </div>
  )
}
