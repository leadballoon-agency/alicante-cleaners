'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  Pause,
  Play,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Heart,
  Star,
  Calendar,
  Loader2,
  X,
} from 'lucide-react'

type AccountStatus = 'ACTIVE' | 'PAUSED' | 'PENDING_DELETION'

type AccountData = {
  status: AccountStatus
  pausedAt: string | null
  pausedReason: string | null
  deletionRequestedAt: string | null
  deletionScheduledFor: string | null
  daysUntilDeletion: number | null
  role: string
  memberSince: string
  stats: {
    totalBookings: number
    reviewCount?: number
    rating?: number | null
    propertyCount?: number
  }
}

const PAUSE_REASONS = [
  { id: 'vacation', label: 'Taking a vacation', icon: '🏖️' },
  { id: 'personal', label: 'Personal reasons', icon: '🏠' },
  { id: 'busy', label: 'Too busy right now', icon: '⏰' },
  { id: 'other', label: 'Other reason', icon: '💭' },
]

const DELETE_REASONS = [
  { id: 'not_using', label: "I'm not using the platform anymore", icon: '😴' },
  { id: 'found_alternative', label: 'Found a different service', icon: '🔄' },
  { id: 'unhappy', label: 'Unhappy with the experience', icon: '😞' },
  { id: 'privacy', label: 'Privacy concerns', icon: '🔒' },
  { id: 'other', label: 'Other reason', icon: '💭' },
]

