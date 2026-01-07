'use client'

import { signOut } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'

export default function SignOutPage() {
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C4785A] to-[#A66347] text-white text-xl font-bold mb-4">
            V
          </div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Sign out</h1>
          <p className="text-[#6B6B6B] mt-2">
            Are you sure you want to sign out?
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB] shadow-sm">
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSigningOut ? 'Signing out...' : 'Yes, sign me out'}
            </button>

            <Link
              href="/"
              className="block w-full bg-white border border-[#DEDEDE] text-[#1A1A1A] py-3.5 rounded-xl font-medium text-center active:scale-[0.98] transition-all"
            >
              Cancel
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#9B9B9B] mt-8">
          VillaCare · Made in Alicante
        </p>
      </div>
    </div>
  )
}
