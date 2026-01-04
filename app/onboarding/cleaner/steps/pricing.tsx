'use client'

import { useState, FormEvent } from 'react'
import { OnboardingData } from '../page'

type Props = {
  data: OnboardingData
  onUpdate: (data: Partial<OnboardingData>) => void
  onBack: () => void
  onNext: () => void
}

function calculateServicePrices(hourlyRate: number) {
  return {
    regular: { price: hourlyRate * 3, hours: 3, name: 'Regular Clean' },
    deep: { price: hourlyRate * 5, hours: 5, name: 'Deep Clean' },
    arrival: { price: hourlyRate * 4, hours: 4, name: 'Arrival Prep' },
  }
}

export default function Pricing({ data, onUpdate, onBack, onNext }: Props) {
  const [rate, setRate] = useState(data.hourlyRate)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const services = calculateServicePrices(rate)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Submit to API
      const response = await fetch('/api/onboarding/cleaner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: data.phone,
          name: data.name,
          photoUrl: data.photoUrl,
          bio: data.bio,
          reviewsLink: data.reviewsLink,
          serviceAreas: data.serviceAreas,
          hourlyRate: rate,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Something went wrong. Please try again.')
        return
      }

      onUpdate({ hourlyRate: rate, slug: result.cleaner.slug })
      onNext()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 text-[#6B6B6B] text-sm flex items-center gap-1 active:opacity-70"
      >
        <span>&larr;</span> Back
      </button>

      <div className="text-center mb-8">
        <div className="text-4xl mb-4">&#128176;</div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
          Set your rate
        </h1>
        <p className="text-[#6B6B6B]">
          Choose your hourly rate and we&apos;ll calculate your service prices
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rate slider */}
        <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
          <div className="text-center mb-4">
            <span className="text-4xl font-semibold text-[#1A1A1A]">&euro;{rate}</span>
            <span className="text-[#6B6B6B]">/hour</span>
          </div>

          <input
            type="range"
            min={12}
            max={30}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full h-2 bg-[#EBEBEB] rounded-lg appearance-none cursor-pointer accent-[#1A1A1A]"
          />

          <div className="flex justify-between text-xs text-[#9B9B9B] mt-2">
            <span>&euro;12</span>
            <span>&euro;30</span>
          </div>
        </div>

        {/* Service prices preview */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-[#1A1A1A]">Your service prices</p>
          {Object.entries(services).map(([key, service]) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#EBEBEB]"
            >
              <div>
                <p className="font-medium text-[#1A1A1A]">{service.name}</p>
                <p className="text-sm text-[#6B6B6B]">{service.hours} hours</p>
              </div>
              <span className="text-lg font-semibold text-[#1A1A1A]">
                &euro;{service.price}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[#9B9B9B] text-xs text-center">
          You can adjust prices for individual services later
        </p>

        {error && (
          <p className="text-[#C75050] text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating your page...
            </>
          ) : (
            'Create my booking page'
          )}
        </button>
      </form>
    </div>
  )
}
