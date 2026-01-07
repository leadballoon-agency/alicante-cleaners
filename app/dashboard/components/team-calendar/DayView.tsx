'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MemberAvailability, AvailabilitySlot } from './TeamCalendar'

interface Props {
  members: MemberAvailability[]
  selectedDate: Date
  onDateChange: (date: Date) => void
  onBackToWeek: () => void
}

// Working hours: 8 AM to 8 PM
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8, 9, 10, ... 20

interface BookingBlock {
  slot: AvailabilitySlot
  startHour: number
  endHour: number
  rowSpan: number
}

export default function DayView({
  members,
  selectedDate,
  onDateChange,
  onBackToWeek,
}: Props) {
  const dateStr = selectedDate.toISOString().split('T')[0]
  const [selectedBooking, setSelectedBooking] = useState<{slot: AvailabilitySlot, memberName: string} | null>(null)

  const formatHour = (hour: number): string => {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  const formatFullDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1))
    onDateChange(newDate)
  }

  // Get booking blocks for a member (grouped continuous slots)
  const getBookingBlocks = (member: MemberAvailability): BookingBlock[] => {
    const slots = member.availability[dateStr] || []
    const blocks: BookingBlock[] = []

    for (const slot of slots) {
      if (slot.source !== 'BOOKING') continue

      const [startH] = slot.startTime.split(':').map(Number)
      const [endH] = slot.endTime.split(':').map(Number)

      // Clamp to visible hours
      const clampedStart = Math.max(startH, HOURS[0])
      const clampedEnd = Math.min(endH, HOURS[HOURS.length - 1] + 1)

      if (clampedStart < clampedEnd) {
        blocks.push({
          slot,
          startHour: clampedStart,
          endHour: clampedEnd,
          rowSpan: clampedEnd - clampedStart,
        })
      }
    }

    return blocks
  }

  // Check if hour is covered by a booking block (not the start)
  const isHourCoveredByBlock = (member: MemberAvailability, hour: number): boolean => {
    const blocks = getBookingBlocks(member)
    return blocks.some(block => hour > block.startHour && hour < block.endHour)
  }

  // Get block starting at this hour
  const getBlockAtHour = (member: MemberAvailability, hour: number): BookingBlock | null => {
    const blocks = getBookingBlocks(member)
    return blocks.find(block => block.startHour === hour) || null
  }

  // Get slot for a member at a specific hour (for non-booking slots)
  const getSlotAtHour = (
    member: MemberAvailability,
    hour: number
  ): AvailabilitySlot | null => {
    const slots = member.availability[dateStr] || []

    for (const slot of slots) {
      if (slot.source === 'BOOKING') continue // Skip bookings, handled separately

      const [startH] = slot.startTime.split(':').map(Number)
      const [endH] = slot.endTime.split(':').map(Number)

      if (hour >= startH && hour < endH) {
        return slot
      }
    }
    return null
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

  // Calculate coverage for each hour
  const getCoverage = (hour: number): { available: number; total: number } => {
    let available = 0
    for (const member of members) {
      if (member.calendarSyncStatus === 'NOT_CONNECTED') continue

      const blocks = getBookingBlocks(member)
      const hasBooking = blocks.some(b => hour >= b.startHour && hour < b.endHour)
      const busySlot = getSlotAtHour(member, hour)

      if (!hasBooking && (!busySlot || busySlot.isAvailable)) {
        available++
      }
    }
    return { available, total: members.length }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-[#EBEBEB] flex items-center justify-between">
        <button
          onClick={onBackToWeek}
          className="flex items-center gap-1 text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Week
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDay('prev')}
            className="p-1.5 hover:bg-[#F5F5F3] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-semibold text-[#1A1A1A] text-sm">{formatFullDate(selectedDate)}</span>
          <button
            onClick={() => navigateDay('next')}
            className="p-1.5 hover:bg-[#F5F5F3] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="w-16" />
      </div>

      {/* Time grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#F5F5F3]">
              <th className="p-2 border-r border-[#EBEBEB] w-16 text-left">
                <span className="text-xs font-medium text-[#6B6B6B]">Time</span>
              </th>
              {members.map((member) => (
                <th key={member.memberId} className="p-2 border-r border-[#EBEBEB] text-center">
                  <div className="flex flex-col items-center gap-1">
                    {member.memberPhoto ? (
                      <div className="w-6 h-6 rounded-full overflow-hidden relative flex-shrink-0">
                        <Image
                          src={member.memberPhoto}
                          alt={member.memberName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#C4785A] text-white flex items-center justify-center text-[10px] font-medium">
                        {getInitials(member.memberName)}
                      </div>
                    )}
                    <span className="text-xs font-medium text-[#1A1A1A]">
                      {member.memberName.split(' ')[0]}
                    </span>
                  </div>
                </th>
              ))}
              <th className="p-2 w-16 text-center">
                <span className="text-xs font-medium text-[#6B6B6B]">Free</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => {
              const coverage = getCoverage(hour)
              const allAvailable = coverage.available === coverage.total

              return (
                <tr key={hour} className="border-b border-[#EBEBEB] last:border-b-0">
                  <td className="p-1 border-r border-[#EBEBEB] text-right align-top">
                    <span className="text-xs text-[#6B6B6B]">{formatHour(hour)}</span>
                  </td>

                  {members.map((member) => {
                    // Check if this cell is covered by a multi-hour block
                    if (isHourCoveredByBlock(member, hour)) {
                      return null // Skip - covered by rowSpan
                    }

                    const block = getBlockAtHour(member, hour)
                    const slot = getSlotAtHour(member, hour)
                    const notConnected = member.calendarSyncStatus === 'NOT_CONNECTED'

                    if (block) {
                      // Render booking block with rowSpan
                      return (
                        <td
                          key={member.memberId}
                          rowSpan={block.rowSpan}
                          className="p-1 border-r border-[#EBEBEB] align-top"
                        >
                          <button
                            onClick={() => setSelectedBooking({slot: block.slot, memberName: member.memberName})}
                            className="w-full h-full min-h-[40px] bg-[#E3F2FD] border border-[#1565C0] rounded-lg p-2 text-left hover:bg-[#BBDEFB] transition-colors"
                            style={{ height: `${block.rowSpan * 44 - 8}px` }}
                          >
                            <div className="text-xs font-medium text-[#1565C0]">
                              {block.slot.title?.split(' - ')[0] || 'Booking'}
                            </div>
                            <div className="text-[10px] text-[#1565C0]/70 mt-0.5">
                              {block.slot.startTime} - {block.slot.endTime}
                            </div>
                            {block.slot.title?.includes(' - ') && (
                              <div className="text-[10px] text-[#1565C0]/70 mt-0.5 truncate">
                                {block.slot.title.split(' - ')[1]}
                              </div>
                            )}
                          </button>
                        </td>
                      )
                    }

                    // Regular cell
                    let cellClass = 'bg-[#E8F5E9] border-[#2E7D32]' // Available
                    let cellContent = null

                    if (notConnected) {
                      cellClass = 'bg-[#F5F5F5] border-[#DEDEDE]'
                    } else if (slot && !slot.isAvailable) {
                      cellClass = 'bg-[#FFEBEE] border-[#C75050]'
                      cellContent = <span className="text-[10px] text-[#C75050]">Busy</span>
                    }

                    return (
                      <td key={member.memberId} className="p-1 border-r border-[#EBEBEB]">
                        <div className={`h-10 rounded-lg border flex items-center justify-center ${cellClass}`}>
                          {cellContent}
                        </div>
                      </td>
                    )
                  })}

                  <td className="p-1 text-center align-middle">
                    <span
                      className={`text-xs font-medium ${
                        allAvailable ? 'text-[#2E7D32]' : coverage.available === 0 ? 'text-[#C75050]' : 'text-[#6B6B6B]'
                      }`}
                    >
                      {coverage.available}/{coverage.total}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Booking detail modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#1A1A1A]">Booking Details</h3>
              <button onClick={() => setSelectedBooking(null)} className="text-[#6B6B6B] text-xl">&times;</button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-[#6B6B6B]">Cleaner</p>
                <p className="font-medium text-[#1A1A1A]">{selectedBooking.memberName}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B]">Service</p>
                <p className="font-medium text-[#1A1A1A]">{selectedBooking.slot.title?.split(' - ')[0] || 'Booking'}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B]">Time</p>
                <p className="font-medium text-[#1A1A1A]">{selectedBooking.slot.startTime} - {selectedBooking.slot.endTime}</p>
              </div>
              {selectedBooking.slot.title?.includes(' - ') && (
                <div>
                  <p className="text-xs text-[#6B6B6B]">Location</p>
                  <p className="font-medium text-[#1A1A1A]">{selectedBooking.slot.title.split(' - ')[1]}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
