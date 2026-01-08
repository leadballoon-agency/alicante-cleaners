'use client'

import { useState } from 'react'
import { Owner } from '../page'

// Copy to clipboard helper
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// Email compose modal
function EmailModal({
  owner,
  onClose,
}: {
  owner: Owner
  onClose: () => void
}) {
  const [subject, setSubject] = useState('Hello from VillaCare')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setError('Please enter a subject and message')
      return
    }

    setSending(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: owner.email,
          toName: owner.name.split(' ')[0],
          subject,
          message,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send email')
      }

      setSent(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#EBEBEB]">
          <div>
            <h3 className="font-semibold text-[#1A1A1A]">Send Email</h3>
            <p className="text-sm text-[#6B6B6B]">To: {owner.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F5F5F3] rounded-full"
          >
            <svg className="w-5 h-5 text-[#6B6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {sent ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#2E7D32]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[#1A1A1A] font-medium">Email sent!</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] text-sm focus:outline-none focus:border-[#1A1A1A]"
                  placeholder="Email subject..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] text-sm focus:outline-none focus:border-[#1A1A1A] resize-none"
                  placeholder="Write your message..."
                />
              </div>

              {error && (
                <p className="text-sm text-[#C62828] bg-[#FFEBEE] px-3 py-2 rounded-lg">{error}</p>
              )}

              <div className="text-xs text-[#9B9B9B]">
                From: support@alicantecleaners.com
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!sent && (
          <div className="p-4 border-t border-[#EBEBEB] flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-white border border-[#DEDEDE] text-[#1A1A1A] rounded-xl text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !message.trim()}
              className="flex-1 py-3 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Get relative time string
function getRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return 'Never'
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

type Props = {
  owners: Owner[]
}

type View = 'list' | 'properties' | 'bookings'

export default function OwnersTab({ owners }: Props) {
  const [search, setSearch] = useState('')
  const [expandedOwner, setExpandedOwner] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<View>('list')
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)
  const [emailingOwner, setEmailingOwner] = useState<Owner | null>(null)

  const handleCopyEmail = async (email: string) => {
    const success = await copyToClipboard(email)
    if (success) {
      setCopiedEmail(email)
      setTimeout(() => setCopiedEmail(null), 2000)
    }
  }

  const filteredOwners = owners.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const selectedOwner = owners.find(o => o.id === expandedOwner)

  const languageFlags: Record<string, string> = {
    en: '🇬🇧',
    es: '🇪🇸',
    de: '🇩🇪',
    fr: '🇫🇷',
    nl: '🇳🇱',
    it: '🇮🇹',
    pt: '🇵🇹',
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-[#FFF3E0] text-[#E65100]',
    confirmed: 'bg-[#E8F5E9] text-[#2E7D32]',
    completed: 'bg-[#F5F5F3] text-[#6B6B6B]',
    cancelled: 'bg-[#FFEBEE] text-[#C62828]',
  }

  // Properties view for selected owner
  if (currentView === 'properties' && selectedOwner) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setCurrentView('list')}
          className="flex items-center gap-2 text-[#6B6B6B] mb-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Owners
        </button>

        <div>
          <h2 className="text-xl font-semibold text-[#1A1A1A]">{selectedOwner.name}&apos;s Properties</h2>
          <p className="text-sm text-[#6B6B6B]">{selectedOwner.properties.length} properties</p>
        </div>

        <div className="space-y-3">
          {selectedOwner.properties.length === 0 ? (
            <div className="bg-[#F5F5F3] rounded-2xl p-8 text-center">
              <p className="text-3xl mb-2">🏠</p>
              <p className="text-[#6B6B6B]">No properties added yet</p>
            </div>
          ) : (
            selectedOwner.properties.map((property) => (
              <div
                key={property.id}
                className="bg-white rounded-2xl p-4 border border-[#EBEBEB]"
              >
                <h3 className="font-semibold text-[#1A1A1A] mb-1">{property.name}</h3>
                <p className="text-sm text-[#6B6B6B] mb-3">{property.address}</p>
                <div className="flex gap-3 text-sm">
                  <span className="text-[#6B6B6B]">🛏️ {property.bedrooms} bed</span>
                  <span className="text-[#6B6B6B]">🛁 {property.bathrooms} bath</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // Bookings view for selected owner
  if (currentView === 'bookings' && selectedOwner) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setCurrentView('list')}
          className="flex items-center gap-2 text-[#6B6B6B] mb-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Owners
        </button>

        <div>
          <h2 className="text-xl font-semibold text-[#1A1A1A]">{selectedOwner.name}&apos;s Bookings</h2>
          <p className="text-sm text-[#6B6B6B]">{selectedOwner.recentBookings.length} recent bookings</p>
        </div>

        <div className="space-y-3">
          {selectedOwner.recentBookings.length === 0 ? (
            <div className="bg-[#F5F5F3] rounded-2xl p-8 text-center">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-[#6B6B6B]">No bookings yet</p>
            </div>
          ) : (
            selectedOwner.recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl p-4 border border-[#EBEBEB]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm text-[#6B6B6B]">{formatDate(booking.date)}</p>
                    <p className="font-semibold text-[#1A1A1A]">{booking.service}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${statusColors[booking.status]}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="space-y-1">
                    <p className="text-[#6B6B6B]">🏠 {booking.propertyName}</p>
                    <p className="text-[#6B6B6B]">🧹 {booking.cleanerName}</p>
                  </div>
                  <span className="font-semibold text-[#1A1A1A]">€{booking.price}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // Main list view
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-[#1A1A1A]">Owners</h2>
        <p className="text-sm text-[#6B6B6B]">
          {owners.length} total · {owners.filter(o => o.trusted).length} trusted
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] text-sm focus:outline-none focus:border-[#1A1A1A]"
      />

      {/* Owner Cards */}
      <div className="space-y-3">
        {filteredOwners.length === 0 ? (
          <div className="bg-[#F5F5F3] rounded-2xl p-8 text-center">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-[#6B6B6B]">No owners found</p>
          </div>
        ) : (
          filteredOwners.map((owner) => (
            <div
              key={owner.id}
              className="bg-white rounded-2xl p-4 border border-[#EBEBEB]"
            >
              {/* Header Row */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-[#F5F5F3] flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-semibold text-[#6B6B6B]">
                    {owner.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[#1A1A1A]">{owner.name}</h3>
                        {owner.trusted && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[#E8F5E9] text-[#2E7D32]">
                            Trusted
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#6B6B6B] truncate">{owner.email}</p>
                    </div>
                    <span className="text-lg" title={owner.preferredLanguage}>
                      {languageFlags[owner.preferredLanguage] || '🌐'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mb-3">
                <span className="text-[#6B6B6B]">🏠 {owner.propertyCount} villas</span>
                <span className="text-[#6B6B6B]">📋 {owner.bookingCount} bookings</span>
                <span className="text-[#6B6B6B]">⭐ {owner.reviewsGiven} reviews</span>
                <span className="text-[#9B9B9B] text-xs">
                  Last seen: {getRelativeTime(owner.lastLoginAt)}
                </span>
              </div>

              {/* Referral Code */}
              {owner.referralCode && (
                <div className="text-xs text-[#9B9B9B] mb-3">
                  Referral: <span className="font-mono">{owner.referralCode}</span>
                  {owner.referralCredits > 0 && (
                    <span className="ml-2 text-[#2E7D32]">€{owner.referralCredits} credits</span>
                  )}
                </div>
              )}

              {/* Contact Actions */}
              <div className="flex gap-2 pt-3 border-t border-[#EBEBEB]/50 mb-2">
                <button
                  onClick={() => handleCopyEmail(owner.email)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition-all ${
                    copiedEmail === owner.email
                      ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]'
                      : 'bg-white border border-[#DEDEDE] text-[#1A1A1A]'
                  }`}
                >
                  {copiedEmail === owner.email ? '✓ Copied!' : '📋 Copy'}
                </button>
                <button
                  onClick={() => setEmailingOwner(owner)}
                  className="flex-1 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium active:scale-[0.98] transition-transform"
                >
                  ✉️ Email
                </button>
                {owner.phone && (
                  <a
                    href={`https://wa.me/${owner.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hi! This is the VillaCare team.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-[#25D366] text-white rounded-xl text-sm font-medium active:scale-[0.98] transition-transform text-center"
                  >
                    💬 WhatsApp
                  </a>
                )}
              </div>

              {/* View Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setExpandedOwner(owner.id)
                    setCurrentView('properties')
                  }}
                  className="flex-1 py-2.5 bg-white border border-[#DEDEDE] text-[#1A1A1A] rounded-xl text-sm font-medium active:scale-[0.98] transition-transform"
                >
                  🏠 Properties
                </button>
                <button
                  onClick={() => {
                    setExpandedOwner(owner.id)
                    setCurrentView('bookings')
                  }}
                  className="flex-1 py-2.5 bg-white border border-[#DEDEDE] text-[#1A1A1A] rounded-xl text-sm font-medium active:scale-[0.98] transition-transform"
                >
                  📋 Bookings
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Email Modal */}
      {emailingOwner && (
        <EmailModal
          owner={emailingOwner}
          onClose={() => setEmailingOwner(null)}
        />
      )}
    </div>
  )
}
