'use client'

import { useState } from 'react'
import { Booking, Cleaner } from '../page'

type Props = {
  bookings: Booking[]
  cleaner: Cleaner
  onCalendarTokenUpdate: (token: string) => void
}

export default function ScheduleTab({ bookings, cleaner, onCalendarTokenUpdate }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [generatingToken, setGeneratingToken] = useState(false)
  const [copied, setCopied] = useState(false)

  // Generate dates for current week view (7 days starting from today)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    return date
  })

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  const formatDayNumber = (date: Date) => {
    return date.getDate()
  }

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
  }

  // Get bookings for selected date
  const selectedDateBookings = bookings.filter(b => {
    const bookingDate = new Date(b.date)
    return isSameDay(bookingDate, selectedDate) && b.status !== 'completed'
  })

  // Check if date has bookings
  const hasBookings = (date: Date) => {
    return bookings.some(b => {
      const bookingDate = new Date(b.date)
      return isSameDay(bookingDate, date) && b.status !== 'completed'
    })
  }

  const formatFullDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  const statusColors = {
    pending: 'border-l-[#E65100]',
    confirmed: 'border-l-[#2E7D32]',
    completed: 'border-l-[#9B9B9B]',
  }

  return (
    <div>
      {/* Week selector */}
      <div className="bg-white rounded-2xl p-4 border border-[#EBEBEB] mb-6">
        <div className="flex justify-between">
          {weekDates.map((date) => {
            const isSelected = isSameDay(date, selectedDate)
            const isToday = isSameDay(date, today)
            const dateHasBookings = hasBookings(date)

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`flex-1 py-2 flex flex-col items-center gap-1 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#1A1A1A]'
                }`}
              >
                <span className={`text-xs ${isSelected ? 'text-white/70' : 'text-[#6B6B6B]'}`}>
                  {formatDayName(date)}
                </span>
                <span className={`text-lg font-semibold ${isToday && !isSelected ? 'text-[#C4785A]' : ''}`}>
                  {formatDayNumber(date)}
                </span>
                {dateHasBookings && (
                  <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#C4785A]'}`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected date header */}
      <h2 className="text-sm font-medium text-[#1A1A1A] mb-3">
        {formatFullDate(selectedDate)}
      </h2>

      {/* Day schedule */}
      {selectedDateBookings.length === 0 ? (
        <div className="bg-[#F5F5F3] rounded-2xl p-8 text-center">
          <p className="text-4xl mb-3">🌴</p>
          <p className="text-[#6B6B6B]">No bookings scheduled</p>
          <p className="text-sm text-[#9B9B9B] mt-1">
            {isSameDay(selectedDate, today) ? 'Enjoy your day!' : 'This day is free'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedDateBookings
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((booking) => (
              <div
                key={booking.id}
                className={`bg-white rounded-2xl p-4 border border-[#EBEBEB] border-l-4 ${statusColors[booking.status]}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-lg font-semibold text-[#1A1A1A]">{booking.time}</p>
                    <p className="text-sm text-[#6B6B6B]">{booking.hours} hours</p>
                  </div>
                  <span className="font-semibold text-[#1A1A1A]">€{booking.price}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🧹</span>
                    <span className="font-medium text-[#1A1A1A]">{booking.service}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                    <span>📍</span>
                    <span className="truncate">{booking.property.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                    <span>👤</span>
                    <span>{booking.owner.name}</span>
                  </div>
                </div>

                {booking.status === 'confirmed' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-[#EBEBEB]">
                    <a
                      href={`tel:${booking.owner.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#F5F5F3] text-[#1A1A1A] py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all"
                    >
                      <span>📞</span>
                      <span>Call owner</span>
                    </a>
                    <button className="flex-1 flex items-center justify-center gap-2 bg-[#F5F5F3] text-[#1A1A1A] py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all">
                      <span>🗺️</span>
                      <span>Directions</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-4 text-xs text-[#6B6B6B]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#E65100]" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#2E7D32]" />
          <span>Confirmed</span>
        </div>
      </div>

      {/* Calendar Sync Section */}
      <div className="mt-8 bg-white rounded-2xl p-4 border border-[#EBEBEB]">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">📅</span>
          <div>
            <h3 className="font-semibold text-[#1A1A1A]">Sync to your calendar</h3>
            <p className="text-sm text-[#6B6B6B]">
              Add bookings to Google, Apple, or Outlook
            </p>
          </div>
        </div>

        {cleaner.calendarToken ? (
          <div className="space-y-3">
            <div className="bg-[#F5F5F3] rounded-xl p-3">
              <p className="text-xs text-[#6B6B6B] mb-1">Subscribe URL</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-[#1A1A1A] break-all">
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}/api/calendar/${cleaner.calendarToken}`
                    : `/api/calendar/${cleaner.calendarToken}`}
                </code>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/api/calendar/${cleaner.calendarToken}`
                    navigator.clipboard.writeText(url)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="px-3 py-1.5 bg-white border border-[#DEDEDE] rounded-lg text-xs font-medium text-[#1A1A1A] hover:bg-[#F5F5F3] transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <a
                href={`https://calendar.google.com/calendar/r?cid=webcal://${typeof window !== 'undefined' ? window.location.host : ''}/api/calendar/${cleaner.calendarToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-3 bg-[#F5F5F3] rounded-xl text-center hover:bg-[#EBEBEB] transition-colors"
              >
                <span className="text-xl">📧</span>
                <span className="text-xs font-medium text-[#1A1A1A]">Google</span>
              </a>
              <a
                href={`webcal://${typeof window !== 'undefined' ? window.location.host : ''}/api/calendar/${cleaner.calendarToken}`}
                className="flex flex-col items-center gap-1 p-3 bg-[#F5F5F3] rounded-xl text-center hover:bg-[#EBEBEB] transition-colors"
              >
                <span className="text-xl">🍎</span>
                <span className="text-xs font-medium text-[#1A1A1A]">Apple</span>
              </a>
              <a
                href={`webcal://${typeof window !== 'undefined' ? window.location.host : ''}/api/calendar/${cleaner.calendarToken}`}
                className="flex flex-col items-center gap-1 p-3 bg-[#F5F5F3] rounded-xl text-center hover:bg-[#EBEBEB] transition-colors"
              >
                <span className="text-xl">📘</span>
                <span className="text-xs font-medium text-[#1A1A1A]">Outlook</span>
              </a>
            </div>

            <p className="text-xs text-[#9B9B9B] text-center">
              Your calendar will auto-update when bookings change
            </p>
          </div>
        ) : (
          <button
            onClick={async () => {
              setGeneratingToken(true)
              try {
                const res = await fetch('/api/dashboard/cleaner', { method: 'POST' })
                if (res.ok) {
                  const data = await res.json()
                  onCalendarTokenUpdate(data.calendarToken)
                }
              } catch (error) {
                console.error('Failed to generate calendar token:', error)
              } finally {
                setGeneratingToken(false)
              }
            }}
            disabled={generatingToken}
            className="w-full bg-[#1A1A1A] text-white py-3 rounded-xl font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
          >
            {generatingToken ? 'Setting up...' : 'Enable calendar sync'}
          </button>
        )}
      </div>
    </div>
  )
}
