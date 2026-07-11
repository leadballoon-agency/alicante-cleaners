import webpush from 'web-push'
import { db } from '@/lib/db'

let configured = false

function ensureConfigured(): boolean {
  if (configured) return true
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails('mailto:hello@alicantecleaners.com', publicKey, privateKey)
  configured = true
  return true
}

export type PushPayload = { title: string; body: string; url?: string; tag?: string }

type SubRow = { id: string; endpoint: string; p256dh: string; auth: string }

async function sendToSubscriptions(subs: SubRow[], payload: PushPayload): Promise<void> {
  if (!ensureConfigured() || subs.length === 0) return
  const data = JSON.stringify(payload)
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data
        )
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode
        // 404/410 = subscription is gone (expired / unsubscribed) → prune it
        if (statusCode === 404 || statusCode === 410) {
          await db.pushSubscription.delete({ where: { id: s.id } }).catch(() => {})
        } else {
          console.error('Push send error:', statusCode, (err as Error)?.message)
        }
      }
    })
  )
}

/** Send a push to a specific user's subscribed devices. Best-effort. This is
 * how cleaners are targeted — a device is tied to a userId regardless of
 * audience, so a staff member who is also a cleaner (e.g. Ernesto) correctly
 * receives both staff broadcasts and their own cleaner pushes on one device. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  try {
    const subs = await db.pushSubscription.findMany({ where: { userId } })
    await sendToSubscriptions(subs, payload)
  } catch (err) {
    console.error('sendPushToUser failed:', err)
  }
}

/**
 * Send a push to all STAFF-audience subscribed devices (admins + managers).
 * Cleaners can now also hold subscriptions (audience: CLEANER), so this
 * filters explicitly rather than relying on "subscribe is staff-gated" —
 * without the filter every staff broadcast here would spam cleaner devices
 * too. Best-effort — never throws.
 */
export async function sendPushToStaff(payload: PushPayload): Promise<void> {
  try {
    const subs = await db.pushSubscription.findMany({ where: { audience: 'STAFF' } })
    await sendToSubscriptions(subs, payload)
  } catch (err) {
    console.error('sendPushToStaff failed:', err)
  }
}

/**
 * Cleaner-facing push copy: ES by default (cleaners' WhatsApp/notification
 * defaults are ES), EN only if the cleaner's preferredLanguage is 'en'.
 * Deliberately NOT routed through lib/translate.ts (OpenAI) — this is a
 * handful of short, fixed strings per call site, not free-form translation.
 */
type CleanerPushKey = 'newBooking' | 'bookingCancelled' | 'approved' | 'newMessage' | 'bookingOverdue'

const CLEANER_PUSH_COPY: Record<CleanerPushKey, { es: (arg?: string) => PushPayload; en: (arg?: string) => PushPayload }> = {
  newBooking: {
    es: (summary) => ({ title: 'Nueva reserva 📅', body: summary || 'Tienes una nueva reserva.', url: '/dashboard?tab=bookings' }),
    en: (summary) => ({ title: 'New booking 📅', body: summary || 'You have a new booking.', url: '/dashboard?tab=bookings' }),
  },
  bookingCancelled: {
    es: (summary) => ({ title: 'Reserva cancelada', body: summary || 'Una reserva ha sido cancelada.', url: '/dashboard?tab=bookings' }),
    en: (summary) => ({ title: 'Booking cancelled', body: summary || 'A booking has been cancelled.', url: '/dashboard?tab=bookings' }),
  },
  approved: {
    es: () => ({ title: '¡Cuenta aprobada! 🎉', body: 'Ya puedes recibir reservas', url: '/dashboard' }),
    en: () => ({ title: 'Account approved! 🎉', body: "You're now able to receive bookings", url: '/dashboard' }),
  },
  newMessage: {
    es: (senderName) => ({ title: 'Nuevo mensaje 💬', body: senderName ? `${senderName} te ha escrito` : 'Tienes un nuevo mensaje', url: '/dashboard?tab=messages' }),
    en: (senderName) => ({ title: 'New message 💬', body: senderName ? `${senderName} sent you a message` : 'You have a new message', url: '/dashboard?tab=messages' }),
  },
  bookingOverdue: {
    es: () => ({ title: 'Tienes una reserva esperando respuesta ⏰', body: 'Responde antes de que se cancele automáticamente.', url: '/dashboard?tab=bookings' }),
    en: () => ({ title: 'You have a booking waiting for a response ⏰', body: 'Respond before it gets auto-declined.', url: '/dashboard?tab=bookings' }),
  },
}

export function cleanerPushText(key: CleanerPushKey, preferredLanguage: string | null | undefined, arg?: string): PushPayload {
  const lang = preferredLanguage === 'en' ? 'en' : 'es'
  return CLEANER_PUSH_COPY[key][lang](arg)
}
