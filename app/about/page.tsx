'use client'

import Link from 'next/link'
import Image from 'next/image'
import LanguageSwitcher from '@/components/language-switcher'

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
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/"
              className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      </header>

      <main className="px-6 py-12 max-w-3xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 bg-[#FFF8F5] text-[#C4785A] text-xs font-medium rounded-full mb-4">
            Currently in beta
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A1A1A] mb-4">
            Our Story
          </h1>
          <p className="text-lg text-[#6B6B6B] max-w-xl mx-auto">
            How a villa owner and a cleaner discovered they were solving two sides of the same problem
          </p>
        </div>

        {/* The Setup */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EBEBEB]">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">
              Villa life in Alicante
            </h2>
            <div className="space-y-4 text-[#6B6B6B]">
              <p>
                We live in a 4-bedroom villa with large outside areas — terraces, a pool, gardens.
                It&apos;s the kind of home that&apos;s common across the Costa Blanca. Ours isn&apos;t
                a holiday home that sits empty most of the year. We&apos;re here about 10 months,
                and we go elsewhere for our holidays.
              </p>
              <p>
                That means we need regular, reliable cleaning. Not just the occasional pre-arrival
                deep clean, but ongoing maintenance of a property with a lot of outdoor space
                that collects dust, leaves, and the general chaos of Spanish sunshine.
              </p>
            </div>
          </div>
        </section>

        {/* Finding Clara */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">
            Finding Clara
          </h2>
          <div className="space-y-4 text-[#6B6B6B]">
            <p>
              Like most villa owners, we&apos;d tried the usual routes. Facebook groups where
              you never really knew who you were getting. Agencies that sent different
              people every time. Friends of friends who were &quot;usually reliable&quot; but
              somehow never when it mattered.
            </p>
            <p>
              Then we found Clara. She was brilliant — thorough, reliable, and took genuine
              pride in her work. Finally, we had someone we could depend on.
            </p>
            <p>
              But there was a problem.
            </p>
          </div>
        </section>

        {/* The Challenge */}
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
                <h3 className="font-semibold text-[#1A1A1A]">Clara&apos;s challenges</h3>
                <p className="text-sm text-[#C4785A]">What we discovered</p>
              </div>
            </div>
            <div className="space-y-4 text-[#6B6B6B]">
              <p>
                We speak mainly English. Clara speaks Portuguese and Spanish. While we
                managed with gestures and Google Translate, it wasn&apos;t ideal. Instructions
                got lost, small details were missed, and there was always that slight
                uncertainty on both sides.
              </p>
              <p>
                But the bigger issue was backup. When Clara was sick, or her car broke down,
                or she had a family emergency — she had no easy way to find cover. She&apos;d
                be stressed trying to contact clients, often in a language she wasn&apos;t
                comfortable with, while also dealing with whatever had come up.
              </p>
              <p>
                She had other cleaners she trusted, colleagues who wanted more work, but no
                simple way to hand over a job when she needed to. The whole system depended
                on her being available, every single time.
              </p>
              <p className="font-medium text-[#1A1A1A]">
                That&apos;s when we started talking about building something better.
              </p>
            </div>
          </div>
        </section>

        {/* The Solutions */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">
            What we&apos;re building
          </h2>
          <div className="space-y-4 text-[#6B6B6B] mb-8">
            <p>
              VillaCare isn&apos;t just another cleaning marketplace. We&apos;re solving the
              specific problems that villa owners and cleaners actually face — problems
              we experienced firsthand.
            </p>
          </div>

          <div className="space-y-4">
            {/* Team Function */}
            <div className="bg-white rounded-xl p-6 border border-[#EBEBEB]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#FFF8F5] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">👥</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A1A1A] mb-2">Teams that cover each other</h3>
                  <p className="text-sm text-[#6B6B6B]">
                    Cleaners can form teams with colleagues they trust. When someone needs cover —
                    sick day, car trouble, holiday — their team sees the job first and can pick
                    it up instantly. No more frantic WhatsApp messages. No more letting clients down.
                    Your regular cleaner stays in the loop, but you&apos;re never left without service.
                  </p>
                </div>
              </div>
            </div>

            {/* Multilingual Messaging */}
            <div className="bg-white rounded-xl p-6 border border-[#EBEBEB]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#FFF8F5] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🌍</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A1A1A] mb-2">Messages in your language</h3>
                  <p className="text-sm text-[#6B6B6B]">
                    Write in English, German, French, Dutch, Italian, or Portuguese — your
                    cleaner receives the message in Spanish (or their preferred language).
                    They reply in Spanish, you read it in yours. No more miscommunication.
                    No more lost instructions. Everyone understands exactly what&apos;s needed.
                  </p>
                </div>
              </div>
            </div>

            {/* Photo Proof */}
            <div className="bg-white rounded-xl p-6 border border-[#EBEBEB]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#FFF8F5] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📸</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A1A1A] mb-2">Photo proof via WhatsApp</h3>
                  <p className="text-sm text-[#6B6B6B]">
                    Every clean comes with photos sent directly to you. Whether you&apos;re
                    upstairs working, away on holiday, or on a flight home — you can see
                    your villa is ready. For owners who aren&apos;t there year-round, it&apos;s
                    the peace of mind you need.
                  </p>
                </div>
              </div>
            </div>

            {/* Vetted Network */}
            <div className="bg-white rounded-xl p-6 border border-[#EBEBEB]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#FFF8F5] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🔒</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A1A1A] mb-2">Invitation-only network</h3>
                  <p className="text-sm text-[#6B6B6B]">
                    Every cleaner on VillaCare is personally referred by someone already in
                    the network. It keeps quality high and ensures that even if your regular
                    cleaner needs cover, the person who steps in is someone they personally
                    vouch for.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="mb-12">
          <div className="bg-[#1A1A1A] rounded-2xl p-6 sm:p-8 text-white">
            <h2 className="text-xl font-semibold mb-4">
              For all kinds of villa owners
            </h2>
            <div className="space-y-4 text-white/80">
              <p>
                Whether you live in your villa year-round like us, spend a few months
                each winter escaping the northern European weather, or visit for family
                holidays a few times a year — you need someone reliable looking after
                your home.
              </p>
              <p>
                VillaCare works for regular weekly cleans, pre-arrival preparations,
                deep seasonal cleaning, or anything in between. The same trusted network,
                the same photo proof, the same peace of mind.
              </p>
            </div>
          </div>
        </section>

        {/* Beta Note */}
        <section className="mb-12">
          <div className="bg-white rounded-xl p-6 border border-[#EBEBEB] border-dashed">
            <h3 className="font-semibold text-[#1A1A1A] mb-2">We&apos;re just getting started</h3>
            <p className="text-sm text-[#6B6B6B]">
              VillaCare is currently in beta, focused on the Alicante and Costa Blanca region.
              We&apos;re growing carefully, adding cleaners through referrals, and refining
              the platform based on real feedback from owners and cleaners. If you&apos;d like
              to be part of shaping how this works, we&apos;d love to hear from you.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
            Find your Clara
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
            <Link href="/privacy" className="hover:text-[#1A1A1A]">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#1A1A1A]">
              Terms
            </Link>
            <a href="mailto:hello@alicantecleaners.com" className="hover:text-[#1A1A1A]">
              hello@alicantecleaners.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
