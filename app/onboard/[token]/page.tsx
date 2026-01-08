'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'

type OnboardingData = {
  id: string
  cleanerName: string
  cleanerPhoto: string | null
  visitorName: string
  visitorPhone: string
  bedrooms: number
  bathrooms: number
  outdoorAreas: string[]
  accessNotes: string | null
  serviceType: string
  serviceName: string
  servicePrice: number
  serviceHours: number
  preferredDate: string
  preferredTime: string
  status: string
  expiresAt: string
}

export default function OnboardingPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [data, setData] = useState<OnboardingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [email, setEmail] = useState('')
  const [propertyName, setPropertyName] = useState('')
  const [accessNotes, setAccessNotes] = useState('')
  const [showSecurityInfo, setShowSecurityInfo] = useState(false)

  useEffect(() => {
    async function fetchOnboarding() {
      try {
        const response = await fetch(`/api/ai/onboarding/${token}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('expired')
          } else {
            setError('error')
          }
          return
        }
        const result = await response.json()
        setData(result)
      } catch {
        setError('error')
      } finally {
        setLoading(false)
      }
    }

    fetchOnboarding()
  }, [token])

  const handleConfirm = async () => {
    if (!email || !propertyName) {
      alert('Please fill in your email and property name')
      return
    }

    setConfirming(true)
    try {
      const response = await fetch(`/api/ai/onboarding/${token}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, propertyName, accessNotes: accessNotes || undefined }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Confirmation failed')
      }

      // Redirect to owner dashboard
      router.push('/dashboard/owner?welcome=true')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong')
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C4785A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error === 'expired' || !data) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">&#8987;</div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">Link Expired</h1>
          <p className="text-[#6B6B6B] mb-6">
            This booking link has expired or already been used.
            Please start a new chat with your cleaner to create a new booking.
          </p>
          <a href="/" className="text-[#C4785A] font-medium underline">
            Back to VillaCare
          </a>
        </div>
      </div>
    )
  }

  if (data.status === 'COMPLETED') {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">&#9989;</div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">Already Confirmed!</h1>
          <p className="text-[#6B6B6B] mb-6">
            This booking has already been confirmed. Check your dashboard for details.
          </p>
          <a href="/dashboard/owner" className="inline-block bg-[#1A1A1A] text-white px-6 py-3 rounded-xl font-medium">
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  const formattedDate = new Date(data.preferredDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 bg-white border-b border-[#EBEBEB]">
        <div className="max-w-lg mx-auto">
          <Image
            src="/villacare-horizontal-logo.png"
            alt="VillaCare"
            width={140}
            height={40}
            className="object-contain"
          />
        </div>
      </header>

      <main className="px-6 py-8 max-w-lg mx-auto">
        {/* Welcome */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">&#127881;</div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
            Welcome, {data.visitorName}!
          </h1>
          <p className="text-[#6B6B6B]">
            Confirm your booking with {data.cleanerName}
          </p>
        </div>

        {/* Booking Summary */}
        <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB] mb-6">
          <h2 className="font-semibold text-[#1A1A1A] mb-4">Booking Details</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Service</span>
              <span className="font-medium text-[#1A1A1A]">{data.serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Date</span>
              <span className="font-medium text-[#1A1A1A]">{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Time</span>
              <span className="font-medium text-[#1A1A1A]">{data.preferredTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Duration</span>
              <span className="font-medium text-[#1A1A1A]">{data.serviceHours} hours</span>
            </div>
            <div className="border-t border-[#EBEBEB] pt-3 flex justify-between">
              <span className="text-[#6B6B6B]">Total</span>
              <span className="font-semibold text-lg text-[#C4785A]">&euro;{data.servicePrice}</span>
            </div>
          </div>
        </div>

        {/* Property Summary */}
        <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB] mb-6">
          <h2 className="font-semibold text-[#1A1A1A] mb-4">Your Property</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Bedrooms</span>
              <span className="font-medium text-[#1A1A1A]">{data.bedrooms}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Bathrooms</span>
              <span className="font-medium text-[#1A1A1A]">{data.bathrooms}</span>
            </div>
            {data.outdoorAreas.length > 0 && (
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Outdoor</span>
                <span className="font-medium text-[#1A1A1A] capitalize">
                  {data.outdoorAreas.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Secure Access Notes Section */}
        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-5 border border-emerald-200 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-[#1A1A1A]">Secure Access Details</h2>
              <p className="text-sm text-[#6B6B6B] mt-0.5">
                This information is encrypted and only shared with your cleaner
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#6B6B6B] mb-1.5">
                Access Instructions
                <span className="text-[#9B9B9B] ml-1">(optional)</span>
              </label>
              <textarea
                value={accessNotes}
                onChange={(e) => setAccessNotes(e.target.value)}
                placeholder="e.g., Key is in the lockbox by the front door (code: 1234), gate code is 5678, parking in space #3"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] focus:outline-none focus:border-emerald-500 text-sm resize-none"
              />
            </div>

            {/* Security Info Toggle */}
            <button
              type="button"
              onClick={() => setShowSecurityInfo(!showSecurityInfo)}
              className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
            >
              <svg className={`w-4 h-4 transition-transform ${showSecurityInfo ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              How we protect your information
            </button>

            {showSecurityInfo && (
              <div className="bg-white rounded-xl p-4 text-sm space-y-2 border border-emerald-100">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">&#10003;</span>
                  <span className="text-[#6B6B6B]">
                    <strong className="text-[#1A1A1A]">Encrypted storage</strong> - Your access details are encrypted using industry-standard AES-256 encryption
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">&#10003;</span>
                  <span className="text-[#6B6B6B]">
                    <strong className="text-[#1A1A1A]">Just-in-time access</strong> - Your cleaner can only view access details 24 hours before your booking
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">&#10003;</span>
                  <span className="text-[#6B6B6B]">
                    <strong className="text-[#1A1A1A]">Limited visibility</strong> - Only your assigned cleaner can see your access information
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">&#10003;</span>
                  <span className="text-[#6B6B6B]">
                    <strong className="text-[#1A1A1A]">You&apos;re in control</strong> - Update or remove access details anytime from your dashboard
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Complete Your Account */}
        <div className="bg-gradient-to-br from-[#FFF8F5] to-white rounded-2xl p-5 border border-[#EBEBEB] mb-6">
          <h2 className="font-semibold text-[#1A1A1A] mb-4">Complete Your Account</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#6B6B6B] mb-1.5">Property Name *</label>
              <input
                type="text"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="e.g., Villa Marina, Casa del Sol"
                className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] focus:outline-none focus:border-[#1A1A1A] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-[#6B6B6B] mb-1.5">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] focus:outline-none focus:border-[#1A1A1A] text-sm"
              />
              <p className="text-xs text-[#9B9B9B] mt-1.5">
                We&apos;ll send booking confirmations and updates here
              </p>
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={confirming || !email || !propertyName}
          className="w-full bg-[#1A1A1A] text-white py-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {confirming ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating your account...
            </>
          ) : (
            <>
              <span>&#9989;</span>
              Confirm Booking
            </>
          )}
        </button>

        <p className="text-xs text-[#9B9B9B] text-center mt-4">
          By confirming, you agree to VillaCare&apos;s terms of service.
          {data.cleanerName} will be notified and will confirm your booking.
        </p>
      </main>
    </div>
  )
}
