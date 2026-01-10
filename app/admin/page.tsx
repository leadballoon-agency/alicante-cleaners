'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import CleanersTab from './tabs/cleaners'
import OwnersTab from './tabs/owners'
import BookingsTab from './tabs/bookings'
import ReviewsTab from './tabs/reviews'
import FeedbackTab from './tabs/feedback'
import SupportTab from './tabs/support'
// AITab removed - now using AdminAIPanel in header
import SettingsTab, { PlatformSettings } from './tabs/settings'
import AuditTab from './tabs/audit'
import LiveTab from './tabs/live'
import Image from 'next/image'
import Link from 'next/link'
import { AdminAIPanel, PullToRefresh } from './components'
import { useAdminLayout } from './AdminLayoutContext'

type Tab = 'live' | 'cleaners' | 'owners' | 'bookings' | 'reviews' | 'feedback' | 'support' | 'audit' | 'settings'

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
  lastLoginAt?: Date | null
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
  lastLoginAt?: Date | null
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

function AdminDashboardContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()

  // AI Panel context - must be called before any early returns
  const { isAIPanelOpen, openAIPanel, closeAIPanel, aiPanelContext } = useAdminLayout()

  // Menu drawer state
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const tabFromUrl = searchParams.get('tab') as Tab | null
  const cardFromUrl = searchParams.get('card') // e.g., "booking-abc123"
  const searchFromUrl = searchParams.get('search') // e.g., "clara"
  const validTabs: Tab[] = ['live', 'cleaners', 'owners', 'bookings', 'reviews', 'feedback', 'support', 'audit', 'settings']
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'live'
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [searchQuery, setSearchQuery] = useState(searchFromUrl || '')
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

  // Pull-to-refresh handler (doesn't show full loading screen)
  const handleRefresh = useCallback(async () => {
    await fetchAdminData()
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
    <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] font-sans pb-4">
      {/* Minimal Header */}
      <header className="px-4 py-3 bg-white border-b border-[#EBEBEB] sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors bg-[#F5F5F3] hover:bg-[#EBEBEB]"
            title="Menu"
          >
            <svg className="w-5 h-5 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/">
            <Image
              src="/villacare-horizontal-logo.png"
              alt="VillaCare"
              width={120}
              height={32}
              className="object-contain"
            />
          </Link>
          <button
            onClick={() => openAIPanel()}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors bg-gradient-to-br from-[#1A1A1A] to-[#333] text-white"
            title="AI Assistant"
          >
            <span className="text-sm font-medium">AI</span>
          </button>
        </div>
      </header>

      {/* Menu Drawer */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />
      <div
        className={`fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 shadow-2xl transition-transform duration-300 ease-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-[#EBEBEB]">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#1A1A1A]">Admin Menu</h2>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="w-8 h-8 rounded-lg bg-[#F5F5F3] flex items-center justify-center text-[#6B6B6B]"
            >
              <span className="text-lg">&times;</span>
            </button>
          </div>
        </div>
        <nav className="p-2">
          {[
            { id: 'live', label: 'Live Feed', icon: '📡', badge: 0 },
            { id: 'cleaners', label: 'Cleaners', icon: '🧹', badge: cleaners.filter(c => c.status === 'pending').length },
            { id: 'owners', label: 'Owners', icon: '👤', badge: 0 },
            { id: 'bookings', label: 'Bookings', icon: '📋', badge: bookings.filter(b => b.status === 'pending').length },
            { id: 'reviews', label: 'Reviews', icon: '⭐', badge: reviews.filter(r => r.status === 'pending').length },
            { id: 'feedback', label: 'Feedback', icon: '💬', badge: 0 },
            { id: 'support', label: 'Support', icon: '🎧', badge: supportStats.escalated },
            { id: 'audit', label: 'Audit Log', icon: '📝', badge: 0 },
            { id: 'settings', label: 'Settings', icon: '⚙️', badge: 0 },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as Tab)
                setIsMenuOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                activeTab === item.id
                  ? 'bg-[#1A1A1A] text-white'
                  : 'hover:bg-[#F5F5F3] text-[#1A1A1A]'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="flex-1 font-medium">{item.label}</span>
              {item.badge > 0 && (
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                  activeTab === item.id
                    ? 'bg-white text-[#1A1A1A]'
                    : 'bg-[#C4785A] text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#EBEBEB]">
          <p className="text-xs text-[#9B9B9B] text-center">
            Tap AI button for assistant
          </p>
        </div>
      </div>

      {/* AI Panel (slide-in from right) */}
      <AdminAIPanel
        isOpen={isAIPanelOpen}
        onClose={closeAIPanel}
        adminName={session?.user?.name || 'Admin'}
        initialContext={aiPanelContext}
      />

      {/* Tab content with pull-to-refresh */}
      <PullToRefresh onRefresh={handleRefresh}>
        <main className="px-4 py-4">
          {activeTab === 'live' && (
            <LiveTab
              onTabChange={(tab) => setActiveTab(tab as Tab)}
              onApproveReview={handleApproveReview}
              onApproveCleaner={handleApproveCleaner}
              stats={stats}
              initialCardId={cardFromUrl}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
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
        {activeTab === 'audit' && (
          <AuditTab />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            settings={platformSettings}
            onUpdate={setPlatformSettings}
          />
        )}
        </main>
      </PullToRefresh>

          </div>
  )
}

// Wrapper with Suspense for useSearchParams
export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#C4785A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#6B6B6B] text-sm">Loading dashboard...</p>
        </div>
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  )
}
