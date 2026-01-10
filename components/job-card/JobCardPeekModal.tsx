'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  BookingCardData,
  JobCardContext,
  getStatusStyles,
  getInitials,
  formatDate,
  getRecurringLabel,
  isToday,
  generateWhatsAppLink,
  generateCalendarLink
} from './types'

// Quick message templates for cleaners
type SupportedLang = 'en' | 'es' | 'de' | 'fr' | 'nl' | 'pt' | 'it'

const MESSAGE_LABELS: Record<SupportedLang, Record<string, string>> = {
  en: { runningLate: 'Running late', onMyWay: 'On my way', accessHelp: 'Access help', customMessage: 'Custom message' },
  es: { runningLate: 'Llegando tarde', onMyWay: 'En camino', accessHelp: 'Ayuda acceso', customMessage: 'Mensaje' },
  de: { runningLate: 'Verspätung', onMyWay: 'Unterwegs', accessHelp: 'Zugang Hilfe', customMessage: 'Nachricht' },
  fr: { runningLate: 'En retard', onMyWay: 'En route', accessHelp: 'Aide accès', customMessage: 'Message' },
  nl: { runningLate: 'Ben laat', onMyWay: 'Onderweg', accessHelp: 'Toegang hulp', customMessage: 'Bericht' },
  pt: { runningLate: 'Atrasado', onMyWay: 'A caminho', accessHelp: 'Ajuda acesso', customMessage: 'Mensagem' },
  it: { runningLate: 'In ritardo', onMyWay: 'In arrivo', accessHelp: 'Aiuto accesso', customMessage: 'Messaggio' },
}

interface Props {
  booking: BookingCardData | null
  context: JobCardContext
  isVisible: boolean
  isLocked: boolean
  lockProgress: number
  onClose: () => void
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
  cleanerName?: string
}

