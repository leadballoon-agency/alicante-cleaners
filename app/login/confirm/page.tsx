'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
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
// page; the token in `u` is never fetched, redirected to, or otherwise
// touched until a human clicks the button below.
//
// Hard requirements (do not relax without re-reviewing the security
// tradeoff): no auto-redirect, no logging/persisting of `u`, and strict
// validation that `u` is really NextAuth's own callback URL - otherwise this
// page would become an open redirect.
function ConfirmContent() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  // Captured exactly once, on first render - not re-read from searchParams
  // inside the effect below. That matters: the effect scrubs `u` out of the
  // browser's URL via replaceState, and re-reading searchParams after that
  // (e.g. on React 18 Strict Mode's dev-only double effect invocation) would
  // see the now-empty URL and flip a valid link to "invalid".
  const [rawUrl] = useState(() => searchParams.get('u'))
  const [targetUrl, setTargetUrl] = useState<string | null>(null)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
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

    if (isSafe) {
      setTargetUrl(rawUrl)
    } else {
      setInvalid(true)
    }

    // Scrub the token out of the visible URL and browser history as early as
    // possible. We can't guarantee no analytics/script tag reads
    // location.href before this runs, but this closes the window as tightly
    // as we can from a client component, and means the token doesn't linger
    // in history if the tab is left open or bookmarked.
    window.history.replaceState({}, '', '/login/confirm')
  }, [rawUrl])

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
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C4785A] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  )
}
