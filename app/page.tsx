'use client'

import { useState, FormEvent } from 'react'

export default function LandingPage() {
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerTown, setOwnerTown] = useState('')
  const [ownerSubmitted, setOwnerSubmitted] = useState(false)
  const [ownerLoading, setOwnerLoading] = useState(false)
  const [ownerError, setOwnerError] = useState('')

  const [cleanerName, setCleanerName] = useState('')
  const [cleanerPhone, setCleanerPhone] = useState('')
  const [cleanerReferrer, setCleanerReferrer] = useState('')
  const [cleanerSubmitted, setCleanerSubmitted] = useState(false)
  const [cleanerLoading, setCleanerLoading] = useState(false)
  const [cleanerError, setCleanerError] = useState('')

  const [activeTab, setActiveTab] = useState<'owner' | 'cleaner'>('owner')

  const towns = [
    'Alicante City',
    'San Juan',
    'El Campello',
    'Mutxamel',
    'San Vicente',
    'Jijona',
    'Playa de San Juan',
    'Other'
  ]

  const handleOwnerSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setOwnerError('')
    setOwnerLoading(true)

    try {
      const res = await fetch('/api/waitlist/owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ownerEmail, town: ownerTown }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }

      setOwnerSubmitted(true)
    } catch (err) {
      setOwnerError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setOwnerLoading(false)
    }
  }

  const handleCleanerSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setCleanerError('')
    setCleanerLoading(true)

    try {
      const res = await fetch('/api/waitlist/cleaner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanerName,
          phone: cleanerPhone,
          referrer_name: cleanerReferrer
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }

      setCleanerSubmitted(true)
    } catch (err) {
      setCleanerError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setCleanerLoading(false)
    }
  }

  return (
    <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] font-sans pb-safe">
      {/* Header */}
      <header className="px-6 py-5 pt-safe flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#C4785A] rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold text-sm">V</span>
          </div>
          <span className="font-semibold text-[#1A1A1A]">VillaCare</span>
        </div>
        <div className="text-sm text-[#6B6B6B]">Alicante</div>
      </header>

      {/* Hero */}
      <main className="px-6 pt-8 pb-16 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A1A1A] mb-4 leading-tight">
            Your villa, ready<br />when you arrive
          </h1>
          <p className="text-[#6B6B6B] text-lg max-w-md mx-auto">
            Trusted cleaners for villa owners in Alicante.
            Coming soon.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-[#F5F5F3] p-1 rounded-xl inline-flex">
            <button
              onClick={() => setActiveTab('owner')}
              className={`px-5 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'owner'
                  ? 'bg-white text-[#1A1A1A] shadow-sm'
                  : 'text-[#6B6B6B] active:bg-white/50'
              }`}
            >
              I own a villa
            </button>
            <button
              onClick={() => setActiveTab('cleaner')}
              className={`px-5 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'cleaner'
                  ? 'bg-white text-[#1A1A1A] shadow-sm'
                  : 'text-[#6B6B6B] active:bg-white/50'
              }`}
            >
              I&apos;m a cleaner
            </button>
          </div>
        </div>

        {/* Owner Form */}
        {activeTab === 'owner' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#EBEBEB] max-w-md mx-auto">
            {!ownerSubmitted ? (
              <form onSubmit={handleOwnerSubmit}>
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">🏠</div>
                  <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
                    Join the waitlist
                  </h2>
                  <p className="text-[#6B6B6B] text-sm">
                    Be first to access trusted cleaners when we launch
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="sandra@email.com"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                      Where&apos;s your property?
                    </label>
                    <select
                      value={ownerTown}
                      onChange={(e) => setOwnerTown(e.target.value)}
                      required
                      className="w-full px-4 py-3 pr-10 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors bg-white appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B6B6B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                    >
                      <option value="">Select area</option>
                      {towns.map(town => (
                        <option key={town} value={town}>{town}</option>
                      ))}
                    </select>
                  </div>

                  {ownerError && (
                    <p className="text-[#C75050] text-sm text-center">{ownerError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={ownerLoading}
                    className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all mt-2 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {ownerLoading ? 'Joining...' : 'Join waitlist'}
                  </button>
                </div>

                <p className="text-center text-[#9B9B9B] text-xs mt-4">
                  No spam. Just a note when we&apos;re ready for you.
                </p>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✓</div>
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
                  You&apos;re on the list
                </h2>
                <p className="text-[#6B6B6B]">
                  We&apos;ll be in touch soon.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Cleaner Form */}
        {activeTab === 'cleaner' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#EBEBEB] max-w-md mx-auto">
            {!cleanerSubmitted ? (
              <form onSubmit={handleCleanerSubmit}>
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">✨</div>
                  <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
                    By invitation only
                  </h2>
                  <p className="text-[#6B6B6B] text-sm">
                    VillaCare cleaners are referred by existing members.
                    Know someone on the inside?
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                      Your name
                    </label>
                    <input
                      type="text"
                      value={cleanerName}
                      onChange={(e) => setCleanerName(e.target.value)}
                      placeholder="Maria Garcia"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                      WhatsApp number
                    </label>
                    <input
                      type="tel"
                      value={cleanerPhone}
                      onChange={(e) => setCleanerPhone(e.target.value)}
                      placeholder="+34 612 345 678"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                      Who referred you?
                    </label>
                    <input
                      type="text"
                      value={cleanerReferrer}
                      onChange={(e) => setCleanerReferrer(e.target.value)}
                      placeholder="Their name"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors"
                    />
                  </div>

                  {cleanerError && (
                    <p className="text-[#C75050] text-sm text-center">{cleanerError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={cleanerLoading}
                    className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all mt-2 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {cleanerLoading ? 'Submitting...' : 'Request to join'}
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-[#EBEBEB]">
                  <p className="text-center text-[#6B6B6B] text-sm">
                    Don&apos;t know anyone yet?
                  </p>
                  <p className="text-center text-[#9B9B9B] text-xs mt-1">
                    We&apos;re starting with a small network of trusted cleaners.
                    Check back soon — or ask around.
                  </p>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✓</div>
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
                  Request received
                </h2>
                <p className="text-[#6B6B6B]">
                  We&apos;ll verify your referral and be in touch within 48 hours.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Value Props */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 text-center">
          <div className="flex sm:block items-center sm:items-start gap-4 sm:gap-0 text-left sm:text-center">
            <div className="text-2xl sm:mb-2">🔒</div>
            <div>
              <h3 className="font-medium text-[#1A1A1A] text-base sm:text-sm mb-0.5 sm:mb-1">Trusted network</h3>
              <p className="text-sm sm:text-xs text-[#6B6B6B]">Every cleaner is referred by someone we trust</p>
            </div>
          </div>
          <div className="flex sm:block items-center sm:items-start gap-4 sm:gap-0 text-left sm:text-center">
            <div className="text-2xl sm:mb-2">📸</div>
            <div>
              <h3 className="font-medium text-[#1A1A1A] text-base sm:text-sm mb-0.5 sm:mb-1">Photo proof</h3>
              <p className="text-sm sm:text-xs text-[#6B6B6B]">See your villa is ready before you arrive</p>
            </div>
          </div>
          <div className="flex sm:block items-center sm:items-start gap-4 sm:gap-0 text-left sm:text-center">
            <div className="text-2xl sm:mb-2">💬</div>
            <div>
              <h3 className="font-medium text-[#1A1A1A] text-base sm:text-sm mb-0.5 sm:mb-1">WhatsApp updates</h3>
              <p className="text-sm sm:text-xs text-[#6B6B6B]">Real-time notifications, no app to download</p>
            </div>
          </div>
        </div>

        {/* Featured Reviews */}
        <div className="mt-16">
          <h2 className="text-xl font-semibold text-[#1A1A1A] text-center mb-6">
            What villa owners say
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} className="text-[#C4785A] text-sm">★</span>
                ))}
              </div>
              <p className="text-[#1A1A1A] mb-3 text-sm">
                &ldquo;Clara is amazing! She always leaves our villa spotless and even waters the plants. Highly recommend!&rdquo;
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center text-sm">
                  S
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">Sandra M.</p>
                  <p className="text-xs text-[#6B6B6B]">San Juan</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} className="text-[#C4785A] text-sm">★</span>
                ))}
              </div>
              <p className="text-[#1A1A1A] mb-3 text-sm">
                &ldquo;Maria did a fantastic deep clean before our arrival. The villa was perfect! Will definitely book again.&rdquo;
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center text-sm">
                  J
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">John D.</p>
                  <p className="text-xs text-[#6B6B6B]">El Campello</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-12 text-center">
          <p className="text-[#6B6B6B] text-sm mb-3">Launching with cleaners trusted by 100+ villas</p>
          <div className="flex justify-center items-center gap-1">
            <span className="text-[#C4785A]">★★★★★</span>
            <span className="text-sm text-[#6B6B6B] ml-1">5.0 average</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-[#EBEBEB]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-[#9B9B9B]">
            VillaCare · Alicante, Spain · hello@alicantecleaners.com
          </p>
        </div>
      </footer>
    </div>
  )
}
