'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/components/language-context'

// Scanner-proof landing page for magic-link emails.
//
// The email now points here instead of straight at NextAuth's one-time
// `/api/auth/callback/email` URL, because email security scanners (Microsoft
// ATP, Proofpoint, etc.) GET every link in an inbound message before a human
// ever opens it - which consumes the single-use token and leaves the real
// recipient with an expired-link error. Scanners land here and get an inert
// page; the tokenized URL is never fetched, redirected to, or otherwise
// touched until a human clicks the button below.
//
// The tokenized URL arrives in the FRAGMENT (#u=<urlencoded url>), not a
// query param. Fragments never leave the browser: they aren't sent to the
// server (so they can't land in server/CDN logs) and they don't appear in
// GA4/GTM's default page_location. A query param on a rendered page would
// have leaked the one-time token into analytics - something the old
// direct-to-API-route links never did, since no scripts run on an API route.
//
// Hard requirements (do not relax without re-reviewing the security
// tradeoff): no auto-redirect, no logging/persisting of the URL, and strict
// validation that it is really NextAuth's own callback URL - otherwise this
// page would become an open redirect.
function ConfirmContent() {
  const { t } = useLanguage()
  const [targetUrl, setTargetUrl] = useState<string | null>(null)
  const [invalid, setInvalid] = useState(false)
  // Ref (not state) guard: React 18 Strict Mode re-runs this effect a second
  // time BEFORE the first run's setState lands, so a state-based guard can't
  // stop the re-run - it would re-read the (now scrubbed, empty) hash and
  // flip a valid link to "invalid". A ref is visible immediately.
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    // Read the fragment directly from the browser (fragments are
    // client-only; the server never sees them). Format: #u=<urlencoded url>.
    const hash = window.location.hash
    const rawUrl = hash.startsWith('#u=')
      ? (() => {
          try {
            return decodeURIComponent(hash.slice(3))
          } catch {
            return null
          }
        })()
      : null

    const isSafe = (() => {
      if (!rawUrl) return false
      try {
        const parsed = new URL(rawUrl)
        const expectedPrefix = `${window.location.origin}/api/auth/callback/email`
        return parsed.origin === window.location.origin && rawUrl.startsWith(expectedPrefix)
      } catch {
        return false
      }
    })()

    if (isSafe && rawUrl) {
      setTargetUrl(rawUrl)
    } else {
      setInvalid(true)
    }

    // Defense in depth: scrub the fragment out of the visible URL and
    // browser history once read, so the token doesn't linger if the tab is
    // left open, bookmarked, or the URL is copied.
    window.history.replaceState({}, '', '/login/confirm')
  }, [])

  const handleConfirm = () => {
    if (targetUrl) {
      window.location.href = targetUrl
    }
  }

  return (
    <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] font-sans flex flex-col">
      <header className="px-6 py-4">
        <Link href="/">
          <Image
            src="/villacare-horizontal-logo.png"
            alt="VillaCare"
            width={140}
            height={40}
            className="object-contain"
          />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md text-center">
          {invalid ? (
            <>
              <div className="w-16 h-16 bg-[#FFEBEE] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">&#9888;</span>
              </div>
              <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
                {t('login.confirm.invalidTitle')}
              </h1>
              <p className="text-[#6B6B6B] mb-6">
                {t('login.confirm.invalidBody')}
              </p>
              <Link href="/login" className="text-[#C4785A] font-medium hover:underline">
                {t('login.confirm.backToLogin')}
              </Link>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">&#128274;</span>
              </div>
              <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
                {t('login.confirm.title')}
              </h1>
              <p className="text-[#6B6B6B] mb-8">
                {t('login.confirm.subtitle')}
              </p>
              <button
                onClick={handleConfirm}
                disabled={!targetUrl}
                className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {t('login.confirm.button')}
              </button>
            </>
          )}
        </div>
      </main>

      <footer className="px-6 py-4 text-center">
        <p className="text-xs text-[#9B9B9B]">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </footer>
    </div>
  )
}

export default function ConfirmPage() {
  return <ConfirmContent />
}
