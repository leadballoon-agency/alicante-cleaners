'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] font-sans pb-safe">
      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-[#EBEBEB] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#C4785A] rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">V</span>
            </div>
            <span className="font-semibold text-[#1A1A1A]">VillaCare</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="px-6 py-12 max-w-3xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A1A1A] mb-4">
            Our Story
          </h1>
          <p className="text-lg text-[#6B6B6B] max-w-xl mx-auto">
            How a villa owner and a cleaner built something better together
          </p>
        </div>

        {/* The Problem */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EBEBEB]">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">
              The moment everything changed
            </h2>
            <div className="space-y-4 text-[#6B6B6B]">
              <p>
                Picture this: You&apos;ve just landed in Alicante after a long flight.
                You&apos;re tired, the kids are cranky, and all you want is to walk
                into your villa, feel the cool tiles under your feet, and breathe in
                that familiar smell of home.
              </p>
              <p>
                Instead, you open the door to stale air, dusty surfaces, and that
                sinking feeling that the cleaner you booked three weeks ago never
                showed up. Again.
              </p>
              <p className="font-medium text-[#1A1A1A]">
                That was me in 2023. And I knew there had to be a better way.
              </p>
            </div>
          </div>
        </section>

        {/* The Search */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">
            Finding the right people
          </h2>
          <div className="space-y-4 text-[#6B6B6B]">
            <p>
              Like most villa owners, I&apos;d tried everything. Facebook groups where
              you never knew who you were really getting. Agencies that sent different
              people every time. Friends of friends who were &quot;usually reliable&quot; but
              somehow never when it mattered.
            </p>
            <p>
              The problem wasn&apos;t finding <em>a</em> cleaner. The problem was finding
              someone I could actually trust with my home — someone who would show up,
              do excellent work, and who I could rely on visit after visit.
            </p>
            <p>
              Then I found Clara.
            </p>
          </div>
        </section>

        {/* Clara's Story */}
        <section className="mb-12">
          <div className="bg-[#FFF8F5] rounded-2xl p-6 sm:p-8 border border-[#F5E6E0]">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-[#C4785A]">
                <Image
                  src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop&crop=face"
                  alt="Clara"
                  width={64}
                  height={64}
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div>
                <h3 className="font-semibold text-[#1A1A1A]">Clara Garcia</h3>
                <p className="text-sm text-[#C4785A]">Co-founder & Quality Director</p>
              </div>
            </div>
            <div className="space-y-4 text-[#6B6B6B]">
              <p>
                Clara had been running her own cleaning business in Alicante for five
                years. Her Google reviews were impeccable — all five stars, all genuine,
                all from villa owners like me who&apos;d finally found someone they could
                depend on.
              </p>
              <p>
                But Clara had her own frustrations. She was spending hours every week
                on WhatsApp coordinating schedules, chasing payments, and turning away
                new clients because she couldn&apos;t keep track of it all. She had cleaners
                she trusted who wanted more work, but no easy way to connect them with
                owners who needed them.
              </p>
              <p className="font-medium text-[#1A1A1A]">
                We realized we were solving two sides of the same problem.
              </p>
            </div>
          </div>
        </section>

        {/* The Solution */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">
            Building it differently
          </h2>
          <div className="space-y-4 text-[#6B6B6B]">
            <p>
              Most cleaning platforms work like a lottery — you book whoever&apos;s
              available and hope for the best. We wanted the opposite: a small
              network of exceptional people where every single cleaner is someone
              we&apos;d trust with our own homes.
            </p>
            <p>
              So we made a decision that seemed crazy at first: <strong className="text-[#1A1A1A]">cleaners
              can only join VillaCare by invitation.</strong>
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="bg-white rounded-xl p-5 border border-[#EBEBEB]">
              <div className="text-2xl mb-2">1</div>
              <h3 className="font-medium text-[#1A1A1A] mb-1">Referred</h3>
              <p className="text-sm text-[#6B6B6B]">
                Every cleaner is personally recommended by someone already in the network
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#EBEBEB]">
              <div className="text-2xl mb-2">2</div>
              <h3 className="font-medium text-[#1A1A1A] mb-1">Vouched for</h3>
              <p className="text-sm text-[#6B6B6B]">
                We verify with the referrer: &quot;Would you stake your reputation on them?&quot;
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-[#EBEBEB]">
              <div className="text-2xl mb-2">3</div>
              <h3 className="font-medium text-[#1A1A1A] mb-1">Accountable</h3>
              <p className="text-sm text-[#6B6B6B]">
                Your referral reflects on you. Quality is everyone&apos;s responsibility.
              </p>
            </div>
          </div>
        </section>

        {/* The Mission */}
        <section className="mb-12">
          <div className="bg-[#1A1A1A] rounded-2xl p-6 sm:p-8 text-white">
            <h2 className="text-xl font-semibold mb-4">
              What we believe
            </h2>
            <div className="space-y-4 text-white/80">
              <p>
                Your villa isn&apos;t just a property. It&apos;s the place where you escape
                to, where you make memories with family, where you come to feel like
                yourself again.
              </p>
              <p>
                You shouldn&apos;t have to worry about whether it&apos;s ready when you arrive.
                You shouldn&apos;t have to wonder if your cleaner will actually show up.
                You shouldn&apos;t have to explain everything from scratch every single time.
              </p>
              <p className="text-white font-medium">
                VillaCare exists so you can simply come home.
              </p>
            </div>
          </div>
        </section>

        {/* Photo Proof */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">
            Peace of mind, built in
          </h2>
          <div className="space-y-4 text-[#6B6B6B]">
            <p>
              One thing I always wished for as a villa owner: being able to see that
              everything was ready before I arrived. No more anxious wondering during
              the flight. No more crossing fingers in the taxi from the airport.
            </p>
            <p>
              That&apos;s why every VillaCare clean comes with photo proof. Your cleaner
              sends you photos via WhatsApp when they&apos;re done, so you can see your
              villa is spotless before you even land.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 border border-[#EBEBEB]">
              <span className="text-xl">📸</span>
              <span className="text-sm text-[#1A1A1A]">Photo proof included</span>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 border border-[#EBEBEB]">
              <span className="text-xl">💬</span>
              <span className="text-sm text-[#1A1A1A]">WhatsApp updates</span>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 border border-[#EBEBEB]">
              <span className="text-xl">🔒</span>
              <span className="text-sm text-[#1A1A1A]">Vetted cleaners</span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
            Ready to come home to a ready home?
          </h2>
          <p className="text-[#6B6B6B] mb-6">
            Browse our network of trusted cleaners in Alicante
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-block bg-[#C4785A] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#B56A4F] transition-colors"
            >
              Find a cleaner
            </Link>
            <Link
              href="/onboarding/cleaner"
              className="inline-block bg-white border border-[#DEDEDE] text-[#1A1A1A] px-6 py-3 rounded-xl font-medium hover:border-[#1A1A1A] transition-colors"
            >
              Join as a cleaner
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-[#EBEBEB] mt-12">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#9B9B9B]">
            VillaCare · Alicante, Spain
          </p>
          <div className="flex items-center gap-4 text-xs text-[#9B9B9B]">
            <a href="mailto:hello@alicantecleaners.com" className="hover:text-[#1A1A1A]">
              hello@alicantecleaners.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
