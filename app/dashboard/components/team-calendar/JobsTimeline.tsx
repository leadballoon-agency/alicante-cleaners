'use client'

import { useState, useEffect, useCallback } from 'react'
import BookingCard, { BookingCardData } from './BookingCard'

interface BookingFromAPI {
  id: string
  status: string
  service: string
  price: number
  hours: number
  date: string
  time: string
  property: {
    address: string
    bedrooms?: number
    accessNotes?: string | null
    accessNotesAvailable?: boolean
    accessNotesMessage?: string
    keyHolderName?: string | null
    keyHolderPhone?: string | null
  }
  owner?: {
    name: string
    phone?: string
  }
  cleanerId?: string
  cleanerName?: string
  cleanerPhoto?: string | null
}

interface Props {
  currentCleanerId?: string
  currentCleanerName?: string
  currentCleanerPhoto?: string | null
}

// Format date header
const formatDateHeader = (dateStr: string): { day: string; weekday: string; isToday: boolean; isTomorrow: boolean } => {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const isToday = date.toDateString() === today.toDateString()
  const isTomorrow = date.toDateString() === tomorrow.toDateString()

  let weekday: string
  if (isToday) {
    weekday = 'Today'
  } else if (isTomorrow) {
    weekday = 'Tomorrow'
  } else {
    // Show "Friday 9th" style for dates within 7 days, otherwise "Fri 9 Jan"
    const daysAway = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysAway <= 7) {
      weekday = date.toLocaleDateString('en-GB', { weekday: 'long' })
    } else {
      weekday = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    }
  }

  return {
    day: date.getDate().toString(),
    weekday,
    isToday,
    isTomorrow
  }
}

// Normalize date to YYYY-MM-DD format (preserving local date)
const normalizeDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  // Use local date components to avoid timezone issues
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Group bookings by date
const groupByDate = (bookings: BookingCardData[]): Map<string, BookingCardData[]> => {
  const groups = new Map<string, BookingCardData[]>()

  bookings.forEach(booking => {
    const dateKey = normalizeDate(booking.date)
    if (!groups.has(dateKey)) {
      groups.set(dateKey, [])
    }
    groups.get(dateKey)!.push(booking)
  })

  // Sort each group by time
  groups.forEach((dayBookings) => {
    dayBookings.sort((a, b) => a.time.localeCompare(b.time))
  })

  return groups
}

