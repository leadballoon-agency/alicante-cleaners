'use client'

import { useState, useEffect } from 'react'

export type PlatformSettings = {
  teamLeaderHoursRequired: number
  teamLeaderRatingRequired: number
  googleTagManagerId?: string | null
  facebookPixelId?: string | null
  googleAnalyticsId?: string | null
  ga4PropertyId?: string | null
  convertBoxScriptId?: string | null
  customHeadScripts?: string | null
  customBodyScripts?: string | null
  updatedAt: Date
}

type Props = {
  settings: PlatformSettings | null
  onUpdate: (settings: PlatformSettings) => void
}

export default function SettingsTab({ settings, onUpdate }: Props) {
  const [hoursRequired, setHoursRequired] = useState(50)
  const [ratingRequired, setRatingRequired] = useState(5.0)
  const [googleTagManagerId, setGoogleTagManagerId] = useState('')
  const [facebookPixelId, setFacebookPixelId] = useState('')
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('')
  const [ga4PropertyId, setGa4PropertyId] = useState('')
  const [convertBoxScriptId, setConvertBoxScriptId] = useState('')
  const [customHeadScripts, setCustomHeadScripts] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeSection, setActiveSection] = useState<'team' | 'scripts'>('team')

  useEffect(() => {
    if (settings) {
      setHoursRequired(settings.teamLeaderHoursRequired)
      setRatingRequired(settings.teamLeaderRatingRequired)
      setGoogleTagManagerId(settings.googleTagManagerId || '')
      setFacebookPixelId(settings.facebookPixelId || '')
      setGoogleAnalyticsId(settings.googleAnalyticsId || '')
      setGa4PropertyId(settings.ga4PropertyId || '')
      setConvertBoxScriptId(settings.convertBoxScriptId || '')
      setCustomHeadScripts(settings.customHeadScripts || '')
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
          googleTagManagerId: googleTagManagerId || null,
          facebookPixelId: facebookPixelId || null,
          googleAnalyticsId: googleAnalyticsId || null,
          ga4PropertyId: ga4PropertyId || null,
          convertBoxScriptId: convertBoxScriptId || null,
          customHeadScripts: customHeadScripts || null,
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

  const hasChanges = settings ? (
    hoursRequired !== settings.teamLeaderHoursRequired ||
    ratingRequired !== settings.teamLeaderRatingRequired ||
    googleTagManagerId !== (settings.googleTagManagerId || '') ||
    facebookPixelId !== (settings.facebookPixelId || '') ||
    googleAnalyticsId !== (settings.googleAnalyticsId || '') ||
    ga4PropertyId !== (settings.ga4PropertyId || '') ||
    convertBoxScriptId !== (settings.convertBoxScriptId || '') ||
    customHeadScripts !== (settings.customHeadScripts || '')
  ) : (
    // If no settings loaded yet, allow save if any field has a value
    googleTagManagerId !== '' ||
    facebookPixelId !== '' ||
    googleAnalyticsId !== '' ||
    ga4PropertyId !== '' ||
    convertBoxScriptId !== '' ||
    customHeadScripts !== ''
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#1A1A1A]">Platform Settings</h2>
        <p className="text-[#6B6B6B] text-sm mt-1">Configure global platform parameters</p>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSection('team')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeSection === 'team'
              ? 'bg-[#1A1A1A] text-white'
              : 'bg-white border border-[#EBEBEB] text-[#6B6B6B]'
          }`}
        >
          Team Settings
        </button>
        <button
          onClick={() => setActiveSection('scripts')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeSection === 'scripts'
              ? 'bg-[#1A1A1A] text-white'
              : 'bg-white border border-[#EBEBEB] text-[#6B6B6B]'
          }`}
        >
          Scripts & Tracking
        </button>
      </div>

      {activeSection === 'team' && (
        <>
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
                    <span className="text-[#C4785A]">★</span>
                    <span className="text-[#6B6B6B]">stars</span>
                  </div>
                </div>
                <p className="text-xs text-[#9B9B9B] mt-2">
                  Minimum average rating required to become a Team Leader
                </p>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-[#FFF8F5] rounded-2xl p-5 border border-[#F5E6E0]">
            <h4 className="font-medium text-[#1A1A1A] mb-2">How Team Leader Eligibility Works</h4>
            <ul className="text-sm text-[#6B6B6B] space-y-2">
              <li>• Cleaners must meet <strong>both</strong> requirements to become Team Leaders</li>
              <li>• Team Leaders can verify and accept new cleaner applications</li>
              <li>• Team Leaders can manage their own team of cleaners</li>
              <li>• Existing Team Leaders are not affected by threshold changes</li>
            </ul>
          </div>
        </>
      )}

      {activeSection === 'scripts' && (
        <>
          {/* Google Tag Manager - Recommended */}
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#333] rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold">Google Tag Manager</h3>
              <span className="px-2 py-0.5 rounded-full text-xs bg-[#C4785A]">Recommended</span>
            </div>
            <p className="text-sm text-white/70 mb-4">
              GTM is the easiest way to manage all your tracking. Add FB Pixel, GA4, ConvertBox, and more - all from one dashboard without code changes.
            </p>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                GTM Container ID
              </label>
              <input
                type="text"
                value={googleTagManagerId}
                onChange={(e) => setGoogleTagManagerId(e.target.value)}
                placeholder="GTM-XXXXXXX"
                className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
              />
              <p className="text-xs text-white/50 mt-2">
                If you use GTM, you can manage all other scripts through the GTM dashboard
              </p>
            </div>
          </div>

          {/* Direct Tracking (if not using GTM) */}
          <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
            <h3 className="font-semibold text-[#1A1A1A] mb-4">Direct Tracking</h3>
            <p className="text-sm text-[#6B6B6B] mb-6">
              {googleTagManagerId
                ? '⚠️ You have GTM configured. These will be ignored - manage everything through GTM instead.'
                : 'Add tracking pixels directly if you prefer not to use GTM.'}
            </p>

            <div className={`space-y-6 ${googleTagManagerId ? 'opacity-50' : ''}`}>
              {/* Facebook Pixel */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Facebook Pixel ID
                </label>
                <input
                  type="text"
                  value={facebookPixelId}
                  onChange={(e) => setFacebookPixelId(e.target.value)}
                  placeholder="123456789012345"
                  disabled={!!googleTagManagerId}
                  className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none disabled:bg-[#F5F5F3] disabled:cursor-not-allowed"
                />
              </div>

              {/* Google Analytics */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Google Analytics 4 ID
                </label>
                <input
                  type="text"
                  value={googleAnalyticsId}
                  onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  disabled={!!googleTagManagerId}
                  className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none disabled:bg-[#F5F5F3] disabled:cursor-not-allowed"
                />
              </div>

              {/* ConvertBox */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  ConvertBox Script ID
                </label>
                <input
                  type="text"
                  value={convertBoxScriptId}
                  onChange={(e) => setConvertBoxScriptId(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none"
                />
                <p className="text-xs text-[#9B9B9B] mt-2">
                  ConvertBox loads independently - works with or without GTM
                </p>
              </div>
            </div>
          </div>

          {/* GA4 Real-time API (for Live Feed) */}
          <div className="bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold">Live Analytics (Real-time)</h3>
              <span className="px-2 py-0.5 rounded-full text-xs bg-white/20">Optional</span>
            </div>
            <p className="text-sm text-white/80 mb-4">
              Connect to Google Analytics API to see real-time visitor counts in the Live Feed.
              This requires a separate GA4 Property ID (not the Measurement ID).
            </p>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                GA4 Property ID
              </label>
              <input
                type="text"
                value={ga4PropertyId}
                onChange={(e) => setGa4PropertyId(e.target.value)}
                placeholder="123456789"
                className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
              />
              <p className="text-xs text-white/60 mt-2">
                Found in GA4 Admin → Property Settings → Property ID (numeric)
              </p>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-white/10 text-xs text-white/70">
              <p className="font-medium text-white/90 mb-1">Setup Required:</p>
              <ul className="space-y-1">
                <li>1. Create a service account in Google Cloud Console</li>
                <li>2. Grant it &quot;Viewer&quot; access in GA4</li>
                <li>3. Add GA4_SERVICE_ACCOUNT_JSON to environment variables</li>
              </ul>
            </div>
          </div>

          {/* Custom Scripts */}
          <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
            <h3 className="font-semibold text-[#1A1A1A] mb-4">Custom Scripts</h3>
            <p className="text-sm text-[#6B6B6B] mb-6">
              Add custom JavaScript that will load on all pages. Use JSON format for multiple scripts.
            </p>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Custom Head Scripts (JSON)
              </label>
              <textarea
                value={customHeadScripts}
                onChange={(e) => setCustomHeadScripts(e.target.value)}
                placeholder={`[{"id": "my-script", "src": "https://example.com/script.js"}]`}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none font-mono text-sm"
              />
              <p className="text-xs text-[#9B9B9B] mt-2">
                JSON array of script objects. Each object can have: id (required), src (external URL), or content (inline JS)
              </p>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-[#E3F2FD] rounded-2xl p-5 border border-[#BBDEFB]">
            <h4 className="font-medium text-[#1A1A1A] mb-2">💡 Script Loading</h4>
            <ul className="text-sm text-[#6B6B6B] space-y-2">
              <li>• Scripts load on all public pages including cleaner profiles</li>
              <li>• Facebook Pixel tracks PageView events automatically</li>
              <li>• ConvertBox can display popups on any cleaner&apos;s profile page</li>
              <li>• Changes take effect immediately after saving</li>
            </ul>
          </div>
        </>
      )}

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