export default function JobCardPeekModal({
  booking,
  context,
  isVisible,
  isLocked,
  lockProgress,
  onClose,
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSendMessage,
  cleanerName = 'Your cleaner'
}: Props) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showCustomMessage, setShowCustomMessage] = useState(false)
  const [customMessage, setCustomMessage] = useState('')

  // Prevent scroll when modal is visible
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setShowCancelConfirm(false)
      setShowCustomMessage(false)
      setCustomMessage('')
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isVisible])

  if (!booking || !isVisible) return null

  const statusStyles = getStatusStyles(booking.status)
  const isPending = booking.status === 'pending'
  const isConfirmed = booking.status === 'confirmed'
  const isCompleted = booking.status === 'completed'
  const isCancelled = booking.status === 'cancelled'
  const recurringLabel = booking.isRecurring ? getRecurringLabel(booking.recurringFrequency) : null

  // Owner context
  const isOwner = context === 'owner'
  const canReview = isOwner && isCompleted && !booking.hasReviewedCleaner
  const canComplete = !isOwner && isConfirmed && isToday(booking.date)

  // Determine display info based on context
  const displayName = isOwner ? booking.cleanerName : (booking.ownerName || 'Owner')
  const displayPhoto = isOwner ? booking.cleanerPhoto : null
  const displayRole = isOwner ? 'Your Cleaner' : 'Property Owner'
  const contactPhone = isOwner ? booking.cleanerPhone : booking.ownerPhone

  // Language for cleaner messages
  const lang = (booking.ownerLanguage || 'en') as SupportedLang
  const validLang: SupportedLang = ['en', 'es', 'de', 'fr', 'nl', 'pt', 'it'].includes(lang) ? lang : 'en'
  const labels = MESSAGE_LABELS[validLang] || MESSAGE_LABELS.en

  // Missing info flags for JIT prompts (owner context only)
  const missingAccess = isOwner && !booking.accessNotes && !booking.keyHolderName
  const missingInstructions = isOwner && !booking.specialInstructions

  // Cleaner WhatsApp message handler
  const handleCleanerWhatsApp = (type: 'runningLate' | 'onMyWay' | 'accessHelp') => {
    if (!booking.ownerPhone) return

    const messages: Record<string, string> = {
      runningLate: `Hi ${booking.ownerName || 'there'}! 👋\n\nIt's ${cleanerName} from VillaCare. I'm running about 10 minutes late for your ${booking.time} clean today.\n\nI'll be there shortly!\n\n- ${cleanerName}`,
      onMyWay: `Hi ${booking.ownerName || 'there'}! 👋\n\nIt's ${cleanerName} from VillaCare. Just letting you know I'm on my way to ${booking.propertyName || booking.propertyAddress} now.\n\nSee you soon! 🏠\n\n- ${cleanerName}`,
      accessHelp: `Hi ${booking.ownerName || 'there'}! 👋\n\nIt's ${cleanerName} from VillaCare. I'm at ${booking.propertyName || booking.propertyAddress} but having trouble with access.\n\nCould you help me get in?\n\n- ${cleanerName}`,
    }

    window.open(generateWhatsAppLink(booking.ownerPhone, messages[type]), '_blank')
    onClose()
  }

  const handleCustomWhatsAppMessage = () => {
    if (!customMessage.trim() || !booking.ownerPhone) return
    const formatted = `Hi ${booking.ownerName || 'there'}! 👋\n\n${customMessage.trim()}\n\n- ${cleanerName}`
    window.open(generateWhatsAppLink(booking.ownerPhone, formatted), '_blank')
    setCustomMessage('')
    setShowCustomMessage(false)
    onClose()
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={isLocked ? onClose : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-200 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        } ${isLocked ? 'ring-2 ring-[#C4785A] ring-offset-2' : ''}`}
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lock progress */}
        {!isLocked && lockProgress > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#EBEBEB] rounded-t-3xl overflow-hidden">
            <div className="h-full bg-[#C4785A] transition-all duration-100" style={{ width: `${lockProgress * 100}%` }} />
          </div>
        )}

        {/* Drag / Lock indicator */}
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
            {displayPhoto ? (
              <div className="w-14 h-14 rounded-full overflow-hidden relative flex-shrink-0">
                <Image src={displayPhoto} alt={displayName} fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#C4785A] text-white flex items-center justify-center text-lg font-medium flex-shrink-0">
                {getInitials(displayName)}
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
              <p className="text-sm text-[#6B6B6B]">{displayName}</p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-[#F5F5F3] rounded-xl p-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-lg">📅</span>
              </div>
              <div>
                <p className="font-medium text-[#1A1A1A]">{formatDate(booking.date, 'full')}</p>
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
              {!isOwner && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(booking.propertyAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg text-[#C4785A] hover:bg-[#FFF8F5] transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Maps
                </a>
              )}
            </div>
          </div>

          {/* Contact (cleaner for owner, owner for cleaner) */}
          <div className="bg-[#F5F5F3] rounded-xl p-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-lg">{isOwner ? '🧹' : '👤'}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-[#1A1A1A]">{displayName}</p>
                <p className="text-xs text-[#6B6B6B]">{displayRole}</p>
              </div>
              {contactPhone && isLocked && (
                <a
                  href={`tel:${contactPhone}`}
                  className="flex items-center gap-2 px-3 py-2 bg-[#E8F5E9] text-[#2E7D32] rounded-lg font-medium text-sm"
                >
                  <span>📞</span>
                  Call
                </a>
              )}
            </div>
          </div>

          {/* Key Holder (if exists) */}
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

          {/* Access Notes (if exists) */}
          {booking.accessNotes && (
            <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-4 mb-3">
              <div className="flex items-start gap-3">
                <span className="text-lg">🔑</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-[#1A1A1A]">Access Notes</p>
                    {isLocked && isOwner && onAddAccess && (
                      <button
                        onClick={() => { onAddAccess(booking.id); onClose() }}
                        className="text-xs text-[#E65100] hover:underline"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-[#6B6B6B]">{booking.accessNotes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Special Instructions (if exists) */}
          {booking.specialInstructions && (
            <div className="bg-[#FFF8F5] border border-[#F5E6E0] rounded-xl p-4 mb-3">
              <div className="flex items-start gap-3">
                <span className="text-lg">📝</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-[#1A1A1A]">Special Instructions</p>
                    {isLocked && isOwner && onAddInstructions && (
                      <button
                        onClick={() => { onAddInstructions(booking.id); onClose() }}
                        className="text-xs text-[#C4785A] hover:underline"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-[#6B6B6B]">{booking.specialInstructions}</p>
                </div>
              </div>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between py-3 border-t border-[#EBEBEB]">
            <span className="text-[#6B6B6B]">Total</span>
            <span className="text-2xl font-bold text-[#1A1A1A]">€{booking.price}</span>
          </div>

          {/* === LOCKED MODE ACTIONS === */}
          {isLocked && (
            <>
              {/* JIT Prompts for Owner (when info is missing) */}
              {isOwner && (isPending || isConfirmed) && !isCancelled && (missingAccess || missingInstructions) && (
                <div className="mt-4 space-y-2">
                  {missingAccess && onAddAccess && (
                    <button
                      onClick={() => {
                        onAddAccess(booking.id)
                        onClose()
                      }}
                      className="w-full bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-4 text-left hover:bg-[#FFF3CD] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🔑</span>
                        <div className="flex-1">
                          <p className="font-medium text-[#1A1A1A]">Add access details</p>
                          <p className="text-xs text-[#6B6B6B]">Key location, alarm code, key holder</p>
                        </div>
                        <span className="text-[#E65100]">→</span>
                      </div>
                    </button>
                  )}
                  {missingInstructions && onAddInstructions && (
                    <button
                      onClick={() => {
                        onAddInstructions(booking.id)
                        onClose()
                      }}
                      className="w-full bg-[#FFF8F5] border border-[#F5E6E0] rounded-xl p-4 text-left hover:bg-[#FFF3EE] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📝</span>
                        <div className="flex-1">
                          <p className="font-medium text-[#C4785A]">Add special instructions</p>
                          <p className="text-xs text-[#6B6B6B]">Focus areas, guest info, preferences</p>
                        </div>
                        <span className="text-[#C4785A]">→</span>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* Cancel confirmation */}
              {showCancelConfirm ? (
                <div className="mt-4 bg-[#FFEBEE] border border-[#FFCDD2] rounded-xl p-4">
                  <p className="text-sm text-[#C62828] mb-3">Are you sure you want to cancel this booking?</p>
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
                  {/* === OWNER ACTIONS === */}
                  {isOwner && (
                    <div className="mt-4 space-y-2">
                      {/* PENDING: Message, Adjust time, Cancel */}
                      {isPending && (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            {onMessage && (
                              <button
                                onClick={() => { onMessage(booking.id); onClose() }}
                                className="py-3 px-4 bg-[#F5F5F3] text-[#1A1A1A] rounded-xl font-medium hover:bg-[#EBEBEB] transition-colors flex items-center justify-center gap-2 text-sm"
                              >
                                <span>💬</span> Message
                              </button>
                            )}
                            {onAdjustTime && (
                              <button
                                onClick={() => { onAdjustTime(booking.id); onClose() }}
                                className="py-3 px-4 bg-[#F5F5F3] text-[#1A1A1A] rounded-xl font-medium hover:bg-[#EBEBEB] transition-colors flex items-center justify-center gap-2 text-sm"
                              >
                                <span>🕐</span> Adjust time
                              </button>
                            )}
                          </div>
                          {onCancel && (
                            <button
                              onClick={() => setShowCancelConfirm(true)}
                              className="w-full py-3 px-4 border border-[#DEDEDE] text-[#6B6B6B] rounded-xl font-medium hover:bg-[#F5F5F3] transition-colors text-sm"
                            >
                              Cancel Request
                            </button>
                          )}
                          <p className="text-xs text-center text-[#9B9B9B]">
                            Waiting for {booking.cleanerName} to confirm
                          </p>
                        </>
                      )}

                      {/* CONFIRMED: Message, Calendar, Adjust time, Cancel */}
                      {isConfirmed && (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            {onMessage && (
                              <button
                                onClick={() => { onMessage(booking.id); onClose() }}
                                className="py-3 px-4 bg-[#F5F5F3] text-[#1A1A1A] rounded-xl font-medium hover:bg-[#EBEBEB] transition-colors flex items-center justify-center gap-2 text-sm"
                              >
                                <span>💬</span> Message
                              </button>
                            )}
                            <a
                              href={generateCalendarLink(booking)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-3 px-4 bg-[#F5F5F3] text-[#1A1A1A] rounded-xl font-medium hover:bg-[#EBEBEB] transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                              <span>📅</span> Calendar
                            </a>
                            {onAdjustTime && (
                              <button
                                onClick={() => { onAdjustTime(booking.id); onClose() }}
                                className="py-3 px-4 border border-[#DEDEDE] text-[#6B6B6B] rounded-xl font-medium hover:bg-[#F5F5F3] transition-colors text-sm"
                              >
                                Adjust time
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

                      {/* COMPLETED: Review, Book Again, Make Recurring */}
                      {isCompleted && (
                        <>
                          <div className="flex gap-2">
                            {canReview && onReview && (
                              <button
                                onClick={() => { onReview(booking.id); onClose() }}
                                className="flex-1 py-3 px-4 bg-[#C4785A] text-white rounded-xl font-medium hover:bg-[#B56A4F] transition-colors flex items-center justify-center gap-2"
                              >
                                <span>⭐</span> Leave Review
                              </button>
                            )}
                            {onBookAgain && (
                              <button
                                onClick={() => { onBookAgain(booking.id, booking.cleanerSlug); onClose() }}
                                className={`flex-1 py-3 px-4 ${canReview ? 'bg-[#F5F5F3] text-[#1A1A1A]' : 'bg-[#1A1A1A] text-white'} rounded-xl font-medium hover:opacity-90 transition-colors flex items-center justify-center gap-2`}
                              >
                                <span>🔄</span> Book Again
                              </button>
                            )}
                          </div>
                          {onMakeRecurring && !booking.isRecurring && (
                            <button
                              onClick={() => { onMakeRecurring(booking.id); onClose() }}
                              className="w-full py-3 px-4 border border-[#1565C0] text-[#1565C0] rounded-xl font-medium hover:bg-[#E3F2FD] transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                              <span>🔄</span> Make this a recurring clean
                            </button>
                          )}
                          {!canReview && booking.hasReviewedCleaner && (
                            <p className="text-xs text-center text-[#9B9B9B]">
                              You&apos;ve already reviewed this clean
                            </p>
                          )}
                        </>
                      )}

                      {/* CANCELLED: Book Again */}
                      {isCancelled && onBookAgain && (
                        <button
                          onClick={() => { onBookAgain(booking.id, booking.cleanerSlug); onClose() }}
                          className="w-full py-3 px-4 bg-[#1A1A1A] text-white rounded-xl font-medium hover:bg-[#333] transition-colors flex items-center justify-center gap-2"
                        >
                          <span>🔄</span> Book Again
                        </button>
                      )}
                    </div>
                  )}

                  {/* === CLEANER ACTIONS === */}
                  {!isOwner && (
                    <>
                      {/* WhatsApp Quick Messages */}
                      {booking.ownerPhone && (
                        <div className="mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            <p className="text-xs font-medium text-[#6B6B6B]">Message {booking.ownerName?.split(' ')[0] || 'owner'}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => handleCleanerWhatsApp('runningLate')} className="flex items-center gap-2 p-3 bg-[#E7FAE7] border border-[#25D366]/20 rounded-xl text-sm hover:bg-[#D4F5D4] transition-colors">
                              <span>🏃</span> {labels.runningLate}
                            </button>
                            <button onClick={() => handleCleanerWhatsApp('onMyWay')} className="flex items-center gap-2 p-3 bg-[#E7FAE7] border border-[#25D366]/20 rounded-xl text-sm hover:bg-[#D4F5D4] transition-colors">
                              <span>🚗</span> {labels.onMyWay}
                            </button>
                            <button onClick={() => handleCleanerWhatsApp('accessHelp')} className="flex items-center gap-2 p-3 bg-[#E7FAE7] border border-[#25D366]/20 rounded-xl text-sm hover:bg-[#D4F5D4] transition-colors col-span-2">
                              <span>🔑</span> {labels.accessHelp}
                            </button>
                          </div>
                          {showCustomMessage ? (
                            <div className="mt-2 flex gap-2">
                              <input
                                type="text"
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 px-3 py-2 border border-[#25D366]/30 rounded-xl text-sm focus:outline-none focus:border-[#25D366]"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCustomWhatsAppMessage()}
                              />
                              <button
                                onClick={handleCustomWhatsAppMessage}
                                disabled={!customMessage.trim()}
                                className="px-4 py-2 bg-[#25D366] text-white rounded-xl text-sm font-medium disabled:opacity-50"
                              >
                                Send
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowCustomMessage(true)}
                              className="mt-2 w-full p-3 border border-dashed border-[#25D366]/40 rounded-xl text-sm text-[#25D366] hover:bg-[#E7FAE7] transition-colors"
                            >
                              + {labels.customMessage}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Cleaner action buttons */}
                      <div className="mt-4 space-y-2">
                        {/* PENDING: Accept/Decline */}
                        {isPending && (onAccept || onDecline) && (
                          <div className="flex gap-2">
                            {onDecline && (
                              <button
                                onClick={() => { onDecline(booking.id); onClose() }}
                                className="flex-1 py-3 px-4 border border-[#DEDEDE] rounded-xl font-medium text-[#6B6B6B] hover:bg-[#F5F5F3] transition-colors"
                              >
                                Decline
                              </button>
                            )}
                            {onAccept && (
                              <button
                                onClick={() => { onAccept(booking.id); onClose() }}
                                className="flex-1 py-3 px-4 bg-[#2E7D32] text-white rounded-xl font-medium hover:bg-[#1B5E20] transition-colors"
                              >
                                Accept Job
                              </button>
                            )}
                          </div>
                        )}

                        {/* CONFIRMED + TODAY: Complete */}
                        {canComplete && onComplete && (
                          <button
                            onClick={() => { onComplete(booking.id); onClose() }}
                            className="w-full py-3 px-4 bg-[#1A1A1A] text-white rounded-xl font-medium hover:bg-[#333] transition-colors flex items-center justify-center gap-2"
                          >
                            <span>✓</span> Mark as Complete
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="w-full py-3 px-4 text-[#6B6B6B] font-medium hover:text-[#1A1A1A] transition-colors mt-2"
                  >
                    Close
                  </button>
                </>
              )}
            </>
          )}

          {/* PEEK MODE hint */}
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
