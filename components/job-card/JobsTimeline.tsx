'use client'

import { useMemo, useState } from 'react'
import JobCard from './JobCard'
import NewBookingCard from './NewBookingCard'
import { BookingCardData, JobCardContext } from './types'

interface Props {
  bookings: BookingCardData[]
  context: JobCardContext
  filter?: 'upcoming' | 'past' | 'all'
  showNewBookingCard?: boolean
  hasExistingBookings?: boolean
  loading?: boolean
  error?: string | null
  // Owner actions
  onMessage?: (bookingId: string) => void
  onAddInstructions?: (bookingId: string) => void
  onAddAccess?: (bookingId: string) => void
  onAdjustTime?: (bookingId: string) => void
  onCancel?: (bookingId: string) => void
  onReview?: (bookingId: string) => void
  onBookAgain?: (bookingId: string, cleanerSlug: string) => void
  onMakeRecurring?: (bookingId: string) => void
  onRebook?: (bookingId: string) => void
  onNewBooking?: () => void
  // Cleaner actions
  onAccept?: (bookingId: string) => void
  onDecline?: (bookingId: string) => void
  onComplete?: (bookingId: string) => void
  onSendMessage?: (bookingId: string, message: string) => void
  onRetry?: () => void
  // Cleaner context
  cleanerName?: string
}

// Group bookings by date
interface DateGroup {
  dateKey: string
  dateLabel: string
  day: string
  month: string
  isToday: boolean
  isTomorrow: boolean
  bookings: BookingCardData[]
}

