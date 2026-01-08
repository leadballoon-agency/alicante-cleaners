'use client'

import { useState, FormEvent, useRef } from 'react'
import Image from 'next/image'
import { OnboardingData } from '../page'

type Props = {
  name: string
  photoUrl: string | null
  bio: string
  reviewsLink: string
  onUpdate: (data: Partial<OnboardingData>) => void
  onBack: () => void
  onNext: () => void
}

export default function NamePhoto({ name, photoUrl, bio, reviewsLink, onUpdate, onBack, onNext }: Props) {
  const [value, setValue] = useState(name)
  const [photo, setPhoto] = useState<string | null>(photoUrl)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [bioValue, setBioValue] = useState(bio)
  const [reviewsLinkValue, setReviewsLinkValue] = useState(reviewsLink)
  const [loading, setLoading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Please use JPEG, PNG, WebP, or GIF')
        return
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Photo must be under 5MB')
        return
      }
      setUploadError(null)
      setPhotoFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhoto(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return photo // Return existing photo URL if no new file

    try {
      const formData = new FormData()
      formData.append('file', photoFile)

      const response = await fetch('/api/onboarding/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload photo')
      }

      const data = await response.json()
      return data.url
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload photo')
      return null
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!value.trim()) return

    setLoading(true)
    setUploadError(null)

    // Upload photo to storage if a new file was selected
    let finalPhotoUrl = photo
    if (photoFile) {
      const uploadedUrl = await uploadPhoto()
      if (uploadedUrl) {
        finalPhotoUrl = uploadedUrl
      } else if (uploadError) {
        setLoading(false)
        return // Stop if upload failed
      }
    }

    onUpdate({ name: value.trim(), photoUrl: finalPhotoUrl, bio: bioValue.trim(), reviewsLink: reviewsLinkValue.trim() })
    setLoading(false)
    onNext()
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 text-[#6B6B6B] text-sm flex items-center gap-1 active:opacity-70"
      >
        <span>←</span> Back
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
          Let&apos;s get to know you
        </h1>
        <p className="text-[#6B6B6B]">
          Add your name and a photo for your profile
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo upload */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-24 h-24 rounded-full bg-[#F5F5F3] border-2 border-dashed border-[#DEDEDE] flex items-center justify-center overflow-hidden active:opacity-70 transition-opacity"
          >
            {photo ? (
              <Image src={photo} alt="Profile" fill className="object-cover" unoptimized />
            ) : (
              <span className="text-3xl">📷</span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>
        <p className="text-center text-[#9B9B9B] text-xs">
          Tap to add a photo (optional)
        </p>
        {uploadError && (
          <p className="text-center text-[#C75050] text-xs mt-1">
            {uploadError}
          </p>
        )}

        {/* Name input */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
            Your name
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Clara García"
            className="w-full px-4 py-3.5 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors"
            autoFocus
          />
          <p className="text-[#9B9B9B] text-xs mt-1.5">
            This is how clients will see you
          </p>
        </div>

        {/* Bio input */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
            Short bio <span className="text-[#9B9B9B] font-normal">(optional)</span>
          </label>
          <textarea
            value={bioValue}
            onChange={(e) => setBioValue(e.target.value)}
            placeholder="Professional villa cleaner with 8 years of experience..."
            rows={3}
            maxLength={200}
            className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors resize-none"
          />
          <p className="text-[#9B9B9B] text-xs mt-1.5">
            {bioValue.length}/200 characters
          </p>
        </div>

        {/* Reviews link input */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
            Link to your reviews <span className="text-[#9B9B9B] font-normal">(optional)</span>
          </label>
          <input
            type="url"
            value={reviewsLinkValue}
            onChange={(e) => setReviewsLinkValue(e.target.value)}
            placeholder="https://g.page/your-google-reviews"
            className="w-full px-4 py-3.5 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors"
          />
          <p className="text-[#9B9B9B] text-xs mt-1.5">
            Google, Facebook, TripAdvisor etc. Shows on your profile.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </form>
    </div>
  )
}
