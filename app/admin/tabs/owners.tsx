'use client'

import { useState } from 'react'
import { Owner } from '../page'

type Props = {
  owners: Owner[]
}

type View = 'list' | 'properties' | 'bookings'

export default function OwnersTab({ owners }: Props) {
  const [search, setSearch] = useState('')
  const [expandedOwner, setExpandedOwner] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<View>('list')

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
              <div className="flex items-center gap-4 text-sm mb-3">
                <span className="text-[#6B6B6B]">🏠 {owner.propertyCount} villas</span>
                <span className="text-[#6B6B6B]">📋 {owner.bookingCount} bookings</span>
                <span className="text-[#6B6B6B]">⭐ {owner.reviewsGiven} reviews</span>
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

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-[#EBEBEB]/50">
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
    </div>
  )
}
