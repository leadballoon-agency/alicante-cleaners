'use client'

import { useState, useEffect, useCallback } from 'react'
import HomeTab from './tabs/home'
import BookingsTab from './tabs/bookings'
import PropertiesTab from './tabs/properties'
import MessagesTab from './tabs/messages'
import AccountTab from './tabs/account'
import ReviewModal from './components/review-modal'
import { ChatWidget } from '@/components/ai/chat-widget'

type Tab = 'home' | 'bookings' | 'properties' | 'messages' | 'account'

export type Owner = {
  id: string
  name: string
  email: string
  phone: string
  referralCode: string
  referrals: { name: string; joinedAt: Date; hasBooked: boolean }[]
  referralCredits: number
}

export type Property = {
  id: string
  name: string
  address: string
  bedrooms: number
  savedCleaner: {
    id: string
    name: string
    slug: string
    phone: string
  } | null
}

export type OwnerBooking = {
  id: string
  status: 'pending' | 'confirmed' | 'completed'
  service: string
  price: number
  date: Date
  time: string
  property: {
    id: string
    name: string
    address: string
    bedrooms: number
  }
  cleaner: {
    id: string
    name: string
    photo: string | null
    slug: string
  }
  hasReviewedCleaner?: boolean
}

export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [owner, setOwner] = useState<Owner | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [bookings, setBookings] = useState<OwnerBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewModal, setReviewModal] = useState<{
    bookingId: string
    cleanerId: string
    cleanerName: string
  } | null>(null)

  // Fetch owner data
  const fetchDashboardData = useCallback(async () => {
    try {
      const [ownerRes, bookingsRes, propertiesRes] = await Promise.all([
        fetch('/api/dashboard/owner'),
        fetch('/api/dashboard/owner/bookings'),
        fetch('/api/dashboard/owner/properties'),
      ])

      if (!ownerRes.ok) {
        throw new Error('Failed to load dashboard')
      }

      const ownerData = await ownerRes.json()
      const bookingsData = await bookingsRes.json()
      const propertiesData = await propertiesRes.json()

      setOwner(ownerData.owner)
      setBookings(bookingsData.bookings || [])
      setProperties(propertiesData.properties || [])
    } catch (err) {
      console.error('Dashboard error:', err)
      setError('Failed to load dashboard. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleLeaveReview = (bookingId: string, cleanerId: string, cleanerName: string) => {
    setReviewModal({ bookingId, cleanerId, cleanerName })
  }

  const handleSubmitReview = async (review: {
    rating: number
    text: string
    cleanerId: string
    bookingId: string
  }) => {
    try {
      const response = await fetch(`/api/dashboard/owner/bookings/${review.bookingId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: review.rating,
          text: review.text,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit review')
      }

      // Mark booking as reviewed in local state
      setBookings(prev => prev.map(b =>
        b.id === review.bookingId ? { ...b, hasReviewedCleaner: true } : b
      ))
    } catch (err) {
      console.error('Error submitting review:', err)
    }
  }

  const handleAddProperty = async (property: { name: string; address: string; bedrooms: number }) => {
    try {
      const response = await fetch('/api/dashboard/owner/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(property),
      })

      if (!response.ok) {
        throw new Error('Failed to add property')
      }

      const result = await response.json()
      setProperties(prev => [result.property, ...prev])
      return true
    } catch (err) {
      console.error('Error adding property:', err)
      return false
    }
  }

  const handleMessage = async (cleanerId: string, _cleanerName: string, propertyId?: string) => {
    try {
      // Create or get existing conversation
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanerId, propertyId }),
      })

      if (!response.ok) {
        throw new Error('Failed to start conversation')
      }

      // Switch to messages tab
      setActiveTab('messages')
    } catch (err) {
      console.error('Error starting conversation:', err)
    }
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'bookings', label: 'Bookings', icon: '📋' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'properties', label: 'Villas', icon: '🏡' },
    { id: 'account', label: 'Account', icon: '👤' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <span className="w-8 h-8 border-2 border-[#1A1A1A]/20 border-t-[#1A1A1A] rounded-full animate-spin inline-block" />
          <p className="text-[#6B6B6B] mt-3">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !owner) {
    return (
      <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">
            {error || 'Dashboard unavailable'}
          </h1>
          <p className="text-[#6B6B6B] mb-4">
            Please make sure you&apos;re logged in as an owner.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#1A1A1A] text-white px-6 py-2.5 rounded-xl font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] font-sans pb-20">
      {/* Header */}
      <header className="px-6 py-4 pt-safe bg-white border-b border-[#EBEBEB]">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-[#6B6B6B]">Welcome back,</p>
            <h1 className="text-lg font-semibold text-[#1A1A1A]">
              {owner.name?.split(' ')[0]}
            </h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#C4785A] flex items-center justify-center">
            <span className="text-white font-semibold">
              {owner.name?.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
        </div>
      </header>

      {/* Tab content */}
      <main className="px-6 py-6 max-w-lg mx-auto">
        {activeTab === 'home' && (
          <HomeTab
            owner={owner}
            properties={properties}
            bookings={bookings}
          />
        )}
        {activeTab === 'bookings' && (
          <BookingsTab bookings={bookings} onLeaveReview={handleLeaveReview} onMessage={handleMessage} />
        )}
        {activeTab === 'messages' && <MessagesTab />}
        {activeTab === 'properties' && (
          <PropertiesTab properties={properties} onAddProperty={handleAddProperty} />
        )}
        {activeTab === 'account' && (
          <AccountTab owner={owner} />
        )}
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#EBEBEB] pb-safe">
        <div className="max-w-lg mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
                activeTab === tab.id
                  ? 'text-[#1A1A1A]'
                  : 'text-[#9B9B9B]'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Review Modal */}
      {reviewModal && (
        <ReviewModal
          bookingId={reviewModal.bookingId}
          cleanerId={reviewModal.cleanerId}
          cleanerName={reviewModal.cleanerName}
          onClose={() => setReviewModal(null)}
          onSubmit={handleSubmitReview}
        />
      )}

      {/* AI Chat Widget */}
      <ChatWidget
        agentType="owner"
        agentName="Villa Assistant"
        agentDescription="Your personal villa management helper"
      />
    </div>
  )
}
