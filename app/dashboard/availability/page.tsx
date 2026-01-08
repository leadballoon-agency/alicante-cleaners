'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  ChevronLeft,
  RefreshCw,
  Check,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react'

type CalendarStatus = {
  connected: boolean
  lastSynced: string | null
  eventCount: number
}

type AvailabilityBlock = {
  id: string
  date: string
  startTime: string
  endTime: string
  source: string
  title?: string
}

export default function AvailabilityPage() {
  const { status } = useSession()
  const searchParams = useSearchParams()
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null)
  const [availability, setAvailability] = useState<AvailabilityBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [oauthError, setOauthError] = useState<string | null>(null)

  // Check for OAuth errors in URL params
  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      if (error === 'OAuthCallback' || error === 'OAuthSignin') {
        setOauthError('Google Calendar connection failed. This may be due to a configuration issue. Please contact support.')
      } else if (error === 'AccessDenied') {
        setOauthError('You denied access to Google Calendar. Calendar sync requires permission to read your calendar.')
      } else {
        setOauthError(`Connection failed: ${error}`)
      }
    }
  }, [searchParams])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch calendar status
      const statusRes = await fetch('/api/calendar/google/sync')
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setCalendarStatus(statusData)
      }

      // Fetch upcoming availability blocks
      const availRes = await fetch('/api/dashboard/cleaner/availability')
      if (availRes.ok) {
        const availData = await availRes.json()
        setAvailability(availData.blocks || [])
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    await signIn('google', {
      callbackUrl: `${window.location.origin}/dashboard/availability`,
      redirect: true,
    })
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/calendar/google/sync', { method: 'POST' })
      if (res.ok) {
        await fetchData()
      }
    } catch (err) {
      console.error('Sync failed:', err)
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Google Calendar?')) {
      return
    }

    setDisconnecting(true)
    try {
      const res = await fetch('/api/calendar/google/disconnect', { method: 'POST' })
      if (res.ok) {
        setCalendarStatus({ connected: false, lastSynced: null, eventCount: 0 })
        setAvailability([])
      }
    } catch (err) {
      console.error('Disconnect failed:', err)
    } finally {
      setDisconnecting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#6B6B6B] animate-spin" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Sign in required</h1>
          <Link href="/login" className="text-blue-600 hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatLastSynced = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-sans pb-safe">
      {/* Header */}
      <header className="px-6 py-4 pt-safe bg-white border-b border-[#EBEBEB]">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/dashboard"
              className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold text-[#1A1A1A]">
              Calendar Sync
            </h1>
          </div>
          <p className="text-sm text-[#6B6B6B] ml-8">
            Connect your Google Calendar to block busy times automatically
          </p>
        </div>
      </header>

      <main className="px-6 py-6 max-w-2xl mx-auto space-y-6">
        {/* OAuth Error Alert */}
        {oauthError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-800 mb-1">Connection Failed</h3>
                <p className="text-sm text-red-700">{oauthError}</p>
                <button
                  onClick={() => setOauthError(null)}
                  className="mt-3 text-sm text-red-600 font-medium hover:underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Google Calendar Connection */}
        <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">
                Google Calendar
              </h2>
              {calendarStatus?.connected ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
                    <Check className="w-4 h-4" />
                    <span>Connected</span>
                  </div>
                  <p className="text-sm text-[#6B6B6B]">
                    {calendarStatus.eventCount} events synced &middot; Last synced{' '}
                    {formatLastSynced(calendarStatus.lastSynced)}
                  </p>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleSync}
                      disabled={syncing}
                      className="flex items-center gap-2 px-4 py-2 bg-[#F5F5F3] rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#EBEBEB] transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                      {syncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-[#6B6B6B] mb-4">
                    Connect your Google Calendar to automatically block times when
                    you&apos;re busy. We only read your calendar - never write to it.
                  </p>
                  <button
                    onClick={handleConnect}
                    className="flex items-center gap-3 px-4 py-2.5 border-2 border-[#EBEBEB] rounded-xl font-medium text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Connect Google Calendar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Blocked Times */}
        {calendarStatus?.connected && (
          <div className="bg-white rounded-2xl border border-[#EBEBEB]">
            <div className="px-6 py-4 border-b border-[#EBEBEB]">
              <h2 className="font-semibold text-[#1A1A1A]">
                Upcoming Blocked Times
              </h2>
              <p className="text-sm text-[#6B6B6B]">
                Times when you won&apos;t receive bookings
              </p>
            </div>

            {availability.length === 0 ? (
              <div className="px-6 py-8 text-center text-[#6B6B6B]">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No blocked times in the next 60 days</p>
              </div>
            ) : (
              <div className="divide-y divide-[#EBEBEB]">
                {availability.slice(0, 10).map((block) => (
                  <div
                    key={block.id}
                    className="px-6 py-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-[#1A1A1A]">
                        {formatDate(block.date)}
                      </p>
                      <p className="text-sm text-[#6B6B6B]">
                        {block.startTime} - {block.endTime}
                        {block.title && ` &middot; ${block.title}`}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        block.source === 'GOOGLE_CALENDAR'
                          ? 'bg-blue-100 text-blue-700'
                          : block.source === 'BOOKING'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {block.source === 'GOOGLE_CALENDAR'
                        ? 'Calendar'
                        : block.source === 'BOOKING'
                        ? 'Booking'
                        : 'Manual'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="text-center text-sm text-[#6B6B6B]">
          <p>
            Need help?{' '}
            <a
              href="mailto:support@villacare.com"
              className="text-blue-600 hover:underline"
            >
              Contact support
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
