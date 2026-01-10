'use client'

import Image from 'next/image'
import Link from 'next/link'

const sections = [
  {
    id: 'login',
    title: 'Logging In',
    description: 'Access your dashboard with email magic link or phone OTP - no passwords needed.',
    steps: [
      {
        title: 'Choose how to sign in',
        description: 'You can sign in with your email (magic link) or phone number (OTP code via WhatsApp).',
        image: '/guides/owner-dashboard/en/01-login-options.png',
        tip: 'Phone login is fastest - the code arrives instantly via WhatsApp!',
      },
      {
        title: 'Enter your phone number',
        description: 'Enter your phone number with country code. We\'ll send a 6-digit code to your WhatsApp.',
        image: '/guides/owner-dashboard/en/02-phone-entry.png',
        tip: 'Make sure to include your country code (e.g., +44 for UK, +34 for Spain).',
      },
      {
        title: 'Enter the verification code',
        description: 'Check your WhatsApp for the 6-digit code and enter it here. You\'ll be logged in automatically.',
        image: '/guides/owner-dashboard/en/03-enter-code.png',
        tip: 'The code expires in 10 minutes. Request a new one if it doesn\'t arrive.',
      },
    ],
  },
  {
    id: 'getting-started',
    title: 'Getting Started Checklist',
    description: 'New to VillaCare? Follow the checklist to set up your account and book your first clean.',
    steps: [
      {
        title: 'Your progress is tracked',
        description: 'When you first log in, you\'ll see a Getting Started checklist. Complete each step to unlock all features.',
        image: '/guides/owner-dashboard/en/05-getting-started-0pct.png',
        tip: 'The checklist shows your progress - aim for 100% to get the most from VillaCare!',
      },
      {
        title: 'Complete your profile',
        description: 'Add your name so cleaners know who they\'re working with. This also personalises your experience.',
        image: '/guides/owner-dashboard/en/07-edit-profile.png',
        tip: 'Your name appears in booking confirmations sent to cleaners.',
      },
      {
        title: 'Track your progress',
        description: 'As you complete steps, the checklist updates. Once you\'ve added a property and made a booking, you\'re all set!',
        image: '/guides/owner-dashboard/en/08-getting-started-33pct.png',
        tip: 'Each completed step unlocks more features and personalisation.',
      },
    ],
  },
  {
    id: 'owner-type',
    title: 'Remote or Resident?',
    description: 'Tell us whether you live at your villa or visit from abroad - this unlocks personalised features.',
    steps: [
      {
        title: 'One quick question',
        description: 'After adding a property or booking, we\'ll ask if you\'re a remote owner (holiday home) or resident (live there full-time).',
        image: null, // Will be captured
        tip: 'This helps us show you relevant features like "I\'m Coming Home" for remote owners.',
      },
    ],
  },
  {
    id: 'coming-home',
    title: 'I\'m Coming Home',
    description: 'Remote villa owners can easily notify their cleaner when they\'re arriving - perfect for arrival prep.',
    steps: [
      {
        title: 'Plan your arrival',
        description: 'The "I\'m Coming Home" card appears on your dashboard. Tap it to let your cleaner know when you\'re arriving.',
        image: '/guides/owner-dashboard/en/04-dashboard-completed.png',
        tip: 'Book an arrival prep clean to have your villa spotless when you land!',
      },
    ],
  },
  {
    id: 'all-set',
    title: 'You\'re All Set!',
    description: 'Once you\'ve booked through the AI assistant or completed onboarding, you\'ll see this confirmation.',
    steps: [
      {
        title: 'Booking confirmed',
        description: 'When you book through a cleaner\'s AI assistant, your account is created automatically with everything set up.',
        image: '/guides/owner-dashboard/en/09-youre-all-set.png',
        tip: 'You\'ll receive WhatsApp reminders before your clean - no need to remember!',
      },
    ],
  },
  {
    id: 'booking-cards',
    title: 'Viewing Booking Details',
    description: 'Your bookings appear as cards on your dashboard. Hold any card to see full details and quick actions.',
    steps: [
      {
        title: 'Hold to peek',
        description: 'Press and hold any booking card for a moment to peek at the full details. Release to close, or keep holding to unlock the actions menu.',
        image: null, // Will be captured
        tip: 'A quick hold (300ms) shows a preview. Hold longer (1.5s) to unlock buttons and take action!',
      },
      {
        title: 'Quick actions',
        description: 'Once unlocked, you can message your cleaner, reschedule, add access notes, or cancel - all from one place.',
        image: null, // Will be captured
        tip: 'Different actions appear based on booking status - pending bookings can be cancelled, completed ones can be reviewed.',
      },
    ],
  },
  {
    id: 'edit-access',
    title: 'Editing Access & Instructions',
    description: 'Need to update access details or add special instructions? You can edit these anytime from the booking card.',
    steps: [
      {
        title: 'Update access notes',
        description: 'Plans changed? Maybe you\'ll be at the villa yourself and the key holder isn\'t needed. Tap "Edit" on access notes to update via the AI assistant.',
        image: null, // Will be captured
        tip: 'Access notes are shared with your cleaner 24 hours before the booking - keep them updated!',
      },
      {
        title: 'Add special instructions',
        description: 'Let your cleaner know about focus areas, guest arrivals, or preferences. The AI assistant makes it easy to add or update instructions.',
        image: null, // Will be captured
        tip: 'Special instructions help cleaners deliver exactly what you need - be specific!',
      },
    ],
  },
]

