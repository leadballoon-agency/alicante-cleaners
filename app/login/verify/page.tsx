'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] font-sans flex flex-col">
      <header className="px-6 py-4">
        <Link href="/">
          <Image
            src="/villacare-horizontal-logo.png"
            alt="VillaCare"
            width={140}
            height={40}
            className="object-contain"
          />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">&#9993;</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
            Check your email
          </h1>
          <p className="text-[#6B6B6B] mb-6">
            A sign-in link has been sent to your email address.
          </p>
          <p className="text-sm text-[#6B6B6B] mb-6">
            Click the link in the email to sign in. The link will expire in 24 hours.
          </p>
          <Link
            href="/login"
            className="text-[#C4785A] font-medium hover:underline"
          >
            Back to login
          </Link>
        </div>
      </main>

      <footer className="px-6 py-4 text-center">
        <p className="text-xs text-[#9B9B9B]">
          Didn&apos;t receive the email? Check your spam folder or try again.
        </p>
      </footer>
    </div>
  )
}
