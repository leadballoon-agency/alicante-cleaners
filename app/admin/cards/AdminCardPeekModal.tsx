'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
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

interface Props {
  item: AdminFeedItem | null
  isVisible: boolean
  isLocked: boolean
  lockProgress: number
  onClose: () => void
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

// Generate WhatsApp link
function generateWhatsAppLink(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '')
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
}

export default function AdminCardPeekModal({
  item,
  isVisible,
  isLocked,
  lockProgress,
  onClose,
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
  const [showConfirmAction, setShowConfirmAction] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  const copyLink = useCallback(() => {
    if (!item) return
    const url = `${window.location.origin}/admin?card=${item.id}`
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }, [item])

  // Prevent scroll when modal is visible
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setShowConfirmAction(null)
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isVisible])

  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setPortalContainer(document.body)
  }, [])

  if (!item || !isVisible || !portalContainer) return null

  const styles = CARD_STYLES[item.type]

  // Render content based on item type
  const renderContent = () => {
    switch (item.type) {
      case 'booking_pending':
      case 'booking_confirmed':
      case 'booking_completed':
        return (
          <BookingPeekContent
            item={item as BookingAdminCardData}
            isLocked={isLocked}
            showConfirmAction={showConfirmAction}
            setShowConfirmAction={setShowConfirmAction}
            onCancel={onCancel}
            onLoginAs={onLoginAs}
            onMessage={onMessage}
            onViewDetails={onViewDetails}
            onClose={onClose}
          />
        )

      case 'cleaner_signup':
        return (
          <CleanerSignupPeekContent
            item={item as CleanerSignupCardData}
            isLocked={isLocked}
            showConfirmAction={showConfirmAction}
            setShowConfirmAction={setShowConfirmAction}
            onApprove={onApprove}
            onReject={onReject}
            onLoginAs={onLoginAs}
            onMessage={onMessage}
            onViewDetails={onViewDetails}
            onClose={onClose}
          />
        )

      case 'cleaner_login':
        return (
          <CleanerLoginPeekContent
            item={item as CleanerLoginCardData}
            isLocked={isLocked}
            onLoginAs={onLoginAs}
            onViewDetails={onViewDetails}
            onClose={onClose}
          />
        )

      case 'review_pending':
      case 'review_approved':
        return (
          <ReviewPeekContent
            item={item as ReviewCardData}
            isLocked={isLocked}
            showConfirmAction={showConfirmAction}
            setShowConfirmAction={setShowConfirmAction}
            onApprove={onApprove}
            onReject={onReject}
            onFeature={onFeature}
            onUnfeature={onUnfeature}
            onViewDetails={onViewDetails}
            onClose={onClose}
          />
        )

      case 'owner_signup':
      case 'owner_dormant':
        return (
          <OwnerPeekContent
            item={item as OwnerActivityCardData}
            isLocked={isLocked}
            onLoginAs={onLoginAs}
            onMessage={onMessage}
            onEmail={onEmail}
            onAddNote={onAddNote}
            onViewDetails={onViewDetails}
            onClose={onClose}
          />
        )

      case 'system_alert':
        return (
          <AlertPeekContent
            item={item as SystemAlertCardData}
            isLocked={isLocked}
            onResolveAlert={onResolveAlert}
            onDismissAlert={onDismissAlert}
            onViewDetails={onViewDetails}
            onClose={onClose}
          />
        )

      case 'audit_entry':
        return (
          <AuditPeekContent
            item={item as AuditEntryCardData}
            isLocked={isLocked}
          />
        )

      default:
        return null
    }
  }

  return createPortal(
    <div
      className={`fixed left-0 right-0 top-0 z-50 flex items-end justify-center transition-all duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={isLocked ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-lg bg-white rounded-t-3xl transition-transform duration-200 select-none ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          maxHeight: '85vh',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
        } as React.CSSProperties}
      >
        {/* Lock progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#EBEBEB] rounded-t-3xl overflow-hidden">
          <div
            className="h-full bg-[#C4785A] transition-all"
            style={{ width: `${lockProgress * 100}%` }}
          />
        </div>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-[#DEDEDE] rounded-full" />
        </div>

        {/* Type indicator + Copy link */}
        <div className="px-6 pb-2 flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: styles.borderColor }}
          />
          <span className="text-xs font-medium text-[#6B6B6B]">{styles.label}</span>
          <span className="text-xs text-[#9B9B9B]">· {formatRelativeTime(item.timestamp)}</span>
          {item.isTest && (
            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded">
              TEST
            </span>
          )}
          <button
            onClick={copyLink}
            className="ml-auto px-2 py-1 text-xs rounded-lg bg-[#F5F5F3] text-[#6B6B6B] hover:bg-[#EBEBEB] transition-colors"
          >
            {linkCopied ? '✓ Copied!' : '🔗 Copy link'}
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
          {renderContent()}
        </div>

        {/* Lock hint */}
        {!isLocked && (
          <div className="absolute bottom-0 left-0 right-0 py-3 text-center text-xs text-[#9B9B9B] bg-gradient-to-t from-white via-white to-transparent">
            Release to close · Hold longer to unlock actions
          </div>
        )}
      </div>
    </div>,
    portalContainer
  )
}

// ============================================
// Booking Peek Content
// ============================================

function BookingPeekContent({
  item,
  isLocked,
  showConfirmAction,
  setShowConfirmAction,
  onCancel,
  onLoginAs,
  onMessage: _onMessage,
  onViewDetails: _onViewDetails,
  onClose,
}: {
  item: BookingAdminCardData
  isLocked: boolean
  showConfirmAction: string | null
  setShowConfirmAction: (v: string | null) => void
  onCancel?: (id: string, type: AdminCardType) => void
  onLoginAs?: (userId: string, role: 'cleaner' | 'owner') => void
  onMessage?: (userId: string, type: 'cleaner' | 'owner', phone?: string) => void
  onViewDetails?: (id: string, type: AdminCardType) => void
  onClose: () => void
}) {
  void _onMessage
  void _onViewDetails
  const { booking } = item

  return (
    <div className="space-y-4">
      {/* Header with cleaner + owner */}
      <div className="flex items-center gap-4">
        {/* Cleaner */}
        <div className="flex items-center gap-2">
          {booking.cleanerPhoto ? (
            <div className="w-10 h-10 rounded-full overflow-hidden relative">
              <Image src={booking.cleanerPhoto} alt={booking.cleanerName} fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#C4785A] text-white flex items-center justify-center text-xs font-medium">
              {getInitials(booking.cleanerName)}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-[#1A1A1A]">{booking.cleanerName}</p>
            <p className="text-xs text-[#9B9B9B]">Cleaner</p>
          </div>
        </div>

        <span className="text-[#9B9B9B]">→</span>

        {/* Owner */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#0288D1] text-white flex items-center justify-center text-xs font-medium">
            {getInitials(booking.ownerName)}
          </div>
          <div>
            <p className="text-sm font-medium text-[#1A1A1A]">{booking.ownerName}</p>
            <p className="text-xs text-[#9B9B9B]">Owner</p>
          </div>
        </div>
      </div>

      {/* Booking details */}
      <div className="bg-[#F5F5F3] rounded-xl p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-[#6B6B6B]">Service</span>
          <span className="text-sm font-medium text-[#1A1A1A]">{booking.service}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-[#6B6B6B]">Date</span>
          <span className="text-sm font-medium text-[#1A1A1A]">{booking.date}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-[#6B6B6B]">Time</span>
          <span className="text-sm font-medium text-[#1A1A1A]">{booking.time}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-[#6B6B6B]">Property</span>
          <span className="text-sm font-medium text-[#1A1A1A] text-right">{booking.propertyName}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-[#EBEBEB]">
          <span className="text-sm text-[#6B6B6B]">Price</span>
          <span className="text-sm font-semibold text-[#1A1A1A]">€{booking.price}</span>
        </div>
      </div>

      {/* Actions (only when locked) */}
      {isLocked && (
        <div className="space-y-3">
          {/* Cancel confirmation */}
          {showConfirmAction === 'cancel' ? (
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-sm text-red-700 mb-3">Cancel this booking?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmAction(null)}
                  className="flex-1 py-2 bg-white border border-[#DEDEDE] rounded-lg text-sm font-medium"
                >
                  No, keep it
                </button>
                <button
                  onClick={() => {
                    onCancel?.(booking.id, item.type)
                    onClose()
                  }}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
                >
                  Yes, cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {/* Message Cleaner */}
              {booking.cleanerPhone && (
                <button
                  onClick={() => {
                    window.open(generateWhatsAppLink(booking.cleanerPhone!, `Hi ${booking.cleanerName}!`), '_blank')
                    onClose()
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 bg-[#25D366] text-white rounded-xl text-sm font-medium"
                >
                  <span>📱</span> Cleaner
                </button>
              )}

              {/* Message Owner */}
              {booking.ownerPhone && (
                <button
                  onClick={() => {
                    window.open(generateWhatsAppLink(booking.ownerPhone!, `Hi ${booking.ownerName}!`), '_blank')
                    onClose()
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 bg-[#25D366] text-white rounded-xl text-sm font-medium"
                >
                  <span>📱</span> Owner
                </button>
              )}

              {/* Login as Cleaner */}
              <button
                onClick={() => {
                  onLoginAs?.(booking.cleanerId, 'cleaner')
                  onClose()
                }}
                className="flex items-center justify-center gap-2 py-2.5 bg-[#F5F5F3] text-[#1A1A1A] rounded-xl text-sm font-medium"
              >
                <span>🎭</span> Login as Cleaner
              </button>

              {/* Login as Owner */}
              <button
                onClick={() => {
                  onLoginAs?.(booking.ownerId, 'owner')
                  onClose()
                }}
                className="flex items-center justify-center gap-2 py-2.5 bg-[#F5F5F3] text-[#1A1A1A] rounded-xl text-sm font-medium"
              >
                <span>🎭</span> Login as Owner
              </button>

              {/* Cancel Booking */}
              {(item.type === 'booking_pending' || item.type === 'booking_confirmed') && (
                <button
                  onClick={() => setShowConfirmAction('cancel')}
                  className="col-span-2 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium"
                >
                  <span>✕</span> Cancel Booking
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// Cleaner Signup Peek Content
// ============================================

function CleanerSignupPeekContent({
  item,
  isLocked,
  showConfirmAction,
  setShowConfirmAction,
  onApprove,
  onReject,
  onLoginAs,
  onMessage: _onMessage,
  onViewDetails: _onViewDetails,
  onClose,
}: {
  item: CleanerSignupCardData
  isLocked: boolean
  showConfirmAction: string | null
  setShowConfirmAction: (v: string | null) => void
  onApprove?: (id: string, type: AdminCardType) => void
  onReject?: (id: string, type: AdminCardType) => void
  onLoginAs?: (userId: string, role: 'cleaner' | 'owner') => void
  onMessage?: (userId: string, type: 'cleaner' | 'owner', phone?: string) => void
  onViewDetails?: (id: string, type: AdminCardType) => void
  onClose: () => void
}) {
  void _onMessage
  void _onViewDetails
  const { cleaner } = item
  const isPending = cleaner.status === 'PENDING'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {cleaner.photo ? (
          <div className="w-16 h-16 rounded-full overflow-hidden relative">
            <Image src={cleaner.photo} alt={cleaner.name} fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#7B1FA2] text-white flex items-center justify-center text-xl font-medium">
            {getInitials(cleaner.name)}
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-[#1A1A1A]">{cleaner.name}</h3>
          <p className="text-sm text-[#6B6B6B]">{cleaner.phone || cleaner.email}</p>
        </div>
      </div>

      {/* Bio */}
      {cleaner.bio && (
        <p className="text-sm text-[#6B6B6B] italic">&ldquo;{cleaner.bio}&rdquo;</p>
      )}

      {/* Details */}
      <div className="bg-[#F5F5F3] rounded-xl p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-[#6B6B6B]">Hourly Rate</span>
          <span className="text-sm font-medium text-[#1A1A1A]">€{cleaner.hourlyRate}/h</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-[#6B6B6B]">Areas</span>
          <span className="text-sm font-medium text-[#1A1A1A] text-right">{cleaner.areas.join(', ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-[#6B6B6B]">Services</span>
          <span className="text-sm font-medium text-[#1A1A1A] text-right">{cleaner.services.join(', ')}</span>
        </div>
      </div>

      {/* Actions (only when locked) */}
      {isLocked && (
        <div className="space-y-3">
          {/* Reject confirmation */}
          {showConfirmAction === 'reject' ? (
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-sm text-red-700 mb-3">Reject this application?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmAction(null)}
                  className="flex-1 py-2 bg-white border border-[#DEDEDE] rounded-lg text-sm font-medium"
                >
                  No, keep it
                </button>
                <button
                  onClick={() => {
                    onReject?.(cleaner.id, item.type)
                    onClose()
                  }}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
                >
                  Yes, reject
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Approve/Reject for pending */}
              {isPending && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onApprove?.(cleaner.id, item.type)
                      onClose()
                    }}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => setShowConfirmAction('reject')}
                    className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold"
                  >
                    ✕ Reject
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {/* WhatsApp */}
                {cleaner.phone && (
                  <button
                    onClick={() => {
                      window.open(generateWhatsAppLink(cleaner.phone!, `Hi ${cleaner.name}! This is VillaCare admin.`), '_blank')
                      onClose()
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 bg-[#25D366] text-white rounded-xl text-sm font-medium"
                  >
                    <span>📱</span> WhatsApp
                  </button>
                )}

                {/* View Profile */}
                <button
                  onClick={() => window.open(`/${cleaner.slug}`, '_blank')}
                  className="flex items-center justify-center gap-2 py-2.5 bg-[#F5F5F3] text-[#1A1A1A] rounded-xl text-sm font-medium"
                >
                  <span>👁</span> View Profile
                </button>

                {/* Login as */}
                <button
                  onClick={() => {
                    onLoginAs?.(cleaner.userId, 'cleaner')
                    onClose()
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 bg-[#F5F5F3] text-[#1A1A1A] rounded-xl text-sm font-medium col-span-2"
                >
                  <span>🎭</span> Login as Cleaner
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// Cleaner Login Peek Content
// ============================================

function CleanerLoginPeekContent({
  item,
  isLocked,
  onLoginAs,
  onViewDetails: _onViewDetails,
  onClose,
}: {
  item: CleanerLoginCardData
  isLocked: boolean
  onLoginAs?: (userId: string, role: 'cleaner' | 'owner') => void
  onViewDetails?: (id: string, type: AdminCardType) => void
  onClose: () => void
}) {
  void _onViewDetails
  const { cleaner } = item

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {cleaner.photo ? (
          <div className="w-12 h-12 rounded-full overflow-hidden relative">
            <Image src={cleaner.photo} alt={cleaner.name} fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-[#9B9B9B] text-white flex items-center justify-center text-sm font-medium">
            {getInitials(cleaner.name)}
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-[#1A1A1A]">{cleaner.name}</h3>
          <p className="text-sm text-[#6B6B6B]">Logged in {formatRelativeTime(item.timestamp)}</p>
        </div>
      </div>

      {/* Actions (only when locked) */}
      {isLocked && (
        <div className="flex gap-2">
          <button
            onClick={() => window.open(`/${cleaner.slug}`, '_blank')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#F5F5F3] text-[#1A1A1A] rounded-xl text-sm font-medium"
          >
            <span>👁</span> View Profile
          </button>
          <button
            onClick={() => {
              onLoginAs?.(cleaner.id, 'cleaner')
              onClose()
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#F5F5F3] text-[#1A1A1A] rounded-xl text-sm font-medium"
          >
            <span>🎭</span> Login as
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================
// Review Peek Content
// ============================================

function ReviewPeekContent({
  item,
  isLocked,
  showConfirmAction,
  setShowConfirmAction,
  onApprove,
  onReject,
  onFeature,
  onUnfeature,
  onViewDetails: _onViewDetails,
  onClose,
}: {
  item: ReviewCardData
  isLocked: boolean
  showConfirmAction: string | null
  setShowConfirmAction: (v: string | null) => void
  onApprove?: (id: string, type: AdminCardType) => void
  onReject?: (id: string, type: AdminCardType) => void
  onFeature?: (id: string) => void
  onUnfeature?: (id: string) => void
  onViewDetails?: (id: string, type: AdminCardType) => void
  onClose: () => void
}) {
  void _onViewDetails
  const { review } = item
  const isPending = review.status === 'PENDING'
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)

  return (
    <div className="space-y-4">
      {/* Rating */}
      <div className="text-center">
        <div className="text-3xl text-[#C4785A] mb-1">{stars}</div>
        <p className="text-sm text-[#6B6B6B]">{review.rating} out of 5 stars</p>
      </div>

      {/* Review text */}
      <blockquote className="text-[#1A1A1A] text-center italic">
        &ldquo;{review.text}&rdquo;
      </blockquote>

      {/* Author + Cleaner */}
      <div className="flex items-center justify-center gap-4 text-sm">
        <span className="text-[#6B6B6B]">{review.authorName}</span>
        <span className="text-[#9B9B9B]">→</span>
        <span className="font-medium text-[#1A1A1A]">{review.cleanerName}</span>
      </div>

      {/* Actions (only when locked) */}
      {isLocked && (
        <div className="space-y-3">
          {/* Reject confirmation */}
          {showConfirmAction === 'reject' ? (
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-sm text-red-700 mb-3">Reject this review?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmAction(null)}
                  className="flex-1 py-2 bg-white border border-[#DEDEDE] rounded-lg text-sm font-medium"
                >
                  No, keep it
                </button>
                <button
                  onClick={() => {
                    onReject?.(review.id, item.type)
                    onClose()
                  }}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
                >
                  Yes, reject
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Approve/Reject for pending */}
              {isPending && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onApprove?.(review.id, item.type)
                      onClose()
                    }}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => setShowConfirmAction('reject')}
                    className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold"
                  >
                    ✕ Reject
                  </button>
                </div>
              )}

              {/* Feature toggle */}
              {!isPending && (
                <button
                  onClick={() => {
                    if (review.featured) {
                      onUnfeature?.(review.id)
                    } else {
                      onFeature?.(review.id)
                    }
                    onClose()
                  }}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium ${
                    review.featured
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-[#F5F5F3] text-[#1A1A1A]'
                  }`}
                >
                  {review.featured ? '★ Remove from Featured' : '☆ Add to Featured'}
                </button>
              )}

              {/* View cleaner profile */}
              <button
                onClick={() => window.open(`/${review.cleanerSlug}`, '_blank')}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#F5F5F3] text-[#1A1A1A] rounded-xl text-sm font-medium"
              >
                <span>👁</span> View {review.cleanerName}&apos;s Profile
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// Owner Peek Content
// ============================================

