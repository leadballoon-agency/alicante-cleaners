'use client'

import Image from 'next/image'
import Link from 'next/link'

const steps = [
  {
    number: 1,
    title: 'Enter your phone number',
    description: 'We use your phone for verification and so villa owners can contact you about bookings. Your number stays private until you accept a job.',
    image: '/onboarding/02-phone-entry.png',
    tip: 'Use the phone number you check regularly - this is how you\'ll receive booking requests!',
  },
  {
    number: 2,
    title: 'Verify with SMS code',
    description: 'We\'ll send a 6-digit code to your phone. Enter it to verify your number. This keeps your account secure.',
    image: '/onboarding/03-verify-code.png',
    tip: 'Code not arriving? Check your SMS inbox or tap "Resend" after 30 seconds.',
  },
  {
    number: 3,
    title: 'Add your name and photo',
    description: 'Tell villa owners who you are! Add your name, a professional photo, and a short bio about your experience.',
    image: '/onboarding/04-name-photo.png',
    tip: 'A friendly photo and short bio help you get more bookings. Owners love to know who\'s coming to their villa!',
  },
  {
    number: 4,
    title: 'Select your service areas',
    description: 'Choose the areas in Alicante where you\'re available to work. You can select multiple areas to maximize your opportunities.',
    image: '/onboarding/05-service-areas.png',
    tip: 'Popular areas like San Juan and El Campello have high demand. Select all areas you can realistically travel to.',
  },
  {
    number: 5,
    title: 'Set your hourly rate',
    description: 'Choose how much you charge per hour. We\'ll automatically calculate prices for Regular Clean (3h), Deep Clean (5h), and Arrival Prep (4h).',
    image: '/onboarding/06-pricing.png',
    tip: 'Most cleaners in Alicante charge €15-20/hour. You can adjust your rate anytime from your dashboard.',
  },
  {
    number: 6,
    title: 'Connect your calendar',
    description: 'Link your Google Calendar so we know when you\'re busy. We\'ll automatically block those times - no double bookings!',
    image: '/onboarding/08-calendar-sync.png',
    tip: 'This is optional but highly recommended. You can also skip and connect later from your dashboard.',
  },
  {
    number: 7,
    title: 'You\'re all set!',
    description: 'Your booking page is now live! Share your personal link with villa owners or let them find you through the VillaCare directory.',
    image: '/onboarding/09-success.png',
    tip: 'Share your link on WhatsApp, Facebook, or with property managers you already work with.',
  },
]

export default function OnboardingGuide() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white border-b border-[#EBEBEB] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/join" className="flex items-center gap-2 text-[#6B6B6B] hover:text-[#1A1A1A]">
            <span>←</span>
            <span>Back to Join</span>
          </Link>
          <Link
            href="/onboarding/cleaner"
            className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#333] transition-colors"
          >
            Start Now
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-[#FAFAF8] py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#E8F5E9] text-[#2E7D32] px-3 py-1 rounded-full text-sm font-medium mb-4">
            <span>⏱</span>
            <span>Takes 2 minutes</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
            How to Join VillaCare
          </h1>
          <p className="text-[#6B6B6B] text-lg max-w-xl mx-auto">
            Follow these simple steps to create your profile and start receiving booking requests from villa owners in Alicante.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-12">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-6 md:gap-10 items-center`}
            >
              {/* Phone mockup */}
              <div className="w-full md:w-1/2 flex justify-center">
                <div className="relative">
                  {/* Phone frame */}
                  <div className="w-[280px] h-[560px] bg-[#1A1A1A] rounded-[40px] p-3 shadow-2xl">
                    <div className="w-full h-full bg-white rounded-[32px] overflow-hidden relative">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1A1A1A] rounded-b-2xl z-10" />
                      {/* Screenshot */}
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        className="object-cover object-top"
                      />
                    </div>
                  </div>
                  {/* Step number badge */}
                  <div className="absolute -top-3 -left-3 w-10 h-10 bg-[#C4785A] text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                    {step.number}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="w-full md:w-1/2 text-center md:text-left">
                <h2 className="text-xl md:text-2xl font-semibold text-[#1A1A1A] mb-3">
                  {step.title}
                </h2>
                <p className="text-[#6B6B6B] mb-4">
                  {step.description}
                </p>
                {step.tip && (
                  <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-4 text-left">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">💡</span>
                      <p className="text-sm text-[#F57C00]">{step.tip}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 bg-white border-t border-[#EBEBEB]">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">
            Ready to get started?
          </h2>
          <p className="text-[#6B6B6B] mb-6">
            Join hundreds of cleaners already earning with VillaCare. It&apos;s free to join and takes just 2 minutes.
          </p>
          <Link
            href="/onboarding/cleaner"
            className="inline-block bg-[#1A1A1A] text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-[#333] transition-colors"
          >
            Create My Profile
          </Link>
          <p className="text-sm text-[#9B9B9B] mt-4">
            No fees · No commitment · Cancel anytime
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 px-4">
        <div className="max-w-xl mx-auto">
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-6 text-center">
            Common Questions
          </h2>
          <div className="space-y-4">
            <details className="bg-white rounded-xl p-4 border border-[#EBEBEB] group">
              <summary className="font-medium text-[#1A1A1A] cursor-pointer list-none flex justify-between items-center">
                How long does signup take?
                <span className="text-[#9B9B9B] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-[#6B6B6B] mt-3 text-sm">
                Most cleaners complete signup in under 2 minutes. You just need your phone, a photo, and to choose your areas and rates.
              </p>
            </details>
            <details className="bg-white rounded-xl p-4 border border-[#EBEBEB] group">
              <summary className="font-medium text-[#1A1A1A] cursor-pointer list-none flex justify-between items-center">
                Is there a fee to join?
                <span className="text-[#9B9B9B] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-[#6B6B6B] mt-3 text-sm">
                No! VillaCare is completely free for cleaners. We make money from villa owners, not from you.
              </p>
            </details>
            <details className="bg-white rounded-xl p-4 border border-[#EBEBEB] group">
              <summary className="font-medium text-[#1A1A1A] cursor-pointer list-none flex justify-between items-center">
                How do I receive bookings?
                <span className="text-[#9B9B9B] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-[#6B6B6B] mt-3 text-sm">
                When a villa owner books you, you&apos;ll get a WhatsApp message with all the details. Simply reply &quot;ACCEPT&quot; or &quot;DECLINE&quot; - it&apos;s that easy!
              </p>
            </details>
            <details className="bg-white rounded-xl p-4 border border-[#EBEBEB] group">
              <summary className="font-medium text-[#1A1A1A] cursor-pointer list-none flex justify-between items-center">
                Can I set my own prices?
                <span className="text-[#9B9B9B] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-[#6B6B6B] mt-3 text-sm">
                Yes! You choose your hourly rate and we calculate service prices automatically. You keep 100% of what you earn.
              </p>
            </details>
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
