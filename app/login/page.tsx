'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

type Step = 'select' | 'owner-method' | 'owner-email' | 'owner-phone' | 'owner-verify' | 'cleaner-phone' | 'cleaner-verify'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') || '/owner/dashboard'
  const isAdminLogin = callbackUrl.includes('/admin')

  const [step, setStep] = useState<Step>('select')
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  // Owner login state
  const [email, setEmail] = useState('')

  // Phone login state (shared by owner and cleaner)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loginType, setLoginType] = useState<'owner' | 'cleaner'>('owner')

  const handleOwnerMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFormError(null)

    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        setFormError('Failed to send magic link. Please try again.')
        setIsLoading(false)
      } else {
        setEmailSent(true)
        setIsLoading(false)
      }
    } catch {
      setFormError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFormError(null)

    // TODO: Integrate with SMS service (Twilio, etc.)
    // For now, simulate sending code
    await new Promise(resolve => setTimeout(resolve, 1000))

    setStep(loginType === 'owner' ? 'owner-verify' : 'cleaner-verify')
    setIsLoading(false)
  }

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFormError(null)

    const providerId = loginType === 'owner' ? 'owner-phone-login' : 'cleaner-login'
    const redirectPath = loginType === 'owner' ? '/owner/dashboard' : '/dashboard'

    const result = await signIn(providerId, {
      phone,
      code,
      redirect: false,
    })

    setIsLoading(false)

    if (result?.error) {
      setFormError('Invalid verification code')
    } else {
      router.push(redirectPath)
      router.refresh()
    }
  }

  const handleBack = () => {
    setFormError(null)
    setEmailSent(false)
    if (step === 'cleaner-verify') {
      setStep('cleaner-phone')
      setCode('')
    } else if (step === 'owner-verify') {
      setStep('owner-phone')
      setCode('')
    } else if (step === 'owner-email' || step === 'owner-phone') {
      setStep(isAdminLogin ? 'select' : 'owner-method')
      setEmail('')
      setPhone('')
    } else if (step === 'owner-method') {
      setStep('select')
    } else {
      setStep('select')
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
            <div className="mb-6 p-4 bg-[#FFEBEE] border border-[#C75050] rounded-xl text-[#C75050] text-sm">
              That page is only accessible to administrators.
            </div>
          )}
          {error === 'owner_only' && (
            <div className="mb-6 p-4 bg-[#FFEBEE] border border-[#C75050] rounded-xl text-[#C75050] text-sm">
              Please sign in as a property owner to access the owner dashboard.
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

          {/* Step: Select user type */}
          {step === 'select' && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
                  {isAdminLogin ? 'Admin Access' : 'Welcome back'}
                </h1>
                <p className="text-[#6B6B6B]">
                  {isAdminLogin ? 'Sign in to access the admin panel' : 'How would you like to sign in?'}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setLoginType('owner')
                    setStep(isAdminLogin ? 'owner-email' : 'owner-method')
                  }}
                  className={`w-full bg-white border-2 rounded-2xl p-5 text-left transition-all group ${isAdminLogin ? 'border-[#1A1A1A]' : 'border-[#EBEBEB] hover:border-[#C4785A]'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform ${isAdminLogin ? 'bg-[#1A1A1A]' : 'bg-[#FFF8F5]'}`}>
                      {isAdminLogin ? (
                        <span className="text-white text-xl">&#128274;</span>
                      ) : (
                        <span>&#127968;</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A1A1A]">{isAdminLogin ? 'Admin' : 'Property Owner'}</p>
                      <p className="text-sm text-[#6B6B6B]">{isAdminLogin ? 'Sign in with email link' : 'Email or phone'}</p>
                    </div>
                  </div>
                </button>

                {!isAdminLogin && (
                  <button
                    onClick={() => {
                      setLoginType('cleaner')
                      setStep('cleaner-phone')
                    }}
                    className="w-full bg-white border-2 border-[#EBEBEB] hover:border-[#C4785A] rounded-2xl p-5 text-left transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#FFF8F5] rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        &#10024;
                      </div>
                      <div>
                        <p className="font-semibold text-[#1A1A1A]">Cleaner</p>
                        <p className="text-sm text-[#6B6B6B]">Sign in with phone</p>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step: Owner method selection */}
          {step === 'owner-method' && (
            <div className="space-y-6">
              <div>
                <button
                  onClick={handleBack}
                  className="text-sm text-[#6B6B6B] flex items-center gap-1 mb-4 hover:text-[#1A1A1A]"
                >
                  &larr; Back
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center text-xl">
                    &#127968;
                  </div>
                  <h1 className="text-xl font-semibold text-[#1A1A1A]">
                    Owner Sign In
                  </h1>
                </div>
                <p className="text-[#6B6B6B]">
                  How would you like to sign in?
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setStep('owner-email')}
                  className="w-full bg-white border-2 border-[#EBEBEB] hover:border-[#C4785A] rounded-2xl p-4 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F5F5F3] rounded-lg flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                      &#9993;
                    </div>
                    <div>
                      <p className="font-medium text-[#1A1A1A]">Email link</p>
                      <p className="text-sm text-[#6B6B6B]">We&apos;ll send you a sign-in link</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setStep('owner-phone')}
                  className="w-full bg-white border-2 border-[#EBEBEB] hover:border-[#C4785A] rounded-2xl p-4 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F5F5F3] rounded-lg flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                      &#128241;
                    </div>
                    <div>
                      <p className="font-medium text-[#1A1A1A]">Phone code</p>
                      <p className="text-sm text-[#6B6B6B]">We&apos;ll send you a verification code</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step: Owner email entry for magic link */}
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
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isAdminLogin ? 'bg-[#1A1A1A]' : 'bg-[#FFF8F5]'}`}>
                    {isAdminLogin ? (
                      <span className="text-white text-base">&#128274;</span>
                    ) : (
                      <span>&#127968;</span>
                    )}
                  </div>
                  <h1 className="text-xl font-semibold text-[#1A1A1A]">
                    {isAdminLogin ? 'Admin Sign In' : 'Owner Sign In'}
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
                    placeholder={isAdminLogin ? 'admin@villacare.com' : 'you@example.com'}
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

              {!isAdminLogin && (
                <p className="text-center text-sm text-[#6B6B6B]">
                  No account? No problem! We&apos;ll create one for you.
                </p>
              )}
            </div>
          )}

          {/* Step: Owner phone entry */}
          {step === 'owner-phone' && (
            <div className="space-y-6">
              <div>
                <button
                  onClick={handleBack}
                  className="text-sm text-[#6B6B6B] flex items-center gap-1 mb-4 hover:text-[#1A1A1A]"
                >
                  &larr; Back
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center text-xl">
                    &#127968;
                  </div>
                  <h1 className="text-xl font-semibold text-[#1A1A1A]">
                    Owner Sign In
                  </h1>
                </div>
                <p className="text-[#6B6B6B]">
                  We&apos;ll send a verification code to your phone
                </p>
              </div>

              {formError && (
                <div className="p-4 bg-[#FFEBEE] border border-[#C75050] rounded-xl text-[#C75050] text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+34 612 345 678"
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
                      Sending code...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-[#6B6B6B]">
                No account? No problem! We&apos;ll create one for you.
              </p>
            </div>
          )}

          {/* Step: Owner verify code */}
          {step === 'owner-verify' && (
            <div className="space-y-6">
              <div>
                <button
                  onClick={handleBack}
                  className="text-sm text-[#6B6B6B] flex items-center gap-1 mb-4 hover:text-[#1A1A1A]"
                >
                  &larr; Back
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center text-xl">
                    &#128241;
                  </div>
                  <h1 className="text-xl font-semibold text-[#1A1A1A]">
                    Enter Code
                  </h1>
                </div>
                <p className="text-[#6B6B6B]">
                  We sent a 6-digit code to <span className="font-medium text-[#1A1A1A]">{phone}</span>
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
                    Verification Code
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
                      Verifying...
                    </>
                  ) : (
                    'Verify & Sign In'
                  )}
                </button>
              </form>

              <div className="text-center">
                <p className="text-sm text-[#6B6B6B]">
                  Didn&apos;t receive the code?{' '}
                  <button
                    onClick={() => handleSendCode({ preventDefault: () => {} } as React.FormEvent)}
                    className="text-[#C4785A] font-medium hover:underline"
                  >
                    Resend
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Step: Cleaner phone entry */}
          {step === 'cleaner-phone' && (
            <div className="space-y-6">
              <div>
                <button
                  onClick={handleBack}
                  className="text-sm text-[#6B6B6B] flex items-center gap-1 mb-4 hover:text-[#1A1A1A]"
                >
                  &larr; Back
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center text-xl">
                    &#10024;
                  </div>
                  <h1 className="text-xl font-semibold text-[#1A1A1A]">
                    Cleaner Sign In
                  </h1>
                </div>
                <p className="text-[#6B6B6B]">
                  We&apos;ll send a verification code to your phone
                </p>
              </div>

              {formError && (
                <div className="p-4 bg-[#FFEBEE] border border-[#C75050] rounded-xl text-[#C75050] text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+34 612 345 678"
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
                      Sending code...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-[#6B6B6B]">
                Not registered yet?{' '}
                <Link href="/onboarding/cleaner" className="text-[#C4785A] font-medium hover:underline">
                  Apply to join
                </Link>
              </p>
            </div>
          )}

          {/* Step: Cleaner verify code */}
          {step === 'cleaner-verify' && (
            <div className="space-y-6">
              <div>
                <button
                  onClick={handleBack}
                  className="text-sm text-[#6B6B6B] flex items-center gap-1 mb-4 hover:text-[#1A1A1A]"
                >
                  &larr; Back
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center text-xl">
                    &#128241;
                  </div>
                  <h1 className="text-xl font-semibold text-[#1A1A1A]">
                    Enter Code
                  </h1>
                </div>
                <p className="text-[#6B6B6B]">
                  We sent a 6-digit code to <span className="font-medium text-[#1A1A1A]">{phone}</span>
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
                    Verification Code
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
                      Verifying...
                    </>
                  ) : (
                    'Verify & Sign In'
                  )}
                </button>
              </form>

              <div className="text-center">
                <p className="text-sm text-[#6B6B6B]">
                  Didn&apos;t receive the code?{' '}
                  <button
                    onClick={() => handleSendCode({ preventDefault: () => {} } as React.FormEvent)}
                    className="text-[#C4785A] font-medium hover:underline"
                  >
                    Resend
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
