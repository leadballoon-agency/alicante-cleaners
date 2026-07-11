'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/components/language-context'
import EnableNotifications from './EnableNotifications'

const DISMISS_KEY = 'push-prompt-dismissed'

// Dismissible prompt on the cleaner Home tab nudging them to enable web
// push. WhatsApp booking notifications are dead pending WABA reinstatement,
// so push is currently the only real-time channel cleaners have — shown
// only when notification permission isn't already granted, and hidden for
// good (via localStorage) once the cleaner dismisses it.
export default function CleanerPushPromptCard() {
  const { t } = useLanguage()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    const dismissed = localStorage.getItem(DISMISS_KEY) === 'true'
    setVisible(!dismissed && Notification.permission !== 'granted')
  }, [])

  if (!visible) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true')
    setVisible(false)
  }

  return (
    <div className="relative mb-6">
      <button
        onClick={dismiss}
        aria-label={t('push.prompt.dismiss')}
        className="absolute -top-2 -right-2 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-[#EBEBEB] text-[#9B9B9B] hover:text-[#6B6B6B] text-sm leading-none shadow-sm"
      >
        ×
      </button>
      <EnableNotifications
        title={t('push.prompt.title')}
        description={t('push.prompt.body')}
        enableLabel={t('push.enable.button')}
        grantedText={t('push.enable.granted')}
        deniedText={t('push.enable.denied')}
      />
    </div>
  )
}
