'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

type Props = {
  cleanerSlug?: string
}

// Generate or get session ID for anonymous tracking
function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = sessionStorage.getItem('vc_session_id')
  if (!sessionId) {
    sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    sessionStorage.setItem('vc_session_id', sessionId)
  }
  return sessionId
}

// Advocacy loop: read `?ref=` straight off the current URL, client-side only
// — never from server-rendered searchParams. Pages like /{slug} are ISR
// (revalidate = 3600) and never read searchParams server-side, so a
// `?ref=` param can't bust the cache or change the server-rendered HTML;
// it's purely a client-side signal picked up after hydration. Cheap format
// check here; the real validation (does this code belong to an owner)
// happens server-side at consumption time — see lib/referrals.ts.
function getRefParam(): string | null {
  if (typeof window === 'undefined') return null

  const value = new URLSearchParams(window.location.search).get('ref')
  if (!value || !/^[A-Za-z0-9_-]{1,64}$/.test(value)) return null
  return value
}

export function PageTracker({ cleanerSlug }: Props) {
  const pathname = usePathname()
  const lastTracked = useRef<string>('')

  useEffect(() => {
    // Avoid duplicate tracking for same path
    if (lastTracked.current === pathname) return
    lastTracked.current = pathname

    const trackPageView = async () => {
      try {
        await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: pathname,
            cleanerSlug,
            referrer: document.referrer || null,
            sessionId: getSessionId(),
            ref: getRefParam(),
          }),
        })
      } catch (error) {
        // Silently fail - tracking shouldn't break the page
        console.debug('Tracking failed:', error)
      }
    }

    // Small delay to avoid tracking during navigation transitions
    const timer = setTimeout(trackPageView, 100)
    return () => clearTimeout(timer)
  }, [pathname, cleanerSlug])

  return null
}
