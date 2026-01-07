'use client'

import Image from 'next/image'
import Link from 'next/link'

const steps = [
  {
    number: 1,
    title: 'Browse trusted cleaners',
    description: 'Visit our homepage to see all available cleaners in Alicante. Filter by area to find someone near your villa. Each profile shows their rating, reviews, and starting prices.',
    image: '/owner-guide/01-homepage.png',
    tip: 'Look for the "Featured" badge - these are our most highly-rated and reliable cleaners!',
  },
  {
    number: 2,
    title: 'View cleaner profile',
    description: 'Click on a cleaner to see their full profile. Check their reviews, service areas, languages spoken, and whether they have a team for backup coverage.',
    image: '/owner-guide/02-cleaner-profile.png',
    tip: 'Cleaners with a team can guarantee coverage - if they\'re sick, a trusted colleague can step in.',
  },
  {
    number: 3,
    title: 'Pick your date',
    description: 'Select the service you need and choose your preferred date. Weekends and Saturdays marked "Popular" tend to fill up fast!',
    image: '/owner-guide/03-select-date.png',
    tip: 'Book at least a few days in advance for the best availability, especially during peak season.',
  },
  {
    number: 4,
    title: 'Choose your time',
    description: 'Pick a time that works for you. You\'ll see which slots are available and which are already booked. All times are shown in local Spain time (CET).',
    image: '/owner-guide/04-select-time.png',
    tip: 'Morning slots (8am-10am) are popular for arrival prep before guests check in.',
  },
  {
    number: 5,
    title: 'Add property details',
    description: 'Tell us about your villa - the address, number of bedrooms, and any special instructions. This helps the cleaner prepare and bring the right supplies.',
    image: '/owner-guide/05-property-details.png',
    tip: 'Include key location, alarm codes, or pet info in the special instructions so everything runs smoothly.',
  },
  {
    number: 6,
    title: 'Confirm your booking',
    description: 'Review your booking details and enter your contact information. The cleaner typically responds within 2 hours to confirm they can take the job.',
    image: '/owner-guide/06-confirm-booking.png',
    tip: 'You\'ll receive updates via WhatsApp, so make sure to include your phone number with country code!',
  },
]

export default function OwnerGuide() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white border-b border-[#EBEBEB] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[#6B6B6B] hover:text-[#1A1A1A]">
            <span>←</span>
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
          <div className="inline-flex items-center gap-2 bg-[#E3F2FD] text-[#1565C0] px-3 py-1 rounded-full text-sm font-medium mb-4">
            <span>🏠</span>
            <span>For Villa Owners</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
            How to Book a Cleaner
          </h1>
          <p className="text-[#6B6B6B] text-lg max-w-xl mx-auto">
            Follow these simple steps to find and book a trusted cleaner for your Alicante villa. The whole process takes just a few minutes.
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

      {/* What Happens Next */}
      <section className="py-12 px-4 bg-white border-t border-[#EBEBEB]">
        <div className="max-w-xl mx-auto">
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-6 text-center">
            What Happens After You Book?
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-[#F5F5F3] rounded-xl">
              <div className="w-8 h-8 bg-[#C4785A] text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">1</div>
              <div>
                <p className="font-medium text-[#1A1A1A]">Cleaner confirms within 2 hours</p>
                <p className="text-sm text-[#6B6B6B]">You&apos;ll get a WhatsApp message once they accept your booking</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-[#F5F5F3] rounded-xl">
              <div className="w-8 h-8 bg-[#C4785A] text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">2</div>
              <div>
                <p className="font-medium text-[#1A1A1A]">Reminder before your booking</p>
                <p className="text-sm text-[#6B6B6B]">We&apos;ll confirm access details like key location and entry codes</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-[#F5F5F3] rounded-xl">
              <div className="w-8 h-8 bg-[#C4785A] text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">3</div>
              <div>
                <p className="font-medium text-[#1A1A1A]">Photo proof when complete</p>
                <p className="text-sm text-[#6B6B6B]">Receive photos via WhatsApp showing your spotless villa</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-[#F5F5F3] rounded-xl">
              <div className="w-8 h-8 bg-[#C4785A] text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">4</div>
              <div>
                <p className="font-medium text-[#1A1A1A]">Pay your cleaner directly</p>
                <p className="text-sm text-[#6B6B6B]">Cash or transfer after the clean - no platform fees for you!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">
            Ready to book your first clean?
          </h2>
          <p className="text-[#6B6B6B] mb-6">
            Browse our network of trusted cleaners and find the perfect match for your villa.
          </p>
          <Link
            href="/"
            className="inline-block bg-[#1A1A1A] text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-[#333] transition-colors"
          >
            Find a Cleaner
          </Link>
          <p className="text-sm text-[#9B9B9B] mt-4">
            No account needed · Book as a guest · Pay after the clean
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 px-4 bg-white border-t border-[#EBEBEB]">
        <div className="max-w-xl mx-auto">
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-6 text-center">
            Common Questions
          </h2>
          <div className="space-y-4">
            <details className="bg-[#FAFAF8] rounded-xl p-4 border border-[#EBEBEB] group">
              <summary className="font-medium text-[#1A1A1A] cursor-pointer list-none flex justify-between items-center">
                Do I need to create an account?
                <span className="text-[#9B9B9B] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-[#6B6B6B] mt-3 text-sm">
                No! You can book as a guest with just your name, email, and phone number. If you want to save your properties and booking history, you can create an account later.
              </p>
            </details>
            <details className="bg-[#FAFAF8] rounded-xl p-4 border border-[#EBEBEB] group">
              <summary className="font-medium text-[#1A1A1A] cursor-pointer list-none flex justify-between items-center">
                How do I pay?
                <span className="text-[#9B9B9B] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-[#6B6B6B] mt-3 text-sm">
                You pay your cleaner directly after the clean - cash or bank transfer. There are no platform fees for villa owners. Online payments are coming soon.
              </p>
            </details>
            <details className="bg-[#FAFAF8] rounded-xl p-4 border border-[#EBEBEB] group">
              <summary className="font-medium text-[#1A1A1A] cursor-pointer list-none flex justify-between items-center">
                What if the cleaner can&apos;t make it?
                <span className="text-[#9B9B9B] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-[#6B6B6B] mt-3 text-sm">
                If your cleaner is unable to attend, we&apos;ll help you find an available replacement. Many of our cleaners have teams who can provide backup coverage.
              </p>
            </details>
            <details className="bg-[#FAFAF8] rounded-xl p-4 border border-[#EBEBEB] group">
              <summary className="font-medium text-[#1A1A1A] cursor-pointer list-none flex justify-between items-center">
                Can I communicate in my own language?
                <span className="text-[#9B9B9B] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-[#6B6B6B] mt-3 text-sm">
                Yes! Our platform auto-translates messages between 7 languages. Write in English, German, French, Dutch, Italian, or Portuguese - your cleaner reads it in Spanish and vice versa.
              </p>
            </details>
            <details className="bg-[#FAFAF8] rounded-xl p-4 border border-[#EBEBEB] group">
              <summary className="font-medium text-[#1A1A1A] cursor-pointer list-none flex justify-between items-center">
                What services are available?
                <span className="text-[#9B9B9B] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-[#6B6B6B] mt-3 text-sm">
                <strong>Regular Clean</strong> (3h) - Standard cleaning for maintained homes. <strong>Deep Clean</strong> (5h) - Thorough cleaning including hard-to-reach areas. <strong>Arrival Prep</strong> (4h) - Get your villa ready before you or your guests arrive.
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
