'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { ChevronLeft, Calendar, Check, Loader2, ExternalLink } from 'lucide-react'

interface CalendarSyncProps {
  onBack: () => void
  onNext: () => void
}

export default function CalendarSync({ onBack, onNext }: CalendarSyncProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'syncing' | 'connected' | 'error'>('idle')
  const [syncResult, setSyncResult] = useState<{ synced: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check if already connected on mount
  useEffect(() => {
    checkCalendarStatus()
  }, [])

  const checkCalendarStatus = async () => {
    try {
      const res = await fetch('/api/calendar/google/sync')
      if (res.ok) {
        const data = await res.json()
        if (data.connected) {
          setStatus('connected')
          setSyncResult({ synced: data.eventCount })
        }
      }
    } catch {
      // Not connected, that's fine
    }
  }

  const handleConnect = async () => {
    setStatus('connecting')
    setError(null)

    try {
      // Use NextAuth to sign in with Google (will redirect)
      await signIn('google', {
        callbackUrl: `${window.location.origin}/onboarding/cleaner/calendar-callback`,
        redirect: true,
      })
    } catch {
      setError('Failed to connect to Google')
      setStatus('error')
    }
  }

  const handleSync = async () => {
    setStatus('syncing')
    setError(null)

    try {
      const res = await fetch('/api/calendar/google/sync', {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Sync failed')
      }

      setSyncResult({ synced: data.synced })
      setStatus('connected')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[#6B6B6B] text-sm mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#1A1A1A]">
              Sync Your Calendar
            </h1>
            <p className="text-[#6B6B6B] text-sm">
              Never get double-booked
            </p>
          </div>
        </div>
      </div>

      {/* Content based on status */}
      <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
        {status === 'idle' && (
          <div className="space-y-4">
            <p className="text-[#4A4A4A]">
              Connect your Google Calendar so we know when you&apos;re busy.
              We&apos;ll automatically block those times for bookings.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm text-[#4A4A4A]">
                  We only read your calendar - never write to it
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm text-[#4A4A4A]">
                  Your event details stay private - we only see busy/free times
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm text-[#4A4A4A]">
                  Disconnect anytime from your dashboard
                </span>
              </div>
            </div>

            <button
              onClick={handleConnect}
              className="w-full py-3.5 bg-white border-2 border-[#EBEBEB] rounded-xl font-medium text-[#1A1A1A] flex items-center justify-center gap-3 hover:border-[#1A1A1A] transition-colors"
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
          </div>
        )}

        {status === 'connecting' && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-[#4A4A4A]">Connecting to Google...</p>
          </div>
        )}

        {status === 'syncing' && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-[#4A4A4A]">Syncing your calendar...</p>
          </div>
        )}

        {status === 'connected' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
              Calendar Connected!
            </h3>
            <p className="text-[#6B6B6B] mb-4">
              {syncResult?.synced
                ? `We found ${syncResult.synced} events in the next 60 days.`
                : 'Your calendar is synced.'}
              <br />
              You won&apos;t be booked during those times.
            </p>
            <button
              onClick={handleSync}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
            >
              <ExternalLink className="w-4 h-4" />
              Sync again
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">!</span>
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
              Connection Failed
            </h3>
            <p className="text-[#6B6B6B] mb-4">
              {error || 'Something went wrong. Please try again.'}
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <button
          onClick={onNext}
          className={`w-full py-3.5 rounded-xl font-medium transition-colors ${
            status === 'connected'
              ? 'bg-[#1A1A1A] text-white'
              : 'bg-[#EBEBEB] text-[#6B6B6B]'
          }`}
        >
          {status === 'connected' ? 'Continue' : 'Skip for now'}
        </button>

        {status === 'idle' && (
          <p className="text-xs text-center text-[#9B9B9B]">
            You can connect your calendar later from your dashboard
          </p>
        )}
      </div>
    </div>
  )
}
