'use client'

import Link from 'next/link'

const guides = [
  {
    id: 'booking',
    icon: '📅',
    title: 'How to Book a Clean',
    description: 'Step-by-step guide to finding a trusted cleaner and booking your first villa cleaning.',
    href: '/guide/booking',
    badge: 'Takes 2 minutes',
    badgeColor: 'bg-[#E8F5E9] text-[#2E7D32]',
  },
  {
    id: 'dashboard',
    icon: '🏠',
    title: 'Your Owner Dashboard',
    description: 'Learn how to manage your villas, bookings, and communicate with cleaners from your dashboard.',
    href: '/guide/dashboard',
    badge: 'For logged-in owners',
    badgeColor: 'bg-[#E3F2FD] text-[#1565C0]',
  },
]

export default function GuidesHub() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white border-b border-[#EBEBEB] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#6B6B6B] hover:text-[#1A1A1A]">
            <span>&larr;</span>
            <span>Back to Home</span>
          </Link>
          <Link
            href="/"
            className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#333] transition-colors"
          >
            Find a Cleaner
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-[#FAFAF8] py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#FFF3E0] text-[#E65100] px-3 py-1 rounded-full text-sm font-medium mb-4">
            <span>📖</span>
            <span>Help Center</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
            VillaCare Guides
          </h1>
          <p className="text-[#6B6B6B] text-lg max-w-xl mx-auto">
            Everything you need to know about booking cleaners and managing your villa cleaning.
          </p>
        </div>
      </section>

      {/* Guide Cards */}
      <section className="py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={guide.href}
              className="block bg-white rounded-2xl p-6 border border-[#EBEBEB] hover:border-[#C4785A] hover:shadow-lg transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-[#F5F5F3] rounded-xl flex items-center justify-center text-2xl group-hover:bg-[#FFF8F5] transition-colors">
                  {guide.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold text-[#1A1A1A] group-hover:text-[#C4785A] transition-colors">
                      {guide.title}
                    </h2>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${guide.badgeColor}`}>
                      {guide.badge}
                    </span>
                  </div>
                  <p className="text-[#6B6B6B] text-sm">
                    {guide.description}
                  </p>
                </div>
                <div className="text-[#9B9B9B] group-hover:text-[#C4785A] transition-colors">
                  &rarr;
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-10 px-4 border-t border-[#EBEBEB]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4 text-center">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/"
              className="bg-white rounded-xl p-4 border border-[#EBEBEB] text-center hover:border-[#C4785A] transition-colors"
            >
              <span className="text-xl block mb-1">🔍</span>
              <span className="text-sm font-medium text-[#1A1A1A]">Browse Cleaners</span>
            </Link>
            <Link
              href="/owner/dashboard"
              className="bg-white rounded-xl p-4 border border-[#EBEBEB] text-center hover:border-[#C4785A] transition-colors"
            >
              <span className="text-xl block mb-1">📊</span>
              <span className="text-sm font-medium text-[#1A1A1A]">Owner Dashboard</span>
            </Link>
            <Link
              href="/login"
              className="bg-white rounded-xl p-4 border border-[#EBEBEB] text-center hover:border-[#C4785A] transition-colors"
            >
              <span className="text-xl block mb-1">🔑</span>
              <span className="text-sm font-medium text-[#1A1A1A]">Sign In</span>
            </Link>
            <Link
              href="/join"
              className="bg-white rounded-xl p-4 border border-[#EBEBEB] text-center hover:border-[#C4785A] transition-colors"
            >
              <span className="text-xl block mb-1">🧹</span>
              <span className="text-sm font-medium text-[#1A1A1A]">Become a Cleaner</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-10 px-4 bg-[#FFF8F5]">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-2">Need more help?</h2>
          <p className="text-[#6B6B6B] mb-4">
            Can&apos;t find what you&apos;re looking for? We&apos;re happy to help.
          </p>
          <a
            href="mailto:hello@alicantecleaners.com"
            className="inline-flex items-center gap-2 text-[#C4785A] font-medium hover:underline"
          >
            <span>✉️</span>
            <span>hello@alicantecleaners.com</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-[#EBEBEB]">
        <div className="max-w-xl mx-auto text-center text-sm text-[#9B9B9B]">
          <p>VillaCare - Villa cleaning in Alicante, Spain</p>
        </div>
      </footer>
    </div>
  )
}
