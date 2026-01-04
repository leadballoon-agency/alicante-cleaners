'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import DateTimePicker from './steps/date-time'
import PropertyDetails from './steps/property-details'
import Payment from './steps/payment'
import Confirmation from './steps/confirmation'

type Cleaner = {
  id: string
  slug: string
  name: string
  photo: string | null
  hourlyRate: number
  services: { type: string; name: string; price: number; hours: number }[]
}

export type BookingData = {
  service: { type: string; name: string; price: number; hours: number } | null
  date: Date | null
  time: string
  propertyAddress: string
  bedrooms: number
  specialInstructions: string
  phone: string
  email: string
}

const STEPS = ['date-time', 'property', 'payment', 'confirmation'] as const
type Step = typeof STEPS[number]

export default function BookingPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const serviceType = searchParams.get('service') || 'regular'

  const [cleaner, setCleaner] = useState<Cleaner | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [step, setStep] = useState<Step>('date-time')
  const [data, setData] = useState<BookingData>({
    service: null,
    date: null,
    time: '',
    propertyAddress: '',
    bedrooms: 2,
    specialInstructions: '',
    phone: '',
    email: '',
  })

  // Fetch cleaner data
  useEffect(() => {
    async function fetchCleaner() {
      try {
        const response = await fetch(`/api/cleaners/${slug}`)
        if (!response.ok) {
          setError('not_found')
          return
        }
        const cleanerData = await response.json()
        setCleaner(cleanerData)

        // Set service from URL param
        const service = cleanerData.services.find((s: { type: string }) => s.type === serviceType) || cleanerData.services[0]
        setData(prev => ({ ...prev, service }))
      } catch {
        setError('error')
      } finally {
        setLoading(false)
      }
    }

    fetchCleaner()
  }, [slug, serviceType])

  if (loading) {
    return (
      <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C4785A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !cleaner) {
    return (
      <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">&#128269;</div>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Cleaner not found</h1>
          <p className="text-[#6B6B6B] mb-6">This profile doesn&apos;t exist or has been removed.</p>
          <Link href="/" className="text-[#1A1A1A] font-medium underline">
            Go to homepage
          </Link>
        </div>
      </div>
    )
  }

  const updateData = (updates: Partial<BookingData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const goToStep = (newStep: Step) => {
    setStep(newStep)
  }

  const currentStepIndex = STEPS.indexOf(step)
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] font-sans pb-safe">
      {/* Header */}
      <header className="px-6 py-4 pt-safe bg-white border-b border-[#EBEBEB]">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            {step !== 'confirmation' ? (
              <Link
                href={step === 'date-time' ? `/${slug}` : '#'}
                onClick={(e) => {
                  if (step !== 'date-time') {
                    e.preventDefault()
                    const prevStep = STEPS[currentStepIndex - 1]
                    if (prevStep) goToStep(prevStep)
                  }
                }}
                className="text-[#6B6B6B] text-sm flex items-center gap-1"
              >
                <span>&larr;</span> Back
              </Link>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden">
                {cleaner.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cleaner.photo} alt={cleaner.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm">&#128100;</span>
                )}
              </div>
              <span className="text-sm font-medium text-[#1A1A1A]">{cleaner.name}</span>
            </div>
          </div>

          {/* Progress bar */}
          {step !== 'confirmation' && (
            <div className="h-1 bg-[#EBEBEB] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1A1A1A] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </header>

      <main className="px-6 py-6 max-w-lg mx-auto">
        {step === 'date-time' && (
          <DateTimePicker
            data={data}
            onUpdate={updateData}
            onNext={() => goToStep('property')}
          />
        )}
        {step === 'property' && (
          <PropertyDetails
            data={data}
            onUpdate={updateData}
            onNext={() => goToStep('payment')}
          />
        )}
        {step === 'payment' && (
          <Payment
            data={data}
            cleaner={cleaner}
            cleanerSlug={slug}
            onUpdate={updateData}
            onNext={() => goToStep('confirmation')}
          />
        )}
        {step === 'confirmation' && (
          <Confirmation
            data={data}
            cleaner={cleaner}
            slug={slug}
          />
        )}
      </main>
    </div>
  )
}
