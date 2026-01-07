'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { PhoneMockup } from '@/components/ui/phone-mockup'

export default function JoinPage() {
  const { data: session } = useSession()
  const router = useRouter()

  // Redirect cleaners to their dashboard - they're already on the platform
  useEffect(() => {
    if (session?.user?.role === 'CLEANER') {
      router.push('/dashboard')
    }
  }, [session, router])

  // Show loading while checking session for cleaners
  if (session?.user?.role === 'CLEANER') {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#C4785A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B6B6B]">Taking you to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white border-b border-[#EBEBEB]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/villacare-horizontal-logo.png"
              alt="VillaCare"
              width={140}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A]"
            >
              Already a member? Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-16 bg-gradient-to-b from-[#1A1A1A] to-[#2A2A2A] text-white">
        <div className="max-w-4xl mx-auto text-center">
          {/* Beta Badge */}
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-sm mb-6">
            <span className="w-2 h-2 bg-[#C4785A] rounded-full animate-pulse" />
            Beta - Free to join
          </span>

          <h1 className="text-3xl sm:text-5xl font-bold mb-4">
            Grow your cleaning business
            <span className="block text-[#C4785A]">in Alicante</span>
          </h1>

          <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
            Join Clara and 5 other trusted professionals building something different.
            Get your own profile page, AI assistant, and tools to grow - free during beta.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/onboarding/cleaner"
              className="inline-flex items-center gap-2 bg-[#C4785A] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#B56A4F] transition-colors"
            >
              Apply to Join
              <span>→</span>
            </Link>
            <Link
              href="/join/guide"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              See how it works
              <span>→</span>
            </Link>
          </div>

          <p className="text-sm text-white/50 mt-4">
            Takes 2 minutes. Phone number only - no email needed.
          </p>
        </div>
      </section>

      {/* Why Join */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-[#1A1A1A] text-center mb-4">
            Why cleaners join VillaCare
          </h2>
          <p className="text-[#6B6B6B] text-center mb-12 max-w-2xl mx-auto">
            We built this with Clara, a professional cleaner with 5 years experience.
            These are the tools she wished existed.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* AI Assistant */}
            <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
              <div className="w-12 h-12 bg-[#FFF8F5] rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">AI Sales Assistant</h3>
              <p className="text-sm text-[#6B6B6B]">
                Your AI handles inquiries, checks your calendar, and books jobs -
                while you focus on cleaning. Never miss a lead again.
              </p>
            </div>

            {/* Auto-translation */}
            <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
              <div className="w-12 h-12 bg-[#FFF8F5] rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">Auto-translation</h3>
              <p className="text-sm text-[#6B6B6B]">
                Owners write in English, German, French - you read in Spanish.
                No more Google Translate screenshots. Just clear communication.
              </p>
            </div>

            {/* Team Tools */}
            <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
              <div className="w-12 h-12 bg-[#FFF8F5] rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">Build Your Team</h3>
              <p className="text-sm text-[#6B6B6B]">
                Invite trusted colleagues to your team. Cover for each other when
                life happens. Never let a client down.
              </p>
            </div>

            {/* Calendar Sync */}
            <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
              <div className="w-12 h-12 bg-[#FFF8F5] rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">Calendar Sync</h3>
              <p className="text-sm text-[#6B6B6B]">
                Bookings automatically sync to Google Calendar, Apple Calendar,
                or Outlook. Your schedule, always up to date.
              </p>
            </div>

            {/* Your Profile */}
            <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
              <div className="w-12 h-12 bg-[#FFF8F5] rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">Your Own Profile</h3>
              <p className="text-sm text-[#6B6B6B]">
                A professional page at villacare.app/yourname. Share your bio,
                services, reviews, and areas you cover.
              </p>
            </div>

            {/* Free During Beta */}
            <div className="bg-[#FFF8F5] rounded-2xl p-6 border border-[#C4785A]">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🎁</span>
              </div>
              <h3 className="font-semibold text-[#C4785A] mb-2">Free During Beta</h3>
              <p className="text-sm text-[#6B6B6B]">
                No fees, no commission - just help us build the right platform.
                Your feedback shapes what we create.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* App Showcase - AI Sales Assistant */}
      <section className="px-6 py-16 bg-[#1A1A1A] overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Content */}
            <div className="flex-1 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-sm text-white/80 mb-4">
                <span className="w-2 h-2 bg-[#C4785A] rounded-full animate-pulse" />
                AI-Powered
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
                Your AI handles sales while you clean
              </h2>
              <p className="text-white/70 mb-6">
                Never miss an inquiry again. Your personal AI assistant responds to potential clients instantly, answers questions about your services, checks your availability, and books jobs - all while you&apos;re focused on what you do best.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>💬</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Instant responses</h4>
                    <p className="text-sm text-white/70">Replies to inquiries 24/7, even when you&apos;re busy</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>📅</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Knows your schedule</h4>
                    <p className="text-sm text-white/70">Checks your calendar and only offers available slots</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>💰</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Grows your business</h4>
                    <p className="text-sm text-white/70">Converts more leads into bookings while you focus on cleaning</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Phone Mockup */}
            <div className="flex-shrink-0 order-1 lg:order-2">
              <PhoneMockup
                src="/screenshots/ai-sales-assistant.png"
                alt="AI Sales Assistant chat"
              />
            </div>
          </div>
        </div>
      </section>

      {/* App Showcase - Your Profile Page */}
      <section className="px-6 py-16 bg-white border-t border-[#EBEBEB] overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Phone Mockup */}
            <div className="flex-shrink-0 order-1 lg:order-1">
              <PhoneMockup
                src="/screenshots/cleaner-profile-full.png"
                alt="Your professional profile page"
              />
            </div>
            {/* Content */}
            <div className="flex-1 order-2 lg:order-2">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mb-4">
                Your own professional profile
              </h2>
              <p className="text-[#6B6B6B] mb-6">
                Get a beautiful booking page at <span className="font-medium text-[#1A1A1A]">villacare.app/yourname</span>. Share it with clients and let them book directly.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>⭐</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">Showcase your reviews</h4>
                    <p className="text-sm text-[#6B6B6B]">Build trust with verified reviews from happy clients</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>💰</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">Set your own prices</h4>
                    <p className="text-sm text-[#6B6B6B]">Display your services with clear pricing - no surprises</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>🤖</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">Personal AI assistant</h4>
                    <p className="text-sm text-[#6B6B6B]">Visitors chat with your AI, get answers, and book instantly</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Showcase - Dashboard */}
      <section className="px-6 py-16 bg-[#FAFAF8] overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Phone Mockup */}
            {/* Content */}
            <div className="flex-1 order-2 lg:order-1">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mb-4">
                Set your rates, grow your business
              </h2>
              <p className="text-[#6B6B6B] mb-6">
                You&apos;re in control. Set your hourly rate and service prices. Accept the jobs that work for you.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>💰</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">Set your own prices</h4>
                    <p className="text-sm text-[#6B6B6B]">Choose your hourly rate - we calculate service prices automatically</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>✅</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">Accept bookings your way</h4>
                    <p className="text-sm text-[#6B6B6B]">One tap to confirm. Decline if you&apos;re busy. You decide</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>📊</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">Track your earnings</h4>
                    <p className="text-sm text-[#6B6B6B]">See this week, this month, and what&apos;s coming up</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 order-1 lg:order-2">
              <PhoneMockup
                src="/screenshots/onboarding-step5-pricing.png"
                alt="Set your rates"
              />
            </div>
          </div>
        </div>
      </section>

      {/* App Showcase - Translation */}
      <section className="px-6 py-16 bg-white border-t border-[#EBEBEB] overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Content */}
            <div className="flex-1 order-2 lg:order-1">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mb-4">
                No more language barriers
              </h2>
              <p className="text-[#6B6B6B] mb-6">
                Owners message in English, German, French - you read everything in Spanish. Reply in Spanish, they read it in their language.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-[#EBEBEB] text-sm">
                  <span>🇬🇧</span> English
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-[#EBEBEB] text-sm">
                  <span>🇩🇪</span> Deutsch
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-[#EBEBEB] text-sm">
                  <span>🇫🇷</span> Français
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-[#EBEBEB] text-sm">
                  <span>🇳🇱</span> Nederlands
                </span>
              </div>
              <p className="text-sm text-[#9B9B9B]">
                Auto-translation happens instantly. No more Google Translate screenshots.
              </p>
            </div>
            {/* Phone Mockup */}
            <div className="flex-shrink-0 order-1 lg:order-2">
              <PhoneMockup
                src="/screenshots/messaging-translation.png"
                alt="Auto-translation messaging"
              />
            </div>
          </div>
        </div>
      </section>

      {/* App Showcase - Calendar */}
      <section className="px-6 py-16 bg-[#FAFAF8] overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Phone Mockup */}
            <div className="flex-shrink-0 order-1 lg:order-1">
              <PhoneMockup
                src="/screenshots/calendar-schedule.png"
                alt="Calendar sync"
              />
            </div>
            {/* Content */}
            <div className="flex-1 order-2 lg:order-2">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mb-4">
                Your schedule, always synced
              </h2>
              <p className="text-[#6B6B6B] mb-6">
                Bookings automatically sync to your phone calendar. No more double-bookings or missed appointments.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>📅</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">Works with everything</h4>
                    <p className="text-sm text-[#6B6B6B]">Google Calendar, Apple Calendar, Outlook - all supported</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F5] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span>🔄</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">Real-time updates</h4>
                    <p className="text-sm text-[#6B6B6B]">New bookings appear instantly. Changes sync automatically</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 bg-[#FAFAF8]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-[#1A1A1A] text-center mb-12">
            How to join
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-[#FFF8F5] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-[#C4785A] font-bold text-xl">1</span>
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">Apply with your phone</h3>
              <p className="text-sm text-[#6B6B6B]">
                Enter your mobile number and verify with a code. No email required.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-[#FFF8F5] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-[#C4785A] font-bold text-xl">2</span>
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">Complete your profile</h3>
              <p className="text-sm text-[#6B6B6B]">
                Add your photo, bio, service areas, and set your rates.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-[#FFF8F5] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-[#C4785A] font-bold text-xl">3</span>
              </div>
              <h3 className="font-semibold text-[#1A1A1A] mb-2">Start receiving bookings</h3>
              <p className="text-sm text-[#6B6B6B]">
                Your AI assistant handles inquiries. You accept jobs that work for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clara Quote */}
      <section className="px-6 py-16 bg-[#1A1A1A]">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 border-4 border-[#C4785A]">
              <Image
                src="/cleaners/Clara-Rodrigues.jpeg"
                alt="Clara"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-white text-lg italic mb-4">
                &ldquo;I spent years juggling WhatsApp messages, Google Translate, and paper
                calendars. Now I have one place for everything, and my AI handles
                bookings while I&apos;m at a villa. It&apos;s what I always wished existed.&rdquo;
              </p>
              <p className="text-[#C4785A] font-medium">
                Clara Rodrigues, Co-founder & Team Leader
              </p>
              <p className="text-white/50 text-sm">
                5 years experience · 25 five-star reviews
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Referral */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 bg-[#FFF8F5] rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🤝</span>
          </div>
          <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">
            We grow through trust
          </h2>
          <p className="text-[#6B6B6B] mb-8 max-w-xl mx-auto">
            VillaCare is invitation-only. We ask for a referral from an existing member,
            or we verify your professional reputation. This keeps quality high and
            protects everyone in the network.
          </p>
          <p className="text-sm text-[#9B9B9B]">
            Don&apos;t know anyone? No problem - apply anyway and tell us about your experience.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-16 bg-[#FFF8F5] border-t border-[#EBEBEB]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">
            Ready to grow your business?
          </h2>
          <p className="text-[#6B6B6B] mb-8">
            Join the beta for free. Help us build something great together.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboarding/cleaner"
              className="inline-flex items-center gap-2 bg-[#C4785A] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#B56A4F] transition-colors"
            >
              Apply to Join
              <span>→</span>
            </Link>
            <Link
              href="/join/guide"
              className="inline-flex items-center gap-2 text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
            >
              See how it works
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-[#EBEBEB]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/villacare-horizontal-logo.png"
              alt="VillaCare"
              width={100}
              height={24}
              className="h-6 w-auto opacity-50"
            />
            <span className="text-[#9B9B9B] text-sm">· Alicante, Spain</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-[#9B9B9B]">
            <Link href="/about" className="hover:text-[#6B6B6B]">Our story</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-[#6B6B6B]">Privacy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-[#6B6B6B]">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
