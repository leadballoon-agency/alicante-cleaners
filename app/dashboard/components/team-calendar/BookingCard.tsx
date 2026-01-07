'use client'

import Image from 'next/image'

export interface BookingCardData {
  id: string
  date: string
  time: string
  service: string
  hours: number
  price: number
  status: string
  propertyAddress: string
  memberName: string
  memberPhoto: string | null
  memberId: string
}

interface Props {
  booking: BookingCardData
  onClick?: () => void
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

// Format date nicely
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow'
  }

  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

// Status badge colors
const getStatusStyles = (status: string): { bg: string; text: string; label: string } => {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return { bg: 'bg-[#E8F5E9]', text: 'text-[#2E7D32]', label: 'Confirmed' }
    case 'pending':
      return { bg: 'bg-[#FFF3E0]', text: 'text-[#E65100]', label: 'Pending' }
    case 'completed':
      return { bg: 'bg-[#E3F2FD]', text: 'text-[#1565C0]', label: 'Completed' }
    default:
      return { bg: 'bg-[#F5F5F5]', text: 'text-[#6B6B6B]', label: status }
  }
}

export default function BookingCard({ booking, onClick }: Props) {
  const statusStyles = getStatusStyles(booking.status)

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl p-4 border border-[#EBEBEB] hover:border-[#C4785A] hover:shadow-md transition-all text-left group"
    >
      <div className="flex items-start gap-3">
        {/* Member avatar */}
        <div className="flex-shrink-0">
          {booking.memberPhoto ? (
            <div className="w-12 h-12 rounded-full overflow-hidden relative">
              <Image
                src={booking.memberPhoto}
                alt={booking.memberName}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#C4785A] text-white flex items-center justify-center text-sm font-medium">
              {getInitials(booking.memberName)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">
                {booking.service}
              </p>
              <p className="text-xs text-[#6B6B6B]">
                {booking.memberName} · {formatDate(booking.date)} · {booking.time}
              </p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles.bg} ${statusStyles.text}`}>
              {statusStyles.label}
            </span>
          </div>

          {/* Property address */}
          <p className="text-sm text-[#1A1A1A] truncate mb-2">
            {booking.propertyAddress}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-[#6B6B6B]">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {booking.hours}h
              </span>
              <span className="font-medium text-[#1A1A1A]">
                €{booking.price}
              </span>
            </div>

            {/* Arrow indicator */}
            <svg
              className="w-4 h-4 text-[#9B9B9B] group-hover:text-[#C4785A] group-hover:translate-x-0.5 transition-all"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </button>
  )
}
