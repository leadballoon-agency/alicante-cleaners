'use client'

import { useState, useEffect } from 'react'

export type PlatformSettings = {
  teamLeaderHoursRequired: number
  teamLeaderRatingRequired: number
  updatedAt: Date
}

type Props = {
  settings: PlatformSettings | null
  onUpdate: (settings: PlatformSettings) => void
}

export default function SettingsTab({ settings, onUpdate }: Props) {
  const [hoursRequired, setHoursRequired] = useState(50)
  const [ratingRequired, setRatingRequired] = useState(5.0)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (settings) {
      setHoursRequired(settings.teamLeaderHoursRequired)
      setRatingRequired(settings.teamLeaderRatingRequired)
    }
  }, [settings])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamLeaderHoursRequired: hoursRequired,
          teamLeaderRatingRequired: ratingRequired,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save settings')
      }

      const data = await response.json()
      onUpdate(data.settings)
      setMessage({ type: 'success', text: 'Settings saved successfully' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = settings && (
    hoursRequired !== settings.teamLeaderHoursRequired ||
    ratingRequired !== settings.teamLeaderRatingRequired
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#1A1A1A]">Platform Settings</h2>
        <p className="text-[#6B6B6B] text-sm mt-1">Configure global platform parameters</p>
      </div>

      {/* Team Leader Requirements */}
      <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
        <h3 className="font-semibold text-[#1A1A1A] mb-4">Team Leader Requirements</h3>
        <p className="text-sm text-[#6B6B6B] mb-6">
          Configure the requirements for cleaners to become eligible as Team Leaders.
          Team Leaders can accept new cleaner applications and verify them.
        </p>

        <div className="space-y-6">
          {/* Hours Required */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Hours of Work Required
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="1"
                max="1000"
                value={hoursRequired}
                onChange={(e) => setHoursRequired(parseInt(e.target.value) || 0)}
                className="w-32 px-4 py-3 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none text-lg font-medium"
              />
              <span className="text-[#6B6B6B]">hours</span>
            </div>
            <p className="text-xs text-[#9B9B9B] mt-2">
              Minimum hours a cleaner must work before becoming eligible for Team Leader status
            </p>
          </div>

          {/* Rating Required */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Minimum Rating Required
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={ratingRequired}
                onChange={(e) => setRatingRequired(parseFloat(e.target.value) || 0)}
                className="w-32 px-4 py-3 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none text-lg font-medium"
              />
              <div className="flex items-center gap-1">
                <span className="text-[#C4785A]">&#9733;</span>
                <span className="text-[#6B6B6B]">stars</span>
              </div>
            </div>
            <p className="text-xs text-[#9B9B9B] mt-2">
              Minimum average rating required to become a Team Leader
            </p>
          </div>

          {/* Current Threshold Info */}
          <div className="bg-[#F5F5F3] rounded-xl p-4">
            <h4 className="text-sm font-medium text-[#1A1A1A] mb-2">Current Thresholds</h4>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-[#6B6B6B]">Hours: </span>
                <span className="font-medium text-[#1A1A1A]">{settings?.teamLeaderHoursRequired ?? 50}h</span>
              </div>
              <div>
                <span className="text-[#6B6B6B]">Rating: </span>
                <span className="font-medium text-[#1A1A1A]">{settings?.teamLeaderRatingRequired ?? 5.0}</span>
                <span className="text-[#C4785A] ml-1">&#9733;</span>
              </div>
            </div>
            {settings?.updatedAt && (
              <p className="text-xs text-[#9B9B9B] mt-2">
                Last updated: {new Date(settings.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-[#FFF8F5] rounded-2xl p-5 border border-[#F5E6E0]">
        <h4 className="font-medium text-[#1A1A1A] mb-2">How Team Leader Eligibility Works</h4>
        <ul className="text-sm text-[#6B6B6B] space-y-2">
          <li>&#8226; Cleaners must meet <strong>both</strong> requirements to become Team Leaders</li>
          <li>&#8226; Team Leaders can verify and accept new cleaner applications</li>
          <li>&#8226; Team Leaders can manage their own team of cleaners</li>
          <li>&#8226; Existing Team Leaders are not affected by threshold changes</li>
        </ul>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl ${
          message.type === 'success'
            ? 'bg-[#E8F5E9] text-[#2E7D32]'
            : 'bg-[#FFEBEE] text-[#C75050]'
        }`}>
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            hasChanges && !saving
              ? 'bg-[#1A1A1A] text-white hover:bg-[#333]'
              : 'bg-[#EBEBEB] text-[#9B9B9B] cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
