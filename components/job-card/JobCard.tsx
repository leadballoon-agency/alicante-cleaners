'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { BookingCardData, JobCardContext, getStatusStyles, getInitials, formatDate, getRecurringLabel } from './types'
import JobCardPeekModal from './JobCardPeekModal'

// Gesture thresholds
const PEEK_THRESHOLD = 300    // 300ms to peek
const LOCK_THRESHOLD = 1500   // 1500ms to lock

interface Props {
  booking: BookingCardData
  context: JobCardContext
  onClick?: () => void
  // Owner actions
  onMessage?: (bookingId: string) => void
  onAddInstructions?: (bookingId: string) => void
  onAddAccess?: (bookingId: string) => void
  onAdjustTime?: (bookingId: string) => void
  onCancel?: (bookingId: string) => void
  onReview?: (bookingId: string) => void
  onBookAgain?: (bookingId: string, cleanerSlug: string) => void
  onMakeRecurring?: (bookingId: string) => void
  // Cleaner actions
  onAccept?: (bookingId: string) => void
  onDecline?: (bookingId: string) => void
  onComplete?: (bookingId: string) => void
  onSendMessage?: (bookingId: string, message: string) => void
  // Cleaner context
  cleanerName?: string
}

export default function JobCard({
  booking,
  context,
  onClick,
  onMessage,
  onAddInstructions,
  onAddAccess,
  onAdjustTime,
  onCancel,
  onReview,
  onBookAgain,
  onMakeRecurring,
  onAccept,
  onDecline,
  onComplete,
  onSendMessage,
  cleanerName
}: Props) {
  const [isPeeking, setIsPeeking] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [lockProgress, setLockProgress] = useState(0)

  const holdStartTime = useRef<number | null>(null)
  const animationFrame = useRef<number | null>(null)
  const hasTriggeredPeek = useRef(false)
  const hasTriggeredLock = useRef(false)

  const statusStyles = getStatusStyles(booking.status)
  const recurringLabel = booking.isRecurring ? getRecurringLabel(booking.recurringFrequency) : null

  // Determine who to show (cleaner sees owner photo, owner sees cleaner photo)
  const displayName = context === 'cleaner' ? (booking.ownerName || 'Owner') : booking.cleanerName
  const displayPhoto = context === 'cleaner' ? null : booking.cleanerPhoto

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [])

  const updateProgress = useCallback(() => {
    if (!holdStartTime.current) return

    const elapsed = Date.now() - holdStartTime.current
    const progress = Math.min(elapsed / LOCK_THRESHOLD, 1)
    setLockProgress(progress)

    // Trigger peek at threshold
    if (elapsed >= PEEK_THRESHOLD && !hasTriggeredPeek.current) {
      hasTriggeredPeek.current = true
      setIsPeeking(true)
      // Haptic feedback for peek
      if (navigator.vibrate) navigator.vibrate(10)
    }

    // Trigger lock at threshold
    if (elapsed >= LOCK_THRESHOLD && !hasTriggeredLock.current) {
      hasTriggeredLock.current = true
      setIsLocked(true)
      // Haptic feedback for lock
      if (navigator.vibrate) navigator.vibrate([20, 50, 20])
    }

    // Continue updating if not locked
    if (!hasTriggeredLock.current) {
      animationFrame.current = requestAnimationFrame(updateProgress)
    }
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only respond to primary button (touch or left click)
    if (e.button !== 0) return

    holdStartTime.current = Date.now()
    hasTriggeredPeek.current = false
    hasTriggeredLock.current = false
    setLockProgress(0)

    // Capture pointer for smooth tracking
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

    // Start progress animation
    animationFrame.current = requestAnimationFrame(updateProgress)
  }, [updateProgress])

  const handlePointerUp = useCallback(() => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current)
    }

    // If we peeked but didn't lock, close the modal
    if (hasTriggeredPeek.current && !hasTriggeredLock.current) {
      setIsPeeking(false)
    }

    holdStartTime.current = null
    setLockProgress(0)
  }, [])

  const handlePointerCancel = useCallback(() => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current)
    }

    if (!hasTriggeredLock.current) {
      setIsPeeking(false)
    }

    holdStartTime.current = null
    setLockProgress(0)
  }, [])

  const handleClose = useCallback(() => {
    setIsPeeking(false)
    setIsLocked(false)
    setLockProgress(0)
  }, [])

  return (
    <>
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
        onClick={onClick}
        className={`w-full bg-white rounded-2xl border transition-all text-left touch-none select-none ${
          isPeeking
            ? 'border-[#C4785A] shadow-lg scale-[0.98]'
            : 'border-[#EBEBEB] hover:border-[#DEDEDE]'
        }`}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Photo */}
            {displayPhoto ? (
              <div className="w-12 h-12 rounded-full overflow-hidden relative flex-shrink-0">
                <Image
                  src={displayPhoto}
                  alt={displayName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#C4785A] text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                {getInitials(displayName)}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Top row: Service + Status */}
              <div className="flex items-center gap-2 mb-0.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <p className="font-semibold text-[#1A1A1A] truncate">{booking.service}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusStyles.bg} ${statusStyles.text}`}>
                    {statusStyles.label}
                  </span>
                  {recurringLabel && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E3F2FD] text-[#1565C0] rounded-full text-xs font-medium flex-shrink-0">
                      🔄 {recurringLabel}
                    </span>
                  )}
                </div>
              </div>

              {/* Second row: Name + Date + Time */}
              <p className="text-sm text-[#6B6B6B] truncate">
                {displayName} · {formatDate(booking.date)} · {booking.time.split('-')[0].trim()}
              </p>

              {/* Third row: Property */}
              <p className="text-sm text-[#9B9B9B] truncate mt-0.5">
                {booking.propertyName || `Property at ${booking.propertyAddress.split(',')[0]}`}
              </p>

              {/* Bottom row: Duration + Price + Hint */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3 text-sm text-[#6B6B6B]">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {booking.hours}h
                  </span>
                  <span className="font-medium text-[#1A1A1A]">€{booking.price}</span>
                </div>
                <span className="text-xs text-[#9B9B9B]">Hold for details</span>
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Peek Modal */}
      <JobCardPeekModal
        booking={booking}
        context={context}
        isVisible={isPeeking}
        isLocked={isLocked}
        lockProgress={lockProgress}
        onClose={handleClose}
        // Owner actions
        onMessage={onMessage}
        onAddInstructions={onAddInstructions}
        onAddAccess={onAddAccess}
        onAdjustTime={onAdjustTime}
        onCancel={onCancel}
        onReview={onReview}
        onBookAgain={onBookAgain}
        onMakeRecurring={onMakeRecurring}
        // Cleaner actions
        onAccept={onAccept}
        onDecline={onDecline}
        onComplete={onComplete}
        onSendMessage={onSendMessage}
        cleanerName={cleanerName}
      />
    </>
  )
}
