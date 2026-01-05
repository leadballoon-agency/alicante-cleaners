'use client'

import { useState, useEffect, useCallback } from 'react'
import OverviewTab from './tabs/overview'
import CleanersTab from './tabs/cleaners'
import BookingsTab from './tabs/bookings'
import ReviewsTab from './tabs/reviews'
import FeedbackTab from './tabs/feedback'

type Tab = 'overview' | 'cleaners' | 'bookings' | 'reviews' | 'feedback'

export type Stats = {
  totalCleaners: number
  activeCleaners: number
  pendingApplications: number
  totalBookings: number
  thisMonthBookings: number
  totalRevenue: number
  thisMonthRevenue: number
  totalReviews: number
  averageRating: number
}

export type Cleaner = {
  id: string
  name: string
  slug: string
  phone: string
  email: string
  status: 'pending' | 'active' | 'suspended'
  joinedAt: Date
  areas: string[]
  hourlyRate: number
  totalBookings: number
  rating: number
  reviewCount: number
  teamLeader: boolean
}

export type Booking = {
  id: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  service: string
  price: number
  date: Date
  cleaner: { id: string; name: string }
  owner: { name: string; email: string }
  property: string
  createdAt: Date
}

export type Review = {
  id: string
  rating: number
  text: string
  author: string
  location: string
  cleaner: { id: string; name: string }
  createdAt: Date
  status: 'pending' | 'approved'
  featured: boolean
}

export type Feedback = {
  id: string
  category: 'idea' | 'issue' | 'praise' | 'question'
  mood: 'love' | 'like' | 'meh' | 'frustrated'
  message: string
  page: string
  userType: 'owner' | 'cleaner' | 'visitor'
  createdAt: Date
  status: 'new' | 'reviewed' | 'planned' | 'done'
  votes: number
}

