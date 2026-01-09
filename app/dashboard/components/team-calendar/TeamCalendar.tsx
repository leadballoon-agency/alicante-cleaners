'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import WeekView from './WeekView'
import DayView from './DayView'
import ViewToggle from './ViewToggle'
import BookingCard, { BookingCardData } from './BookingCard'

export interface AvailabilitySlot {
  startTime: string
  endTime: string
  isAvailable: boolean
  source: 'GOOGLE_CALENDAR' | 'BOOKING' | 'MANUAL'
  bookingId?: string
  title?: string
}

export interface MemberAvailability {
  memberId: string
  memberName: string
  memberPhoto: string | null
  calendarSyncStatus: string
  lastSynced: Date | null
  availability: Record<string, AvailabilitySlot[]>
}

interface TeamCalendarData {
  team: {
    id: string
    name: string
    requireCalendarSync: boolean
  }
  members: MemberAvailability[]
  dateRange: {
    startDate: string
    endDate: string
  }
  errors?: Array<{
    memberId: string
    error: string
    lastSynced: Date | null
  }>
  partialData: boolean
}

interface BookingFromAPI {
  id: string
  status: string
  service: string
  price: number
  hours: number
  date: string
  time: string
  property: {
    id: string
    address: string
    bedrooms?: number
    accessNotes?: string | null
    accessNotesAvailable?: boolean
    accessNotesMessage?: string
  }
  owner: {
    id: string
    name: string
    phone?: string
    email?: string
    preferredLanguage?: string
  }
  cleanerId?: string
  cleanerName?: string
  cleanerPhoto?: string | null
}

type ViewMode = 'week' | 'day'
type SelectedView = 'me' | 'team' | string // 'me', 'team', or memberId

interface Props {
  teamId: string
  currentCleanerId?: string
  currentCleanerName?: string
  currentCleanerPhoto?: string | null
}

