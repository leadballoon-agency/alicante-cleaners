'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import OverviewTab from './tabs/overview'
import CleanersTab from './tabs/cleaners'
import OwnersTab from './tabs/owners'
import BookingsTab from './tabs/bookings'
import ReviewsTab from './tabs/reviews'
import FeedbackTab from './tabs/feedback'
import SupportTab from './tabs/support'
import AITab from './tabs/ai'
import SettingsTab, { PlatformSettings } from './tabs/settings'
import Image from 'next/image'
import Link from 'next/link'

type Tab = 'overview' | 'cleaners' | 'owners' | 'bookings' | 'reviews' | 'feedback' | 'support' | 'ai' | 'settings'

type SupportConversation = {
  id: string
  userType: string
  userName: string
  userEmail?: string
  status: 'active' | 'resolved' | 'escalated'
  sentiment?: string
  topic?: string
  summary?: string
  page: string
  messageCount: number
  lastMessage?: string
  createdAt: Date
  updatedAt: Date
  messages: {
    id: string
    role: 'user' | 'assistant'
    content: string
    isAI: boolean
    createdAt: Date
  }[]
}

type SupportStats = {
  total: number
  active: number
  escalated: number
  resolved: number
}

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
  photo?: string
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
  cleaner: { id: string; name: string; phone: string | null }
  owner: { name: string; email: string; phone: string | null }
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

