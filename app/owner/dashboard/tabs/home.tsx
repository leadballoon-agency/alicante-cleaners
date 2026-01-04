'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Owner, Property, OwnerBooking } from '../page'

type Props = {
  owner: Owner
  properties: Property[]
  bookings: OwnerBooking[]
}

const EXTRAS = [
  { id: 'groceries', icon: '🛒', label: 'Stock the fridge', description: 'Groceries & essentials' },
  { id: 'welcome', icon: '🍷', label: 'Welcome basket', description: 'Wine, snacks & treats' },
  { id: 'flowers', icon: '🌸', label: 'Fresh flowers', description: 'Brighten up the space' },
  { id: 'linens', icon: '🛏️', label: 'Fresh linens', description: 'Premium bed & bath' },
]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function HomeTab({ owner, properties, bookings }: Props) {
  const [showArrivalModal, setShowArrivalModal] = useState(false)
  const [step, setStep] = useState<'details' | 'extras' | 'confirmed'>('details')
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [arrivalDate, setArrivalDate] = useState('')
  const [arrivalTime, setArrivalTime] = useState('14:00')
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const upcomingBookings = bookings
    .filter(b => new Date(b.date) > new Date() && b.status !== 'completed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 2)

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatArrivalDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  const toggleExtra = (id: string) => {
    setSelectedExtras(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  const handleContinueToExtras = () => {
    if (!selectedProperty || !arrivalDate) return
    setStep('extras')
  }

  const handleArrivalSubmit = async () => {
    setSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSubmitting(false)
    setStep('confirmed')
  }

  const generateWhatsAppLink = () => {
    if (!selectedProperty?.savedCleaner?.phone) return '#'

    const cleanerName = selectedProperty.savedCleaner.name.split(' ')[0]
    const propertyName = selectedProperty.name
    const date = formatArrivalDate(arrivalDate)
    const time = arrivalTime

    // Build the message
    let message = `Hi ${cleanerName}! 👋\n\n`
    message += `I'm arriving at ${propertyName} on ${date} around ${time}.\n\n`

    if (selectedExtras.length > 0) {
      message += `I'd love some help with:\n`
      selectedExtras.forEach(extraId => {
        const extra = EXTRAS.find(e => e.id === extraId)
        if (extra) {
          message += `${extra.icon} ${extra.label}\n`
        }
      })
      message += `\nCould you let me know the cost? Happy to Bizum you! 💳\n\n`
    }

    message += `Thanks! 🙏`

    // WhatsApp API URL
    const phone = selectedProperty.savedCleaner.phone
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }

  const resetModal = () => {
    setShowArrivalModal(false)
    setSelectedProperty(null)
    setArrivalDate('')
    setArrivalTime('14:00')
    setSelectedExtras([])
    setStep('details')
  }

  // Get tomorrow's date for min date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* I'm Coming Home CTA */}
      <div className="bg-gradient-to-br from-[#C4785A] to-[#A66348] rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="text-4xl">✈️</div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-1">I&apos;m Coming Home</h2>
            <p className="text-white/80 text-sm mb-4">
              Let your cleaner know when you&apos;re arriving and they&apos;ll have your villa ready
            </p>
            <button
              onClick={() => setShowArrivalModal(true)}
              className="bg-white text-[#C4785A] px-5 py-2.5 rounded-xl font-medium text-sm active:scale-[0.98] transition-all"
            >
              Schedule arrival prep
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming bookings */}
      {upcomingBookings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-[#1A1A1A]">Upcoming</h2>
            <button className="text-sm text-[#C4785A] font-medium">View all</button>
          </div>
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl p-4 border border-[#EBEBEB]">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-[#1A1A1A]">{booking.service}</h3>
                    <p className="text-sm text-[#6B6B6B]">
                      {formatDate(booking.date)} · {booking.time}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                    Confirmed
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden relative">
                    {booking.cleaner.photo ? (
                      <Image src={booking.cleaner.photo} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <span className="text-sm">👤</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1A1A1A]">{booking.cleaner.name}</p>
                    <p className="text-xs text-[#6B6B6B]">{booking.property.name}</p>
                  </div>
                  <Link
                    href={`/${booking.cleaner.slug}`}
                    className="text-sm text-[#C4785A] font-medium"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Your properties */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-[#1A1A1A]">Your villas</h2>
          <button className="text-sm text-[#C4785A] font-medium">+ Add new</button>
        </div>
        <div className="space-y-3">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-2xl p-4 border border-[#EBEBEB]">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-[#1A1A1A]">{property.name}</h3>
                  <p className="text-sm text-[#6B6B6B]">{property.bedrooms} bedrooms</p>
                </div>
                {property.savedCleaner ? (
                  <Link
                    href={`/${property.savedCleaner.slug}`}
                    className="text-sm bg-[#F5F5F3] px-3 py-1 rounded-full text-[#1A1A1A]"
                  >
                    {property.savedCleaner.name.split(' ')[0]}
                  </Link>
                ) : (
                  <span className="text-sm text-[#9B9B9B]">No cleaner</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Find cleaners CTA */}
      <div className="bg-[#F5F5F3] rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔍</span>
          <div className="flex-1">
            <h3 className="font-medium text-[#1A1A1A] mb-1">Need a cleaner?</h3>
            <p className="text-sm text-[#6B6B6B] mb-3">
              Find trusted cleaners in your area
            </p>
            <Link
              href="/"
              className="inline-block bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all"
            >
              Browse cleaners
            </Link>
          </div>
        </div>
      </div>

      {/* Arrival Modal */}
      {showArrivalModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 pb-safe animate-slide-up max-h-[90vh] overflow-y-auto">

            {/* Step 1: Details */}
            {step === 'details' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#1A1A1A]">Schedule arrival</h2>
                  <button
                    onClick={resetModal}
                    className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-5">
                  {/* Property selector */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                      Which villa?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {properties.map((property) => (
                        <button
                          key={property.id}
                          onClick={() => setSelectedProperty(property)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            selectedProperty?.id === property.id
                              ? 'border-[#1A1A1A] bg-[#F5F5F3]'
                              : 'border-[#EBEBEB] bg-white'
                          }`}
                        >
                          <p className="font-medium text-[#1A1A1A] text-sm">{property.name}</p>
                          <p className="text-xs text-[#6B6B6B]">{property.bedrooms} bed</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date picker */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                      Arrival date
                    </label>
                    <input
                      type="date"
                      value={arrivalDate}
                      min={minDate}
                      onChange={(e) => setArrivalDate(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors"
                    />
                  </div>

                  {/* Time picker */}
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                      Arrival time (approximate)
                    </label>
                    <select
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors bg-white"
                    >
                      <option value="10:00">Morning (10:00)</option>
                      <option value="12:00">Midday (12:00)</option>
                      <option value="14:00">Afternoon (14:00)</option>
                      <option value="16:00">Late afternoon (16:00)</option>
                      <option value="18:00">Evening (18:00)</option>
                      <option value="20:00">Night (20:00)</option>
                    </select>
                  </div>

                  {/* Selected cleaner info */}
                  {selectedProperty?.savedCleaner && (
                    <div className="bg-[#F5F5F3] rounded-xl p-4">
                      <p className="text-xs text-[#6B6B6B] mb-1">Your cleaner</p>
                      <p className="font-medium text-[#1A1A1A]">{selectedProperty.savedCleaner.name}</p>
                      <p className="text-sm text-[#6B6B6B]">Will be notified of your arrival</p>
                    </div>
                  )}

                  {selectedProperty && !selectedProperty.savedCleaner && (
                    <div className="bg-[#FFF8F5] rounded-xl p-4 border border-[#F5E6E0]">
                      <p className="text-sm text-[#1A1A1A]">
                        No cleaner saved for this villa. You&apos;ll be able to choose one after submitting.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleContinueToExtras}
                    disabled={!selectedProperty || !arrivalDate}
                    className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Extras */}
            {step === 'extras' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setStep('details')}
                    className="text-[#6B6B6B] text-sm flex items-center gap-1"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={resetModal}
                    className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">🛒</div>
                  <h2 className="text-xl font-semibold text-[#1A1A1A] mb-1">Need anything else?</h2>
                  <p className="text-sm text-[#6B6B6B]">
                    {selectedProperty?.savedCleaner?.name.split(' ')[0]} can help with extras
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {EXTRAS.map((extra) => (
                    <button
                      key={extra.id}
                      onClick={() => toggleExtra(extra.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                        selectedExtras.includes(extra.id)
                          ? 'border-[#1A1A1A] bg-[#F5F5F3]'
                          : 'border-[#EBEBEB] bg-white'
                      }`}
                    >
                      <span className="text-2xl">{extra.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-[#1A1A1A]">{extra.label}</p>
                        <p className="text-sm text-[#6B6B6B]">{extra.description}</p>
                      </div>
                      {selectedExtras.includes(extra.id) && (
                        <span className="text-[#1A1A1A]">✓</span>
                      )}
                    </button>
                  ))}
                </div>

                {selectedExtras.length > 0 && (
                  <div className="bg-[#FFF8F5] rounded-xl p-4 mb-6 border border-[#F5E6E0]">
                    <div className="flex items-start gap-2">
                      <span>💬</span>
                      <p className="text-sm text-[#6B6B6B]">
                        You&apos;ll chat with {selectedProperty?.savedCleaner?.name.split(' ')[0]} on WhatsApp to share details and arrange payment via Bizum
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleArrivalSubmit}
                  disabled={submitting}
                  className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : selectedExtras.length > 0 ? 'Continue to WhatsApp' : 'Skip extras & confirm'}
                </button>
              </>
            )}

            {/* Step 3: Confirmed */}
            {step === 'confirmed' && (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
                  You&apos;re all set!
                </h2>
                <p className="text-[#6B6B6B] mb-6">
                  {selectedProperty?.savedCleaner?.name || 'Your cleaner'} has been notified and will prepare your villa for{' '}
                  {formatArrivalDate(arrivalDate)}
                </p>

                {selectedExtras.length > 0 && selectedProperty?.savedCleaner && (
                  <>
                    <div className="bg-[#25D366]/10 rounded-xl p-4 mb-4">
                      <p className="text-sm text-[#1A1A1A] mb-3">
                        <strong>One more step!</strong> Message {selectedProperty.savedCleaner.name.split(' ')[0]} about your extras:
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {selectedExtras.map(extraId => {
                          const extra = EXTRAS.find(e => e.id === extraId)
                          return extra ? (
                            <span key={extraId} className="bg-white px-3 py-1 rounded-full text-sm">
                              {extra.icon} {extra.label}
                            </span>
                          ) : null
                        })}
                      </div>
                    </div>

                    <a
                      href={generateWhatsAppLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#25D366] text-white py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-3"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Open WhatsApp
                    </a>

                    <button
                      onClick={resetModal}
                      className="w-full text-[#6B6B6B] py-3 font-medium text-sm"
                    >
                      I&apos;ll message later
                    </button>
                  </>
                )}

                {(selectedExtras.length === 0 || !selectedProperty?.savedCleaner) && (
                  <button
                    onClick={resetModal}
                    className="bg-[#1A1A1A] text-white px-6 py-3 rounded-xl font-medium active:scale-[0.98] transition-all"
                  >
                    Done
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
