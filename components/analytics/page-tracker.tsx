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