export default function JobsTimeline({
  currentCleanerId,
  currentCleanerName = 'You',
  currentCleanerPhoto
}: Props) {
  const [bookings, setBookings] = useState<BookingFromAPI[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'upcoming' | 'all'>('upcoming')

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/dashboard/cleaner/bookings')

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to fetch bookings')
      }

      const data = await res.json()
      setBookings(data.bookings || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Action handlers for booking cards
  const handleAccept = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/dashboard/cleaner/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' })
      })
      if (res.ok) {
        fetchBookings() // Refresh the list
      }
    } catch (err) {
      console.error('Failed to accept booking:', err)
    }
  }

  const handleDecline = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/dashboard/cleaner/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline' })
      })
      if (res.ok) {
        fetchBookings()
      }
    } catch (err) {
      console.error('Failed to decline booking:', err)
    }
  }

  const handleComplete = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/dashboard/cleaner/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' })
      })
      if (res.ok) {
        fetchBookings()
      }
    } catch (err) {
      console.error('Failed to complete booking:', err)
    }
  }

  const handleSendMessage = async (bookingId: string, message: string) => {
    // Find the booking to get owner info
    const booking = bookings.find(b => b.id === bookingId)
    if (!booking) return

    try {
      // This would send via the messages API - for now just log
      console.log('Send message for booking:', bookingId, message)
      // TODO: Implement actual message sending
      // await fetch('/api/messages', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ bookingId, message })
      // })
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  // Convert to card data and filter
  const getDisplayBookings = (): BookingCardData[] => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return bookings
      .map(b => ({
        id: b.id,
        date: b.date,
        time: b.time,
        service: b.service,
        hours: b.hours,
        price: b.price,
        status: b.status,
        propertyAddress: b.property.address,
        memberName: b.cleanerName || currentCleanerName,
        memberPhoto: b.cleanerPhoto ?? currentCleanerPhoto ?? null,
        memberId: b.cleanerId || currentCleanerId || '',
        // Extended data for peek modal
        ownerName: b.owner?.name,
        ownerPhone: b.owner?.phone,
        accessNotes: b.property.accessNotes,
        bedrooms: b.property.bedrooms,
        keyHolderName: b.property.keyHolderName,
        keyHolderPhone: b.property.keyHolderPhone
      }))
      .filter(b => {
        if (filter === 'upcoming') {
          const bookingDate = new Date(b.date)
          return bookingDate >= today && b.status !== 'completed' && b.status !== 'cancelled'
        }
        return true
      })
      .sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime()
        if (dateCompare !== 0) return dateCompare
        return a.time.localeCompare(b.time)
      })
  }

  const displayBookings = getDisplayBookings()
  const groupedBookings = groupByDate(displayBookings)
  const sortedDates = Array.from(groupedBookings.keys()).sort()

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

  if (error) {
    return (
      <div className="bg-[#FFEBEE] rounded-2xl p-6 text-center">
        <span className="text-3xl mb-3 block">⚠️</span>
        <p className="font-medium text-[#C75050]">{error}</p>
        <button
          onClick={fetchBookings}
          className="mt-3 text-[#C4785A] font-medium hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filter === 'upcoming'
              ? 'bg-[#1A1A1A] text-white'
              : 'bg-white text-[#1A1A1A] border border-[#EBEBEB] hover:border-[#1A1A1A]'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filter === 'all'
              ? 'bg-[#1A1A1A] text-white'
              : 'bg-white text-[#1A1A1A] border border-[#EBEBEB] hover:border-[#1A1A1A]'
          }`}
        >
          All Jobs
        </button>

        {/* Quick stats */}
        {displayBookings.length > 0 && (
          <span className="ml-auto text-sm text-[#6B6B6B]">
            {displayBookings.length} job{displayBookings.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Jobs grouped by date */}
      {sortedDates.length > 0 ? (
        <div className="space-y-6">
          {sortedDates.map(dateStr => {
            const dayBookings = groupedBookings.get(dateStr)!
            const { day, weekday, isToday, isTomorrow } = formatDateHeader(dateStr)

            return (
              <div key={dateStr} className="space-y-3">
                {/* Date header */}
                <div className="flex items-center gap-3 px-1">
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${
                    isToday
                      ? 'bg-[#C4785A] text-white'
                      : isTomorrow
                      ? 'bg-[#1A1A1A] text-white'
                      : 'bg-[#F5F5F3] text-[#1A1A1A]'
                  }`}>
                    <span className="text-lg font-bold leading-none">{day}</span>
                    <span className="text-[10px] uppercase leading-none mt-0.5">
                      {new Date(dateStr).toLocaleDateString('en-GB', { month: 'short' })}
                    </span>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${
                      isToday || isTomorrow ? 'text-[#1A1A1A]' : 'text-[#6B6B6B]'
                    }`}>
                      {weekday}
                    </p>
                    <p className="text-xs text-[#9B9B9B]">
                      {dayBookings.length} job{dayBookings.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Day's bookings */}
                <div className="space-y-2 pl-2 border-l-2 border-[#EBEBEB] ml-6">
                  {dayBookings.map(booking => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onClick={() => {
                        console.log('View booking:', booking.id)
                      }}
                      onAccept={handleAccept}
                      onDecline={handleDecline}
                      onComplete={handleComplete}
                      onSendMessage={handleSendMessage}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 border border-[#EBEBEB] text-center">
          <span className="text-4xl block mb-4">✨</span>
          <h3 className="font-medium text-[#1A1A1A] mb-2">
            {filter === 'upcoming' ? 'No upcoming jobs' : 'No jobs yet'}
          </h3>
          <p className="text-sm text-[#6B6B6B]">
            {filter === 'upcoming'
              ? 'Your schedule is clear - enjoy the break!'
              : 'Jobs will appear here when you receive bookings'
            }
          </p>
        </div>
      )}
    </div>
  )
}
