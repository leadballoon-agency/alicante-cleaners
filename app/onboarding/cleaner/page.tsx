'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PhoneEntry from './steps/phone-entry'
import VerifyCode from './steps/verify-code'
import NamePhoto from './steps/name-photo'
import ServiceAreas from './steps/service-areas'
import Pricing from './steps/pricing'
import TeamSelection from './steps/team-selection'
import CalendarSync from './steps/calendar-sync'
import Success from './steps/success'
import { OnboardingChatWidget } from '@/components/ai/onboarding-chat-widget'

export type OnboardingData = {
  phone: string
  name: string
  photoUrl: string | null
  bio: string
  reviewsLink: string
  serviceAreas: string[]
  hourlyRate: number
  slug: string
  cleanerId: string
}

function CleanerOnboardingContent() {
  const searchParams = useSearchParams()
  const initialStep = process.env.NODE_ENV === 'development'
    ? parseInt(searchParams.get('step') || '1', 10)
    : 1
  const [step, setStep] = useState(initialStep)
  const [data, setData] = useState<OnboardingData>({
    phone: '',
    name: '',
    photoUrl: null,
    bio: '',
    reviewsLink: '',
    serviceAreas: [],
    hourlyRate: 18,
    slug: '',
    cleanerId: '',
  })

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const nextStep = () => setStep(prev => prev + 1)
  const prevStep = () => setStep(prev => prev - 1)

  return (
    <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] font-sans pb-safe">
      {/* Progress bar */}
      {step < 8 && (
        <div className="px-6 pt-safe">
          <div className="max-w-md mx-auto pt-4">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= step ? 'bg-[#1A1A1A]' : 'bg-[#EBEBEB]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="px-6 py-8 max-w-md mx-auto">
        {step === 1 && (
          <PhoneEntry
            phone={data.phone}
            onUpdate={updateData}
            onNext={nextStep}
          />
        )}
        {step === 2 && (
          <VerifyCode
            phone={data.phone}
            onBack={prevStep}
            onNext={nextStep}
          />
        )}
        {step === 3 && (
          <NamePhoto
            name={data.name}
            photoUrl={data.photoUrl}
            bio={data.bio}
            reviewsLink={data.reviewsLink}
            onUpdate={updateData}
            onBack={prevStep}
            onNext={nextStep}
          />
        )}
        {step === 4 && (
          <ServiceAreas
            selectedAreas={data.serviceAreas}
            onUpdate={updateData}
            onBack={prevStep}
            onNext={nextStep}
          />
        )}
        {step === 5 && (
          <Pricing
            data={data}
            onUpdate={updateData}
            onBack={prevStep}
            onNext={nextStep}
          />
        )}
        {step === 6 && (
          <TeamSelection
            cleanerId={data.cleanerId}
            serviceAreas={data.serviceAreas}
            onBack={prevStep}
            onNext={nextStep}
          />
        )}
        {step === 7 && (
          <CalendarSync
            onBack={prevStep}
            onNext={nextStep}
          />
        )}
        {step === 8 && (
          <Success data={data} />
        )}
      </div>

      {/* AI Help Widget - shows on all steps except success */}
      {step < 8 && <OnboardingChatWidget currentStep={step} />}
    </div>
  )
}

export default function CleanerOnboarding() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CleanerOnboardingContent />
    </Suspense>
  )
}