export default function AccountSettingsPage() {
  const [accountData, setAccountData] = useState<AccountData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Modal states
  const [showPauseModal, setShowPauseModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  // Form states
  const [selectedPauseReason, setSelectedPauseReason] = useState('')
  const [selectedDeleteReason, setSelectedDeleteReason] = useState('')
  const [deleteFeedback, setDeleteFeedback] = useState('')

  useEffect(() => {
    fetchAccountData()
  }, [])

  const fetchAccountData = async () => {
    try {
      const res = await fetch('/api/account')
      if (res.ok) {
        const data = await res.json()
        setAccountData(data)
      }
    } catch (err) {
      console.error('Failed to fetch account data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: string, reason?: string, feedback?: string) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason, feedback }),
      })

      if (res.ok) {
        await fetchAccountData()
        setShowPauseModal(false)
        setShowDeleteModal(false)
        setShowConfirmDelete(false)
      }
    } catch (err) {
      console.error('Action failed:', err)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#6B6B6B] animate-spin" />
      </div>
    )
  }

  if (!accountData) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-[#6B6B6B]">Unable to load account settings</p>
          <Link href="/dashboard" className="text-[#C4785A] mt-2 inline-block">
            Return to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-sans pb-safe">
      {/* Header */}
      <header className="px-6 py-4 pt-safe bg-white border-b border-[#EBEBEB]">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/dashboard"
              className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold text-[#1A1A1A]">
              Account Settings
            </h1>
          </div>
        </div>
      </header>

      <main className="px-6 py-6 max-w-2xl mx-auto space-y-6">
        {/* Current Status Banner */}
        {accountData.status === 'PAUSED' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Pause className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-amber-800 mb-1">Account Paused</h3>
                <p className="text-sm text-amber-700">
                  Your profile is hidden and you won&apos;t receive new bookings.
                  {accountData.pausedAt && (
                    <span> Paused on {formatDate(accountData.pausedAt)}.</span>
                  )}
                </p>
                <button
                  onClick={() => handleAction('unpause')}
                  disabled={actionLoading}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  Reactivate Account
                </button>
              </div>
            </div>
          </div>
        )}

        {accountData.status === 'PENDING_DELETION' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-800 mb-1">
                  Account Scheduled for Deletion
                </h3>
                <p className="text-sm text-red-700">
                  Your account will be permanently deleted in{' '}
                  <strong>{accountData.daysUntilDeletion} days</strong>
                  {accountData.deletionScheduledFor && (
                    <span> (on {formatDate(accountData.deletionScheduledFor)})</span>
                  )}
                  . All your data will be removed.
                </p>
                <button
                  onClick={() => handleAction('cancel_deletion')}
                  disabled={actionLoading}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Cancel Deletion
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Account Summary */}
        <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
          <h2 className="font-semibold text-[#1A1A1A] mb-4">Your Journey</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-[#F5F5F3] rounded-xl p-4 text-center">
              <Calendar className="w-5 h-5 mx-auto mb-2 text-[#6B6B6B]" />
              <p className="text-2xl font-semibold text-[#1A1A1A]">
                {Math.floor((Date.now() - new Date(accountData.memberSince).getTime()) / (1000 * 60 * 60 * 24 * 30))}
              </p>
              <p className="text-xs text-[#6B6B6B]">Months with us</p>
            </div>
            <div className="bg-[#F5F5F3] rounded-xl p-4 text-center">
              <CheckCircle className="w-5 h-5 mx-auto mb-2 text-[#6B6B6B]" />
              <p className="text-2xl font-semibold text-[#1A1A1A]">
                {accountData.stats.totalBookings}
              </p>
              <p className="text-xs text-[#6B6B6B]">Bookings completed</p>
            </div>
          </div>

          {accountData.stats.rating && (
            <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
              <Star className="w-4 h-4 text-[#C4785A]" />
              <span>{accountData.stats.rating.toFixed(1)} rating from {accountData.stats.reviewCount} reviews</span>
            </div>
          )}

          <p className="text-xs text-[#9B9B9B] mt-4">
            Member since {formatDate(accountData.memberSince)}
          </p>
        </div>

        {/* Account Actions */}
        {accountData.status === 'ACTIVE' && (
          <div className="space-y-4">
            {/* Pause Option */}
            <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Pause className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#1A1A1A] mb-1">Take a Break</h3>
                  <p className="text-sm text-[#6B6B6B] mb-4">
                    Need some time off? Pause your account to temporarily hide your profile.
                    Your data stays safe and you can come back anytime.
                  </p>
                  <ul className="text-sm text-[#6B6B6B] mb-4 space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Profile hidden from search
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      All your data preserved
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Reactivate with one click
                    </li>
                  </ul>
                  <button
                    onClick={() => setShowPauseModal(true)}
                    className="px-4 py-2 bg-[#F5F5F3] rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#EBEBEB] transition-colors"
                  >
                    Pause Account
                  </button>
                </div>
              </div>
            </div>

            {/* Delete Option */}
            <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#1A1A1A] mb-1">Delete Account</h3>
                  <p className="text-sm text-[#6B6B6B] mb-4">
                    Want to leave? We&apos;ll be sad to see you go. Deletion includes a
                    30-day grace period in case you change your mind.
                  </p>
                  <ul className="text-sm text-[#6B6B6B] mb-4 space-y-1">
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      30-day grace period to reconsider
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      All data permanently removed
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      Reviews and history deleted
                    </li>
                  </ul>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="text-center text-sm text-[#6B6B6B] py-4">
          <p className="mb-2">Having issues? We&apos;re here to help.</p>
          <a
            href="mailto:support@alicantecleaners.com"
            className="text-[#C4785A] font-medium hover:underline"
          >
            Contact Support
          </a>
        </div>
      </main>

      {/* Pause Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Take a Break</h2>
              <button
                onClick={() => setShowPauseModal(false)}
                className="text-[#9B9B9B] hover:text-[#1A1A1A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[#6B6B6B] mb-4">
              Why are you taking a break? (Optional)
            </p>

            <div className="space-y-2 mb-6">
              {PAUSE_REASONS.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedPauseReason(reason.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    selectedPauseReason === reason.id
                      ? 'border-[#1A1A1A] bg-[#F5F5F3]'
                      : 'border-[#EBEBEB] hover:border-[#DEDEDE]'
                  }`}
                >
                  <span className="text-xl">{reason.icon}</span>
                  <span className="font-medium text-[#1A1A1A]">{reason.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPauseModal(false)}
                className="flex-1 py-3 rounded-xl border border-[#DEDEDE] text-[#6B6B6B] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('pause', selectedPauseReason)}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Pausing...' : 'Pause Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal - Step 1: Reason */}
      {showDeleteModal && !showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">We&apos;re Sorry to See You Go</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-[#9B9B9B] hover:text-[#1A1A1A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#FFF8E7] rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-[#C4785A] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#6B6B6B]">
                  Before you go, have you considered <strong>pausing your account</strong> instead?
                  You can take a break and come back anytime without losing your data.
                </p>
              </div>
            </div>

            <p className="text-sm text-[#6B6B6B] mb-4">
              What made you decide to leave?
            </p>

            <div className="space-y-2 mb-4">
              {DELETE_REASONS.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedDeleteReason(reason.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    selectedDeleteReason === reason.id
                      ? 'border-[#1A1A1A] bg-[#F5F5F3]'
                      : 'border-[#EBEBEB] hover:border-[#DEDEDE]'
                  }`}
                >
                  <span className="text-xl">{reason.icon}</span>
                  <span className="font-medium text-[#1A1A1A]">{reason.label}</span>
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                Anything else you&apos;d like us to know? (Optional)
              </label>
              <textarea
                value={deleteFeedback}
                onChange={(e) => setDeleteFeedback(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none text-sm resize-none"
                placeholder="Your feedback helps us improve..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setShowPauseModal(true)
                }}
                className="flex-1 py-3 rounded-xl bg-[#F5F5F3] text-[#1A1A1A] font-medium"
              >
                Pause Instead
              </button>
              <button
                onClick={() => setShowConfirmDelete(true)}
                disabled={!selectedDeleteReason}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal - Step 2: Confirm */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
                Confirm Account Deletion
              </h2>
              <p className="text-sm text-[#6B6B6B]">
                Your account will be scheduled for deletion. You have{' '}
                <strong>30 days</strong> to change your mind before all data is
                permanently removed.
              </p>
            </div>

            <div className="bg-red-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-700">
                <strong>What will be deleted:</strong>
              </p>
              <ul className="text-sm text-red-600 mt-2 space-y-1">
                <li>• Your profile and account</li>
                <li>• All booking history</li>
                <li>• Reviews you&apos;ve received</li>
                <li>• Messages and conversations</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmDelete(false)
                  setShowDeleteModal(false)
                }}
                className="flex-1 py-3 rounded-xl border border-[#DEDEDE] text-[#6B6B6B] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('request_deletion', selectedDeleteReason, deleteFeedback)}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
