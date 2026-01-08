'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export interface BookingPeekData {
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
  // Extended data for peek
  ownerName?: string
  ownerPhone?: string
  accessNotes?: string
  propertyName?: string
  bedrooms?: number
  bathrooms?: number
  keyHolderName?: string | null
  keyHolderPhone?: string | null
}

interface Props {
  booking: BookingPeekData | null
  isVisible: boolean
  isLocked: boolean
  lockProgress: number
  onClose: () => void
  onAccept?: (bookingId: string) => void
  onDecline?: (bookingId: string) => void
  onComplete?: (bookingId: string) => void
  onSendMessage?: (bookingId: string, message: string) => void
}

// Quick message presets
const QUICK_MESSAGES = [
  { emoji: '🏃', text: 'Running 10 mins late' },
  { emoji: '🚗', text: 'On my way now' },
  { emoji: '✅', text: 'Just finished!' },
  { emoji: '❓', text: 'Quick question...' },
]

// Format date nicely
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Check if booking is today (handles various date formats)
const isToday = (dateStr: string): boolean => {
  // Parse the date string - handle both ISO and other formats
  const date = new Date(dateStr)
  const today = new Date()

  // Compare year, month, and day to avoid timezone issues
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
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

// Get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function BookingPeekModal({
  booking,
  isVisible,
  isLocked,
  lockProgress,
  onClose,
  onAccept,
  onDecline,
  onComplete,
  onSendMessage
}: Props) {
  const [showCustomMessage, setShowCustomMessage] = useState(false)
  const [customMessage, setCustomMessage] = useState('')

  // Prevent scroll when modal is visible
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setShowCustomMessage(false)
      setCustomMessage('')
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isVisible])

  if (!booking || !isVisible) return null

  const statusStyles = getStatusStyles(booking.status)
  const isPending = booking.status.toLowerCase() === 'pending'
  const isConfirmed = booking.status.toLowerCase() === 'confirmed'
  const canComplete = isConfirmed && isToday(booking.date)

  const handleQuickMessage = (message: string) => {
    if (onSendMessage) {
      onSendMessage(booking.id, message)
      onClose()
    }
  }

  const handleCustomMessageSend = () => {
    if (customMessage.trim() && onSendMessage) {
      onSendMessage(booking.id, customMessage.trim())
      setCustomMessage('')
      setShowCustomMessage(false)
      onClose()
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={isLocked ? onClose : undefined}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal content - slides up from bottom */}
      <div
        className={`relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-200 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        } ${isLocked ? 'ring-2 ring-[#C4785A] ring-offset-2' : ''}`}
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lock progress indicator */}
        {!isLocked && lockProgress > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#EBEBEB] rounded-t-3xl overflow-hidden">
            <div
              className="h-full bg-[#C4785A] transition-all duration-100"
              style={{ width: `${lockProgress * 100}%` }}
            />
          </div>
        )}

        {/* Drag indicator / Lock indicator */}
        <div className="flex justify-center pt-3 pb-2">
          {isLocked ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#E8F5E9] rounded-full">
              <span className="text-xs">🔓</span>
              <span className="text-xs font-medium text-[#2E7D32]">Unlocked</span>
            </div>
          ) : (
            <div className="w-10 h-1 bg-[#DEDEDE] rounded-full" />
          )}
        </div>

        {/* Content */}
        <div className="px-5 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 50px)' }}>
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            {booking.memberPhoto ? (
              <div className="w-14 h-14 rounded-full overflow-hidden relative flex-shrink-0">
                <Image
                  src={booking.memberPhoto}
                  alt={booking.memberName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#C4785A] text-white flex items-center justify-center text-lg font-medium flex-shrink-0">
                {getInitials(booking.memberName)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-[#1A1A1A]">{booking.service}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles.bg} ${statusStyles.text}`}>
                  {statusStyles.label}
                </span>
              </div>
              <p className="text-sm text-[#6B6B6B]">{booking.memberName}</p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-[#F5F5F3] rounded-xl p-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-lg">📅</span>
              </div>
              <div>
                <p className="font-medium text-[#1A1A1A]">{formatDate(booking.date)}</p>
                <p className="text-sm text-[#6B6B6B]">{booking.time} · {booking.hours} hours</p>
              </div>
            </div>
          </div>

          {/* Property */}
          <div className="bg-[#F5F5F3] rounded-xl p-4 mb-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🏠</span>
              </div>
              <div className="flex-1 min-w-0">
                {booking.propertyName && (
                  <p className="font-medium text-[#1A1A1A] mb-0.5">{booking.propertyName}</p>
                )}
                <p className="text-sm text-[#1A1A1A]">{booking.propertyAddress}</p>
                {(booking.bedrooms || booking.bathrooms) && (
                  <p className="text-xs text-[#6B6B6B] mt-1">
                    {booking.bedrooms && `${booking.bedrooms} bed`}
                    {booking.bedrooms && booking.bathrooms && ' · '}
                    {booking.bathrooms && `${booking.bathrooms} bath`}
                  </p>
                )}
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(booking.propertyAddress)}`}
                className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg text-[#C4785A] hover:bg-[#FFF8F5] transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Maps
              </a>
            </div>
          </div>

          {/* Owner contact - only show if locked or has owner info */}
          {booking.ownerName && (
            <div className="bg-[#F5F5F3] rounded-xl p-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-lg">👤</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#1A1A1A]">{booking.ownerName}</p>
                  <p className="text-xs text-[#6B6B6B]">Property Owner</p>
                </div>
                {booking.ownerPhone && isLocked && (
                  <a
                    href={`tel:${booking.ownerPhone}`}
                    className="flex items-center gap-2 px-3 py-2 bg-[#E8F5E9] text-[#2E7D32] rounded-lg font-medium text-sm"
                  >
                    <span>📞</span>
                    Call
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Key holder contact - only show when access notes are visible */}
          {booking.keyHolderName && booking.keyHolderPhone && (
            <div className="bg-[#E3F2FD] border border-[#90CAF9] rounded-xl p-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-lg">🔑</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#1A1A1A]">{booking.keyHolderName}</p>
                  <p className="text-xs text-[#6B6B6B]">Key Holder</p>
                </div>
                {isLocked && (
                  <a
                    href={`tel:${booking.keyHolderPhone}`}
                    className="flex items-center gap-2 px-3 py-2 bg-[#1565C0] text-white rounded-lg font-medium text-sm"
                  >
                    <span>📞</span>
                    Call
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Access notes */}
          {booking.accessNotes && (
            <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-4 mb-3">
              <div className="flex items-start gap-3">
                <span className="text-lg">🔑</span>
                <div>
                  <p className="font-medium text-[#1A1A1A] mb-1">Access Notes</p>
                  <p className="text-sm text-[#6B6B6B]">{booking.accessNotes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between py-3 border-t border-[#EBEBEB]">
            <span className="text-[#6B6B6B]">Total</span>
            <span className="text-2xl font-bold text-[#1A1A1A]">€{booking.price}</span>
          </div>

          {/* LOCKED MODE: Show all interactive elements */}
          {isLocked && (
            <>
              {/* Quick Messages */}
              {onSendMessage && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-[#6B6B6B] mb-2">Quick message to owner</p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_MESSAGES.map((msg, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickMessage(msg.text)}
                        className="flex items-center gap-2 p-3 bg-[#F5F5F3] rounded-xl text-sm text-[#1A1A1A] hover:bg-[#EBEBEB] transition-colors text-left"
                      >
                        <span>{msg.emoji}</span>
                        <span className="truncate">{msg.text}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom message input */}
                  {showCustomMessage ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border border-[#DEDEDE] rounded-xl text-sm focus:outline-none focus:border-[#C4785A]"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleCustomMessageSend()}
                      />
                      <button
                        onClick={handleCustomMessageSend}
                        disabled={!customMessage.trim()}
                        className="px-4 py-2 bg-[#C4785A] text-white rounded-xl text-sm font-medium disabled:opacity-50"
                      >
                        Send
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCustomMessage(true)}
                      className="mt-2 w-full p-3 border border-dashed border-[#DEDEDE] rounded-xl text-sm text-[#6B6B6B] hover:border-[#C4785A] hover:text-[#C4785A] transition-colors"
                    >
                      + Write custom message
                    </button>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-4 space-y-2">
                {/* Pending: Accept/Decline */}
                {isPending && (onAccept || onDecline) && (
                  <div className="flex gap-2">
                    {onDecline && (
                      <button
                        onClick={() => {
                          onDecline(booking.id)
                          onClose()
                        }}
                        className="flex-1 py-3 px-4 border border-[#DEDEDE] rounded-xl font-medium text-[#6B6B6B] hover:bg-[#F5F5F3] transition-colors"
                      >
                        Decline
                      </button>
                    )}
                    {onAccept && (
                      <button
                        onClick={() => {
                          onAccept(booking.id)
                          onClose()
                        }}
                        className="flex-1 py-3 px-4 bg-[#2E7D32] text-white rounded-xl font-medium hover:bg-[#1B5E20] transition-colors"
                      >
                        Accept Job
                      </button>
                    )}
                  </div>
                )}

                {/* Confirmed + Today: Complete */}
                {canComplete && onComplete && (
                  <button
                    onClick={() => {
                      onComplete(booking.id)
                      onClose()
                    }}
                    className="w-full py-3 px-4 bg-[#1A1A1A] text-white rounded-xl font-medium hover:bg-[#333] transition-colors flex items-center justify-center gap-2"
                  >
                    <span>✓</span>
                    Mark as Complete
                  </button>
                )}

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 text-[#6B6B6B] font-medium hover:text-[#1A1A1A] transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          )}

          {/* PEEK MODE: Show release hint */}
          {!isLocked && (
            <p className="text-center text-xs text-[#9B9B9B] mt-3">
              {lockProgress > 0.5 ? 'Keep holding to unlock...' : 'Release to close · Hold longer to unlock'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
