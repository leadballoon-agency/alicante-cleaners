'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import BookingsTab from './tabs/bookings'
import MessagesTab from './tabs/messages'
import TeamTab from './tabs/team'
import ProfileTab from './tabs/profile'
import PromoteTab from './tabs/promote'
import SuccessTab from './tabs/success'
import OwnerReviewModal from './components/owner-review-modal'
import { SmartWidget, Screen } from '@/components/smart-widget'
import { useLanguage } from '@/components/language-context'
import { JobsTimeline } from './components/team-calendar'

type Tab = 'home' | 'bookings' | 'messages' | 'team' | 'profile' | 'promote' | 'success'

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
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'
  preferredLanguage?: string
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
  const { t, setLang } = useLanguage()
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

      // Sync language context with cleaner's preferred language
      if (cleanerData.cleaner?.preferredLanguage) {
        setLang(cleanerData.cleaner.preferredLanguage)
      }

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
  }, [setLang])

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
    <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] font-sans">
      {/* Header */}
      <header className="px-6 py-4 pt-safe bg-white border-b border-[#EBEBEB]">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-[#6B6B6B]">{t('dashboard.welcomeBack')}</p>
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
        {/* Show pending state for unverified cleaners */}
        {cleaner.status === 'PENDING' ? (
          <PendingState cleaner={cleaner} />
        ) : (
          <>
            {activeTab === 'home' && (
              <JobsTimeline
                currentCleanerId={cleaner.id}
                currentCleanerName={cleaner.name}
                currentCleanerPhoto={cleaner.photo}
              />
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
            {activeTab === 'promote' && (
              <PromoteTab cleaner={cleaner} bookings={bookings} />
            )}
            {activeTab === 'success' && <SuccessTab />}
          </>
        )}
      </main>

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

      {/* Smart Navigation Widget */}
      <SmartWidget
        currentScreen={activeTab as Screen}
        onNavigate={(screen) => setActiveTab(screen as Tab)}
        onQuickAction={(action) => {
          // Handle quick actions from context menus
          if (action === 'support') {
            // Open support - could be a modal or external link
            window.open('mailto:hello@alicantecleaners.com', '_blank')
          } else if (action === 'feedback') {
            // Feedback handled via support
            window.open('mailto:hello@alicantecleaners.com?subject=Feedback', '_blank')
          } else if (action.startsWith('promote:')) {
            // Navigate to promote tab
            setActiveTab('promote')
          } else if (action.startsWith('profile:')) {
            setActiveTab('profile')
          }
        }}
        language={cleaner?.preferredLanguage || 'en'}
      />
    </div>
  )
}

// Pending state for unverified cleaners
function PendingState({ cleaner }: { cleaner: Cleaner }) {
  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className="bg-[#FFF8F5] rounded-2xl p-5 border border-[#F5E6E0]">
        <div className="flex items-start gap-3">
          <span className="text-3xl">&#9203;</span>
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">Application Pending</h2>
            <p className="text-sm text-[#6B6B6B]">
              Your profile is awaiting verification by a team leader. Once verified, you&apos;ll be able to accept bookings.
            </p>
          </div>
        </div>
      </div>

      {/* What to do next */}
      <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
        <h3 className="font-medium text-[#1A1A1A] mb-4">What to do next</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-[#E8F5E9] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm">&#128172;</span>
            </div>
            <div>
              <p className="font-medium text-[#1A1A1A] text-sm">Chat with a Team Leader</p>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Visit a team leader&apos;s profile and introduce yourself via the chat widget
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-[#E3F2FD] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm">&#128100;</span>
            </div>
            <div>
              <p className="font-medium text-[#1A1A1A] text-sm">Complete your profile</p>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Add a photo and bio to make a good impression
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-[#F5F5F3] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm">&#9200;</span>
            </div>
            <div>
              <p className="font-medium text-[#1A1A1A] text-sm">Wait for verification</p>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Team leaders review applications and will accept you when ready
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile preview */}
      <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
        <h3 className="font-medium text-[#1A1A1A] mb-4">Your Profile</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6B6B6B]">Hourly Rate</span>
            <span className="text-sm font-medium text-[#1A1A1A]">&euro;{cleaner.hourlyRate}/hr</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6B6B6B]">Service Areas</span>
            <span className="text-sm font-medium text-[#1A1A1A]">
              {cleaner.serviceAreas.length} area{cleaner.serviceAreas.length !== 1 ? 's' : ''}
            </span>
          </div>
          {cleaner.bio ? (
            <div className="pt-3 border-t border-[#EBEBEB]">
              <p className="text-sm text-[#6B6B6B]">{cleaner.bio}</p>
            </div>
          ) : (
            <div className="pt-3 border-t border-[#EBEBEB]">
              <p className="text-sm text-[#9B9B9B] italic">No bio added yet - add one to stand out!</p>
            </div>
          )}
        </div>
      </div>

      {/* Help */}
      <div className="text-center">
        <p className="text-sm text-[#6B6B6B]">
          Questions? Contact{' '}
          <a href="mailto:support@alicantecleaners.com" className="text-[#C4785A] font-medium">
            support@alicantecleaners.com
          </a>
        </p>
      </div>
    </div>
  )
}
