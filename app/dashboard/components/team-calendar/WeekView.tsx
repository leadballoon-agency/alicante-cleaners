'use client'

import Image from 'next/image'
import { MemberAvailability } from './TeamCalendar'

interface Props {
  members: MemberAvailability[]
  weekStart: Date
  onDateClick: (date: Date) => void
  selectedDate: Date
}

type DayStatus = 'available' | 'partial' | 'busy' | 'not_synced'

export default function WeekView({ members, weekStart, onDateClick, selectedDate }: Props) {
  // Generate 7 days starting from weekStart
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    return date
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    )
  }

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  const formatDayNumber = (date: Date) => {
    return date.getDate()
  }

  // Calculate day status for a member
  const getDayStatus = (
    member: MemberAvailability,
    date: Date
  ): DayStatus => {
    const dateStr = date.toISOString().split('T')[0]
    const slots = member.availability[dateStr] || []

    // If not synced, show that status
    if (member.calendarSyncStatus === 'NOT_CONNECTED' || member.calendarSyncStatus === 'PENDING_SETUP') {
      return 'not_synced'
    }

    if (slots.length === 0) {
      return 'available'
    }

    // Count busy hours (rough estimate based on slots)
    const busySlots = slots.filter((s) => !s.isAvailable)
    if (busySlots.length === 0) {
      return 'available'
    }

    // Calculate total busy hours
    let totalBusyHours = 0
    for (const slot of busySlots) {
      const [startH, startM] = slot.startTime.split(':').map(Number)
      const [endH, endM] = slot.endTime.split(':').map(Number)
      const hours = endH - startH + (endM - startM) / 60
      totalBusyHours += hours
    }

    // Working day is roughly 8-18 (10 hours)
    if (totalBusyHours >= 8) {
      return 'busy'
    }
    return 'partial'
  }

  // Get status color classes
  const getStatusClasses = (status: DayStatus): string => {
    switch (status) {
      case 'available':
        return 'bg-[#E8F5E9] border-[#2E7D32]'
      case 'partial':
        return 'bg-[#FFF3E0] border-[#E65100]'
      case 'busy':
        return 'bg-[#FFEBEE] border-[#C75050]'
      case 'not_synced':
        return 'bg-[#F5F5F5] border-[#9B9B9B]'
    }
  }

  // Get booking count for a member on a day
  const getBookingCount = (member: MemberAvailability, date: Date): number => {
    const dateStr = date.toISOString().split('T')[0]
    const slots = member.availability[dateStr] || []
    return slots.filter((s) => s.source === 'BOOKING').length
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

  return (
    <div className="bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden">
      {/* Header row with days */}
      <div className={`grid border-b border-[#EBEBEB] ${members.length === 1 ? 'grid-cols-7' : 'grid-cols-8'}`}>
        {members.length > 1 && (
          <div className="p-3 bg-[#F5F5F3] border-r border-[#EBEBEB]">
            <span className="text-xs font-medium text-[#6B6B6B]">Team</span>
          </div>
        )}
        {weekDays.map((date) => {
          const isToday = isSameDay(date, today)
          const isSelected = isSameDay(date, selectedDate)

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateClick(date)}
              className={`p-2 text-center border-r border-[#EBEBEB] last:border-r-0 hover:bg-[#F5F5F3] transition-colors ${
                isSelected ? 'bg-[#F5F5F3]' : ''
              }`}
            >
              <p className="text-xs text-[#6B6B6B]">{formatDayName(date)}</p>
              <p
                className={`text-lg font-semibold ${
                  isToday ? 'text-[#C4785A]' : 'text-[#1A1A1A]'
                }`}
              >
                {formatDayNumber(date)}
              </p>
            </button>
          )
        })}
      </div>

      {/* Member rows */}
      {members.map((member) => (
        <div
          key={member.memberId}
          className="grid grid-cols-8 border-b border-[#EBEBEB] last:border-b-0"
        >
          {/* Member info */}
          <div className="p-3 border-r border-[#EBEBEB] flex items-center gap-2">
            {member.memberPhoto ? (
              <div className="w-8 h-8 rounded-full overflow-hidden relative flex-shrink-0">
                <Image
                  src={member.memberPhoto}
                  alt={member.memberName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#C4785A] text-white flex items-center justify-center text-xs font-medium">
                {getInitials(member.memberName)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1A1A1A] truncate">
                {member.memberName}
              </p>
              {member.calendarSyncStatus === 'NOT_CONNECTED' && (
                <p className="text-xs text-[#9B9B9B]">Not synced</p>
              )}
            </div>
          </div>

          {/* Day cells */}
          {weekDays.map((date) => {
            const status = getDayStatus(member, date)
            const bookingCount = getBookingCount(member, date)

            return (
              <button
                key={date.toISOString()}
                onClick={() => onDateClick(date)}
                className="p-2 border-r border-[#EBEBEB] last:border-r-0 hover:bg-[#F5F5F3] transition-colors"
              >
                <div
                  className={`h-10 rounded-lg border flex items-center justify-center ${getStatusClasses(
                    status
                  )}`}
                >
                  {bookingCount > 0 && (
                    <span className="text-xs font-medium text-[#1565C0]">
                      {bookingCount}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      ))}

      {/* Coverage summary row */}
      <div className="grid grid-cols-8 bg-[#F5F5F3]">
        <div className="p-3 border-r border-[#EBEBEB]">
          <span className="text-xs font-medium text-[#6B6B6B]">Coverage</span>
        </div>
        {weekDays.map((date) => {
          const availableCount = members.filter((m) => {
            const status = getDayStatus(m, date)
            return status === 'available' || status === 'partial'
          }).length
          const totalCount = members.length
          const allAvailable = availableCount === totalCount

          return (
            <div
              key={date.toISOString()}
              className="p-2 border-r border-[#EBEBEB] last:border-r-0 text-center"
            >
              <span
                className={`text-sm font-medium ${
                  allAvailable ? 'text-[#2E7D32]' : 'text-[#6B6B6B]'
                }`}
              >
                {availableCount}/{totalCount}
                {allAvailable && ' ✓'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
