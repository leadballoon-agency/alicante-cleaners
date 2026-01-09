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
  const [activeSection, setActiveSection] = useState<'team' | 'scripts' | 'whatsapp'>('team')

  // WhatsApp test state
  const [testPhone, setTestPhone] = useState('')
  const [testType, setTestType] = useState<'simple' | 'booking'>('simple')
  const [customMessage, setCustomMessage] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

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
        <button
          onClick={() => setActiveSection('whatsapp')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeSection === 'whatsapp'
              ? 'bg-[#25D366] text-white'
              : 'bg-white border border-[#EBEBEB] text-[#6B6B6B]'
          }`}
        >
          WhatsApp
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

      {activeSection === 'whatsapp' && (
        <>
          {/* WhatsApp Test Section */}
          <div className="bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <div>
                <h3 className="font-semibold text-lg">WhatsApp Test Tool</h3>
                <p className="text-white/80 text-sm">Test your WhatsApp notifications</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Phone Number (with country code)
                </label>
                <input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+34612345678"
                  className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                />
              </div>

              {/* Test Type */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Message Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTestType('simple')}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                      testType === 'simple'
                        ? 'bg-white text-[#25D366]'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Simple Test
                  </button>
                  <button
                    onClick={() => setTestType('booking')}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                      testType === 'booking'
                        ? 'bg-white text-[#25D366]'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Booking Template
                  </button>
                </div>
              </div>

              {/* Custom Message (for simple type) */}
              {testType === 'simple' && (
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Custom Message (optional)
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Leave empty for default test message..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-white/40 focus:outline-none resize-none"
                  />
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={async () => {
                  setSendingTest(true)
                  setTestResult(null)
                  try {
                    const res = await fetch('/api/admin/test-whatsapp', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: testType,
                        phone: testPhone,
                        message: customMessage || undefined,
                      }),
                    })
                    const data = await res.json()
                    setTestResult({
                      success: data.success,
                      message: data.success
                        ? `Message sent successfully! ID: ${data.messageId || 'N/A'}`
                        : data.error || 'Failed to send message',
                    })
                  } catch (err) {
                    setTestResult({
                      success: false,
                      message: err instanceof Error ? err.message : 'Network error',
                    })
                  } finally {
                    setSendingTest(false)
                  }
                }}
                disabled={sendingTest || !testPhone}
                className={`w-full py-3 rounded-xl font-medium transition-all ${
                  sendingTest || !testPhone
                    ? 'bg-white/20 text-white/50 cursor-not-allowed'
                    : 'bg-white text-[#25D366] hover:bg-white/90'
                }`}
              >
                {sendingTest ? 'Sending...' : 'Send Test Message'}
              </button>

              {/* Result */}
              {testResult && (
                <div
                  className={`p-4 rounded-xl ${
                    testResult.success
                      ? 'bg-white/20 text-white'
                      : 'bg-red-500/30 text-white'
                  }`}
                >
                  {testResult.success ? '✓ ' : '✗ '}
                  {testResult.message}
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-white rounded-2xl p-6 border border-[#EBEBEB]">
            <h4 className="font-semibold text-[#1A1A1A] mb-4">How WhatsApp Works</h4>
            <div className="space-y-4 text-sm text-[#6B6B6B]">
              <div>
                <p className="font-medium text-[#1A1A1A] mb-1">Templates (Business-initiated)</p>
                <p>
                  Twilio requires pre-approved templates to send messages to users who haven&apos;t messaged you first.
                  We use templates for OTP codes and new booking notifications.
                </p>
              </div>
              <div>
                <p className="font-medium text-[#1A1A1A] mb-1">Free-form Messages (Reply window)</p>
                <p>
                  Within 24 hours of a user messaging you, you can send any message (no template needed).
                  This is why the &quot;Simple Test&quot; only works if the recipient has messaged the WhatsApp number recently.
                </p>
              </div>
              <div>
                <p className="font-medium text-[#1A1A1A] mb-1">Booking Template Test</p>
                <p>
                  The &quot;Booking Template&quot; option sends a test booking notification using the approved template.
                  This should work regardless of whether the user has messaged before.
                </p>
              </div>
            </div>
          </div>

          {/* Template Info */}
          <div className="bg-[#FFF8F5] rounded-2xl p-5 border border-[#F5E6E0]">
            <h4 className="font-medium text-[#1A1A1A] mb-2">Approved Templates</h4>
            <div className="text-sm text-[#6B6B6B] space-y-2 font-mono">
              <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                <span>OTP</span>
                <span className="text-xs">HX1bf4d7b...7ce1</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                <span>New Booking</span>
                <span className="text-xs">HX471e05...d703</span>
              </div>
            </div>
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
