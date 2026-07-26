'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/components/language-context'

// Unified login flow (non-admin): a single "phone or email" field replaces
// the old up-front "Property Owner" vs "Cleaner" fork. That fork was
// cosmetic - cleaners with an email on file could already magic-link in via
// the owner path - but it hid the option and, worse, meant a magic-link
// request for an email matching NO account silently minted a brand-new
// OWNER account (see the signIn callback in lib/auth.ts). The new flow asks
// /api/auth/identify what the identifier is BEFORE doing anything
// account-touching, so an unrecognized email always needs an explicit human
// choice ("email-choice" step) rather than a silent create, and an
// unrecognized phone gets a friendly dead-end instead of nothing.
//
// Admin sign-in (?callbackUrl=/admin) is intentionally left on its own,
// unchanged path ('select' -> 'owner-email') - it never had the phantom
// owner-account problem in practice (staff accounts are pre-provisioned) and
// isn't part of the identifier-first redesign.
type Step =
  | 'select'
  | 'owner-email'
  | 'identify'
  | 'phone-verify'
  | 'phone-not-found'
  | 'email-choice'

function LoginContent() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const explicitCallbackUrl = searchParams.get('callbackUrl')
  const callbackUrl = explicitCallbackUrl || '/owner/dashboard'
  const isAdminLogin = callbackUrl.includes('/admin')
  // Only bounce through the smart post-login router when nobody asked for a
  // specific page (e.g. a plain "Owner" sign-in). Explicit callback URLs —
  // including deep links like /admin?tab=messages — are passed straight
  // through untouched so they land exactly where requested.
  const magicLinkCallbackUrl = explicitCallbackUrl || '/api/auth/post-login-redirect'

  const [step, setStep] = useState<Step>(isAdminLogin ? 'select' : 'identify')
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  // Admin-only email entry (preserved exactly)
  const [email, setEmail] = useState('')

  // Unified identify field (non-admin)
  const [identifier, setIdentifier] = useState('')

  // Phone verify state
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  // Which OTP credentials provider verifies this phone - decided by
  // /api/auth/identify BEFORE we ever call signIn(), since Twilio Verify
  // codes are single-use and can't be replayed against a second provider.
  const [loginProvider, setLoginProvider] = useState<'cleaner' | 'general' | null>(null)

  const sendMagicLinkForEmail = async (targetEmail: string) => {
    setIsLoading(true)
    setFormError(null)

    try {
      const result = await signIn('email', {
        email: targetEmail,
        redirect: false,
        callbackUrl: magicLinkCallbackUrl,
      })

      if (result?.error) {
        setFormError('Failed to send magic link. Please try again.')
      } else {
        setEmail(targetEmail)
        setEmailSent(true)
      }
    } catch {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Admin-only form (preserved exactly)
  const handleOwnerMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendMagicLinkForEmail(email)
  }

  const sendOtpCode = async (targetPhone: string) => {
    setIsLoading(true)
    setFormError(null)

    try {
      const response = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone, action: 'send' }),
      })

      const result = await response.json()

      if (!response.ok) {
        setFormError(result.error || 'Failed to send verification code')
        return
      }

      setStep('phone-verify')
    } catch {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 1 of the unified flow: figure out what the identifier is and
  // whether it already has an account, WITHOUT creating anything.
  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFormError(null)

    const trimmed = identifier.trim()

    try {
      const response = await fetch('/api/auth/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: trimmed }),
      })

      const data = await response.json()

      if (!response.ok) {
        setFormError(data.error || t('login.identify.genericError'))
        setIsLoading(false)
        return
      }

      if (data.method === 'email') {
        const normalizedEmail = trimmed.toLowerCase()
        setEmail(normalizedEmail)
        if (data.exists) {
          await sendMagicLinkForEmail(normalizedEmail)
        } else {
          setStep('email-choice')
          setIsLoading(false)
        }
        return
      }

      // Phone path
      setPhone(trimmed)
      if (data.exists) {
        setLoginProvider(data.loginProvider === 'cleaner' ? 'cleaner' : 'general')
        await sendOtpCode(trimmed)
      } else {
        setStep('phone-not-found')
        setIsLoading(false)
      }
    } catch {
      setFormError(t('login.identify.genericError'))
      setIsLoading(false)
    }
  }

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFormError(null)

    const providerId = loginProvider === 'cleaner' ? 'cleaner-login' : 'owner-phone-login'
    // Honor an explicit callbackUrl (e.g. a deep link from a push
    // notification or a booking message) the same way the magic-link path
    // already does; otherwise fall back to each role's default dashboard.
    const redirectPath = explicitCallbackUrl || (loginProvider === 'cleaner' ? '/dashboard' : '/owner/dashboard')

    const result = await signIn(providerId, {
      phone,
      code,
      redirect: false,
    })

    setIsLoading(false)

    if (result?.error) {
      // NextAuth doesn't pass through detailed error, so give helpful guidance
      setFormError(t('login.verify.invalidCode'))
    } else {
      router.push(redirectPath)
      router.refresh()
    }
  }

  const handleBack = () => {
    setFormError(null)
    setEmailSent(false)
    if (step === 'phone-verify') {
      setStep('identify')
      setCode('')
    } else if (step === 'owner-email') {
      setStep('select')
      setEmail('')
    } else if (step === 'phone-not-found' || step === 'email-choice') {
      setStep('identify')
      setIdentifier('')
      setEmail('')
      setPhone('')
    } else {
      setStep(isAdminLogin ? 'select' : 'identify')
      setIdentifier('')
      setEmail('')
      setPhone('')
      setCode('')
    }
  }

  // Email sent confirmation view
  if (emailSent) {
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
            <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">&#9993;</span>
            </div>
            <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
              Check your email
            </h1>
            <p className="text-[#6B6B6B] mb-2">
              We sent a sign-in link to
            </p>
            <p className="font-medium text-[#1A1A1A] mb-6">
              {email}
            </p>
            <p className="text-sm text-[#6B6B6B] mb-6">
              Click the link in the email to sign in. The link will expire in 24 hours.
            </p>
            <button
              onClick={handleBack}
              className="text-[#C4785A] font-medium hover:underline"
            >
              Use a different email
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] font-sans flex flex-col">
      {/* Header */}
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

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          {/* Error from URL */}
          {error === 'unauthorized' && (
            <div className="mb-6 p-4 bg-[#FFEBEE] border border-[#C75050] rounded-xl text-[#C75050] text-sm">
              You need to sign in to access that page.
            </div>
          )}
          {error === 'admin_only' && (
            <div className="mb-6 p-4 bg-[#1A1A1A] rounded-xl text-white text-sm">
              <p className="font-medium mb-1">🔐 Admin Access Required</p>
              <p className="text-white/80">Sign in with your admin email to access the admin panel.</p>
            </div>
          )}
          {error === 'owner_only' && (
            <div className="mb-6 p-4 bg-[#FFF8F5] border border-[#C4785A] rounded-xl text-[#1A1A1A] text-sm">
              <p className="font-medium mb-1">🏠 Owner Dashboard</p>
              <p className="text-[#6B6B6B]">Sign in as a property owner to access your villa dashboard. If you&apos;re an admin, <Link href="/login?callbackUrl=/admin" className="text-[#C4785A] underline">sign in to admin panel</Link> instead.</p>
            </div>
          )}
          {error === 'cleaner_only' && (
            <div className="mb-6 p-4 bg-[#FFEBEE] border border-[#C75050] rounded-xl text-[#C75050] text-sm">
              Please sign in as a cleaner to access the cleaner dashboard.
            </div>
          )}
          {error === 'Verification' && (
            <div className="mb-6 p-4 bg-[#FFEBEE] border border-[#C75050] rounded-xl text-[#C75050] text-sm">
              The sign-in link has expired or has already been used. Please request a new one.
            </div>
          )}
          {error === 'EmailSignin' && (
            <div className="mb-6 p-4 bg-[#FFEBEE] border border-[#C75050] rounded-xl text-[#C75050] text-sm">
              There was a problem sending the sign-in link. Please try again.
            </div>
          )}
          {error === 'Callback' && (
            <div className="mb-6 p-4 bg-[#FFF3E0] border border-[#E65100] rounded-xl text-[#1A1A1A] text-sm">
              <p className="font-medium mb-1">Sign-in link expired</p>
              <p className="text-[#6B6B6B]">This link is no longer valid. Please request a new sign-in link below.</p>
            </div>
          )}
          {/* Catch-all for unknown errors (including Prisma errors) */}
          {error && !['unauthorized', 'admin_only', 'owner_only', 'cleaner_only', 'Verification', 'EmailSignin', 'Callback'].includes(error) && (
            <div className="mb-6 p-4 bg-[#FFF3E0] border border-[#E65100] rounded-xl text-[#1A1A1A] text-sm">
              <p className="font-medium mb-1">Something went wrong</p>
              <p className="text-[#6B6B6B]">Your sign-in link may have expired. Please request a new one below.</p>
            </div>
          )}

          {/* Step: Admin select (preserved exactly - admin sign-in only) */}
          {step === 'select' && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
                  Admin Access
                </h1>
                <p className="text-[#6B6B6B]">
                  Sign in to access the admin panel
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setStep('owner-email')}
                  className="w-full bg-white border-2 border-[#1A1A1A] rounded-2xl p-5 text-left transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform bg-[#1A1A1A]">
                      <span className="text-white text-xl">&#128274;</span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A1A1A]">Admin</p>
                      <p className="text-sm text-[#6B6B6B]">Sign in with email link</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step: Admin email entry for magic link (preserved exactly) */}
          {step === 'owner-email' && (
            <div className="space-y-6">
              <div>
                <button
                  onClick={handleBack}
                  className="text-sm text-[#6B6B6B] flex items-center gap-1 mb-4 hover:text-[#1A1A1A]"
                >
                  &larr; Back
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-[#1A1A1A]">
                    <span className="text-white text-base">&#128274;</span>
                  </div>
                  <h1 className="text-xl font-semibold text-[#1A1A1A]">
                    Admin Sign In
                  </h1>
                </div>
                <p className="text-[#6B6B6B]">
                  Enter your email and we&apos;ll send you a sign-in link
                </p>
              </div>

              {formError && (
                <div className="p-4 bg-[#FFEBEE] border border-[#C75050] rounded-xl text-[#C75050] text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleOwnerMagicLink} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@villacare.com"
                    required
                    className="w-full px-4 py-3.5 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    'Send Sign-In Link'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Step: Unified identify (phone or email) */}
          {step === 'identify' && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
                  {t('login.identify.title')}
                </h1>
                <p className="text-[#6B6B6B]">
                  {t('login.identify.subtitle')}
                </p>
              </div>

              {formError && (
                <div className="p-4 bg-[#FFEBEE] border border-[#C75050] rounded-xl text-[#C75050] text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleIdentify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    {t('login.identify.label')}
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={t('login.identify.placeholder')}
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full px-4 py-3.5 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !identifier.trim()}
                  className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('login.identify.checking')}
                    </>
                  ) : (
                    t('login.identify.continue')
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-[#9B9B9B]">
                VillaCare team?{' '}
                <Link href="/login?callbackUrl=/admin" className="text-[#9B9B9B] underline hover:text-[#6B6B6B]">
                  Log in with your email
                </Link>
              </p>
            </div>
          )}

          {/* Step: Phone not found */}
          {step === 'phone-not-found' && (
            <div className="space-y-6">
              <div>
                <button
                  onClick={handleBack}
                  className="text-sm text-[#6B6B6B] flex items-center gap-1 mb-4 hover:text-[#1A1A1A]"
                >
                  {t('login.back')}
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-[#FFF3E0] rounded-xl flex items-center justify-center text-xl">
                    &#128269;
                  </div>
                  <h1 className="text-xl font-semibold text-[#1A1A1A]">
                    {t('login.phone.notFound.title')}
                  </h1>
                </div>
                <p className="text-[#6B6B6B]">
                  {t('login.phone.notFound.body')}
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  href="/onboarding/cleaner"
                  className="block w-full bg-white border-2 border-[#EBEBEB] hover:border-[#C4785A] rounded-2xl p-4 text-center font-medium text-[#1A1A1A] transition-all"
                >
                  {t('login.phone.notFound.cleanerCta')}
                </Link>
                <Link
                  href="/"
                  className="block w-full bg-[#1A1A1A] text-white rounded-2xl p-4 text-center font-medium transition-all active:scale-[0.98]"
                >
                  {t('login.phone.notFound.ownerCta')}
                </Link>
              </div>
            </div>
          )}

          {/* Step: Email choice (unrecognized email) */}
          {step === 'email-choice' && (
            <div className="space-y-6">
              <div>
                <button
                  onClick={handleBack}
                  className="text-sm text-[#6B6B6B] flex items-center gap-1 mb-4 hover:text-[#1A1A1A]"
                >
                  {t('login.back')}
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center text-xl">
                    &#127968;
                  </div>
                  <h1 className="text-xl font-semibold text-[#1A1A1A]">
                    {t('login.email.choice.title')}
                  </h1>
                </div>
                <p className="text-[#6B6B6B]">
                  {t('login.email.choice.body')}
                </p>
              </div>

              {formError && (
                <div className="p-4 bg-[#FFEBEE] border border-[#C75050] rounded-xl text-[#C75050] text-sm">
                  {formError}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => sendMagicLinkForEmail(email)}
                  disabled={isLoading}
                  className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    t('login.email.choice.ownerCta')
                  )}
                </button>
                <button
                  onClick={() => {
                    setStep('identify')
                    setIdentifier('')
                    setEmail('')
                    setFormError(null)
                  }}
                  className="w-full bg-white border-2 border-[#EBEBEB] hover:border-[#C4785A] rounded-2xl p-4 text-center font-medium text-[#1A1A1A] transition-all"
                >
                  {t('login.email.choice.cleanerCta')}
                </button>
              </div>
            </div>
          )}

          {/* Step: Verify phone code */}
          {step === 'phone-verify' && (
            <div className="space-y-6">
              <div>
                <button
                  onClick={handleBack}
                  className="text-sm text-[#6B6B6B] flex items-center gap-1 mb-4 hover:text-[#1A1A1A]"
                >
                  {t('login.back')}
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center text-xl">
                    &#128241;
                  </div>
                  <h1 className="text-xl font-semibold text-[#1A1A1A]">
                    {t('login.verify.title')}
                  </h1>
                </div>
                <p className="text-[#6B6B6B]">
                  {t('login.verify.sentTo').replace('{phone}', phone)}
                </p>
              </div>

              {formError && (
                <div className="p-4 bg-[#FFEBEE] border border-[#C75050] rounded-xl text-[#C75050] text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handlePhoneLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    {t('login.verify.codeLabel')}
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    required
                    maxLength={6}
                    className="w-full px-4 py-3.5 rounded-xl border border-[#DEDEDE] text-base text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-[#1A1A1A] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || code.length !== 6}
                  className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('login.verify.verifying')}
                    </>
                  ) : (
                    t('login.verify.verifyButton')
                  )}
                </button>
              </form>

              <div className="text-center">
                <p className="text-sm text-[#6B6B6B]">
                  {t('login.verify.resendPrompt')}{' '}
                  <button
                    onClick={() => sendOtpCode(phone)}
                    className="text-[#C4785A] font-medium hover:underline"
                  >
                    {t('login.verify.resendButton')}
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center">
        <p className="text-xs text-[#9B9B9B]">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </footer>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C4785A] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
