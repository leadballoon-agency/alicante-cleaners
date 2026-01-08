import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Success Coach - AI-Powered Growth for Cleaners | VillaCare',
  description: 'Your personal AI coach that analyzes your profile, tracks your views, and gives personalized tips to help you get more bookings on VillaCare.',
  keywords: ['AI coach', 'cleaner success', 'booking tips', 'profile optimization', 'villa cleaning', 'Alicante'],
  openGraph: {
    title: 'Success Coach - AI-Powered Growth for Cleaners',
    description: 'Your personal AI coach that analyzes your profile, tracks your views, and gives personalized tips to help you get more bookings.',
    images: ['/screenshots/success-coach-main.png'],
    type: 'website',
    siteName: 'VillaCare',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Success Coach - AI-Powered Growth for Cleaners',
    description: 'Your personal AI coach to maximize bookings on VillaCare',
    images: ['/screenshots/success-coach-main.png'],
  },
}

export default function SuccessCoachPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white border-b border-[#EBEBEB]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/villacare-horizontal-logo.png"
              alt="VillaCare"
              width={140}
              height={32}
              priority
            />
          </Link>
          <Link
            href="/join"
            className="bg-[#1A1A1A] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#333] transition-colors"
          >
            Join as Cleaner
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-[#FFF8F5] py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#FFF8F5] text-[#C4785A] px-4 py-2 rounded-full text-sm font-medium mb-6">
                <span className="text-lg">🎯</span>
                New Feature
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-6 leading-tight">
                Your Personal<br />
                <span className="text-[#C4785A]">Success Coach</span>
              </h1>
              <p className="text-xl text-[#6B6B6B] mb-8 leading-relaxed">
                AI-powered coaching that analyzes your profile, tracks who&apos;s viewing you,
                and gives personalized tips to help you get more bookings.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/join"
                  className="bg-[#1A1A1A] text-white px-8 py-4 rounded-xl font-medium text-center hover:bg-[#333] transition-colors"
                >
                  Start Getting Coached
                </Link>
                <Link
                  href="/login"
                  className="border-2 border-[#1A1A1A] text-[#1A1A1A] px-8 py-4 rounded-xl font-medium text-center hover:bg-[#F5F5F3] transition-colors"
                >
                  I&apos;m Already a Cleaner
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#EBEBEB] max-w-[320px] mx-auto">
                <Image
                  src="/screenshots/success-coach-main.png"
                  alt="Success Coach Dashboard"
                  width={320}
                  height={640}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
              Everything You Need to Grow
            </h2>
            <p className="text-xl text-[#6B6B6B] max-w-2xl mx-auto">
              The Success Coach gives you insights that were previously only available to top cleaners.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 border border-[#EBEBEB]">
              <div className="w-14 h-14 bg-[#FFF8F5] rounded-xl flex items-center justify-center text-2xl mb-6">
                📊
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">Profile Health Score</h3>
              <p className="text-[#6B6B6B] leading-relaxed">
                Get a 0-100 score showing how complete and optimized your profile is.
                Profiles with higher scores get 3x more bookings.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 border border-[#EBEBEB]">
              <div className="w-14 h-14 bg-[#FFF8F5] rounded-xl flex items-center justify-center text-2xl mb-6">
                👁️
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">Profile Views</h3>
              <p className="text-[#6B6B6B] leading-relaxed">
                See how many villa owners viewed your profile this week.
                Know if your profile is getting attention or needs improvement.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 border border-[#EBEBEB]">
              <div className="w-14 h-14 bg-[#FFF8F5] rounded-xl flex items-center justify-center text-2xl mb-6">
                💬
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">AI Chat Advice</h3>
              <p className="text-[#6B6B6B] leading-relaxed">
                Ask questions and get personalized answers based on your actual data.
                Not generic tips &ndash; real insights for your situation.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-8 border border-[#EBEBEB]">
              <div className="w-14 h-14 bg-[#FFF8F5] rounded-xl flex items-center justify-center text-2xl mb-6">
                ✅
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">Profile Checklist</h3>
              <p className="text-[#6B6B6B] leading-relaxed">
                A clear checklist of what&apos;s done and what needs attention.
                Priority indicators show what will have the biggest impact.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-2xl p-8 border border-[#EBEBEB]">
              <div className="w-14 h-14 bg-[#FFF8F5] rounded-xl flex items-center justify-center text-2xl mb-6">
                📈
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">Revenue Insights</h3>
              <p className="text-[#6B6B6B] leading-relaxed">
                Track your earnings, see which services are most popular,
                and understand your booking patterns over time.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-2xl p-8 border border-[#EBEBEB]">
              <div className="w-14 h-14 bg-[#FFF8F5] rounded-xl flex items-center justify-center text-2xl mb-6">
                👥
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">Team Opportunities</h3>
              <p className="text-[#6B6B6B] leading-relaxed">
                Learn about the benefits of joining or creating a team.
                Get coverage for holidays and expand your client base.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
              How It Works
            </h2>
            <p className="text-xl text-[#6B6B6B] max-w-2xl mx-auto">
              The Success Coach unlocks after your first completed job, giving you motivation to get started.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#C4785A] text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Sign Up & Build Your Profile</h3>
                  <p className="text-[#6B6B6B]">
                    Create your cleaner profile with photo, bio, service areas, and rates.
                    You&apos;ll see a progress bar showing how complete your profile is.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#C4785A] text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Complete Your First Job</h3>
                  <p className="text-[#6B6B6B]">
                    Get your first booking and mark it complete.
                    This unlocks the full Success Coach experience.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#C4785A] text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Get Personalized Coaching</h3>
                  <p className="text-[#6B6B6B]">
                    Chat with your AI coach, see your profile views, track revenue,
                    and get specific recommendations to grow your business.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#FAFAF8] rounded-3xl p-8 border border-[#EBEBEB]">
              <div className="max-w-[280px] mx-auto">
                <Image
                  src="/screenshots/success-coach-chat.png"
                  alt="Success Coach Chat"
                  width={280}
                  height={560}
                  className="w-full h-auto rounded-2xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial / Quote */}
      <section className="py-16 md:py-24 bg-[#1A1A1A] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-5xl mb-8">🎯</div>
          <blockquote className="text-2xl md:text-3xl font-medium mb-8 leading-relaxed">
            &ldquo;I never knew 47 people viewed my profile last week! The Success Coach
            helped me understand why I wasn&apos;t getting bookings &ndash; my bio was too short.&rdquo;
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 bg-[#C4785A] rounded-full flex items-center justify-center text-xl">
              C
            </div>
            <div className="text-left">
              <p className="font-medium">Clara R.</p>
              <p className="text-[#9B9B9B] text-sm">Professional Cleaner, San Juan</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
            Ready to Grow Your Cleaning Business?
          </h2>
          <p className="text-xl text-[#6B6B6B] mb-8 max-w-2xl mx-auto">
            Join VillaCare today and get your own AI-powered Success Coach to help you
            maximize your bookings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/join"
              className="bg-[#C4785A] text-white px-8 py-4 rounded-xl font-medium hover:bg-[#B56A4F] transition-colors"
            >
              Apply to Join VillaCare
            </Link>
            <Link
              href="/about"
              className="border-2 border-[#DEDEDE] text-[#1A1A1A] px-8 py-4 rounded-xl font-medium hover:bg-[#F5F5F3] transition-colors"
            >
              Learn More About Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#EBEBEB] py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/">
              <Image
                src="/villacare-horizontal-logo.png"
                alt="VillaCare"
                width={120}
                height={28}
              />
            </Link>
            <div className="flex gap-6 text-sm text-[#6B6B6B]">
              <Link href="/privacy" className="hover:text-[#1A1A1A]">Privacy</Link>
              <Link href="/terms" className="hover:text-[#1A1A1A]">Terms</Link>
              <Link href="/about" className="hover:text-[#1A1A1A]">About</Link>
            </div>
            <p className="text-sm text-[#9B9B9B]">
              &copy; {new Date().getFullYear()} VillaCare
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
