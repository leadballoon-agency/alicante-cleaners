'use client'

import { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  member: {
    id: string
    name: string
    phone: string | null
  }
  teamName: string
}

export default function CalendarSetupModal({ isOpen, onClose, member, teamName }: Props) {
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)

  if (!isOpen) return null

  // Generate setup instructions
  const setupInstructions = `Hi ${member.name.split(' ')[0]}! Welcome to ${teamName}!

To complete your setup, please connect your Google Calendar so the team can see when you're available.

Here's how:
1. Go to your VillaCare dashboard
2. Click on "Profile" tab
3. Click "Connect Google Calendar"
4. Sign in with Google and allow access

This helps ${teamName} assign jobs when you're free. Your personal events stay private - we only see busy/free times.

Questions? Reply to this message!`

  const whatsappLink = member.phone
    ? `https://wa.me/${member.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(setupInstructions)}`
    : null

  const handleCopy = () => {
    navigator.clipboard.writeText(setupInstructions)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendWhatsApp = () => {
    if (whatsappLink) {
      setSending(true)
      window.open(whatsappLink, '_blank')
      setTimeout(() => {
        setSending(false)
        onClose()
      }, 1000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-[#EBEBEB]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <h2 className="font-semibold text-[#1A1A1A]">Calendar Setup Required</h2>
                <p className="text-sm text-[#6B6B6B]">for {member.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#6B6B6B] hover:text-[#1A1A1A] text-xl"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="bg-[#E8F5E9] rounded-xl p-4">
            <p className="text-sm text-[#2E7D32] font-medium mb-1">
              {member.name} has been activated!
            </p>
            <p className="text-sm text-[#1A1A1A]">
              Send them the calendar setup instructions below so they can connect their Google Calendar.
            </p>
          </div>

          {/* Instructions preview */}
          <div className="bg-[#F5F5F3] rounded-xl p-4">
            <p className="text-xs text-[#6B6B6B] font-medium mb-2">Setup Instructions</p>
            <p className="text-sm text-[#1A1A1A] whitespace-pre-line">
              {setupInstructions}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {whatsappLink ? (
              <button
                onClick={handleSendWhatsApp}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-xl font-medium hover:bg-[#20bd5a] disabled:opacity-50 transition-colors"
              >
                <span>💬</span>
                <span>{sending ? 'Opening WhatsApp...' : 'Send via WhatsApp'}</span>
              </button>
            ) : (
              <p className="text-sm text-[#9B9B9B] text-center">
                No phone number available for WhatsApp
              </p>
            )}

            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 bg-[#F5F5F3] text-[#1A1A1A] py-3 rounded-xl font-medium hover:bg-[#EBEBEB] transition-colors"
            >
              <span>📋</span>
              <span>{copied ? 'Copied!' : 'Copy Instructions'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-full text-[#6B6B6B] py-2 text-sm font-medium hover:text-[#1A1A1A] transition-colors"
            >
              I&apos;ll send later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
