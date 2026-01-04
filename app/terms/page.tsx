'use client'

import Link from 'next/link'
import LanguageSwitcher from '@/components/language-switcher'

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] font-sans">
      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-[#EBEBEB] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#C4785A] rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">V</span>
            </div>
            <span className="font-semibold text-[#1A1A1A]">VillaCare</span>
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="px-6 py-12 max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold text-[#1A1A1A] mb-2">Terms & Conditions</h1>
        <p className="text-sm text-[#6B6B6B] mb-8">Last updated: January 2025</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">1. Agreement to Terms</h2>
            <p className="text-[#6B6B6B] mb-4">
              By accessing or using VillaCare (&quot;the Platform&quot;), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
            </p>
            <p className="text-[#6B6B6B]">
              VillaCare is a marketplace platform that connects villa owners with independent cleaning professionals in the Alicante region of Spain.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">2. Definitions</h2>
            <ul className="list-disc pl-6 text-[#6B6B6B] space-y-2">
              <li><strong>&quot;Platform&quot;</strong> refers to the VillaCare website and related services</li>
              <li><strong>&quot;Villa Owner&quot;</strong> or <strong>&quot;Owner&quot;</strong> refers to users who book cleaning services</li>
              <li><strong>&quot;Cleaner&quot;</strong> refers to independent cleaning professionals offering services through the Platform</li>
              <li><strong>&quot;Booking&quot;</strong> refers to a confirmed cleaning service appointment</li>
              <li><strong>&quot;Services&quot;</strong> refers to cleaning services provided by Cleaners</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">3. Platform Role</h2>
            <p className="text-[#6B6B6B] mb-4">
              VillaCare operates as an intermediary platform. We:
            </p>
            <ul className="list-disc pl-6 text-[#6B6B6B] space-y-2">
              <li>Facilitate connections between Villa Owners and Cleaners</li>
              <li>Process payments on behalf of Cleaners</li>
              <li>Provide a review and rating system</li>
              <li>Offer customer support for platform-related issues</li>
            </ul>
            <p className="text-[#6B6B6B] mt-4">
              <strong>VillaCare does not employ Cleaners.</strong> Cleaners are independent contractors who set their own rates, schedules, and methods. The contract for cleaning services is between the Villa Owner and the Cleaner directly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">4. Account Registration</h2>

            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">4.1 Eligibility</h3>
            <p className="text-[#6B6B6B] mb-4">
              You must be at least 18 years old and legally able to enter into contracts to use our Platform.
            </p>

            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">4.2 Account Security</h3>
            <p className="text-[#6B6B6B] mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
            </p>

            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">4.3 Accurate Information</h3>
            <p className="text-[#6B6B6B]">
              You agree to provide accurate, current, and complete information during registration and to update it as necessary.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">5. For Villa Owners</h2>

            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">5.1 Booking Services</h3>
            <ul className="list-disc pl-6 text-[#6B6B6B] space-y-2 mb-4">
              <li>Bookings are confirmed once payment is processed</li>
              <li>You must provide accurate property details and access instructions</li>
              <li>Ensure the property is accessible at the scheduled time</li>
            </ul>

            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">5.2 Payment</h3>
            <ul className="list-disc pl-6 text-[#6B6B6B] space-y-2 mb-4">
              <li>Full payment is required at the time of booking</li>
              <li>Payments are processed securely through Stripe</li>
              <li>Prices include the Cleaner&apos;s rate and platform service fee</li>
            </ul>

            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">5.3 Cancellation Policy</h3>
            <ul className="list-disc pl-6 text-[#6B6B6B] space-y-2">
              <li><strong>48+ hours before:</strong> Full refund</li>
              <li><strong>24-48 hours before:</strong> 50% refund</li>
              <li><strong>Less than 24 hours:</strong> No refund</li>
            </ul>
            <p className="text-[#6B6B6B] mt-2">
              Cancellations can be made through your account dashboard or by contacting support.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">6. For Cleaners</h2>

            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">6.1 Independent Contractor Status</h3>
            <p className="text-[#6B6B6B] mb-4">
              As a Cleaner, you are an independent contractor, not an employee of VillaCare. You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-[#6B6B6B] space-y-2 mb-4">
              <li>Your own taxes and social security contributions</li>
              <li>Obtaining necessary permits or licenses</li>
              <li>Your own insurance coverage</li>
              <li>Providing your own cleaning supplies and equipment</li>
            </ul>

            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">6.2 Service Standards</h3>
            <ul className="list-disc pl-6 text-[#6B6B6B] space-y-2 mb-4">
              <li>Provide services professionally and to the agreed standard</li>
              <li>Arrive on time for scheduled bookings</li>
              <li>Provide photo proof of completed work via WhatsApp</li>
              <li>Communicate promptly with Villa Owners and VillaCare</li>
            </ul>

            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">6.3 Payment Terms</h3>
            <ul className="list-disc pl-6 text-[#6B6B6B] space-y-2">
              <li>Payments are processed after service completion</li>
              <li>VillaCare retains a platform fee (15%) from each booking</li>
              <li>Payments are transferred weekly to your registered bank account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">7. Photo Proof</h2>
            <p className="text-[#6B6B6B] mb-4">
              Cleaners are required to provide photo proof of completed cleanings. By using our services:
            </p>
            <ul className="list-disc pl-6 text-[#6B6B6B] space-y-2">
              <li>Villa Owners consent to photos being taken of their property interior</li>
              <li>Photos are shared only with the Villa Owner and VillaCare</li>
              <li>Photos may be retained for dispute resolution purposes</li>
              <li>Photos will not be used for marketing without explicit consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">8. Reviews and Ratings</h2>
            <ul className="list-disc pl-6 text-[#6B6B6B] space-y-2">
              <li>Both parties may leave reviews after a completed booking</li>
              <li>Reviews must be honest, fair, and based on actual experience</li>
              <li>VillaCare reserves the right to remove reviews that violate our policies</li>
              <li>Fraudulent or defamatory reviews are prohibited</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">9. Prohibited Conduct</h2>
            <p className="text-[#6B6B6B] mb-4">Users must not:</p>
            <ul className="list-disc pl-6 text-[#6B6B6B] space-y-2">
              <li>Provide false or misleading information</li>
              <li>Circumvent the Platform to avoid fees</li>
              <li>Harass, threaten, or discriminate against other users</li>
              <li>Use the Platform for illegal purposes</li>
              <li>Interfere with Platform operations</li>
              <li>Create multiple accounts</li>
              <li>Share account credentials</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">10. Liability</h2>

            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">10.1 Platform Liability</h3>
            <p className="text-[#6B6B6B] mb-4">
              VillaCare is a marketplace platform. To the maximum extent permitted by law, we are not liable for:
            </p>
            <ul className="list-disc pl-6 text-[#6B6B6B] space-y-2 mb-4">
              <li>The quality of cleaning services provided</li>
              <li>Damage to property during cleaning</li>
              <li>Actions or omissions of Cleaners or Villa Owners</li>
              <li>Disputes between users</li>
            </ul>

            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">10.2 Cleaner Liability</h3>
            <p className="text-[#6B6B6B] mb-4">
              Cleaners are responsible for any damage caused during service provision. We strongly recommend Cleaners maintain appropriate liability insurance.
            </p>

            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">10.3 Dispute Resolution</h3>
            <p className="text-[#6B6B6B]">
              In case of disputes, please contact us at <a href="mailto:support@alicantecleaners.com" className="text-[#C4785A] hover:underline">support@alicantecleaners.com</a>. We will assist in mediating disputes but are not responsible for their resolution.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">11. Intellectual Property</h2>
            <p className="text-[#6B6B6B]">
              The VillaCare name, logo, and all Platform content are owned by or licensed to VillaCare. You may not use our intellectual property without written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">12. Termination</h2>
            <p className="text-[#6B6B6B] mb-4">
              We may suspend or terminate your account if you:
            </p>
            <ul className="list-disc pl-6 text-[#6B6B6B] space-y-2">
              <li>Violate these Terms and Conditions</li>
              <li>Engage in fraudulent activity</li>
              <li>Receive consistently poor reviews (Cleaners)</li>
              <li>Fail to complete booked services without valid reason</li>
            </ul>
            <p className="text-[#6B6B6B] mt-4">
              You may close your account at any time through your account settings or by contacting support.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">13. Governing Law</h2>
            <p className="text-[#6B6B6B]">
              These Terms are governed by the laws of Spain. Any disputes shall be subject to the exclusive jurisdiction of the courts of Alicante, Spain.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">14. Changes to Terms</h2>
            <p className="text-[#6B6B6B]">
              We may modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the new Terms. Material changes will be communicated via email or Platform notification.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">15. Contact Information</h2>
            <p className="text-[#6B6B6B] mb-4">
              For questions about these Terms, please contact us:
            </p>
            <div className="bg-white rounded-xl p-6 border border-[#EBEBEB]">
              <p className="text-[#1A1A1A] font-medium mb-2">VillaCare</p>
              <p className="text-[#6B6B6B]">Alicante, Spain</p>
              <p className="text-[#6B6B6B]">
                Email: <a href="mailto:hello@alicantecleaners.com" className="text-[#C4785A] hover:underline">hello@alicantecleaners.com</a>
              </p>
              <p className="text-[#6B6B6B]">
                Support: <a href="mailto:support@alicantecleaners.com" className="text-[#C4785A] hover:underline">support@alicantecleaners.com</a>
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-[#EBEBEB]">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#9B9B9B]">
            VillaCare · Alicante, Spain
          </p>
          <div className="flex items-center gap-4 text-xs text-[#9B9B9B]">
            <Link href="/privacy" className="hover:text-[#1A1A1A]">
              Privacy Policy
            </Link>
            <Link href="/about" className="hover:text-[#1A1A1A]">
              Our story
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
