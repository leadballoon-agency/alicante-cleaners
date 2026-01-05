'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { BookingData } from '../page'
import { Loader2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  data: BookingData
  onUpdate: (data: Partial<BookingData>) => void
  onNext: () => void
  cleanerSlug: string
}

type TimeSlot = {
  time: string
  available: boolean
  reason?: string
}

type AvailabilityResponse = {
  slots: TimeSlot[]
  calendarConnected: boolean
  lastSynced: string | null
}

const TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '14:00',
  '15:00',
  '16:00',
]

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function DateTimePicker({ data, onUpdate, onNext, cleanerSlug }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(data.date)
  const [selectedTime, setSelectedTime] = useState(data.time)
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  // Fetch availability when date changes
  const fetchAvailability = useCallback(async (date: Date) => {
    setLoadingAvailability(true)
    setAvailability(null)
    setSelectedTime('') // Reset selected time when date changes

    try {
      const dateStr = date.toISOString().split('T')[0]
      const res = await fetch(`/api/cleaners/${cleanerSlug}/availability?date=${dateStr}`)
      if (res.ok) {
        const data = await res.json()
        setAvailability(data)
      }
    } catch (err) {
      console.error('Failed to fetch availability:', err)
    } finally {
      setLoadingAvailability(false)
    }
  }, [cleanerSlug])

  useEffect(() => {
    if (selectedDate) {
      fetchAvailability(selectedDate)
    }
  }, [selectedDate, fetchAvailability])

  // Generate calendar grid for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // First day of month (0 = Sunday, adjust for Monday start)
    const firstDay = new Date(year, month, 1)
    let startOffset = firstDay.getDay() - 1
    if (startOffset < 0) startOffset = 6 // Sunday becomes 6

    // Days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    // Create array of day objects
    const days: (Date | null)[] = []

    // Add empty slots for offset
    for (let i = 0; i < startOffset; i++) {
      days.push(null)
    }

    // Add actual days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d))
    }

    return days
  }, [currentMonth])

  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
  }

  const isPastDate = (date: Date) => {
    return date <= today
  }

  const isWithinBookingWindow = (date: Date) => {
    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + 60) // Allow booking up to 60 days ahead
    return date <= maxDate
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const canGoBack = currentMonth > new Date(today.getFullYear(), today.getMonth(), 1)
  const canGoForward = currentMonth < new Date(today.getFullYear(), today.getMonth() + 2, 1)

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) return
    onUpdate({ date: selectedDate, time: selectedTime })
    onNext()
  }

  const canContinue = selectedDate && selectedTime

  return (
    <div>
      {/* Service info */}
      {data.service && (
        <div className="bg-white rounded-2xl p-4 border border-[#EBEBEB] mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[#1A1A1A]">{data.service.name}</h3>
              <p className="text-sm text-[#6B6B6B]">{data.service.hours} hours</p>
            </div>
            <span className="text-lg font-semibold text-[#1A1A1A]">€{data.service.price}</span>
          </div>
        </div>
      )}

      {/* Date selection - Calendar Grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Choose a date</h2>
        </div>

        <div className="bg-white rounded-2xl border border-[#EBEBEB] p-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPreviousMonth}
              disabled={!canGoBack}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F5F5F3] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5 text-[#6B6B6B]" />
            </button>
            <span className="font-semibold text-[#1A1A1A]">
              {formatMonthYear(currentMonth)}
            </span>
            <button
              onClick={goToNextMonth}
              disabled={!canGoForward}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F5F5F3] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_NAMES.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-[#6B6B6B] py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="aspect-square" />
              }

              const isSelected = selectedDate && isSameDay(date, selectedDate)
              const isPast = isPastDate(date)
              const isToday = isSameDay(date, today)
              const isWeekend = date.getDay() === 0 || date.getDay() === 6
              const isBookable = !isPast && isWithinBookingWindow(date)

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => isBookable && setSelectedDate(date)}
                  disabled={!isBookable}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-[#1A1A1A] text-white'
                      : isPast
                      ? 'text-[#DEDEDE] cursor-not-allowed'
                      : isToday
                      ? 'bg-[#FFF8F5] text-[#C4785A] border border-[#C4785A]'
                      : isWeekend
                      ? 'bg-[#F5F5F3] text-[#1A1A1A] hover:bg-[#EBEBEB]'
                      : 'text-[#1A1A1A] hover:bg-[#F5F5F3]'
                  } ${isBookable && !isSelected ? 'active:scale-95' : ''}`}
                >
                  <span>{date.getDate()}</span>
                  {isWeekend && !isPast && !isSelected && (
                    <span className="text-[8px] text-[#C4785A] -mt-0.5">Popular</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Time selection */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Choose a time</h2>
          {availability?.calendarConnected && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Calendar className="w-3 h-3" />
              <span>Calendar synced</span>
            </div>
          )}
        </div>

        {loadingAvailability ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#6B6B6B] animate-spin" />
          </div>
        ) : !selectedDate ? (
          <div className="text-center py-8 text-[#6B6B6B]">
            Select a date first
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {TIME_SLOTS.map((time) => {
              const slotInfo = availability?.slots.find(s => s.time === time)
              const isAvailable = slotInfo?.available !== false
              const isSelected = selectedTime === time

              return (
                <button
                  key={time}
                  onClick={() => isAvailable && setSelectedTime(time)}
                  disabled={!isAvailable}
                  className={`py-3 rounded-xl border-2 font-medium transition-all ${
                    !isAvailable
                      ? 'border-[#EBEBEB] bg-[#F5F5F3] text-[#BEBEBE] cursor-not-allowed'
                      : isSelected
                      ? 'border-[#1A1A1A] bg-[#F5F5F3] text-[#1A1A1A] active:scale-[0.98]'
                      : 'border-[#EBEBEB] bg-white text-[#6B6B6B] active:scale-[0.98]'
                  }`}
                >
                  <span>{time}</span>
                  {!isAvailable && (
                    <span className="block text-[10px] text-[#BEBEBE] mt-0.5">
                      {slotInfo?.reason || 'Unavailable'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        <p className="text-xs text-[#9B9B9B] mt-3 text-center">
          All times are in local Spain time (CET)
        </p>
      </div>

      {/* Summary */}
      {canContinue && (
        <div className="bg-[#F5F5F3] rounded-xl p-4 mb-6">
          <p className="text-sm text-[#6B6B6B] mb-1">Your appointment</p>
          <p className="font-medium text-[#1A1A1A]">
            {selectedDate?.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })} at {selectedTime}
          </p>
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={!canContinue}
        className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
      >
        Continue
      </button>
    </div>
  )
}
