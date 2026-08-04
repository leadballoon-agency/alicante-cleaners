import Twilio from 'twilio'

// Canonical plain-SMS sender for the whole platform (distinct from the
// WhatsApp-templated sends, which layer on top of this via lib/whatsapp.ts).
// The "from" number must be SMS-capable and bare E.164 (no `whatsapp:`
// prefix). Resolution order, most-specific first:
//   1. TWILIO_SMS_FROM       - explicit dedicated SMS number
//   2. TWILIO_SMS_NUMBER     - legacy alias for the same thing
//   3. TWILIO_WHATSAPP_NUMBER - our UK numbers are all SMS-capable, so the
//      WhatsApp sender (minus its `whatsapp:` prefix) is a safe zero-config
//      default. This is why SMS works today with no extra env var set.
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const smsFrom =
  process.env.TWILIO_SMS_FROM ||
  process.env.TWILIO_SMS_NUMBER ||
  process.env.TWILIO_WHATSAPP_NUMBER?.replace(/^whatsapp:/, '')

const client = accountSid && authToken ? Twilio(accountSid, authToken) : null

const E164_RE = /^\+\d{8,15}$/

/**
 * Send a plain SMS via Twilio. Used directly for push-less cleaner fallbacks
 * and as the fallback channel behind lib/whatsapp.ts when WhatsApp is off.
 * Never throws - always safe to fire from a runSideEffects() entry.
 */
export async function sendSms(to: string, body: string): Promise<boolean> {
  if (!smsFrom) {
    console.warn('sendSms: no SMS "from" number resolved (set TWILIO_SMS_FROM or TWILIO_WHATSAPP_NUMBER) - skipping SMS send')
    return false
  }
  if (!client) {
    console.error('sendSms: Twilio not configured - missing credentials')
    return false
  }
  // Accept `whatsapp:`-prefixed numbers defensively (some callers pass the
  // WhatsApp-form `to`); SMS needs the bare E.164 number.
  const dest = to.replace(/^whatsapp:/, '')
  if (!E164_RE.test(dest)) {
    console.error(`sendSms: phone number does not match E.164 format, skipping: ${dest}`)
    return false
  }

  try {
    const message = await client.messages.create({ body, from: smsFrom, to: dest })
    console.log(`SMS sent: ${message.sid}`)
    return true
  } catch (error) {
    console.error('Failed to send SMS:', error)
    return false
  }
}