const dashboardTabs = [
  {
    icon: '🏠',
    name: 'Home',
    description: 'Your dashboard overview with upcoming bookings, Getting Started checklist, and quick actions.',
  },
  {
    icon: '📋',
    name: 'Bookings',
    description: 'View all your past and upcoming bookings. Leave reviews for completed cleans.',
  },
  {
    icon: '💬',
    name: 'Messages',
    description: 'Chat with your cleaners. Messages are auto-translated between your language and theirs.',
  },
  {
    icon: '🏡',
    name: 'Villas',
    description: 'Manage your properties - add addresses, bedroom counts, and access instructions.',
  },
  {
    icon: '👤',
    name: 'Account',
    description: 'Update your profile, phone number, and manage your referral code.',
  },
]

export default function DashboardGuide() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white border-b border-[#EBEBEB] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/guide" className="flex items-center gap-2 text-[#6B6B6B] hover:text-[#1A1A1A]">
            <span>&larr;</span>
            <span>Back to Guides</span>
          </Link>
          <Link
            href="/owner/dashboard"
            className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#333] transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-[#FAFAF8] py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#E3F2FD] text-[#1565C0] px-3 py-1 rounded-full text-sm font-medium mb-4">
            <span>🏠</span>
            <span>Owner Dashboard</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
            Your Owner Dashboard
          </h1>
          <p className="text-[#6B6B6B] text-lg max-w-xl mx-auto">
            Manage your villas, bookings, and communicate with cleaners - all from one place.
          </p>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="py-6 px-4 bg-white border-y border-[#EBEBEB]">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-[#6B6B6B] mb-3 text-center">Jump to section:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="px-3 py-1.5 bg-[#F5F5F3] text-[#6B6B6B] rounded-lg text-sm hover:bg-[#EBEBEB] hover:text-[#1A1A1A] transition-colors"
              >
                {section.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Tabs Overview */}
      <section className="py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-6 text-center">
            Dashboard Navigation
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {dashboardTabs.map((tab) => (
              <div
                key={tab.name}
                className="bg-white rounded-xl p-4 border border-[#EBEBEB] text-center hover:border-[#C4785A] transition-colors"
              >
                <span className="text-2xl mb-2 block">{tab.icon}</span>
                <p className="font-medium text-[#1A1A1A] text-sm">{tab.name}</p>
                <p className="text-xs text-[#9B9B9B] mt-1 hidden sm:block">{tab.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sections */}
      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="py-10 px-4 border-t border-[#EBEBEB]"
        >
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">{section.title}</h2>
              <p className="text-[#6B6B6B]">{section.description}</p>
            </div>

            <div className="space-y-10">
              {section.steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-6 md:gap-10 items-center`}
                >
                  {/* Phone mockup */}
                  {step.image && (
                    <div className="w-full md:w-1/2 flex justify-center">
                      <div className="relative">
                        <div className="w-[260px] h-[520px] bg-[#1A1A1A] rounded-[36px] p-2.5 shadow-2xl">
                          <div className="w-full h-full bg-white rounded-[28px] overflow-hidden relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#1A1A1A] rounded-b-xl z-10" />
                            <Image
                              src={step.image}
                              alt={step.title}
                              fill
                              className="object-cover object-top"
                            />
                          </div>
                        </div>
                        <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#C4785A] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                          {index + 1}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className={`w-full ${step.image ? 'md:w-1/2' : ''} text-center md:text-left`}>
                    <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                      {step.title}
                    </h3>
                    <p className="text-[#6B6B6B] mb-4">
                      {step.description}
                    </p>
                    {step.tip && (
                      <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-3 text-left">
                        <div className="flex items-start gap-2">
                          <span className="text-base">💡</span>
                          <p className="text-sm text-[#F57C00]">{step.tip}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA Section */}
      <section className="py-12 px-4 bg-gradient-to-b from-white to-[#FFF8F5] border-t border-[#EBEBEB]">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">
            Ready to get started?
          </h2>
          <p className="text-[#6B6B6B] mb-6">
            Log in to your dashboard and complete the Getting Started checklist.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/owner/dashboard"
              className="inline-block bg-[#1A1A1A] text-white px-8 py-4 rounded-xl font-medium hover:bg-[#333] transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/guide/booking"
              className="inline-block bg-white text-[#1A1A1A] px-8 py-4 rounded-xl font-medium border border-[#EBEBEB] hover:border-[#1A1A1A] transition-colors"
            >
              How to Book a Clean
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-[#EBEBEB]">
        <div className="max-w-xl mx-auto text-center text-sm text-[#9B9B9B]">
          <p>Questions? Contact us at hello@alicantecleaners.com</p>
        </div>
      </footer>
    </div>
  )
}
