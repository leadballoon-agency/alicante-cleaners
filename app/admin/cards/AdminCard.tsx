'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import {
  AdminFeedItem,
  AdminCardType,
  BookingAdminCardData,
  CleanerSignupCardData,
  CleanerLoginCardData,
  ReviewCardData,
  OwnerActivityCardData,
  SystemAlertCardData,
  AuditEntryCardData,
  CARD_STYLES,
  formatRelativeTime,
} from '@/lib/admin/card-types'
import AdminCardPeekModal from './AdminCardPeekModal'

// Gesture thresholds (same as JobCard)
const PEEK_THRESHOLD = 300    // 300ms to peek
const LOCK_THRESHOLD = 1500   // 1500ms to lock

interface Props {
  item: AdminFeedItem
  // Action handlers
  onApprove?: (id: string, type: AdminCardType) => void
  onReject?: (id: string, type: AdminCardType) => void
  onFeature?: (id: string) => void
  onUnfeature?: (id: string) => void
  onCancel?: (id: string, type: AdminCardType) => void
  onLoginAs?: (userId: string, role: 'cleaner' | 'owner') => void
  onMessage?: (userId: string, type: 'cleaner' | 'owner', phone?: string) => void
  onEmail?: (email: string, name: string) => void
  onViewDetails?: (id: string, type: AdminCardType) => void
  onAddNote?: (id: string, type: 'cleaner' | 'owner') => void
  onResolveAlert?: (id: string) => void
  onDismissAlert?: (id: string) => void
}

// Helper to get initials
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function AdminCard({
  item,
  onApprove,
  onReject,
  onFeature,
  onUnfeature,
  onCancel,
  onLoginAs,
  onMessage,
  onEmail,
  onViewDetails,
  onAddNote,
  onResolveAlert,
  onDismissAlert,
}: Props) {
  const [isPeeking, setIsPeeking] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [lockProgress, setLockProgress] = useState(0)

  const holdStartTime = useRef<number | null>(null)
  const animationFrame = useRef<number | null>(null)
  const hasTriggeredPeek = useRef(false)
  const hasTriggeredLock = useRef(false)

  const styles = CARD_STYLES[item.type]

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

  // Render card content based on type
  const renderContent = () => {
    switch (item.type) {
      case 'booking_pending':
      case 'booking_confirmed':
      case 'booking_completed':
        return <BookingCardContent item={item as BookingAdminCardData} />

      case 'cleaner_signup':
        return <CleanerSignupContent item={item as CleanerSignupCardData} />

      case 'cleaner_login':
        return <CleanerLoginContent item={item as CleanerLoginCardData} />

      case 'review_pending':
      case 'review_approved':
        return <ReviewCardContent item={item as ReviewCardData} />

      case 'owner_signup':
      case 'owner_dormant':
        return <OwnerCardContent item={item as OwnerActivityCardData} />

      case 'system_alert':
        return <AlertCardContent item={item as SystemAlertCardData} />

      case 'audit_entry':
        return <AuditCardContent item={item as AuditEntryCardData} />

      default:
        return null
    }
  }

  return (
    <>
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
        className={`w-full bg-white rounded-xl transition-all text-left touch-none select-none overflow-hidden ${
          isPeeking
            ? 'shadow-lg scale-[0.98] ring-2 ring-[#C4785A]'
            : 'hover:shadow-sm'
        } ${item.priority === 'urgent' ? styles.urgentBg : 'bg-white'}`}
        style={{
          borderLeft: `4px solid ${styles.borderColor}`,
        }}
      >
        <div className="p-3">
          {/* Test data badge */}
          {item.isTest && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded">
              TEST
            </div>
          )}

          {renderContent()}

          {/* Footer: timestamp + hint */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F5F5F3]">
            <span className="text-xs text-[#9B9B9B]">
              {formatRelativeTime(item.timestamp)}
            </span>
            <span className="text-xs text-[#9B9B9B]">Hold for actions</span>
          </div>
        </div>
      </button>

      {/* Peek Modal */}
      <AdminCardPeekModal
        item={item}
        isVisible={isPeeking}
        isLocked={isLocked}
        lockProgress={lockProgress}
        onClose={handleClose}
        // Action handlers
        onApprove={onApprove}
        onReject={onReject}
        onFeature={onFeature}
        onUnfeature={onUnfeature}
        onCancel={onCancel}
        onLoginAs={onLoginAs}
        onMessage={onMessage}
        onEmail={onEmail}
        onViewDetails={onViewDetails}
        onAddNote={onAddNote}
        onResolveAlert={onResolveAlert}
        onDismissAlert={onDismissAlert}
      />
    </>
  )
}

