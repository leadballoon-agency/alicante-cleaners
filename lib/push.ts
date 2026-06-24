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

/** Send a push to a specific user's subscribed devices. Best-effort. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  try {
    const subs = await db.pushSubscription.findMany({ where: { userId } })
    await sendToSubscriptions(subs, payload)
  } catch (err) {
    console.error('sendPushToUser failed:', err)
  }
}

/**
 * Send a push to all subscribed devices. Subscriptions are only ever created
 * via the staff-gated /api/push/subscribe endpoint, so this effectively means
 * "all staff (admins + managers)". Best-effort — never throws.
 */
export async function sendPushToStaff(payload: PushPayload): Promise<void> {
  try {
    const subs = await db.pushSubscription.findMany()
    await sendToSubscriptions(subs, payload)
  } catch (err) {
    console.error('sendPushToStaff failed:', err)
  }
}