export type Owner = {
  id: string
  name: string
  email: string
  phone: string
  preferredLanguage: string
  trusted: boolean
  referralCode: string
  referralCredits: number
  totalBookings: number
  rating: number | null
  reviewsGiven: number
  joinedAt: Date
  propertyCount: number
  bookingCount: number
  properties: {
    id: string
    name: string
    address: string
    bedrooms: number
    bathrooms: number
  }[]
  recentBookings: {
    id: string
    status: string
    service: string
    price: number
    date: Date
    cleanerName: string
    propertyName: string
  }[]
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
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab') as Tab | null
  const validTabs: Tab[] = ['overview', 'cleaners', 'owners', 'bookings', 'reviews', 'feedback', 'support', 'ai', 'settings']
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview'
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS)
  const [cleaners, setCleaners] = useState<Cleaner[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [supportConversations, setSupportConversations] = useState<SupportConversation[]>([])
  const [supportStats, setSupportStats] = useState<SupportStats>({ total: 0, active: 0, escalated: 0, resolved: 0 })
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Get today's bookings
  const todayBookings = bookings.filter(b => {
    const bookingDate = new Date(b.date)
    const today = new Date()
    return bookingDate.toDateString() === today.toDateString()
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Get pending reviews count
  const pendingReviewsCount = reviews.filter(r => r.status === 'pending').length

  // Fetch support conversations
  const fetchSupportData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/support')
      if (response.ok) {
        const data = await response.json()
        setSupportConversations(data.conversations || [])
        setSupportStats(data.stats || { total: 0, active: 0, escalated: 0, resolved: 0 })
      }
    } catch (err) {
      console.error('Error fetching support data:', err)
    }
  }, [])

  // Fetch all admin data
  const fetchAdminData = useCallback(async () => {
    try {
      const [statsRes, cleanersRes, ownersRes, bookingsRes, reviewsRes, feedbackRes, settingsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/cleaners'),
        fetch('/api/admin/owners'),
        fetch('/api/admin/bookings'),
        fetch('/api/admin/reviews'),
        fetch('/api/admin/feedback'),
        fetch('/api/admin/settings'),
      ])

      // Also fetch support data
      fetchSupportData()

      if (!statsRes.ok) {
        throw new Error('Failed to load admin dashboard')
      }

      const statsData = await statsRes.json()
      const cleanersData = await cleanersRes.json()
      const ownersData = await ownersRes.json()
      const bookingsData = await bookingsRes.json()
      const reviewsData = await reviewsRes.json()
      const feedbackData = await feedbackRes.json()
      const settingsData = await settingsRes.json()

      setStats(statsData.stats || DEFAULT_STATS)
      setCleaners(cleanersData.cleaners || [])
      setOwners(ownersData.owners || [])
      setBookings(bookingsData.bookings || [])
      setReviews(reviewsData.reviews || [])
      setFeedback(feedbackData.feedback || [])
      setPlatformSettings(settingsData.settings || null)
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

  const handleEditCleaner = async (id: string, data: { name?: string; phone?: string; email?: string }) => {
    try {
      const response = await fetch(`/api/admin/cleaners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', ...data }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update cleaner')
      }

      const result = await response.json()
      setCleaners(prev => prev.map(c =>
        c.id === id ? {
          ...c,
          name: result.cleaner.name || c.name,
          phone: result.cleaner.phone || c.phone,
          email: result.cleaner.email || c.email,
        } : c
      ))
    } catch (err) {
      console.error('Error editing cleaner:', err)
      throw err
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

  const handleResolveSupportConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/support/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED' }),
      })

      if (response.ok) {
        setSupportConversations(prev => prev.map(c =>
          c.id === id ? { ...c, status: 'resolved' } : c
        ))
        setSupportStats(prev => ({
          ...prev,
          active: Math.max(0, prev.active - 1),
          escalated: prev.escalated - (supportConversations.find(c => c.id === id)?.status === 'escalated' ? 1 : 0),
          resolved: prev.resolved + 1,
        }))
      }
    } catch (err) {
      console.error('Error resolving support conversation:', err)
    }
  }

  const tabs: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: 'overview', label: 'Home', icon: '🏠' },
    { id: 'ai', label: 'AI', icon: '🤖' },
    { id: 'support', label: 'Support', icon: '💬', badge: supportStats.escalated },
    { id: 'cleaners', label: 'Cleaners', icon: '🧹', badge: cleaners.filter(c => c.status === 'pending').length },
    { id: 'owners', label: 'Owners', icon: '👤' },
    { id: 'bookings', label: 'Bookings', icon: '📋', badge: bookings.filter(b => b.status === 'pending').length },
    { id: 'reviews', label: 'Reviews', icon: '⭐', badge: reviews.filter(r => r.status === 'pending').length },
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
    <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] font-sans pb-20">
      {/* Minimal Header */}
      <header className="px-4 py-3 bg-white border-b border-[#EBEBEB] sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Image
              src="/villacare-horizontal-logo.png"
              alt="VillaCare"
              width={120}
              height={32}
              className="object-contain"
            />
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                activeTab === 'settings'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-[#F5F5F3] text-[#6B6B6B] hover:bg-[#EBEBEB]'
              }`}
              title="Settings"
            >
              <span className="text-sm">⚙️</span>
            </button>
            <div className="w-8 h-8 bg-[#1A1A1A] rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {session?.user?.name?.charAt(0) || 'A'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab content */}
      <main className="px-4 py-4">
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            recentBookings={bookings.slice(0, 5)}
            todayBookings={todayBookings}
            pendingReviews={pendingReviewsCount}
            adminName={session?.user?.name || 'Admin'}
            onTabChange={(tab) => setActiveTab(tab as Tab)}
          />
        )}
        {activeTab === 'ai' && (
          <AITab adminName={session?.user?.name || 'Admin'} />
        )}
        {activeTab === 'cleaners' && (
          <CleanersTab
            cleaners={cleaners}
            onApprove={handleApproveCleaner}
            onReject={handleRejectCleaner}
            onToggleTeamLeader={handleToggleTeamLeader}
            onLoginAs={handleLoginAs}
            onEdit={handleEditCleaner}
          />
        )}
        {activeTab === 'owners' && (
          <OwnersTab owners={owners} />
        )}
        {activeTab === 'bookings' && (
          <BookingsTab
            bookings={bookings}
            onBookingUpdate={(bookingId, newStatus) => {
              setBookings(prev => prev.map(b =>
                b.id === bookingId ? { ...b, status: newStatus } : b
              ))
            }}
          />
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
        {activeTab === 'support' && (
          <SupportTab
            conversations={supportConversations}
            stats={supportStats}
            onResolve={handleResolveSupportConversation}
            onRefresh={fetchSupportData}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            settings={platformSettings}
            onUpdate={setPlatformSettings}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#EBEBEB] pb-safe z-50">
        <div className="flex justify-around py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-[56px] transition-colors ${
                activeTab === tab.id
                  ? 'text-[#C4785A]'
                  : 'text-[#9B9B9B]'
              }`}
            >
              <div className="relative">
                <span className="text-xl">{tab.icon}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-[#C4785A] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