// Get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function TeamCalendar({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  teamId,
  currentCleanerId,
  currentCleanerName = 'You',
  currentCleanerPhoto
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [data, setData] = useState<TeamCalendarData | null>(null)
  const [bookings, setBookings] = useState<BookingFromAPI[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedView, setSelectedView] = useState<SelectedView>('me')

  // Week navigation
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = day === 0 ? -6 : 1 - day // Adjust to Monday
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff)
    monday.setHours(0, 0, 0, 0)
    return monday
  })

  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true)
      const endDate = new Date(weekStart)
      endDate.setDate(weekStart.getDate() + 6)

      const startDateStr = weekStart.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      // Fetch calendar and bookings in parallel
      const [calendarRes, bookingsRes] = await Promise.all([
        fetch(`/api/dashboard/cleaner/team/calendar?startDate=${startDateStr}&endDate=${endDateStr}`),
        fetch('/api/dashboard/cleaner/bookings')
      ])

      if (!calendarRes.ok) {
        const errorData = await calendarRes.json()
        throw new Error(errorData.error || 'Failed to fetch calendar')
      }

      const calendarData = await calendarRes.json()
      setData(calendarData)

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json()
        setBookings(bookingsData.bookings || [])
      }

      setError(null)
    } catch (err) {
      console.error('Error fetching team calendar:', err)
      setError(err instanceof Error ? err.message : 'Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => {
    fetchCalendarData()
  }, [fetchCalendarData])

  const handleSync = async () => {
    try {
      setSyncing(true)
      const res = await fetch('/api/dashboard/cleaner/team/calendar/sync', {
        method: 'POST',
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to sync calendars')
      }

      // Refresh data after sync
      await fetchCalendarData()
    } catch (err) {
      console.error('Error syncing calendars:', err)
      setError(err instanceof Error ? err.message : 'Failed to sync')
    } finally {
      setSyncing(false)
    }
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(weekStart)
    newWeekStart.setDate(weekStart.getDate() + (direction === 'next' ? 7 : -7))
    setWeekStart(newWeekStart)
  }

  const handleBookingAction = async (bookingId: string, action: 'accept' | 'decline' | 'complete') => {
    try {
      const res = await fetch(`/api/dashboard/cleaner/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (!res.ok) {
        throw new Error('Failed to update booking')
      }

      // Refresh bookings
      await fetchCalendarData()
    } catch (err) {
      console.error('Error updating booking:', err)
      setError(err instanceof Error ? err.message : 'Failed to update booking')
    }
  }

  const handleSendMessage = async (bookingId: string, message: string) => {
    // Find the booking to get the owner info
    const booking = bookings.find(b => b.id === bookingId)
    if (!booking?.owner?.id) {
      console.error('No owner found for booking')
      return
    }

    try {
      // First, get or create a conversation with the owner
      const convRes = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: booking.owner.id })
      })

      if (!convRes.ok) {
        throw new Error('Failed to create conversation')
      }

      const { conversationId } = await convRes.json()

      // Send the message
      const msgRes = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content: message
        })
      })

      if (!msgRes.ok) {
        throw new Error('Failed to send message')
      }

      // Could show a toast notification here
      console.log('Message sent:', message)
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
    }
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setViewMode('day')
  }

  // Filter members to only show synced calendars
  const syncedMembers = data?.members.filter(
    m => m.calendarSyncStatus !== 'NOT_CONNECTED' && m.calendarSyncStatus !== 'PENDING_SETUP'
  ) || []

  // Get members to display based on selected view
  const getDisplayMembers = (): MemberAvailability[] => {
    if (!data) return []

    if (selectedView === 'me') {
      // Find current user in members, or create a placeholder
      const currentMember = data.members.find(m => m.memberId === currentCleanerId)
      if (currentMember) {
        return [currentMember]
      }
      // If not in team, show empty
      return []
    }

    if (selectedView === 'team') {
      // Show all synced members
      return syncedMembers
    }

    // Show specific member
    const member = data.members.find(m => m.memberId === selectedView)
    return member ? [member] : []
  }

  // Get bookings to display based on selected view
  const getDisplayBookings = (): BookingCardData[] => {
    const endDate = new Date(weekStart)
    endDate.setDate(weekStart.getDate() + 6)

    // Filter bookings within the current week
    const weekBookings = bookings.filter(b => {
      const bookingDate = new Date(b.date)
      return bookingDate >= weekStart && bookingDate <= endDate
    })

    // Map to BookingCardData format
    return weekBookings.map(b => ({
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
      // Extended data for peek
      bedrooms: b.property.bedrooms,
      accessNotes: b.property.accessNotes || undefined,
      ownerName: b.owner.name,
      ownerPhone: b.owner.phone,
      ownerLanguage: b.owner.preferredLanguage || 'en',
    })).filter(b => {
      // Filter by selected view
      if (selectedView === 'me') {
        return b.memberId === currentCleanerId || !b.memberId
      }
      if (selectedView === 'team') {
        return true // Show all
      }
      return b.memberId === selectedView
    }).sort((a, b) => {
      // Sort by date then time
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime()
      if (dateCompare !== 0) return dateCompare
      return a.time.localeCompare(b.time)
    })
  }

  const displayMembers = getDisplayMembers()
  const displayBookings = getDisplayBookings()

  if (loading && !data) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-[#F5F5F3] rounded-xl w-3/4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-[#F5F5F3] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="bg-[#FFEBEE] rounded-2xl p-6 text-center">
        <span className="text-3xl mb-3 block">⚠️</span>
        <p className="font-medium text-[#C75050]">{error}</p>
        <button
          onClick={fetchCalendarData}
          className="mt-3 text-[#C4785A] font-medium hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-[#EBEBEB] text-center">
        <span className="text-4xl block mb-4">📅</span>
        <h3 className="font-medium text-[#1A1A1A] mb-2">Calendar</h3>
        <p className="text-sm text-[#6B6B6B]">
          Connect your Google Calendar to see availability
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Member selector tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2">
        {/* "My Calendar" tab */}
        <button
          onClick={() => setSelectedView('me')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            selectedView === 'me'
              ? 'bg-[#1A1A1A] text-white'
              : 'bg-white text-[#1A1A1A] border border-[#EBEBEB] hover:border-[#1A1A1A]'
          }`}
        >
          {currentCleanerPhoto ? (
            <div className="w-5 h-5 rounded-full overflow-hidden relative">
              <Image
                src={currentCleanerPhoto}
                alt={currentCleanerName}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-[#C4785A] text-white flex items-center justify-center text-[10px]">
              {getInitials(currentCleanerName)}
            </div>
          )}
          My Calendar
        </button>

        {/* Team tab (only if there are synced team members) */}
        {syncedMembers.length > 1 && (
          <button
            onClick={() => setSelectedView('team')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedView === 'team'
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-white text-[#1A1A1A] border border-[#EBEBEB] hover:border-[#1A1A1A]'
            }`}
          >
            <span className="text-sm">👥</span>
            Team ({syncedMembers.length})
          </button>
        )}

        {/* Individual team member tabs */}
        {syncedMembers
          .filter(m => m.memberId !== currentCleanerId)
          .map(member => (
            <button
              key={member.memberId}
              onClick={() => setSelectedView(member.memberId)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedView === member.memberId
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-white text-[#1A1A1A] border border-[#EBEBEB] hover:border-[#1A1A1A]'
              }`}
            >
              {member.memberPhoto ? (
                <div className="w-5 h-5 rounded-full overflow-hidden relative">
                  <Image
                    src={member.memberPhoto}
                    alt={member.memberName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#C4785A] text-white flex items-center justify-center text-[10px]">
                  {getInitials(member.memberName)}
                </div>
              )}
              {member.memberName.split(' ')[0]}
            </button>
          ))}
      </div>

      {/* Header with controls */}
      <div className="bg-white rounded-2xl p-4 border border-[#EBEBEB]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-[#F5F5F3] rounded-lg transition-colors"
              aria-label="Previous week"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-[#F5F5F3] rounded-lg transition-colors"
              aria-label="Next week"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <ViewToggle viewMode={viewMode} onChange={setViewMode} />
            <button
              onClick={handleSync}
              disabled={syncing}
              className="p-2 hover:bg-[#F5F5F3] rounded-lg transition-colors disabled:opacity-50"
              aria-label="Sync calendars"
            >
              <svg
                className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Partial data warning */}
        {data.partialData && (
          <div className="mt-3 bg-[#FFF8F5] p-3 rounded-lg flex items-center gap-2 text-sm">
            <span className="text-[#E65100]">⚠️</span>
            <span className="text-[#1A1A1A]">
              Some calendars couldn&apos;t sync. Showing last known availability.
            </span>
            <button
              onClick={handleSync}
              className="text-[#C4785A] font-medium hover:underline ml-auto"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Calendar view */}
      {displayMembers.length > 0 ? (
        viewMode === 'week' ? (
          <WeekView
            members={displayMembers}
            weekStart={weekStart}
            onDateClick={handleDateClick}
            selectedDate={selectedDate}
          />
        ) : (
          <DayView
            members={displayMembers}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onBackToWeek={() => setViewMode('week')}
          />
        )
      ) : (
        <div className="bg-white rounded-2xl p-8 border border-[#EBEBEB] text-center">
          <span className="text-4xl block mb-4">📅</span>
          <h3 className="font-medium text-[#1A1A1A] mb-2">No synced calendar</h3>
          <p className="text-sm text-[#6B6B6B]">
            Connect your Google Calendar in Profile to see availability
          </p>
        </div>
      )}

      {/* Legend - simplified */}
      <div className="flex items-center justify-center gap-4 text-xs text-[#6B6B6B]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#E8F5E9] border border-[#2E7D32]" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#E3F2FD] border border-[#1565C0]" />
          <span>Booking</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#FFEBEE] border border-[#C75050]" />
          <span>Busy</span>
        </div>
      </div>

      {/* Booking Cards Section */}
      {displayBookings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[#6B6B6B] px-1">
            {selectedView === 'team' ? 'Team Jobs' : 'Upcoming Jobs'} ({displayBookings.length})
          </h3>
          {displayBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onAccept={booking.status.toLowerCase() === 'pending' ? (id) => handleBookingAction(id, 'accept') : undefined}
              onDecline={booking.status.toLowerCase() === 'pending' ? (id) => handleBookingAction(id, 'decline') : undefined}
              onComplete={booking.status.toLowerCase() === 'confirmed' ? (id) => handleBookingAction(id, 'complete') : undefined}
              onSendMessage={handleSendMessage}
              cleanerName={currentCleanerName}
            />
          ))}
        </div>
      )}

      {/* Empty state for bookings */}
      {displayBookings.length === 0 && displayMembers.length > 0 && (
        <div className="bg-[#F5F5F3] rounded-2xl p-6 text-center">
          <p className="text-sm text-[#6B6B6B]">No jobs scheduled this week</p>
        </div>
      )}
    </div>
  )
}
