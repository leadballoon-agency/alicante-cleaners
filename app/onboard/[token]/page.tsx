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
        body: JSON.stringify({ email, propertyName }),
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
            {data.accessNotes && (
              <div className="border-t border-[#EBEBEB] pt-3">
                <span className="text-[#6B6B6B] block mb-1">Access Notes</span>
                <span className="text-[#1A1A1A]">{data.accessNotes}</span>
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
