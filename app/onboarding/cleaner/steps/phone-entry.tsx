'use client'

import { useState, FormEvent } from 'react'
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // Basic validation
    const cleaned = value.replace(/\s/g, '')
    if (!cleaned.match(/^\+?34\d{9}$/) && !cleaned.match(/^\d{9}$/)) {
      setError('Please enter a valid Spanish phone number')
      return
    }

    setLoading(true)

    const formattedPhone = cleaned.startsWith('+') ? cleaned : `+34${cleaned}`

    try {
      // Send OTP
      const response = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          action: 'send',
        }),
      })

      const result = await response.json()

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
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B]">
              +34
            </span>
            <input
              type="tel"
              value={value.replace(/^\+?34/, '')}
              onChange={(e) => setValue(e.target.value)}
              placeholder="612 345 678"
              className="w-full pl-14 pr-4 py-3.5 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors"
              autoFocus
            />
          </div>
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
