'use client'

import { useState, useEffect } from 'react'

export type PlatformSettings = {
  requireCleanerApproval: boolean
  requireReviewApproval: boolean
  allowGuestBookings: boolean
  minimumHourlyRate: number
  maximumHourlyRate: number
  defaultServiceHours: {
    regular: number
    deep: number
    arrival: number
  }
  platformFeePercent: number
  supportEmail: string
  supportPhone: string
  maintenanceMode: boolean
  enableAIChat: boolean
}

interface Props {
  isOpen: boolean
  onClose: () => void
  settings: PlatformSettings
  onSave: (settings: PlatformSettings) => Promise<void>
}

export default function SettingsDrawer({ isOpen, onClose, settings: initialSettings, onSave }: Props) {
  const [settings, setSettings] = useState<PlatformSettings>(initialSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(initialSettings)
    setHasChanges(changed)
  }, [settings, initialSettings])

  // Reset when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setSettings(initialSettings)
      setHasChanges(false)
    }
  }, [isOpen, initialSettings])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(settings)
      onClose()
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-[90vw] max-w-[400px] bg-white z-50 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#EBEBEB]">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#F5F5F3] flex items-center justify-center text-[#6B6B6B]"
          >
            <span className="text-lg">&times;</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Approvals */}
          <section>
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Approvals</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-[#6B6B6B]">Require cleaner approval</span>
                <input
                  type="checkbox"
                  checked={settings.requireCleanerApproval}
                  onChange={(e) => setSettings({ ...settings, requireCleanerApproval: e.target.checked })}
                  className="w-5 h-5 rounded border-[#DEDEDE] text-[#C4785A] focus:ring-[#C4785A]"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-[#6B6B6B]">Require review approval</span>
                <input
                  type="checkbox"
                  checked={settings.requireReviewApproval}
                  onChange={(e) => setSettings({ ...settings, requireReviewApproval: e.target.checked })}
                  className="w-5 h-5 rounded border-[#DEDEDE] text-[#C4785A] focus:ring-[#C4785A]"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-[#6B6B6B]">Allow guest bookings</span>
                <input
                  type="checkbox"
                  checked={settings.allowGuestBookings}
                  onChange={(e) => setSettings({ ...settings, allowGuestBookings: e.target.checked })}
                  className="w-5 h-5 rounded border-[#DEDEDE] text-[#C4785A] focus:ring-[#C4785A]"
                />
              </label>
            </div>
          </section>

          {/* Pricing */}
          <section>
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Pricing</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-[#6B6B6B]">Minimum hourly rate</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#9B9B9B]">EUR</span>
                  <input
                    type="number"
                    value={settings.minimumHourlyRate}
                    onChange={(e) => setSettings({ ...settings, minimumHourlyRate: Number(e.target.value) })}
                    className="flex-1 px-3 py-2 rounded-lg border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-[#6B6B6B]">Maximum hourly rate</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#9B9B9B]">EUR</span>
                  <input
                    type="number"
                    value={settings.maximumHourlyRate}
                    onChange={(e) => setSettings({ ...settings, maximumHourlyRate: Number(e.target.value) })}
                    className="flex-1 px-3 py-2 rounded-lg border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-[#6B6B6B]">Platform fee %</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={settings.platformFeePercent}
                    onChange={(e) => setSettings({ ...settings, platformFeePercent: Number(e.target.value) })}
                    className="flex-1 px-3 py-2 rounded-lg border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none text-sm"
                    min={0}
                    max={100}
                  />
                  <span className="text-[#9B9B9B]">%</span>
                </div>
              </div>
            </div>
          </section>

          {/* Service Hours */}
          <section>
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Default Service Hours</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-[#6B6B6B]">Regular</label>
                <input
                  type="number"
                  value={settings.defaultServiceHours.regular}
                  onChange={(e) => setSettings({
                    ...settings,
                    defaultServiceHours: { ...settings.defaultServiceHours, regular: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 rounded-lg border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-[#6B6B6B]">Deep</label>
                <input
                  type="number"
                  value={settings.defaultServiceHours.deep}
                  onChange={(e) => setSettings({
                    ...settings,
                    defaultServiceHours: { ...settings.defaultServiceHours, deep: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 rounded-lg border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-[#6B6B6B]">Arrival</label>
                <input
                  type="number"
                  value={settings.defaultServiceHours.arrival}
                  onChange={(e) => setSettings({
                    ...settings,
                    defaultServiceHours: { ...settings.defaultServiceHours, arrival: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 rounded-lg border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none text-sm mt-1"
                />
              </div>
            </div>
          </section>

          {/* Support */}
          <section>
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Support</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-[#6B6B6B]">Support email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-[#6B6B6B]">Support phone</label>
                <input
                  type="tel"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none text-sm mt-1"
                />
              </div>
            </div>
          </section>

          {/* System */}
          <section>
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">System</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-[#6B6B6B]">Enable AI chat</span>
                <input
                  type="checkbox"
                  checked={settings.enableAIChat}
                  onChange={(e) => setSettings({ ...settings, enableAIChat: e.target.checked })}
                  className="w-5 h-5 rounded border-[#DEDEDE] text-[#C4785A] focus:ring-[#C4785A]"
                />
              </label>
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-[#6B6B6B]">Maintenance mode</span>
                  <p className="text-xs text-[#9B9B9B]">Disables public access</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="w-5 h-5 rounded border-[#DEDEDE] text-red-500 focus:ring-red-500"
                />
              </label>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EBEBEB] bg-[#F5F5F3]">
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="w-full py-3 bg-[#1A1A1A] text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
          >
            {isSaving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
