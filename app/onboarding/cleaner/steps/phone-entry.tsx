'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { OnboardingData } from '../page'

type Props = {
  phone: string
  onUpdate: (data: Partial<OnboardingData>) => void
  onNext: () => void
}

export default function PhoneEntry({ phone, onUpdate, onNext }: Props) {
  const [value, setValue] = useState(phone)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [existingUser, setExistingUser] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setExistingUser(false)

    // Basic validation - accept Spanish (+34) and UK (+44) numbers
    const cleaned = value.replace(/\s/g, '')
    // Spanish: 9 digits, UK: 10-11 digits
    const isSpanish = cleaned.match(/^\+?34\d{9}$/) || cleaned.match(/^\d{9}$/)
    const isUK = cleaned.match(/^\+?44\d{10,11}$/) || cleaned.match(/^0\d{10}$/)
    const isInternational = cleaned.match(/^\+\d{10,15}$/) // Any international format

    if (!isSpanish && !isUK && !isInternational) {
      setError('Please enter a valid phone number with country code (e.g., +34 or +44)')
      return
    }

    setLoading(true)

    // Format phone with country code
    let formattedPhone = cleaned
    if (cleaned.match(/^\d{9}$/)) {
      formattedPhone = `+34${cleaned}` // Default to Spanish
    } else if (cleaned.match(/^0\d{10}$/)) {
      formattedPhone = `+44${cleaned.slice(1)}` // UK: convert 07xxx to +447xxx
    } else if (!cleaned.startsWith('+')) {
      formattedPhone = `+${cleaned}`
    }

    try {
      // Send OTP with onboarding context to check for existing users
      const response = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          action: 'send',
          context: 'onboarding', // Check for existing users
        }),
      })

      const result = await response.json()

      // Handle existing user (409 Conflict)
      if (response.status === 409 && result.existingUser) {
        setExistingUser(true)
        onUpdate({ phone: formattedPhone }) // Store phone for login redirect
        return
      }

      if (!response.ok) {
        setError(result.error || 'Failed to send verification code')
        return
      }

      onUpdate({ phone: formattedPhone })
      onNext()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Show existing user message
  if (existingUser) {
    return (
      <div>
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">&#128075;</div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
            Welcome back!
          </h1>
          <p className="text-[#6B6B6B]">
            You already have an account with this phone number.
          </p>
        </div>

        <div className="bg-[#F5F5F3] rounded-2xl p-6 text-center mb-6">
          <p className="text-[#6B6B6B] mb-4">
            Please sign in to access your dashboard.
          </p>
          <Link
            href="/login"
            className="inline-block w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all text-center"
          >
            Sign In
          </Link>
        </div>

        <button
          type="button"
          onClick={() => {
            setExistingUser(false)
            setValue('')
          }}
          className="w-full py-2 text-sm text-[#6B6B6B] hover:text-[#1A1A1A]"
        >
          Use a different phone number
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="text-4xl mb-4">&#128241;</div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
          Enter your phone
        </h1>
        <p className="text-[#6B6B6B]">
          We&apos;ll send you a code to verify it&apos;s you
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
            Phone number
          </label>
          <input
            type="tel"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="+34 612 345 678"
            className="w-full px-4 py-3.5 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors"
            autoFocus
          />
          <p className="text-xs text-[#9B9B9B] mt-1.5">
            Include country code (e.g., +34 for Spain, +44 for UK)
          </p>
        </div>

        {error && (
          <p className="text-[#C75050] text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !value}
          className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending code...
            </>
          ) : (
            'Send verification code'
          )}
        </button>
      </form>

      <p className="text-center text-[#9B9B9B] text-xs mt-6">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>

      {/* Dev mode skip */}
      {process.env.NODE_ENV === 'development' && (
        <button
          type="button"
          onClick={() => {
            onUpdate({ phone: '+34600000000' })
            onNext()
            // Skip verification step too
            setTimeout(() => onNext(), 100)
          }}
          className="w-full mt-4 py-2 text-sm text-[#9B9B9B] hover:text-[#6B6B6B]"
        >
          [Dev] Skip phone verification
        </button>
      )}
    </div>
  )
}
