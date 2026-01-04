'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

type Category = 'idea' | 'issue' | 'praise' | 'question'
type Mood = 'love' | 'like' | 'meh' | 'frustrated'

type FeedbackData = {
  id: string
  category: Category
  mood: Mood
  message: string
  page: string
  userType: 'owner' | 'cleaner' | 'visitor' | null
  createdAt: Date
  status: 'new' | 'reviewed' | 'planned' | 'done'
  votes: number
}

const MOODS: { id: Mood; emoji: string; label: string; color: string }[] = [
  { id: 'love', emoji: '😍', label: 'Love it!', color: '#E8F5E9' },
  { id: 'like', emoji: '🙂', label: 'It\'s good', color: '#E3F2FD' },
  { id: 'meh', emoji: '😐', label: 'Could be better', color: '#FFF8E1' },
  { id: 'frustrated', emoji: '😤', label: 'Frustrated', color: '#FFEBEE' },
]

const CATEGORIES: { id: Category; emoji: string; label: string; description: string }[] = [
  { id: 'idea', emoji: '💡', label: 'Idea', description: 'Feature suggestion' },
  { id: 'issue', emoji: '🐛', label: 'Issue', description: 'Something broken' },
  { id: 'praise', emoji: '⭐', label: 'Praise', description: 'What you love' },
  { id: 'question', emoji: '❓', label: 'Question', description: 'Need help' },
]

