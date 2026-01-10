'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import OwnerBookingPeekModal from './OwnerBookingPeekModal'

export interface OwnerBookingCardData {
  id: string
  date: string
  time: string
  service: string
  hours: number
  price: number
  status: string
  propertyName: string
  propertyAddress: string
  cleanerName: string
  cleanerPhoto: string | null
  cleanerId: string
  cleanerSlug: string
  cleanerPhone?: string
  // Recurring info (optional)
  isRecurring?: boolean
  recurringFrequency?: 'weekly' | 'fortnightly' | 'monthly'
  recurringGroupId?: string
  // Extended data
  bedrooms?: number
  bathrooms?: number
  hasReviewedCleaner?: boolean
}

interface Props {
  booking: OwnerBookingCardData
  onClick?: () => void
  onMessage?: (bookingId: string) => void
  onReschedule?: (bookingId: string) => void
  onCancel?: (bookingId: string) => void
  onReview?: (bookingId: string) => void
  onBookAgain?: (bookingId: string, cleanerSlug: string) => void
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
    case 'cancelled':
      return { bg: 'bg-[#FFEBEE]', text: 'text-[#C62828]', label: 'Cancelled' }
    default:
      return { bg: 'bg-[#F5F5F5]', text: 'text-[#6B6B6B]', label: status }
  }
}

// Recurring badge
const getRecurringBadge = (frequency?: string): { emoji: string; label: string } | null => {
  if (!frequency) return null
  switch (frequency) {
    case 'weekly':
      return { emoji: '🔄', label: 'Weekly' }
    case 'fortnightly':
      return { emoji: '🔄', label: 'Fortnightly' }
    case 'monthly':
      return { emoji: '🔄', label: 'Monthly' }
    default:
      return null
  }
}

// Thresholds
const PEEK_THRESHOLD = 300    // ms to start peek
const LOCK_THRESHOLD = 1500   // ms to lock modal open

export default function OwnerBookingCard({
  booking,
  onClick,
  onMessage,
  onReschedule,
  onCancel,
  onReview,
  onBookAgain
}: Props) {
  const statusStyles = getStatusStyles(booking.status)
  const recurringBadge = booking.isRecurring ? getRecurringBadge(booking.recurringFrequency) : null
  const [isPeeking, setIsPeeking] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [lockProgress, setLockProgress] = useState(0)
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const didPeekRef = useRef(false)
  const startTimeRef = useRef<number>(0)
  const isLockedRef = useRef(false)
  const isPeekingRef = useRef(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [])

  const startHold = useCallback((e: React.PointerEvent) => {
    if (buttonRef.current) {
      buttonRef.current.setPointerCapture(e.pointerId)
    }
    setIsPressed(true)
    didPeekRef.current = false
    isLockedRef.current = false
    isPeekingRef.current = false
    startTimeRef.current = Date.now()
    setLockProgress(0)

    holdTimerRef.current = setTimeout(() => {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10)
      }
      isPeekingRef.current = true
      setIsPeeking(true)
      didPeekRef.current = true

      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current
        const progress = Math.min((elapsed - PEEK_THRESHOLD) / (LOCK_THRESHOLD - PEEK_THRESHOLD), 1)
        setLockProgress(progress)
      }, 50)

      const lockDelay = LOCK_THRESHOLD - PEEK_THRESHOLD
      lockTimerRef.current = setTimeout(() => {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([20, 50, 20])
        }
        isLockedRef.current = true
        setIsLocked(true)
        setLockProgress(1)
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
          progressIntervalRef.current = null
        }
      }, lockDelay)
    }, PEEK_THRESHOLD)
  }, [])

  const endHold = useCallback((e: React.PointerEvent) => {
    if (buttonRef.current && buttonRef.current.hasPointerCapture(e.pointerId)) {
      buttonRef.current.releasePointerCapture(e.pointerId)
    }
    setIsPressed(false)

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current)
      lockTimerRef.current = null
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }

    if (isLockedRef.current) {
      return
    }

    if (isPeekingRef.current) {
      isPeekingRef.current = false
      setIsPeeking(false)
      setLockProgress(0)
    } else if (!didPeekRef.current && onClick) {
      onClick()
    }
  }, [onClick])

  const cancelHold = useCallback(() => {
    if (isLockedRef.current) return

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current)
      lockTimerRef.current = null
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }

    if (isPeekingRef.current) {
      isPeekingRef.current = false
      setIsPeeking(false)
    }

    setIsPressed(false)
    setLockProgress(0)
  }, [])

  const closeModal = useCallback(() => {
    isLockedRef.current = false
    isPeekingRef.current = false
    setIsPeeking(false)
    setIsLocked(false)
    setLockProgress(0)
  }, [])

  return (
    <>
      <button
        ref={buttonRef}
        onPointerDown={startHold}
        onPointerUp={endHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onContextMenu={(e) => e.preventDefault()}
        className={`w-full bg-white rounded-2xl p-4 border border-[#EBEBEB] transition-all text-left group select-none touch-none ${
          isPressed && !isPeeking
            ? 'scale-[0.98] border-[#C4785A] shadow-md'
            : 'hover:border-[#C4785A] hover:shadow-md'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Cleaner avatar */}
          <div className="flex-shrink-0">
            {booking.cleanerPhoto ? (
              <div className="w-12 h-12 rounded-full overflow-hidden relative">
                <Image
                  src={booking.cleanerPhoto}
                  alt={booking.cleanerName}
                  fill
                  className="object-cover"
                  unoptimized
                  draggable={false}
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#C4785A] text-white flex items-center justify-center text-sm font-medium">
                {getInitials(booking.cleanerName)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#1A1A1A]">
                    {booking.service}
                  </p>
                  {/* Recurring badge */}
                  {recurringBadge && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#E3F2FD] text-[#1565C0] rounded text-[10px] font-medium">
                      {recurringBadge.emoji} {recurringBadge.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6B6B6B]">
                  {booking.cleanerName} · {formatDate(booking.date)} · {booking.time}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles.bg} ${statusStyles.text}`}>
                {statusStyles.label}
              </span>
            </div>

            {/* Property */}
            <p className="text-sm text-[#1A1A1A] truncate mb-2">
              {booking.propertyName || booking.propertyAddress}
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

              {/* Hold hint */}
              <span className="text-[10px] text-[#9B9B9B] opacity-0 group-hover:opacity-100 transition-opacity">
                Hold for details
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Peek Modal */}
      <OwnerBookingPeekModal
        booking={booking}
        isVisible={isPeeking}
        isLocked={isLocked}
        lockProgress={lockProgress}
        onClose={closeModal}
        onMessage={onMessage}
        onReschedule={onReschedule}
        onCancel={onCancel}
        onReview={onReview}
        onBookAgain={onBookAgain}
      />
    </>
  )
}
