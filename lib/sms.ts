import Twilio from 'twilio'

// Plain SMS fallback (distinct from lib/whatsapp.ts's WhatsApp-templated
// sends). Needs its own Twilio-capable "from" number - the WhatsApp number
// in TWILIO_WHATSAPP_NUMBER is prefixed `whatsapp:` and can't send SMS.
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const smsFrom = process.env.TWILIO_SMS_FROM

const client = accountSid && authToken ? Twilio(accountSid, authToken) : null

const E164_RE = /^\+\d{8,15}$/

/**
 * Send a plain SMS via Twilio. Fallback channel for cleaners who have no
 * push subscription (WhatsApp Business API is dead, push adoption is ~5
 * users platform-wide). Never throws - always safe to fire from a
 * runSideEffects() entry.
 */
export async function sendSms(to: string, body: string): Promise<boolean> {
  if (!smsFrom) {
    console.warn('sendSms: TWILIO_SMS_FROM not set - skipping SMS send')
    return false
  }
  if (!client) {
    console.error('sendSms: Twilio not configured - missing credentials')
    return false
  }
  if (!E164_RE.test(to)) {
    console.error(`sendSms: phone number does not match E.164 format, skipping: ${to}`)
    return false
  }

  try {
    const message = await client.messages.create({ body, from: smsFrom, to })
    console.log(`SMS sent: ${message.sid}`)
    return true
  } catch (error) {
    console.error('Failed to send SMS:', error)
    return false
  }
}
