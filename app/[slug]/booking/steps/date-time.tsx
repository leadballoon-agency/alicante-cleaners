'use client'

import { useState } from 'react'
import { BookingData } from '../page'

type Props = {
  data: BookingData
  onUpdate: (data: Partial<BookingData>) => void
  onNext: () => void
}

const TIME_SLOTS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '14:00',
  '15:00',
  '16:00',
]

export default function DateTimePicker({ data, onUpdate, onNext }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(data.date)
  const [selectedTime, setSelectedTime] = useState(data.time)

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
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">Choose a date</h2>
        <p className="text-sm text-[#6B6B6B] mb-4">{formatMonthYear(dates[0])}</p>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
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
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Choose a time</h2>

        <div className="grid grid-cols-3 gap-3">
          {TIME_SLOTS.map((time) => {
            const isSelected = selectedTime === time

            return (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`py-3 rounded-xl border-2 font-medium transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'border-[#1A1A1A] bg-[#F5F5F3] text-[#1A1A1A]'
                    : 'border-[#EBEBEB] bg-white text-[#6B6B6B]'
                }`}
              >
                {time}
              </button>
            )
          })}
        </div>

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
