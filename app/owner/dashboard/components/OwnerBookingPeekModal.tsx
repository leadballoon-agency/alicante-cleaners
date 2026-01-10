'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { OwnerBookingCardData } from './OwnerBookingCard'

interface Props {
  booking: OwnerBookingCardData | null
  isVisible: boolean
  isLocked: boolean
  lockProgress: number
  onClose: () => void
  onMessage?: (bookingId: string) => void
  onReschedule?: (bookingId: string) => void
  onCancel?: (bookingId: string) => void
  onReview?: (bookingId: string) => void
  onBookAgain?: (bookingId: string, cleanerSlug: string) => void
}

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

// Status badge colors
const getStatusStyles = (status: string): { bg: string; text: string; label: string } => {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return { bg: 'bg-[#E8F5E9]', text: 'text-[#2E7D32]', label: 'Confirmed' }
    case 'pending':
      return { bg: 'bg-[#FFF3E0]', text: 'text-[#E65100]', label: 'Pending' }
    case 'completed':
      return { bg: 'bg-[#E3F2FD]', text: 'text-[#1565C0]', label: 'Completed' }
    case 'cancelled':
      return { bg: 'bg-[#FFEBEE]', text: 'text-[#C62828]', label: 'Cancelled' }
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

// Recurring badge
const getRecurringLabel = (frequency?: string): string | null => {
  if (!frequency) return null
  switch (frequency) {
    case 'weekly':
      return 'Weekly'
    case 'fortnightly':
      return 'Fortnightly'
    case 'monthly':
      return 'Monthly'
    default:
      return null
  }
}

// Generate WhatsApp link with pre-filled message
const generateWhatsAppLink = (phone: string, message: string): string => {
  const cleanPhone = phone.replace(/\s/g, '').replace('whatsapp:', '')
  const phoneNumber = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
}

// Generate Google Calendar link
const generateCalendarLink = (booking: OwnerBookingCardData): string => {
  const startDate = new Date(`${booking.date}T${booking.time.split('-')[0].trim().padStart(5, '0')}:00`)
  const endDate = new Date(startDate.getTime() + booking.hours * 60 * 60 * 1000)

  const formatCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z'

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${booking.service} - ${booking.cleanerName}`,
    dates: `${formatCalDate(startDate)}/${formatCalDate(endDate)}`,
    details: `Cleaning by ${booking.cleanerName}\n${booking.propertyName || booking.propertyAddress}`,
    location: booking.propertyAddress
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export default function OwnerBookingPeekModal({
  booking,
  isVisible,
  isLocked,
  lockProgress,
  onClose,
  onMessage,
  onReschedule,
  onCancel,
  onReview,
  onBookAgain
}: Props) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Prevent scroll when modal is visible
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setShowCancelConfirm(false)
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isVisible])

  if (!booking || !isVisible) return null

  const statusStyles = getStatusStyles(booking.status)
  const isPending = booking.status.toLowerCase() === 'pending'
  const isConfirmed = booking.status.toLowerCase() === 'confirmed'
  const isCompleted = booking.status.toLowerCase() === 'completed'
  const isCancelled = booking.status.toLowerCase() === 'cancelled'
  const recurringLabel = booking.isRecurring ? getRecurringLabel(booking.recurringFrequency) : null

  // Can review if completed and hasn't reviewed yet
  const canReview = isCompleted && !booking.hasReviewedCleaner

  // WhatsApp message to cleaner
  const handleWhatsAppCleaner = () => {
    if (!booking.cleanerPhone) return
    const message = `Hi ${booking.cleanerName}! I wanted to ask about my ${booking.service.toLowerCase()} booking on ${formatDate(booking.date)} at ${booking.time}.`
    window.open(generateWhatsAppLink(booking.cleanerPhone, message), '_blank')
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
            {booking.cleanerPhoto ? (
              <div className="w-14 h-14 rounded-full overflow-hidden relative flex-shrink-0">
                <Image
                  src={booking.cleanerPhoto}
                  alt={booking.cleanerName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#C4785A] text-white flex items-center justify-center text-lg font-medium flex-shrink-0">
                {getInitials(booking.cleanerName)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-xl font-bold text-[#1A1A1A]">{booking.service}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles.bg} ${statusStyles.text}`}>
                  {statusStyles.label}
                </span>
                {recurringLabel && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E3F2FD] text-[#1565C0] rounded-full text-xs font-medium">
                    🔄 {recurringLabel}
                  </span>
                )}
              </div>
              <p className="text-sm text-[#6B6B6B]">{booking.cleanerName}</p>
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
            </div>
          </div>

          {/* Cleaner contact */}
          <div className="bg-[#F5F5F3] rounded-xl p-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-lg">🧹</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#1A1A1A]">{booking.cleanerName}</p>
                <p className="text-xs text-[#6B6B6B]">Your Cleaner</p>
              </div>
              {booking.cleanerPhone && isLocked && (
                <button
                  onClick={handleWhatsAppCleaner}
                  className="flex items-center gap-2 px-3 py-2 bg-[#25D366] text-white rounded-lg font-medium text-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </button>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between py-3 border-t border-[#EBEBEB]">
            <span className="text-[#6B6B6B]">Total</span>
            <span className="text-2xl font-bold text-[#1A1A1A]">€{booking.price}</span>
          </div>

          {/* LOCKED MODE: Show all interactive elements */}
          {isLocked && (
            <>
              {/* Cancel confirmation */}
              {showCancelConfirm ? (
                <div className="mt-4 bg-[#FFEBEE] border border-[#FFCDD2] rounded-xl p-4">
                  <p className="text-sm text-[#C62828] mb-3">
                    Are you sure you want to cancel this booking?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="flex-1 py-2 px-4 border border-[#DEDEDE] rounded-xl font-medium text-[#6B6B6B] hover:bg-white transition-colors text-sm"
                    >
                      Keep Booking
                    </button>
                    <button
                      onClick={() => {
                        if (onCancel) onCancel(booking.id)
                        onClose()
                      }}
                      className="flex-1 py-2 px-4 bg-[#C62828] text-white rounded-xl font-medium hover:bg-[#B71C1C] transition-colors text-sm"
                    >
                      Cancel Booking
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Action buttons by status */}
                  <div className="mt-4 space-y-2">
                    {/* PENDING: Message cleaner, Cancel */}
                    {isPending && (
                      <>
                        <div className="flex gap-2">
                          {onMessage && (
                            <button
                              onClick={() => {
                                onMessage(booking.id)
                                onClose()
                              }}
                              className="flex-1 py-3 px-4 bg-[#F5F5F3] text-[#1A1A1A] rounded-xl font-medium hover:bg-[#EBEBEB] transition-colors flex items-center justify-center gap-2"
                            >
                              <span>💬</span>
                              Message
                            </button>
                          )}
                          {onCancel && (
                            <button
                              onClick={() => setShowCancelConfirm(true)}
                              className="flex-1 py-3 px-4 border border-[#DEDEDE] text-[#6B6B6B] rounded-xl font-medium hover:bg-[#F5F5F3] transition-colors"
                            >
                              Cancel Request
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-center text-[#9B9B9B] mt-2">
                          Waiting for {booking.cleanerName} to confirm
                        </p>
                      </>
                    )}

                    {/* CONFIRMED: Message, Reschedule, Calendar, Cancel */}
                    {isConfirmed && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          {onMessage && (
                            <button
                              onClick={() => {
                                onMessage(booking.id)
                                onClose()
                              }}
                              className="py-3 px-4 bg-[#F5F5F3] text-[#1A1A1A] rounded-xl font-medium hover:bg-[#EBEBEB] transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                              <span>💬</span>
                              Message
                            </button>
                          )}
                          <a
                            href={generateCalendarLink(booking)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-3 px-4 bg-[#F5F5F3] text-[#1A1A1A] rounded-xl font-medium hover:bg-[#EBEBEB] transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            <span>📅</span>
                            Add to Calendar
                          </a>
                          {onReschedule && (
                            <button
                              onClick={() => {
                                onReschedule(booking.id)
                                onClose()
                              }}
                              className="py-3 px-4 border border-[#DEDEDE] text-[#6B6B6B] rounded-xl font-medium hover:bg-[#F5F5F3] transition-colors text-sm"
                            >
                              Reschedule
                            </button>
                          )}
                          {onCancel && (
                            <button
                              onClick={() => setShowCancelConfirm(true)}
                              className="py-3 px-4 border border-[#DEDEDE] text-[#6B6B6B] rounded-xl font-medium hover:bg-[#F5F5F3] transition-colors text-sm"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </>
                    )}

                    {/* COMPLETED: Review, Book Again */}
                    {isCompleted && (
                      <>
                        <div className="flex gap-2">
                          {canReview && onReview && (
                            <button
                              onClick={() => {
                                onReview(booking.id)
                                onClose()
                              }}
                              className="flex-1 py-3 px-4 bg-[#C4785A] text-white rounded-xl font-medium hover:bg-[#B56A4F] transition-colors flex items-center justify-center gap-2"
                            >
                              <span>⭐</span>
                              Leave Review
                            </button>
                          )}
                          {onBookAgain && (
                            <button
                              onClick={() => {
                                onBookAgain(booking.id, booking.cleanerSlug)
                                onClose()
                              }}
                              className={`flex-1 py-3 px-4 ${canReview ? 'bg-[#F5F5F3] text-[#1A1A1A]' : 'bg-[#1A1A1A] text-white'} rounded-xl font-medium hover:opacity-90 transition-colors flex items-center justify-center gap-2`}
                            >
                              <span>🔄</span>
                              Book Again
                            </button>
                          )}
                        </div>
                        {!canReview && booking.hasReviewedCleaner && (
                          <p className="text-xs text-center text-[#9B9B9B] mt-2">
                            You&apos;ve already reviewed this clean
                          </p>
                        )}
                      </>
                    )}

                    {/* CANCELLED: Book Again */}
                    {isCancelled && onBookAgain && (
                      <button
                        onClick={() => {
                          onBookAgain(booking.id, booking.cleanerSlug)
                          onClose()
                        }}
                        className="w-full py-3 px-4 bg-[#1A1A1A] text-white rounded-xl font-medium hover:bg-[#333] transition-colors flex items-center justify-center gap-2"
                      >
                        <span>🔄</span>
                        Book Again
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
