'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Owner } from '../page'
import LanguageSelector from '@/components/language-selector'

type Props = {
  owner: Owner
  onRefresh: () => void
}

export default function AccountTab({ owner, onRefresh }: Props) {
  const [copied, setCopied] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState(owner.name)
  const [editPhone, setEditPhone] = useState(owner.phone || '')
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const menuItems = [
    { icon: '💳', label: 'Payment methods', href: '#' },
    { icon: '🔔', label: 'Notifications', href: '#' },
    { icon: '🔒', label: 'Privacy & security', href: '#' },
  ]

  const referralLink = `https://alicantecleaners.com/join?ref=${owner.referralCode}`

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setEditError('')

    try {
      const response = await fetch('/api/dashboard/owner', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          phone: editPhone || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setEditError(data.error || 'Failed to update profile')
        return
      }

      setShowEditModal(false)
      onRefresh()
    } catch {
      setEditError('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const openEditModal = () => {
    setEditName(owner.name)
    setEditPhone(owner.phone || '')
    setEditError('')
    setShowEditModal(true)
  }

  const completedReferrals = owner.referrals.filter(r => r.hasBooked).length
  const pendingReferrals = owner.referrals.filter(r => !r.hasBooked).length

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-[#C4785A] flex items-center justify-center">
            <span className="text-white text-xl font-semibold">
              {owner.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-[#1A1A1A]">{owner.name}</h2>
            <p className="text-sm text-[#6B6B6B]">Villa owner</p>
          </div>
          <button
            onClick={openEditModal}
            className="px-3 py-1.5 text-sm font-medium text-[#C4785A] border border-[#C4785A] rounded-lg active:scale-[0.98] transition-all"
          >
            Edit
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[#6B6B6B]">📧</span>
            <span className="text-[#1A1A1A]">{owner.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[#6B6B6B]">📱</span>
            <span className="text-[#1A1A1A]">{owner.phone || 'Not set'}</span>
          </div>
        </div>
      </div>

      {/* Referral rewards */}
      <div className="bg-gradient-to-br from-[#C4785A] to-[#A66347] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🎁</span>
          <h3 className="font-semibold">Refer & Earn</h3>
        </div>
        <p className="text-white/80 text-sm mb-4">
          Get €10 credit for every villa owner you refer who completes a booking
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-semibold">{owner.referrals.length}</p>
            <p className="text-xs text-white/70">Referred</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-semibold">{completedReferrals}</p>
            <p className="text-xs text-white/70">Booked</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-semibold">€{owner.referralCredits}</p>
            <p className="text-xs text-white/70">Earned</p>
          </div>
        </div>

        {/* Referral code */}
        <div className="bg-white/10 rounded-xl p-3">
          <p className="text-xs text-white/70 mb-1">Your referral code</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono font-semibold">{owner.referralCode}</code>
            <button
              onClick={copyReferralLink}
              className="px-3 py-1.5 bg-white text-[#C4785A] rounded-lg text-sm font-medium active:scale-[0.98] transition-all"
            >
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>

        {/* Pending referrals note */}
        {pendingReferrals > 0 && (
          <p className="text-xs text-white/70 mt-3">
            {pendingReferrals} referral{pendingReferrals > 1 ? 's' : ''} waiting to complete first booking
          </p>
        )}
      </div>

      {/* Language preference */}
      <LanguageSelector
        label="Preferred Language"
        description="Messages from cleaners will be translated to this language"
      />

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/"
          className="bg-white rounded-xl p-4 border border-[#EBEBEB] text-center active:scale-[0.98] transition-all"
        >
          <span className="text-2xl block mb-2">🔍</span>
          <span className="text-sm font-medium text-[#1A1A1A]">Find cleaner</span>
        </Link>
        <button
          onClick={copyReferralLink}
          className="bg-white rounded-xl p-4 border border-[#EBEBEB] text-center active:scale-[0.98] transition-all"
        >
          <span className="text-2xl block mb-2">📤</span>
          <span className="text-sm font-medium text-[#1A1A1A]">Share VillaCare</span>
        </button>
      </div>

      {/* Menu items */}
      <div className="bg-white rounded-2xl border border-[#EBEBEB] divide-y divide-[#EBEBEB]">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3.5 active:bg-[#F5F5F3] transition-colors"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium text-[#1A1A1A]">{item.label}</span>
            <span className="ml-auto text-[#9B9B9B]">→</span>
          </Link>
        ))}
      </div>

      {/* Become a cleaner CTA */}
      <div className="bg-[#FFF8F5] rounded-2xl p-5 border border-[#F5E6E0]">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🧹</span>
          <div className="flex-1">
            <h3 className="font-medium text-[#1A1A1A] mb-1">Are you a cleaner?</h3>
            <p className="text-sm text-[#6B6B6B] mb-3">
              Join VillaCare and get bookings from villa owners
            </p>
            <Link
              href="/onboarding/cleaner"
              className="inline-block bg-[#C4785A] text-white px-4 py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all"
            >
              Become a cleaner
            </Link>
          </div>
        </div>
      </div>

      {/* Support & logout */}
      <div className="space-y-3">
        <Link
          href="#"
          className="block w-full bg-white border border-[#EBEBEB] text-[#1A1A1A] py-3.5 rounded-xl font-medium text-center active:scale-[0.98] transition-all"
        >
          Help & Support
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full text-[#C75050] py-3 font-medium text-sm active:opacity-70"
        >
          Log out
        </button>
      </div>

      <p className="text-center text-xs text-[#9B9B9B]">
        VillaCare v1.0 · Made in Alicante
      </p>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Edit Profile</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-[#9B9B9B] hover:text-[#1A1A1A]"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 bg-[#FFEBEE] text-[#C75050] rounded-xl text-sm">
                {editError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none"
                  placeholder="+34 612 345 678"
                />
                <p className="text-xs text-[#9B9B9B] mt-1">
                  Include country code. Used for WhatsApp notifications.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={owner.email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] bg-[#F5F5F3] text-[#9B9B9B] cursor-not-allowed"
                />
                <p className="text-xs text-[#9B9B9B] mt-1">
                  Email cannot be changed as it&apos;s used for login.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 rounded-xl border border-[#DEDEDE] text-[#6B6B6B] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving || !editName.trim()}
                className="flex-1 py-3 rounded-xl bg-[#1A1A1A] text-white font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
