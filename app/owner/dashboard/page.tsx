'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
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
  needsName?: boolean
  ownerType?: 'REMOTE' | 'RESIDENT' | null
  onboarding?: {
    profileCompleted: boolean
    propertyAdded: boolean
    firstBooking: boolean
    completed: boolean
  }
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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  service: string
  price: number
  date: Date
  time: string
  specialInstructions?: string
  property: {
    id: string
    name: string
    address: string
    bedrooms: number
    accessNotes?: string
    keyHolderName?: string
    keyHolderPhone?: string
  }
  cleaner: {
    id: string
    name: string
    photo: string | null
    slug: string
    phone?: string
  }
  hasReviewedCleaner?: boolean
}

export default function OwnerDashboard() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const [showAdminBanner, setShowAdminBanner] = useState(true)

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
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInitialMessage, setChatInitialMessage] = useState<string | undefined>()

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

  const handleOpenChat = (initialMessage?: string) => {
    setChatInitialMessage(initialMessage)
    setChatOpen(true)
  }

  const handleCloseChat = () => {
    setChatOpen(false)
    setChatInitialMessage(undefined)
  }

  const handleReschedule = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (booking) {
      const message = `I need to reschedule my ${booking.service.toLowerCase()} at ${booking.property.name} (currently ${new Date(booking.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })} at ${booking.time}). Can you help me find a new time?`
      handleOpenChat(message)
    }
  }

  const handleCancel = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/dashboard/owner/bookings/${bookingId}/cancel`, {
        method: 'POST',
      })
      if (response.ok) {
        // Update local state
        setBookings(prev => prev.map(b =>
          b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
        ))
      }
    } catch (err) {
      console.error('Error cancelling booking:', err)
    }
  }

  const handleAddAccess = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (booking) {
      // Check if access notes already exist (editing vs adding)
      const hasAccessNotes = booking.property.accessNotes || booking.property.keyHolderName
      const message = hasAccessNotes
        ? `I need to update the access details for my ${booking.property.name} booking. The current notes may need changing - for example, I might be at the villa myself so the key holder isn't necessary.`
        : `I need to add access details for my ${booking.property.name} booking. Can you help me provide key location, alarm codes, or key holder info for my cleaner?`
      handleOpenChat(message)
    }
  }

  const handleAddInstructions = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (booking) {
      const message = `I'd like to add special instructions for my upcoming ${booking.service.toLowerCase()} at ${booking.property.name}. What details should I include for ${booking.cleaner.name}?`
      handleOpenChat(message)
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
      {/* Admin Banner - shown when an admin user lands on owner dashboard */}
      {isAdmin && showAdminBanner && (
        <div className="bg-[#1A1A1A] text-white px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg">🔐</span>
              <span className="text-sm truncate">You&apos;re logged in as Admin</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href="/admin"
                className="bg-white text-[#1A1A1A] px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Admin Panel
              </Link>
              <button
                onClick={() => setShowAdminBanner(false)}
                className="text-white/70 hover:text-white p-1"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

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
            onNavigate={(tab: Tab) => setActiveTab(tab)}
            onOwnerTypeChange={(ownerType: 'REMOTE' | 'RESIDENT') => {
              setOwner(prev => prev ? { ...prev, ownerType } : null)
            }}
            onMessage={(bookingId) => {
              const booking = bookings.find(b => b.id === bookingId)
              if (booking) {
                handleMessage(booking.cleaner.id, booking.cleaner.name, booking.property.id)
              }
            }}
            onReschedule={handleReschedule}
            onCancel={handleCancel}
            onReview={(bookingId) => {
              const booking = bookings.find(b => b.id === bookingId)
              if (booking) {
                handleLeaveReview(bookingId, booking.cleaner.id, booking.cleaner.name)
              }
            }}
            onAddAccess={handleAddAccess}
            onAddInstructions={handleAddInstructions}
            onOpenChat={handleOpenChat}
          />
        )}
        {activeTab === 'bookings' && (
          <BookingsTab bookings={bookings} onLeaveReview={handleLeaveReview} onMessage={handleMessage} onOpenChat={handleOpenChat} />
        )}
        {activeTab === 'messages' && <MessagesTab />}
        {activeTab === 'properties' && (
          <PropertiesTab properties={properties} onAddProperty={handleAddProperty} />
        )}
        {activeTab === 'account' && (
          <AccountTab owner={owner} onRefresh={fetchDashboardData} />
        )}
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#EBEBEB] pb-safe">
        <div className="max-w-lg mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all rounded-lg mx-0.5 ${
                activeTab === tab.id
                  ? 'text-[#C4785A] bg-[#FFF8F5]'
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
        externalOpen={chatOpen}
        onExternalClose={handleCloseChat}
        initialMessage={chatInitialMessage}
      />
    </div>
  )
}
