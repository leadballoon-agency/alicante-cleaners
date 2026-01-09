'use client'

import Link from 'next/link'
import Image from 'next/image'
import LanguageSwitcher from '@/components/language-switcher'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] font-sans">
      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-[#EBEBEB] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image
              src="/villacare-horizontal-logo.png"
              alt="VillaCare"
              width={140}
              height={40}
              className="object-contain"
            />
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="px-6 py-12 max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold text-[#1A1A1A] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#6B6B6B] mb-8">Last updated: January 2025</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">1. Introduction</h2>
            <p className="text-[#6B6B6B] mb-4">
              VillaCare (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our villa cleaning marketplace platform serving the Alicante region of Spain.
            </p>
            <p className="text-[#6B6B6B]">
              By using our services, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">Personal Information</h3>
            <p className="text-[#6B6B6B] mb-4">We may collect the following personal information:</p>
            <ul className="list-disc pl-6 text-[#6B6B6B] mb-4 space-y-2">
              <li>Name and contact information (email address, phone number)</li>
              <li>Property address and details for villa owners</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Profile photos and biographical information for cleaners</li>
              <li>Service areas and availability</li>
              <li>Reviews and ratings</li>
              <li>Communication preferences and language settings</li>
            </ul>

            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">Automatically Collected Information</h3>
            <ul className="list-disc pl-6 text-[#6B6B6B] space-y-2">
              <li>Device information (browser type, operating system)</li>
              <li>IP address and approximate location</li>
              <li>Usage data (pages visited, features used)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">3. How We Use Your Information</h2>
            <p className="text-[#6B6B6B] mb-4">We use the collected information to:</p>
            <ul className="list-disc pl-6 text-[#6B6B6B] space-y-2">
              <li>Facilitate connections between villa owners and cleaners</li>
              <li>Process bookings and payments</li>
              <li>Send booking confirmations and updates via WhatsApp or email</li>
              <li>Provide photo proof of completed cleanings</li>
              <li>Enable reviews and ratings</li>
              <li>Improve our platform and services</li>
              <li>Communicate important updates and promotional offers</li>
              <li>Ensure platform security and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">4. Information Sharing</h2>
            <p className="text-[#6B6B6B] mb-4">We may share your information with:</p>
            <ul className="list-disc pl-6 text-[#6B6B6B] space-y-2">
              <li><strong>Service Providers:</strong> Cleaners receive villa owner contact details and property information necessary to provide services</li>
              <li><strong>Villa Owners:</strong> Receive cleaner profiles, contact information, and service updates</li>
              <li><strong>Payment Processors:</strong> Stripe processes payments securely</li>
              <li><strong>Communication Services:</strong> WhatsApp for notifications and photo proof</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>
            <p className="text-[#6B6B6B] mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">5. Data Security</h2>
            <p className="text-[#6B6B6B] mb-4">
              We implement appropriate technical and organizational measures to protect your personal information, including:
            </p>
            <ul className="list-disc pl-6 text-[#6B6B6B] space-y-2">
              <li>Encrypted data transmission (HTTPS/TLS)</li>
              <li>Passwordless authentication (magic links, phone OTP via WhatsApp)</li>
              <li>AES-256 encryption for sensitive property access information</li>
              <li>Regular security assessments</li>
              <li>Limited access to personal data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">6. Your Rights (GDPR)</h2>
            <p className="text-[#6B6B6B] mb-4">
              Under the General Data Protection Regulation (GDPR), you have the following rights:
            </p>
            <ul className="list-disc pl-6 text-[#6B6B6B] space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Erasure:</strong> Request deletion of your data (&quot;right to be forgotten&quot;)</li>
              <li><strong>Restriction:</strong> Limit how we process your data</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Objection:</strong> Object to certain processing activities</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent at any time</li>
            </ul>
            <p className="text-[#6B6B6B] mt-4">
              To exercise these rights, contact us at <a href="mailto:privacy@alicantecleaners.com" className="text-[#C4785A] hover:underline">privacy@alicantecleaners.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">7. Cookies</h2>
            <p className="text-[#6B6B6B] mb-4">
              We use essential cookies to:
            </p>
            <ul className="list-disc pl-6 text-[#6B6B6B] space-y-2">
              <li>Keep you logged in</li>
              <li>Remember your language preferences</li>
              <li>Ensure platform security</li>
            </ul>
            <p className="text-[#6B6B6B] mt-4">
              You can control cookies through your browser settings. Disabling cookies may affect platform functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">8. Data Retention</h2>
            <p className="text-[#6B6B6B]">
              We retain your personal data for as long as necessary to provide our services and comply with legal obligations. Booking records are kept for 7 years for tax and legal purposes. You can request deletion of your account and associated data at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">9. International Transfers</h2>
            <p className="text-[#6B6B6B]">
              Your data is primarily processed within the European Economic Area (EEA). If we transfer data outside the EEA, we ensure appropriate safeguards are in place in compliance with GDPR requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">10. Children&apos;s Privacy</h2>
            <p className="text-[#6B6B6B]">
              Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">11. Changes to This Policy</h2>
            <p className="text-[#6B6B6B]">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">12. Contact Us</h2>
            <p className="text-[#6B6B6B] mb-4">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-white rounded-xl p-6 border border-[#EBEBEB]">
              <p className="text-[#1A1A1A] font-medium mb-2">VillaCare</p>
              <p className="text-[#6B6B6B]">Alicante, Spain</p>
              <p className="text-[#6B6B6B]">
                Email: <a href="mailto:privacy@alicantecleaners.com" className="text-[#C4785A] hover:underline">privacy@alicantecleaners.com</a>
              </p>
              <p className="text-[#6B6B6B]">
                General: <a href="mailto:hello@alicantecleaners.com" className="text-[#C4785A] hover:underline">hello@alicantecleaners.com</a>
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
            <Link href="/terms" className="hover:text-[#1A1A1A]">
              Terms & Conditions
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