const DEFAULT_STATS: Stats = {
  totalCleaners: 0,
  activeCleaners: 0,
  pendingApplications: 0,
  totalBookings: 0,
  thisMonthBookings: 0,
  totalRevenue: 0,
  thisMonthRevenue: 0,
  totalReviews: 0,
  averageRating: 0,
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS)
  const [cleaners, setCleaners] = useState<Cleaner[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch all admin data
  const fetchAdminData = useCallback(async () => {
    try {
      const [statsRes, cleanersRes, bookingsRes, reviewsRes, feedbackRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/cleaners'),
        fetch('/api/admin/bookings'),
        fetch('/api/admin/reviews'),
        fetch('/api/admin/feedback'),
      ])

      if (!statsRes.ok) {
        throw new Error('Failed to load admin dashboard')
      }

      const statsData = await statsRes.json()
      const cleanersData = await cleanersRes.json()
      const bookingsData = await bookingsRes.json()
      const reviewsData = await reviewsRes.json()
      const feedbackData = await feedbackRes.json()

      setStats(statsData.stats || DEFAULT_STATS)
      setCleaners(cleanersData.cleaners || [])
      setBookings(bookingsData.bookings || [])
      setReviews(reviewsData.reviews || [])
      setFeedback(feedbackData.feedback || [])
    } catch (err) {
      console.error('Admin dashboard error:', err)
      setError('Failed to load admin dashboard. Please ensure you have admin access.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAdminData()
  }, [fetchAdminData])

  const handleApproveCleaner = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/cleaners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })

      if (response.ok) {
        setCleaners(prev => prev.map(c =>
          c.id === id ? { ...c, status: 'active' as const } : c
        ))
        setStats(prev => ({
          ...prev,
          activeCleaners: prev.activeCleaners + 1,
          pendingApplications: Math.max(0, prev.pendingApplications - 1),
        }))
      }
    } catch (err) {
      console.error('Error approving cleaner:', err)
    }
  }

  const handleRejectCleaner = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/cleaners/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCleaners(prev => prev.filter(c => c.id !== id))
        setStats(prev => ({
          ...prev,
          totalCleaners: prev.totalCleaners - 1,
          pendingApplications: Math.max(0, prev.pendingApplications - 1),
        }))
      }
    } catch (err) {
      console.error('Error rejecting cleaner:', err)
    }
  }

  const handleToggleTeamLeader = async (id: string) => {
    const cleaner = cleaners.find(c => c.id === id)
    if (!cleaner) return

    try {
      const response = await fetch(`/api/admin/cleaners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: cleaner.teamLeader ? 'removeTeamLeader' : 'makeTeamLeader' }),
      })

      if (response.ok) {
        setCleaners(prev => prev.map(c =>
          c.id === id ? { ...c, teamLeader: !c.teamLeader } : c
        ))
      }
    } catch (err) {
      console.error('Error toggling team leader:', err)
    }
  }

  const handleLoginAs = async (cleanerId: string) => {
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanerId }),
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to cleaner dashboard
        window.location.href = data.redirectTo || '/dashboard'
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to login as cleaner')
      }
    } catch (err) {
      console.error('Error logging in as cleaner:', err)
      alert('Failed to login as cleaner')
    }
  }

  const handleApproveReview = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })

      if (response.ok) {
        setReviews(prev => prev.map(r =>
          r.id === id ? { ...r, status: 'approved' as const } : r
        ))
      }
    } catch (err) {
      console.error('Error approving review:', err)
    }
  }

  const handleRejectReview = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })

      if (response.ok) {
        setReviews(prev => prev.filter(r => r.id !== id))
      }
    } catch (err) {
      console.error('Error rejecting review:', err)
    }
  }

  const handleToggleFeatured = async (id: string) => {
    const review = reviews.find(r => r.id === id)
    if (!review) return

    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: review.featured ? 'unfeature' : 'feature' }),
      })

      if (response.ok) {
        setReviews(prev => prev.map(r =>
          r.id === id ? { ...r, featured: !r.featured } : r
        ))
      }
    } catch (err) {
      console.error('Error toggling featured:', err)
    }
  }

  const handleUpdateFeedbackStatus = async (id: string, status: 'new' | 'reviewed' | 'planned' | 'done') => {
    try {
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        setFeedback(prev => prev.map(f =>
          f.id === id ? { ...f, status } : f
        ))
      }
    } catch (err) {
      console.error('Error updating feedback status:', err)
    }
  }

  const tabs: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'cleaners', label: 'Cleaners', icon: '👥', badge: cleaners.filter(c => c.status === 'pending').length },
    { id: 'bookings', label: 'Bookings', icon: '📋' },
    { id: 'reviews', label: 'Reviews', icon: '⭐', badge: reviews.filter(r => r.status === 'pending').length },
    { id: 'feedback', label: 'Feedback', icon: '💬', badge: feedback.filter(f => f.status === 'new').length },
  ]

  if (loading) {
    return (
      <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <span className="w-8 h-8 border-2 border-[#1A1A1A]/20 border-t-[#1A1A1A] rounded-full animate-spin inline-block" />
          <p className="text-[#6B6B6B] mt-3">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-4xl mb-4">🔐</p>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Access Denied</h1>
          <p className="text-[#6B6B6B] mb-4">{error}</p>
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
    <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] font-sans">
      {/* Header */}
      <header className="px-6 py-4 bg-[#1A1A1A] text-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#C4785A] rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">V</span>
            </div>
            <div>
              <h1 className="font-semibold">VillaCare Admin</h1>
              <p className="text-xs text-white/60">Platform Manager</p>
            </div>
          </div>
          <button className="text-sm text-white/60 hover:text-white">
            Log out
          </button>
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="px-6 py-3 bg-white border-b border-[#EBEBEB]">
        <div className="max-w-5xl mx-auto flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-[#1A1A1A] text-white'
                  : 'text-[#6B6B6B] hover:bg-[#F5F5F3]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs bg-[#C4785A] text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab content */}
      <main className="px-6 py-6 max-w-5xl mx-auto">
        {activeTab === 'overview' && (
          <OverviewTab stats={stats} recentBookings={bookings.slice(0, 5)} />
        )}
        {activeTab === 'cleaners' && (
          <CleanersTab
            cleaners={cleaners}
            onApprove={handleApproveCleaner}
            onReject={handleRejectCleaner}
            onToggleTeamLeader={handleToggleTeamLeader}
            onLoginAs={handleLoginAs}
          />
        )}
        {activeTab === 'bookings' && (
          <BookingsTab bookings={bookings} />
        )}
        {activeTab === 'reviews' && (
          <ReviewsTab
            reviews={reviews}
            onApprove={handleApproveReview}
            onReject={handleRejectReview}
            onToggleFeatured={handleToggleFeatured}
          />
        )}
        {activeTab === 'feedback' && (
          <FeedbackTab
            feedback={feedback}
            onUpdateStatus={handleUpdateFeedbackStatus}
          />
        )}
      </main>
    </div>
  )
}
