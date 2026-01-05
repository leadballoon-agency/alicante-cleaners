'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { BookingData } from '../page'
import { Loader2, Calendar } from 'lucide-react'

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

export default function DateTimePicker({ data, onUpdate, onNext, cleanerSlug }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(data.date)
  const [selectedTime, setSelectedTime] = useState(data.time)
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

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

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = 200
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  // Handle mouse wheel for horizontal scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current) return
    e.preventDefault()
    scrollRef.current.scrollLeft += e.deltaY
  }

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i + 1) // Start from tomorrow
    return date
  })

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  const formatDayNumber = (date: Date) => {
    return date.getDate()
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
  }

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

      {/* Date selection */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">Choose a date</h2>
            <p className="text-sm text-[#6B6B6B]">{formatMonthYear(dates[0])}</p>
          </div>
          {/* Navigation arrows for desktop */}
          <div className="hidden sm:flex gap-1">
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full border border-[#EBEBEB] bg-white flex items-center justify-center hover:bg-[#F5F5F3] transition-colors"
              aria-label="Scroll left"
            >
              <span className="text-[#6B6B6B]">&larr;</span>
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full border border-[#EBEBEB] bg-white flex items-center justify-center hover:bg-[#F5F5F3] transition-colors"
              aria-label="Scroll right"
            >
              <span className="text-[#6B6B6B]">&rarr;</span>
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          onWheel={handleWheel}
          className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide cursor-grab active:cursor-grabbing"
        >
          {dates.map((date) => {
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const isWeekend = date.getDay() === 0 || date.getDay() === 6

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 w-14 py-3 rounded-xl border-2 transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                    : 'border-[#EBEBEB] bg-white text-[#1A1A1A]'
                }`}
              >
                <div className={`text-xs mb-1 ${isSelected ? 'text-white/70' : 'text-[#6B6B6B]'}`}>
                  {formatDayName(date)}
                </div>
                <div className="text-lg font-semibold">{formatDayNumber(date)}</div>
                {isWeekend && !isSelected && (
                  <div className="text-[10px] text-[#C4785A] mt-0.5">Popular</div>
                )}
              </button>
            )
          })}
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
