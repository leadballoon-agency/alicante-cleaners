'use client'

import { useEffect, useState } from 'react'

// Sanitize at the source: env values pasted into Vercel can arrive with
// wrapping quotes or stray whitespace/newlines, which make atob() throw
// "The string contains invalid characters". Strip them once, here.
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  ?.trim()
  .replace(/^['"]+|['"]+$/g, '')
  .replace(/\s+/g, '')

function urlBase64ToUint8Array(base64String: string) {
  // Defensive: keep only valid base64url characters before decoding.
  const cleaned = base64String.replace(/[^A-Za-z0-9_-]/g, '')
  const padding = '='.repeat((4 - (cleaned.length % 4)) % 4)
  const base64 = (cleaned + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

type Status = 'idle' | 'granted' | 'working' | 'denied' | 'error' | 'ios-install' | 'unsupported' | 'unconfigured'

export default function EnableNotifications() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!VAPID_PUBLIC_KEY) { setStatus('unconfigured'); return }

    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isStandalone =
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches

    if (!supported) {
      // iOS Safari (not installed to Home Screen) has no PushManager → guide to install
      if (isIOS && !isStandalone) { setStatus('ios-install'); return }
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'granted') setStatus('granted')
  }, [])

  const enable = async () => {
    setStatus('working')
    setError('')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setStatus('denied'); return }

      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const existing = await reg.pushManager.getSubscription()
      const sub =
        existing ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY as string) as BufferSource,
        }))

      const json = sub.toJSON()
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, userAgent: navigator.userAgent }),
      })
      if (!res.ok) { setStatus('error'); setError('No se pudo guardar la suscripción.'); return }

      setStatus('granted')
    } catch (err) {
      setStatus('error')
      setError((err as Error)?.message || 'Error activando las notificaciones.')
    }
  }

  // Surface the exact state instead of hiding silently — this is the admin
  // home, so a small diagnostic note is appropriate and tells us what's wrong.
  if (status === 'unconfigured') {
    return (
      <div className="bg-[#FFFBEB] border border-[#E0C878] rounded-xl p-3 text-xs text-[#8A6D1F]">
        🔔 Notifications can&apos;t start on this device — the server is missing the
        {' '}<strong>NEXT_PUBLIC_VAPID_PUBLIC_KEY</strong> environment variable (Production).
        Once it&apos;s set and the app is redeployed, the Enable button shows up here.
      </div>
    )
  }
  if (status === 'unsupported') {
    return (
      <div className="bg-[#F5F5F3] border border-[#EBEBEB] rounded-xl p-3 text-xs text-[#9B9B9B]">
        🔔 This browser doesn&apos;t support web push. On iPhone you need iOS 16.4+ and the app added to your Home Screen.
      </div>
    )
  }

  if (status === 'granted') {
    return (
      <div className="bg-[#E8F5E9] border border-[#2E7D32]/30 rounded-xl p-3 text-sm text-[#2E7D32] flex items-center gap-2">
        <span>🔔</span> Notificaciones activadas en este dispositivo
      </div>
    )
  }

  if (status === 'ios-install') {
    return (
      <div className="bg-[#FFF8F5] border border-[#C4785A]/30 rounded-xl p-4 text-sm text-[#6B6B6B]">
        <p className="font-medium text-[#1A1A1A] mb-1">🔔 Enable notifications on your iPhone</p>
        <p>Tap the <strong>Share</strong> icon → <strong>Add to Home Screen</strong>, then open VillaCare from your home screen and turn notifications on here.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#EBEBEB] rounded-xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-[#1A1A1A] text-sm">🔔 Turn on notifications</p>
          <p className="text-xs text-[#6B6B6B]">Get alerted on this device for new messages and bookings.</p>
        </div>
        <button
          onClick={enable}
          disabled={status === 'working'}
          className="bg-[#C4785A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#B56A4F] disabled:opacity-50 flex-shrink-0"
        >
          {status === 'working' ? '...' : 'Enable'}
        </button>
      </div>
      {status === 'denied' && (
        <p className="text-xs text-[#C75050] mt-2">Notifications are blocked — enable them in your browser/site settings, then try again.</p>
      )}
      {status === 'error' && <p className="text-xs text-[#C75050] mt-2">{error}</p>}
    </div>
  )
}
