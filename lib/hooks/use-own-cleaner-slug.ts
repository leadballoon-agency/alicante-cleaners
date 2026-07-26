'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

// Shared across every component instance on the page (and across
// client-side navigations, since the module stays loaded) so however many
// cards ask "is this my own card?" only ever trigger one network request,
// not N.
let cachedSlugPromise: Promise<string | null> | null = null

async function fetchOwnSlug(): Promise<string | null> {
  try {
    const res = await fetch('/api/dashboard/cleaner')
    if (!res.ok) return null
    const data = await res.json()
    return typeof data?.cleaner?.slug === 'string' ? data.cleaner.slug : null
  } catch {
    return null
  }
}

/**
 * Resolves the logged-in cleaner's own profile slug, for surfaces that want
 * to show a self-serve affordance on public cleaner cards — e.g. an "Add
 * your photo" CTA on a photo-less cleaner's own card/profile.
 *
 * Session-gated: `useSession()` reads the session next-auth's SessionProvider
 * (mounted at the root layout) already fetches once for the whole app, so
 * checking `status`/`role` here costs nothing extra. Only when the viewer IS
 * a logged-in cleaner do we make one additional request — to the existing
 * GET /api/dashboard/cleaner endpoint — and that request is memoized so it
 * only ever fires once no matter how many cards call this hook.
 * Anonymous visitors and non-cleaner sessions (owners, admins) never trigger
 * any extra network activity.
 *
 * These card surfaces are ISR'd and shared across every visitor, so this
 * hook must never influence server-rendered HTML — it only ever resolves
 * after hydration, client-side.
 */
export function useOwnCleanerSlug(): string | null {
  const { data: session, status } = useSession()
  const isCleanerSession = status === 'authenticated' && session?.user?.role === 'CLEANER'
  const [slug, setSlug] = useState<string | null>(null)

  useEffect(() => {
    if (!isCleanerSession) return
    if (!cachedSlugPromise) {
      cachedSlugPromise = fetchOwnSlug()
    }
    let cancelled = false
    cachedSlugPromise.then((resolved) => {
      if (!cancelled) setSlug(resolved)
    })
    return () => {
      cancelled = true
    }
  }, [isCleanerSession])

  return isCleanerSession ? slug : null
}