function OwnerPeekContent({
  item,
  isLocked,
  onLoginAs,
  onMessage: _onMessage,
  onEmail,
  onAddNote,
  onViewDetails: _onViewDetails,
  onClose,
}: {
  item: OwnerActivityCardData
  isLocked: boolean
  onLoginAs?: (userId: string, role: 'cleaner' | 'owner') => void
  onMessage?: (userId: string, type: 'cleaner' | 'owner', phone?: string) => void
  onEmail?: (email: string, name: string) => void
  onAddNote?: (id: string, type: 'cleaner' | 'owner') => void
  onViewDetails?: (id: string, type: AdminCardType) => void
  onClose: () => void
}) {
  void _onMessage
  void _onViewDetails
  const { owner, type, dormantReason } = item

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-[#0288D1] text-white flex items-center justify-center text-xl font-medium">
          {getInitials(owner.name)}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#1A1A1A]">{owner.name}</h3>
          <p className="text-sm text-[#6B6B6B]">{owner.email}</p>
          {owner.phone && <p className="text-sm text-[#6B6B6B]">{owner.phone}</p>}
        </div>
      </div>

      {/* Dormant warning */}
      {type === 'owner_dormant' && (
        <div className="bg-orange-50 rounded-xl p-3 flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <p className="text-sm text-orange-700">
            {dormantReason === 'no_booking_90_days' ? 'No bookings in 90+ days' :
             dormantReason === 'no_booking_60_days' ? 'No bookings in 60+ days' :
             'No bookings in 30+ days'}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="bg-[#F5F5F3] rounded-xl p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-[#6B6B6B]">Properties</span>
          <span className="text-sm font-medium text-[#1A1A1A]">{owner.propertyCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-[#6B6B6B]">Total Bookings</span>
          <span className="text-sm font-medium text-[#1A1A1A]">{owner.bookingCount}</span>
        </div>
        {owner.totalSpent > 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-[#6B6B6B]">Total Spent</span>
            <span className="text-sm font-medium text-[#1A1A1A]">€{owner.totalSpent}</span>
          </div>
        )}
        {owner.ownerType && (
          <div className="flex justify-between">
            <span className="text-sm text-[#6B6B6B]">Owner Type</span>
            <span className="text-sm font-medium text-[#1A1A1A]">
              {owner.ownerType === 'REMOTE' ? '✈️ Remote' : '🏠 Resident'}
            </span>
          </div>
        )}
      </div>

      {/* CRM Notes */}
      {owner.adminNotes && (
        <div className="bg-yellow-50 rounded-xl p-3">
          <p className="text-xs text-yellow-700 font-medium mb-1">Admin Notes</p>
          <p className="text-sm text-[#1A1A1A]">{owner.adminNotes}</p>
        </div>
      )}

      {/* Actions (only when locked) */}
      {isLocked && (
        <div className="grid grid-cols-2 gap-2">
          {/* WhatsApp */}
          {owner.phone && (
            <button
              onClick={() => {
                window.open(generateWhatsAppLink(owner.phone!, `Hi ${owner.name}!`), '_blank')
                onClose()
              }}
              className="flex items-center justify-center gap-2 py-2.5 bg-[#25D366] text-white rounded-xl text-sm font-medium"
            >
              <span>📱</span> WhatsApp
            </button>
          )}

          {/* Email */}
          <button
            onClick={() => {
              onEmail?.(owner.email, owner.name)
              onClose()
            }}
            className="flex items-center justify-center gap-2 py-2.5 bg-[#F5F5F3] text-[#1A1A1A] rounded-xl text-sm font-medium"
          >
            <span>📧</span> Email
          </button>

          {/* Add Note */}
          <button
            onClick={() => {
              onAddNote?.(owner.id, 'owner')
              onClose()
            }}
            className="flex items-center justify-center gap-2 py-2.5 bg-[#F5F5F3] text-[#1A1A1A] rounded-xl text-sm font-medium"
          >
            <span>📝</span> Add Note
          </button>

          {/* Login as */}
          <button
            onClick={() => {
              onLoginAs?.(owner.userId, 'owner')
              onClose()
            }}
            className="flex items-center justify-center gap-2 py-2.5 bg-[#F5F5F3] text-[#1A1A1A] rounded-xl text-sm font-medium"
          >
            <span>🎭</span> Login as
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================
// Alert Peek Content
// ============================================

function AlertPeekContent({
  item,
  isLocked,
  onResolveAlert,
  onDismissAlert,
  onViewDetails: _onViewDetails,
  onClose,
}: {
  item: SystemAlertCardData
  isLocked: boolean
  onResolveAlert?: (id: string) => void
  onDismissAlert?: (id: string) => void
  onViewDetails?: (id: string, type: AdminCardType) => void
  onClose: () => void
}) {
  void _onViewDetails
  const { alert } = item
  const severityStyles = {
    error: { bg: 'bg-red-100', text: 'text-red-700', icon: '🔴' },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '🟡' },
    info: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🔵' },
  }[alert.severity]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl ${severityStyles.bg} flex items-center justify-center text-2xl`}>
          {severityStyles.icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#1A1A1A]">{alert.title}</h3>
          <p className="text-sm text-[#6B6B6B]">Source: {alert.source}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[#1A1A1A]">{alert.description}</p>

      {/* Metadata */}
      {alert.metadata && Object.keys(alert.metadata).length > 0 && (
        <div className="bg-[#F5F5F3] rounded-xl p-3">
          <p className="text-xs text-[#6B6B6B] font-medium mb-2">Details</p>
          <pre className="text-xs text-[#1A1A1A] overflow-x-auto">
            {JSON.stringify(alert.metadata, null, 2)}
          </pre>
        </div>
      )}

      {/* Actions (only when locked) */}
      {isLocked && !alert.resolved && (
        <div className="flex gap-2">
          <button
            onClick={() => {
              onResolveAlert?.(alert.id)
              onClose()
            }}
            className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold"
          >
            ✓ Mark Resolved
          </button>
          <button
            onClick={() => {
              onDismissAlert?.(alert.id)
              onClose()
            }}
            className="flex-1 py-3 bg-[#F5F5F3] text-[#6B6B6B] rounded-xl text-sm font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {alert.resolved && (
        <div className="bg-green-50 rounded-xl p-3 flex items-center gap-2">
          <span>✓</span>
          <p className="text-sm text-green-700">
            Resolved {alert.resolvedAt && `on ${new Date(alert.resolvedAt).toLocaleDateString()}`}
            {alert.resolvedBy && ` by ${alert.resolvedBy}`}
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================
// Audit Peek Content
// ============================================

function AuditPeekContent({
  item,
  isLocked,
}: {
  item: AuditEntryCardData
  isLocked: boolean
}) {
  const { audit } = item

  // Format action nicely
  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase())
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <p className="text-2xl mb-2">📜</p>
        <h3 className="text-lg font-semibold text-[#1A1A1A]">{formatAction(audit.action)}</h3>
        <p className="text-sm text-[#6B6B6B]">
          by {audit.actorName} ({audit.actorRole})
        </p>
      </div>

      {/* Details */}
      <div className="bg-[#F5F5F3] rounded-xl p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-[#6B6B6B]">Timestamp</span>
          <span className="text-sm font-medium text-[#1A1A1A]">
            {audit.createdAt.toLocaleString()}
          </span>
        </div>
        {audit.targetType && (
          <div className="flex justify-between">
            <span className="text-sm text-[#6B6B6B]">Target Type</span>
            <span className="text-sm font-medium text-[#1A1A1A]">{audit.targetType}</span>
          </div>
        )}
        {audit.targetName && (
          <div className="flex justify-between">
            <span className="text-sm text-[#6B6B6B]">Target</span>
            <span className="text-sm font-medium text-[#1A1A1A]">{audit.targetName}</span>
          </div>
        )}
        {audit.ipAddress && (
          <div className="flex justify-between">
            <span className="text-sm text-[#6B6B6B]">IP Address</span>
            <span className="text-sm font-medium text-[#1A1A1A]">{audit.ipAddress}</span>
          </div>
        )}
      </div>

      {/* Raw details */}
      {isLocked && audit.details && Object.keys(audit.details).length > 0 && (
        <div className="bg-[#F5F5F3] rounded-xl p-3">
          <p className="text-xs text-[#6B6B6B] font-medium mb-2">Raw Details</p>
          <pre className="text-xs text-[#1A1A1A] overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(audit.details, null, 2)}
          </pre>
        </div>
      )}

      {/* User agent */}
      {isLocked && audit.userAgent && (
        <p className="text-xs text-[#9B9B9B] truncate">
          User Agent: {audit.userAgent}
        </p>
      )}
    </div>
  )
}
