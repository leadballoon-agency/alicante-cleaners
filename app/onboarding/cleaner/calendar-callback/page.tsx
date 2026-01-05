'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check, X } from 'lucide-react'

export default function CalendarCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'syncing' | 'success' | 'error'>('syncing')
  const [message, setMessage] = useState('')

  useEffect(() => {
    syncCalendar()
  }, [])

  const syncCalendar = async () => {
    try {
      // Trigger a sync after Google OAuth callback
      const res = await fetch('/api/calendar/google/sync', {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Sync failed')
      }

      setStatus('success')
      setMessage(`Synced ${data.synced} events from your calendar`)

      // Redirect back to onboarding after a short delay
      setTimeout(() => {
        // Store that we've connected the calendar in sessionStorage
        sessionStorage.setItem('calendarConnected', 'true')
        sessionStorage.setItem('calendarSynced', String(data.synced))
        router.push('/onboarding/cleaner?step=6')
      }, 2000)
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Failed to sync calendar')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 border border-[#EBEBEB] max-w-md w-full text-center">
        {status === 'syncing' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
              Syncing Your Calendar
            </h2>
            <p className="text-[#6B6B6B]">
              Please wait while we import your calendar events...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
              Calendar Connected!
            </h2>
            <p className="text-[#6B6B6B]">{message}</p>
            <p className="text-sm text-[#9B9B9B] mt-4">
              Redirecting you back...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
              Connection Failed
            </h2>
            <p className="text-[#6B6B6B] mb-4">{message}</p>
            <button
              onClick={() => router.push('/onboarding/cleaner?step=6')}
              className="px-6 py-2.5 bg-[#1A1A1A] text-white rounded-xl font-medium"
            >
              Go Back
            </button>
          </>
        )}
      </div>
    </div>
  )
}
