'use client'

import { useState, FormEvent } from 'react'
import { BookingData } from '../page'

type Props = {
  data: BookingData
  onUpdate: (data: Partial<BookingData>) => void
  onNext: () => void
}

export default function PropertyDetails({ data, onUpdate, onNext }: Props) {
  const [address, setAddress] = useState(data.propertyAddress)
  const [bedrooms, setBedrooms] = useState(data.bedrooms)
  const [instructions, setInstructions] = useState(data.specialInstructions)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!address.trim()) return

    onUpdate({
      propertyAddress: address.trim(),
      bedrooms,
      specialInstructions: instructions.trim(),
    })
    onNext()
  }

  return (
    <div>
      <div className="text-center mb-6">
        <div className="text-4xl mb-4">🏠</div>
        <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">
          Property details
        </h1>
        <p className="text-[#6B6B6B] text-sm">
          Tell us about your villa
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
            Property address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Calle Example 123, San Juan"
            className="w-full px-4 py-3.5 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors"
            required
          />
        </div>

        {/* Bedrooms */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
            Number of bedrooms
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setBedrooms(Math.max(1, bedrooms - 1))}
              className="w-12 h-12 rounded-xl border border-[#DEDEDE] bg-white flex items-center justify-center text-xl font-medium text-[#1A1A1A] active:bg-[#F5F5F3] transition-colors"
            >
              −
            </button>
            <div className="flex-1 text-center">
              <span className="text-2xl font-semibold text-[#1A1A1A]">{bedrooms}</span>
              <span className="text-[#6B6B6B] ml-1">bedroom{bedrooms !== 1 ? 's' : ''}</span>
            </div>
            <button
              type="button"
              onClick={() => setBedrooms(Math.min(10, bedrooms + 1))}
              className="w-12 h-12 rounded-xl border border-[#DEDEDE] bg-white flex items-center justify-center text-xl font-medium text-[#1A1A1A] active:bg-[#F5F5F3] transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Special instructions */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
            Special instructions <span className="text-[#9B9B9B] font-normal">(optional)</span>
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Key location, alarm codes, pet info, specific areas to focus on..."
            rows={3}
            className="w-full px-4 py-3.5 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors resize-none"
          />
        </div>

        {/* Info box */}
        <div className="bg-[#FFF8F5] rounded-xl p-4 border border-[#F5E6E0]">
          <div className="flex gap-3">
            <span className="text-lg">ℹ️</span>
            <div>
              <p className="text-sm text-[#1A1A1A] font-medium mb-1">Access instructions</p>
              <p className="text-xs text-[#6B6B6B]">
                We&apos;ll send you a reminder before your booking to confirm access details like key location or entry codes.
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!address.trim()}
          className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          Continue to payment
        </button>
      </form>
    </div>
  )
}
