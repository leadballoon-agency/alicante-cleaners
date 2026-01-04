'use client'

import { useState, FormEvent } from 'react'
import { BookingData } from '../page'

type Props = {
  data: BookingData
  cleaner: {
    name: string
    photo: string | null
  }
  cleanerSlug: string
  onUpdate: (data: Partial<BookingData>) => void
  onNext: () => void
}

export default function Payment({ data, cleaner, cleanerSlug, onUpdate, onNext }: Props) {
  const [phone, setPhone] = useState(data.phone)
  const [email, setEmail] = useState(data.email)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!phone.trim() || !email.trim()) return

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      // Submit booking to API
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cleanerSlug,
          propertyAddress: data.propertyAddress,
          bedrooms: data.bedrooms,
          specialInstructions: data.specialInstructions,
          service: data.service,
          date: data.date?.toISOString(),
          time: data.time,
          guestPhone: phone.trim(),
          guestEmail: email.trim(),
          guestName: name.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Something went wrong. Please try again.')
        return
      }

      onUpdate({ phone: phone.trim(), email: email.trim() })
      onNext()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div>
      <div className="text-center mb-6">
        <div className="text-4xl mb-4">&#128179;</div>
        <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">
          Confirm & pay
        </h1>
        <p className="text-[#6B6B6B] text-sm">
          Review your booking details
        </p>
      </div>

      {/* Booking summary */}
      <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB] mb-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#EBEBEB]">
          <div className="w-12 h-12 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden">
            {cleaner.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cleaner.photo} alt={cleaner.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">&#128100;</span>
            )}
          </div>
          <div>
            <p className="font-medium text-[#1A1A1A]">{cleaner.name}</p>
            <p className="text-sm text-[#6B6B6B]">{data.service?.name}</p>
          </div>
        </div>

        <div className="py-4 space-y-3 border-b border-[#EBEBEB]">
          <div className="flex justify-between text-sm">
            <span className="text-[#6B6B6B]">Date</span>
            <span className="text-[#1A1A1A]">{formatDate(data.date)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6B6B6B]">Time</span>
            <span className="text-[#1A1A1A]">{data.time}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6B6B6B]">Duration</span>
            <span className="text-[#1A1A1A]">{data.service?.hours} hours</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6B6B6B]">Property</span>
            <span className="text-[#1A1A1A] text-right max-w-[60%] truncate">{data.propertyAddress}</span>
          </div>
        </div>

        <div className="pt-4 flex justify-between items-center">
          <span className="font-medium text-[#1A1A1A]">Total</span>
          <span className="text-xl font-semibold text-[#1A1A1A]">&euro;{data.service?.price}</span>
        </div>
      </div>

      {/* Contact details form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
            Your name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Smith"
            className="w-full px-4 py-3.5 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
            Phone number
          </label>
          <div className="flex gap-2">
            <div className="w-16 px-3 py-3.5 rounded-xl border border-[#DEDEDE] bg-[#F5F5F3] text-center text-[#6B6B6B]">
              +34
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="612 345 678"
              className="flex-1 px-4 py-3.5 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3.5 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors"
            required
          />
          <p className="text-xs text-[#9B9B9B] mt-1.5">
            We&apos;ll send your booking confirmation here
          </p>
        </div>

        {/* Payment placeholder */}
        <div className="bg-[#F5F5F3] rounded-xl p-4 border border-[#EBEBEB]">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-lg">&#128274;</span>
            <span className="text-sm font-medium text-[#1A1A1A]">Secure payment</span>
          </div>
          <p className="text-xs text-[#6B6B6B]">
            Payment processing will be enabled soon. For now, your booking will be confirmed directly.
          </p>
        </div>

        {error && (
          <p className="text-[#C75050] text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !phone.trim() || !email.trim()}
          className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating booking...
            </>
          ) : (
            `Confirm booking · €${data.service?.price}`
          )}
        </button>

        <p className="text-xs text-[#9B9B9B] text-center">
          By confirming, you agree to our terms of service
        </p>
      </form>
    </div>
  )
}
