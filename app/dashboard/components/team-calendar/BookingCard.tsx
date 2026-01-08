'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import BookingPeekModal, { BookingPeekData } from './BookingPeekModal'

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
  // Extended data for peek (optional)
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
  booking: BookingCardData
  onClick?: () => void
  onAccept?: (bookingId: string) => void
  onDecline?: (bookingId: string) => void
  onComplete?: (bookingId: string) => void
  onSendMessage?: (bookingId: string, message: string) => void
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

// Thresholds
const PEEK_THRESHOLD = 300    // ms to start peek
const LOCK_THRESHOLD = 1500   // ms to lock modal open (gives ~1.2s to peek before lock)

export default function BookingCard({
  booking,
  onClick,
  onAccept,
  onDecline,
  onComplete,
  onSendMessage
}: Props) {
  const statusStyles = getStatusStyles(booking.status)
  const [isPeeking, setIsPeeking] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [lockProgress, setLockProgress] = useState(0)
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const didPeekRef = useRef(false)
  const startTimeRef = useRef<number>(0)
  const isLockedRef = useRef(false) // Track locked state to avoid stale closures
  const isPeekingRef = useRef(false) // Track peeking state to avoid stale closures
  const buttonRef = useRef<HTMLButtonElement>(null) // For pointer capture

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [])

  const startHold = useCallback((e: React.PointerEvent) => {
    // Capture pointer so we receive pointerUp even if modal appears
    if (buttonRef.current) {
      buttonRef.current.setPointerCapture(e.pointerId)
    }
    setIsPressed(true)
    didPeekRef.current = false
    isLockedRef.current = false // Reset lock state for new hold
    isPeekingRef.current = false // Reset peek state for new hold
    startTimeRef.current = Date.now()
    setLockProgress(0)

    // Start peek after PEEK_THRESHOLD
    holdTimerRef.current = setTimeout(() => {
      // Trigger haptic feedback if available
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10)
      }
      isPeekingRef.current = true
      setIsPeeking(true)
      didPeekRef.current = true

      // Start progress toward lock
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current
        const progress = Math.min((elapsed - PEEK_THRESHOLD) / (LOCK_THRESHOLD - PEEK_THRESHOLD), 1)
        setLockProgress(progress)
      }, 50)

      // Lock after LOCK_THRESHOLD
      const lockDelay = LOCK_THRESHOLD - PEEK_THRESHOLD
      lockTimerRef.current = setTimeout(() => {
        // Double haptic for lock
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
    // Release pointer capture
    if (buttonRef.current && buttonRef.current.hasPointerCapture(e.pointerId)) {
      buttonRef.current.releasePointerCapture(e.pointerId)
    }
    setIsPressed(false)

    // Clear all timers
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

    // If locked, keep modal open (use ref to avoid stale closure)
    if (isLockedRef.current) {
      return
    }

    // If peeking but not locked, close (use ref to avoid stale closure)
    if (isPeekingRef.current) {
      isPeekingRef.current = false
      setIsPeeking(false)
      setLockProgress(0)
    } else if (!didPeekRef.current && onClick) {
      // Only trigger click if we didn't peek
      onClick()
    }
  }, [onClick])

  const cancelHold = useCallback(() => {
    // If locked, don't do anything
    if (isLockedRef.current) return

    // Clear all timers
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

    // If peeking, close the peek (this handles release during peek)
    if (isPeekingRef.current) {
      isPeekingRef.current = false
      setIsPeeking(false)
    }

    setIsPressed(false)
    setLockProgress(0)
  }, [])

  const closeModal = useCallback(() => {
    isLockedRef.current = false // Reset ref when closing
    isPeekingRef.current = false
    setIsPeeking(false)
    setIsLocked(false)
    setLockProgress(0)
  }, [])

  // Prepare peek data
  const peekData: BookingPeekData = {
    ...booking
  }

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
                  draggable={false}
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

              {/* Hold hint */}
              <span className="text-[10px] text-[#9B9B9B] opacity-0 group-hover:opacity-100 transition-opacity">
                Hold for details
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Peek Modal */}
      <BookingPeekModal
        booking={peekData}
        isVisible={isPeeking}
        isLocked={isLocked}
        lockProgress={lockProgress}
        onClose={closeModal}
        onAccept={onAccept}
        onDecline={onDecline}
        onComplete={onComplete}
        onSendMessage={onSendMessage}
      />
    </>
  )
}