// Format date for grouping header
const formatDateHeader = (dateStr: string): { label: string; day: string; month: string; isToday: boolean; isTomorrow: boolean } => {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Reset times for comparison
  today.setHours(0, 0, 0, 0)
  tomorrow.setHours(0, 0, 0, 0)
  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)

  const isToday = compareDate.getTime() === today.getTime()
  const isTomorrow = compareDate.getTime() === tomorrow.getTime()

  let label: string
  if (isToday) {
    label = 'Today'
  } else if (isTomorrow) {
    label = 'Tomorrow'
  } else {
    // If within next 7 days, show weekday
    const daysUntil = Math.ceil((compareDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntil > 0 && daysUntil <= 7) {
      label = date.toLocaleDateString('en-GB', { weekday: 'long' })
    } else {
      label = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    }
  }

  return {
    label,
    day: date.getDate().toString(),
    month: date.toLocaleDateString('en-GB', { month: 'short' }),
    isToday,
    isTomorrow
  }
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

export default function JobsTimeline({
  bookings,
  context,
  filter = 'upcoming',
  showNewBookingCard = false,
  hasExistingBookings = false,
  loading = false,
  error = null,
  onMessage,
  onAddInstructions,
  onAddAccess,
  onAdjustTime,
  onCancel,
  onReview,
  onBookAgain,
  onMakeRecurring,
  onRebook,
  onNewBooking,
  onAccept,
  onDecline,
  onComplete,
  onSendMessage,
  onRetry,
  cleanerName
}: Props) {
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'past' | 'all'>(filter)

  // Filter and group bookings
  const dateGroups = useMemo(() => {
    // Filter based on active filter and status
    let filtered = bookings
    if (activeFilter === 'upcoming') {
      filtered = bookings.filter(b => isDateUpcoming(b.date) && b.status !== 'completed' && b.status !== 'cancelled')
    } else if (activeFilter === 'past') {
      filtered = bookings.filter(b => isDatePast(b.date) || b.status === 'completed' || b.status === 'cancelled')
    }

    // Group by date
    const groups = new Map<string, BookingCardData[]>()
    filtered.forEach(booking => {
      const key = getDateKey(booking.date)
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(booking)
    })

    // Convert to array and sort
    const sortedGroups: DateGroup[] = Array.from(groups.entries())
      .map(([dateKey, groupBookings]) => {
        const { label, day, month, isToday, isTomorrow } = formatDateHeader(groupBookings[0].date)
        return {
          dateKey,
          dateLabel: label,
          day,
          month,
          isToday,
          isTomorrow,
          bookings: groupBookings.sort((a, b) => {
            // Sort by time within same date
            const timeA = a.time.split(':').map(Number)
            const timeB = b.time.split(':').map(Number)
            return (timeA[0] * 60 + (timeA[1] || 0)) - (timeB[0] * 60 + (timeB[1] || 0))
          })
        }
      })
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

  const upcomingCount = useMemo(
    () => bookings.filter(b => isDateUpcoming(b.date) && b.status !== 'completed' && b.status !== 'cancelled').length,
    [bookings]
  )
  const pastCount = useMemo(
    () => bookings.filter(b => isDatePast(b.date) || b.status === 'completed' || b.status === 'cancelled').length,
    [bookings]
  )

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-[#F5F5F3] rounded-xl w-48 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-[#EBEBEB] animate-pulse">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-full bg-[#F5F5F3]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#F5F5F3] rounded w-3/4" />
                <div className="h-3 bg-[#F5F5F3] rounded w-1/2" />
                <div className="h-3 bg-[#F5F5F3] rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-[#FFEBEE] rounded-2xl p-6 text-center">
        <span className="text-3xl mb-3 block">⚠️</span>
        <p className="font-medium text-[#C75050]">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 text-[#C4785A] font-medium hover:underline"
          >
            Try again
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs - show if we have bookings in both categories */}
      {(upcomingCount > 0 && pastCount > 0) || filter === 'all' ? (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveFilter('upcoming')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === 'upcoming'
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-white text-[#1A1A1A] border border-[#EBEBEB] hover:border-[#1A1A1A]'
            }`}
          >
            Upcoming {upcomingCount > 0 && `(${upcomingCount})`}
          </button>
          <button
            onClick={() => setActiveFilter('past')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === 'past'
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-white text-[#1A1A1A] border border-[#EBEBEB] hover:border-[#1A1A1A]'
            }`}
          >
            Past {pastCount > 0 && `(${pastCount})`}
          </button>
          {filter === 'all' && (
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeFilter === 'all'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-white text-[#1A1A1A] border border-[#EBEBEB] hover:border-[#1A1A1A]'
              }`}
            >
              All ({bookings.length})
            </button>
          )}

          {/* Quick stats for cleaner context */}
          {context === 'cleaner' && dateGroups.reduce((sum, g) => sum + g.bookings.length, 0) > 0 && (
            <span className="ml-auto text-sm text-[#6B6B6B] self-center">
              {dateGroups.reduce((sum, g) => sum + g.bookings.length, 0)} jobs
            </span>
          )}
        </div>
      ) : null}

      {/* New booking card at top for owner context (upcoming view) */}
      {showNewBookingCard && context === 'owner' && activeFilter !== 'past' && onNewBooking && (
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
              {/* Date header with calendar box */}
              <div className="flex items-center gap-3 mb-3 px-1">
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${
                  group.isToday
                    ? 'bg-[#C4785A] text-white'
                    : group.isTomorrow
                    ? 'bg-[#1A1A1A] text-white'
                    : 'bg-[#F5F5F3] text-[#1A1A1A]'
                }`}>
                  <span className="text-lg font-bold leading-none">{group.day}</span>
                  <span className="text-[10px] uppercase leading-none mt-0.5">{group.month}</span>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${
                    group.isToday || group.isTomorrow ? 'text-[#1A1A1A]' : 'text-[#6B6B6B]'
                  }`}>
                    {group.dateLabel}
                  </p>
                  <p className="text-xs text-[#9B9B9B]">
                    {group.bookings.length} {group.bookings.length !== 1 ? 'jobs' : 'job'}
                  </p>
                </div>
              </div>

              {/* Bookings for this date */}
              <div className="space-y-2 pl-2 border-l-2 border-[#EBEBEB] ml-6">
                {group.bookings.map(booking => (
                  <JobCard
                    key={booking.id}
                    booking={booking}
                    context={context}
                    // Owner actions
                    onMessage={onMessage}
                    onAddInstructions={onAddInstructions}
                    onAddAccess={onAddAccess}
                    onAdjustTime={onAdjustTime}
                    onCancel={onCancel}
                    onReview={onReview}
                    onBookAgain={onBookAgain}
                    onMakeRecurring={onMakeRecurring}
                    onRebook={onRebook}
                    // Cleaner actions
                    onAccept={onAccept}
                    onDecline={onDecline}
                    onComplete={onComplete}
                    onSendMessage={onSendMessage}
                    cleanerName={cleanerName}
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
              : context === 'cleaner'
              ? 'No upcoming jobs'
              : 'No upcoming bookings'}
          </h3>
          <p className="text-sm text-[#6B6B6B] mb-4">
            {activeFilter === 'past'
              ? context === 'cleaner'
                ? 'Jobs will appear here when completed.'
                : 'Your completed bookings will appear here.'
              : context === 'cleaner'
              ? 'Your schedule is clear - enjoy the break!'
              : 'Book a clean to keep your villa spotless!'}
          </p>
          {activeFilter !== 'past' && context === 'owner' && onNewBooking && (
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