// ============================================
// Card Content Components
// ============================================

function BookingCardContent({ item }: { item: BookingAdminCardData }) {
  const { booking } = item
  const statusColor = {
    PENDING: 'bg-orange-100 text-orange-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
  }[booking.status]

  return (
    <div className="flex items-start gap-3">
      {/* Cleaner photo */}
      {booking.cleanerPhoto ? (
        <div className="w-10 h-10 rounded-full overflow-hidden relative flex-shrink-0">
          <Image
            src={booking.cleanerPhoto}
            alt={booking.cleanerName}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-full bg-[#C4785A] text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
          {getInitials(booking.cleanerName)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Service + Status */}
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-[#1A1A1A] text-sm truncate">{booking.service}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColor}`}>
            {booking.status}
          </span>
        </div>

        {/* Cleaner → Owner */}
        <p className="text-xs text-[#6B6B6B] truncate">
          {booking.cleanerName} → {booking.ownerName}
        </p>

        {/* Property + Price */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-[#9B9B9B] truncate">{booking.propertyName}</span>
          <span className="text-xs font-medium text-[#1A1A1A]">€{booking.price}</span>
        </div>
      </div>
    </div>
  )
}

function CleanerSignupContent({ item }: { item: CleanerSignupCardData }) {
  const { cleaner } = item
  const statusColor = {
    PENDING: 'bg-purple-100 text-purple-700',
    ACTIVE: 'bg-green-100 text-green-700',
    SUSPENDED: 'bg-red-100 text-red-700',
  }[cleaner.status]

  return (
    <div className="flex items-start gap-3">
      {/* Photo */}
      {cleaner.photo ? (
        <div className="w-10 h-10 rounded-full overflow-hidden relative flex-shrink-0">
          <Image
            src={cleaner.photo}
            alt={cleaner.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-full bg-[#7B1FA2] text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
          {getInitials(cleaner.name)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Name + Status */}
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-[#1A1A1A] text-sm truncate">{cleaner.name}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColor}`}>
            {cleaner.status}
          </span>
        </div>

        {/* Phone/email */}
        <p className="text-xs text-[#6B6B6B] truncate">
          {cleaner.phone || cleaner.email || 'No contact info'}
        </p>

        {/* Areas + Rate */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-[#9B9B9B] truncate">
            {cleaner.areas.slice(0, 2).join(', ')}
          </span>
          <span className="text-xs font-medium text-[#1A1A1A]">€{cleaner.hourlyRate}/h</span>
        </div>
      </div>
    </div>
  )
}

function CleanerLoginContent({ item }: { item: CleanerLoginCardData }) {
  const { cleaner } = item

  return (
    <div className="flex items-center gap-3">
      {/* Photo */}
      {cleaner.photo ? (
        <div className="w-8 h-8 rounded-full overflow-hidden relative flex-shrink-0">
          <Image
            src={cleaner.photo}
            alt={cleaner.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-[#9B9B9B] text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
          {getInitials(cleaner.name)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <span className="text-sm text-[#6B6B6B]">
          <span className="font-medium text-[#1A1A1A]">{cleaner.name}</span> logged in
        </span>
      </div>
    </div>
  )
}

function ReviewCardContent({ item }: { item: ReviewCardData }) {
  const { review } = item
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)

  return (
    <div className="flex items-start gap-3">
      {/* Cleaner photo */}
      {review.cleanerPhoto ? (
        <div className="w-10 h-10 rounded-full overflow-hidden relative flex-shrink-0">
          <Image
            src={review.cleanerPhoto}
            alt={review.cleanerName}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-full bg-[#C4785A] text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
          {getInitials(review.cleanerName)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Rating + Status */}
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm text-[#C4785A]">{stars}</span>
          {review.featured && (
            <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px] font-medium">
              FEATURED
            </span>
          )}
          {review.status === 'PENDING' && (
            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-medium">
              PENDING
            </span>
          )}
        </div>

        {/* Review text */}
        <p className="text-xs text-[#1A1A1A] line-clamp-2">
          &ldquo;{review.text.slice(0, 80)}{review.text.length > 80 ? '...' : ''}&rdquo;
        </p>

        {/* Author + Cleaner */}
        <p className="text-xs text-[#9B9B9B] mt-1 truncate">
          {review.authorName} → {review.cleanerName}
        </p>
      </div>
    </div>
  )
}

function OwnerCardContent({ item }: { item: OwnerActivityCardData }) {
  const { owner, type, dormantReason } = item

  return (
    <div className="flex items-start gap-3">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-[#0288D1] text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
        {getInitials(owner.name)}
      </div>

      <div className="flex-1 min-w-0">
        {/* Name + Type */}
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-[#1A1A1A] text-sm truncate">{owner.name}</span>
          {type === 'owner_dormant' && (
            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-medium">
              {dormantReason === 'no_booking_90_days' ? '90+ days' :
               dormantReason === 'no_booking_60_days' ? '60+ days' : '30+ days'}
            </span>
          )}
          {type === 'owner_signup' && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
              NEW
            </span>
          )}
        </div>

        {/* Email */}
        <p className="text-xs text-[#6B6B6B] truncate">{owner.email}</p>

        {/* Stats */}
        <div className="flex items-center gap-3 mt-1 text-xs text-[#9B9B9B]">
          <span>{owner.propertyCount} villa{owner.propertyCount !== 1 ? 's' : ''}</span>
          <span>{owner.bookingCount} booking{owner.bookingCount !== 1 ? 's' : ''}</span>
          {owner.totalSpent > 0 && <span>€{owner.totalSpent}</span>}
        </div>
      </div>
    </div>
  )
}

function AlertCardContent({ item }: { item: SystemAlertCardData }) {
  const { alert } = item
  const severityStyles = {
    error: { bg: 'bg-red-100', text: 'text-red-700', icon: '🔴' },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '🟡' },
    info: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🔵' },
  }[alert.severity]

  return (
    <div className="flex items-start gap-3">
      {/* Severity icon */}
      <div className={`w-10 h-10 rounded-lg ${severityStyles.bg} flex items-center justify-center text-lg flex-shrink-0`}>
        {severityStyles.icon}
      </div>

      <div className="flex-1 min-w-0">
        {/* Title + Severity */}
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-[#1A1A1A] text-sm truncate">{alert.title}</span>
          {alert.resolved && (
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-medium">
              RESOLVED
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-[#6B6B6B] line-clamp-2">{alert.description}</p>

        {/* Source */}
        <p className="text-xs text-[#9B9B9B] mt-1">Source: {alert.source}</p>
      </div>
    </div>
  )
}

function AuditCardContent({ item }: { item: AuditEntryCardData }) {
  const { audit } = item

  // Format action nicely
  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase())
  }

  return (
    <div className="flex items-center gap-3 py-1">
      {/* Scroll icon */}
      <div className="w-6 h-6 rounded bg-[#F5F5F3] flex items-center justify-center text-xs flex-shrink-0">
        📜
      </div>

      <div className="flex-1 min-w-0 text-xs">
        <span className="text-[#6B6B6B]">{audit.actorName}</span>
        <span className="text-[#9B9B9B]"> {formatAction(audit.action)} </span>
        {audit.targetName && (
          <span className="text-[#1A1A1A] font-medium">{audit.targetName}</span>
        )}
      </div>
    </div>
  )
}
