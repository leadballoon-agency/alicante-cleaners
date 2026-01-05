'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import HomeTab from './tabs/home'
import BookingsTab from './tabs/bookings'
import MessagesTab from './tabs/messages'
import TeamTab from './tabs/team'
import ProfileTab from './tabs/profile'
import OwnerReviewModal from './components/owner-review-modal'
import { ChatWidget } from '@/components/ai/chat-widget'

// Helper to read cookie on client
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

type Tab = 'home' | 'bookings' | 'messages' | 'team' | 'profile'

export type Owner = {
  id: string
  name: string
  phone: string
  email: string
  trusted: boolean
  referredBy: string | null
  memberSince: Date
  totalBookings: number
  cleanerRating: number | null
  cleanerReviewCount: number
}

export type Booking = {
  id: string
  status: 'pending' | 'confirmed' | 'completed'
  service: string
  price: number
  hours: number
  date: Date
  time: string
  property: {
    id: string
    address: string
    bedrooms: number
  }
  owner: Owner
  hasReviewedOwner: boolean
}

export type Cleaner = {
  id: string
  name: string
  photo: string | null
  slug: string
  hourlyRate: number
  serviceAreas: string[]
  rating?: number | null
  reviewCount?: number
  calendarToken?: string | null
}

export type InternalComment = {
  id: string
  propertyId: string
  ownerId: string
  cleanerId: string
  cleanerName: string
  text: string
  createdAt: Date
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [cleaner, setCleaner] = useState<Cleaner | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [comments, setComments] = useState<InternalComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ownerReviewModal, setOwnerReviewModal] = useState<{
    bookingId: string
    ownerId: string
    ownerName: string
  } | null>(null)
  const [impersonating, setImpersonating] = useState<string | null>(null)

  // Check for impersonation on mount
  useEffect(() => {
    const impersonatedName = getCookie('impersonating_user_name')
    if (impersonatedName) {
      setImpersonating(decodeURIComponent(impersonatedName))
    }
  }, [])

  // Exit impersonation
  const handleExitImpersonation = async () => {
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'DELETE',
      })

      if (response.ok) {
        const data = await response.json()
        window.location.href = data.redirectTo || '/admin'
      }
    } catch (err) {
      console.error('Error exiting impersonation:', err)
    }
  }

  // Fetch cleaner profile and bookings
  const fetchDashboardData = useCallback(async () => {
    try {
      const [cleanerRes, bookingsRes, commentsRes] = await Promise.all([
        fetch('/api/dashboard/cleaner'),
        fetch('/api/dashboard/cleaner/bookings'),
        fetch('/api/dashboard/cleaner/comments'),
      ])

      if (!cleanerRes.ok) {
        throw new Error('Failed to load dashboard')
      }

      const cleanerData = await cleanerRes.json()
      const bookingsData = await bookingsRes.json()
      const commentsData = await commentsRes.json()

      setCleaner(cleanerData.cleaner)
      setBookings(bookingsData.bookings || [])
      setComments(commentsData.comments || [])
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

  const handleAddComment = async (propertyId: string, _ownerId: string, text: string) => {
    try {
      const response = await fetch('/api/dashboard/cleaner/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, text }),
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      const result = await response.json()
      setComments(prev => [result.comment, ...prev])
    } catch (err) {
      console.error('Error adding comment:', err)
    }
  }

  const handleReviewOwner = (bookingId: string, ownerId: string, ownerName: string) => {
    setOwnerReviewModal({ bookingId, ownerId, ownerName })
  }

  const handleSubmitOwnerReview = async (review: {
    rating: number
    workAgain: boolean
    communication: number
    propertyAccuracy: number
    respectfulness: number
    note: string
    ownerId: string
    bookingId: string
  }) => {
    try {
      const response = await fetch(`/api/dashboard/cleaner/bookings/${review.bookingId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: review.rating,
          workAgain: review.workAgain,
          communication: review.communication,
          propertyAccuracy: review.propertyAccuracy,
          respectfulness: review.respectfulness,
          note: review.note,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit review')
      }

      // Mark booking as reviewed
      setBookings(prev => prev.map(b =>
        b.id === review.bookingId ? { ...b, hasReviewedOwner: true } : b
      ))
    } catch (err) {
      console.error('Error submitting review:', err)
    }
  }

  const handleBookingAction = async (bookingId: string, action: 'accept' | 'decline' | 'complete') => {
    try {
      const response = await fetch(`/api/dashboard/cleaner/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error('Failed to update booking')
      }

      const result = await response.json()

      // Update local state
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, status: result.booking.status } : b
      ))
    } catch (err) {
      console.error('Error updating booking:', err)
    }
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'home', label: 'Inicio', icon: '🏠' },
    { id: 'bookings', label: 'Reservas', icon: '📋' },
    { id: 'messages', label: 'Mensajes', icon: '💬' },
    { id: 'team', label: 'Equipo', icon: '👥' },
    { id: 'profile', label: 'Perfil', icon: '👤' },
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

  if (error || !cleaner) {
    return (
      <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">
            {error || 'Dashboard unavailable'}
          </h1>
          <p className="text-[#6B6B6B] mb-4">
            Please make sure you&apos;re logged in as a cleaner.
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
      {/* Impersonation Banner */}
      {impersonating && (
        <div className="bg-[#1A1A1A] text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">👁</span>
            <span className="text-sm">
              Viewing as <span className="font-medium">{impersonating}</span>
            </span>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full font-medium transition-colors"
          >
            Exit
          </button>
        </div>
      )}

      {/* Header */}
      <header className="px-6 py-4 pt-safe bg-white border-b border-[#EBEBEB]">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-[#6B6B6B]">Welcome back,</p>
            <h1 className="text-lg font-semibold text-[#1A1A1A]">
              {cleaner.name?.split(' ')[0]}
            </h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden relative">
            {cleaner.photo ? (
              <Image src={cleaner.photo} alt={cleaner.name} fill className="object-cover" unoptimized />
            ) : (
              <span className="text-lg">👤</span>
            )}
          </div>
        </div>
      </header>

      {/* Tab content */}
      <main className="px-6 py-6 max-w-lg mx-auto">
        {activeTab === 'home' && (
          <HomeTab cleaner={cleaner} bookings={bookings} />
        )}
        {activeTab === 'bookings' && (
          <BookingsTab
            bookings={bookings}
            comments={comments}
            onAddComment={handleAddComment}
            onReviewOwner={handleReviewOwner}
            onBookingAction={handleBookingAction}
          />
        )}
        {activeTab === 'messages' && <MessagesTab />}
        {activeTab === 'team' && <TeamTab />}
        {activeTab === 'profile' && (
          <ProfileTab cleaner={cleaner} />
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

      {/* Owner Review Modal */}
      {ownerReviewModal && (
        <OwnerReviewModal
          bookingId={ownerReviewModal.bookingId}
          ownerId={ownerReviewModal.ownerId}
          ownerName={ownerReviewModal.ownerName}
          onClose={() => setOwnerReviewModal(null)}
          onSubmit={handleSubmitOwnerReview}
        />
      )}

      {/* AI Chat Widget */}
      <ChatWidget
        agentType="cleaner"
        agentName="Pro Assistant"
        agentDescription="Tu asistente profesional de limpieza"
      />
    </div>
  )
}
