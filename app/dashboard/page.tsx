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
  bio?: string | null
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

export type TeamMember = {
  id: string
  name: string
  photo: string | null
  slug: string
}

export type TeamInfo = {
  role: 'leader' | 'member' | 'independent'
  members?: TeamMember[]
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [cleaner, setCleaner] = useState<Cleaner | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [comments, setComments] = useState<InternalComment[]>([])
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ownerReviewModal, setOwnerReviewModal] = useState<{
    bookingId: string
    ownerId: string
    ownerName: string
  } | null>(null)
  // Fetch cleaner profile and bookings
  const fetchDashboardData = useCallback(async () => {
    try {
      const [cleanerRes, bookingsRes, commentsRes, teamRes] = await Promise.all([
        fetch('/api/dashboard/cleaner'),
        fetch('/api/dashboard/cleaner/bookings'),
        fetch('/api/dashboard/cleaner/comments'),
        fetch('/api/dashboard/cleaner/team'),
      ])

      if (!cleanerRes.ok) {
        const errorData = await cleanerRes.json().catch(() => ({}))

        // Handle role-based redirects gracefully
        if (errorData.redirect) {
          window.location.href = errorData.redirect
          return
        }

        throw new Error(errorData.error || 'Failed to load dashboard')
      }

      const cleanerData = await cleanerRes.json()
      const bookingsData = await bookingsRes.json()
      const commentsData = await commentsRes.json()
      const teamData = await teamRes.json()

      setCleaner(cleanerData.cleaner)
      setBookings(bookingsData.bookings || [])
      setComments(commentsData.comments || [])

      // Set team info for team leaders
      if (teamData.role === 'leader' && teamData.team?.members) {
        setTeamInfo({
          role: 'leader',
          members: teamData.team.members,
        })
      } else {
        setTeamInfo({ role: teamData.role || 'independent' })
      }
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

  const handleBookingAction = async (bookingId: string, action: 'accept' | 'decline' | 'complete' | 'assign', assignToCleanerId?: string) => {
    try {
      const response = await fetch(`/api/dashboard/cleaner/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, assignToCleanerId }),
      })

      if (!response.ok) {
        throw new Error('Failed to update booking')
      }

      const result = await response.json()

      if (action === 'assign') {
        // Remove the booking from our list (it now belongs to team member)
        setBookings(prev => prev.filter(b => b.id !== bookingId))
      } else {
        // Update local state
        setBookings(prev => prev.map(b =>
          b.id === bookingId ? { ...b, status: result.booking.status } : b
        ))
      }
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
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">🧹</p>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">
            Cleaner Dashboard
          </h1>
          <p className="text-[#6B6B6B] mb-6">
            This dashboard is for cleaners. If you&apos;re looking for a different dashboard, use the links below.
          </p>
          <div className="space-y-3">
            <a
              href="/admin"
              className="block w-full bg-[#1A1A1A] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#333] transition-colors"
            >
              Go to Admin Dashboard
            </a>
            <a
              href="/owner/dashboard"
              className="block w-full bg-white text-[#1A1A1A] px-6 py-3 rounded-xl font-medium border border-[#DEDEDE] hover:border-[#1A1A1A] transition-colors"
            >
              Go to Owner Dashboard
            </a>
            <a
              href="/"
              className="block text-sm text-[#6B6B6B] hover:text-[#1A1A1A] mt-4"
            >
              ← Back to Home
            </a>
          </div>
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
            teamInfo={teamInfo}
            onAddComment={handleAddComment}
            onReviewOwner={handleReviewOwner}
            onBookingAction={handleBookingAction}
          />
        )}
        {activeTab === 'messages' && <MessagesTab />}
        {activeTab === 'team' && <TeamTab />}
        {activeTab === 'profile' && (
          <ProfileTab cleaner={cleaner} onUpdate={setCleaner} />
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