export default function FeedbackWidget() {
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'mood' | 'category' | 'message' | 'success'>('mood')
  const [mood, setMood] = useState<Mood | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPulse, setShowPulse] = useState(false)

  const pathname = usePathname()

  // Hide on admin pages (admins view feedback, not submit)
  const isAdminPage = pathname?.startsWith('/admin') ?? false

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Pulse animation every few seconds when closed
  useEffect(() => {
    if (!mounted || isOpen) return

    // Initial pulse after mount
    const timeout = setTimeout(() => setShowPulse(true), 1000)

    const interval = setInterval(() => {
      setShowPulse(true)
      setTimeout(() => setShowPulse(false), 2000)
    }, 8000)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [mounted, isOpen])

  const reset = () => {
    setStep('mood')
    setMood(null)
    setCategory(null)
    setMessage('')
  }

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(reset, 300)
  }

  const handleMoodSelect = (selectedMood: Mood) => {
    setMood(selectedMood)
    setStep('category')
  }

  const handleCategorySelect = (selectedCategory: Category) => {
    setCategory(selectedCategory)
    setStep('message')
  }

  const handleSubmit = async () => {
    if (!mood || !category) return

    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    const feedback: FeedbackData = {
      id: `fb_${Date.now()}`,
      category,
      mood,
      message: message.trim(),
      page: pathname || '/',
      userType: pathname?.includes('/dashboard') ? 'cleaner' : pathname?.includes('/owner') ? 'owner' : 'visitor',
      createdAt: new Date(),
      status: 'new',
      votes: 0,
    }

    console.log('Feedback submitted:', feedback)
    // TODO: Send to API

    setIsSubmitting(false)
    setStep('success')
  }

  const getPageContext = () => {
    if (!pathname || pathname === '/') return 'Landing Page'
    if (pathname.includes('/dashboard')) return 'Cleaner Dashboard'
    if (pathname.includes('/owner')) return 'Owner Dashboard'
    if (pathname.includes('/admin')) return 'Admin Panel'
    if (pathname.includes('/booking')) return 'Booking Flow'
    if (pathname.includes('/onboarding')) return 'Onboarding'
    return pathname
  }

  // Don't render until mounted (prevents hydration mismatch) or on admin pages
  if (!mounted || isAdminPage) return null

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#C4785A] to-[#A66347] text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
        aria-label="Send feedback"
      >
        {/* Pulse ring */}
        {showPulse && (
          <span className="absolute inset-0 rounded-full bg-[#C4785A] animate-ping opacity-30" />
        )}

        {/* Icon */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M12 7v2" />
          <path d="M12 13h.01" />
        </svg>
      </button>

      {/* Modal Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-[calc(100vw-48px)] max-w-md transition-all duration-300 ease-out ${
          isOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-[#C4785A] to-[#A66347] px-6 py-5 text-white">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <span className="text-lg">×</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xl">
                  {step === 'success' ? '🎉' : step === 'message' ? '✍️' : '💭'}
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-lg">
                  {step === 'mood' && 'How are you feeling?'}
                  {step === 'category' && 'What\'s on your mind?'}
                  {step === 'message' && 'Tell us more'}
                  {step === 'success' && 'Thank you!'}
                </h2>
                <p className="text-white/70 text-sm">
                  {step === 'success' ? 'Your feedback helps us improve' : `Viewing: ${getPageContext()}`}
                </p>
              </div>
            </div>

            {/* Progress dots */}
            {step !== 'success' && (
              <div className="flex gap-1.5 mt-4">
                {['mood', 'category', 'message'].map((s, i) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      ['mood', 'category', 'message'].indexOf(step) >= i
                        ? 'bg-white'
                        : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step 1: Mood */}
            {step === 'mood' && (
              <div className="space-y-3">
                <p className="text-sm text-[#6B6B6B] text-center mb-4">
                  Start by sharing how you feel about VillaCare
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {MOODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleMoodSelect(m.id)}
                      className="p-4 rounded-2xl border-2 border-[#EBEBEB] hover:border-[#C4785A] transition-all hover:scale-[1.02] active:scale-[0.98] text-center group"
                      style={{ backgroundColor: mood === m.id ? m.color : undefined }}
                    >
                      <span className="text-3xl block mb-1 group-hover:scale-110 transition-transform">
                        {m.emoji}
                      </span>
                      <span className="text-sm font-medium text-[#1A1A1A]">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Category */}
            {step === 'category' && (
              <div className="space-y-3">
                <button
                  onClick={() => setStep('mood')}
                  className="text-sm text-[#6B6B6B] flex items-center gap-1 mb-2 hover:text-[#1A1A1A]"
                >
                  ← Back
                </button>
                <p className="text-sm text-[#6B6B6B] text-center mb-4">
                  What type of feedback do you have?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleCategorySelect(c.id)}
                      className={`p-4 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98] text-center ${
                        category === c.id
                          ? 'border-[#C4785A] bg-[#FFF8F5]'
                          : 'border-[#EBEBEB] hover:border-[#C4785A]'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{c.emoji}</span>
                      <span className="text-sm font-medium text-[#1A1A1A] block">{c.label}</span>
                      <span className="text-xs text-[#6B6B6B]">{c.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Message */}
            {step === 'message' && (
              <div className="space-y-4">
                <button
                  onClick={() => setStep('category')}
                  className="text-sm text-[#6B6B6B] flex items-center gap-1 hover:text-[#1A1A1A]"
                >
                  ← Back
                </button>

                {/* Selected mood & category */}
                <div className="flex gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-[#F5F5F3] text-sm flex items-center gap-1">
                    {MOODS.find(m => m.id === mood)?.emoji}
                    {MOODS.find(m => m.id === mood)?.label}
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-[#F5F5F3] text-sm flex items-center gap-1">
                    {CATEGORIES.find(c => c.id === category)?.emoji}
                    {CATEGORIES.find(c => c.id === category)?.label}
                  </span>
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    category === 'idea' ? 'Describe your feature idea...' :
                    category === 'issue' ? 'What went wrong? Be specific...' :
                    category === 'praise' ? 'What do you love about VillaCare?' :
                    'What would you like to know?'
                  }
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#C4785A] transition-colors resize-none"
                  autoFocus
                />

                <div className="flex items-center justify-between text-xs text-[#9B9B9B]">
                  <span>Page: {getPageContext()}</span>
                  <span>{message.length}/500</span>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#C4785A] to-[#A66347] text-white py-3.5 rounded-xl font-medium active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Feedback
                      <span>→</span>
                    </>
                  )}
                </button>

                <p className="text-xs text-[#9B9B9B] text-center">
                  Your feedback is anonymous unless you sign in
                </p>
              </div>
            )}

            {/* Step 4: Success */}
            {step === 'success' && (
              <div className="text-center py-4">
                {/* Celebration animation */}
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 bg-[#E8F5E9] rounded-full animate-ping opacity-30" />
                  <div className="relative w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center">
                    <span className="text-4xl">✓</span>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">
                  Feedback Received!
                </h3>
                <p className="text-[#6B6B6B] mb-6">
                  We read every piece of feedback and use it to make VillaCare better.
                </p>

                <div className="bg-[#F5F5F3] rounded-xl p-4 mb-6">
                  <p className="text-sm text-[#6B6B6B]">
                    <span className="font-medium text-[#1A1A1A]">Did you know?</span> You can also suggest features
                    and vote on ideas from other users in our roadmap.
                  </p>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full bg-[#1A1A1A] text-white py-3 rounded-xl font-medium active:scale-[0.98] transition-all"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
