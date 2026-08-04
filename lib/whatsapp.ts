import Twilio from 'twilio'
import { sendSms } from '@/lib/sms'

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER // e.g., 'whatsapp:+14155238886'

// Kill switch for the WhatsApp channel. When the WhatsApp Business Account is
// disabled by Meta (Twilio errors 63112 / 63002), WhatsApp sends are accepted
// by the API and then fail asynchronously at delivery — a plain try/catch
// can't catch that. Setting WHATSAPP_ENABLED=false routes every notification
// straight to SMS so alerts still land. Flip back to true once the WABA is
// restored. Defaults to enabled.
const whatsappEnabled = (process.env.WHATSAPP_ENABLED ?? 'true').toLowerCase() !== 'false'

/** Whether the WhatsApp channel is currently live (vs. SMS-only fallback). */
export function isWhatsAppEnabled(): boolean {
  return whatsappEnabled
}

const client = accountSid && authToken ? Twilio(accountSid, authToken) : null

type SendResult = {
  success: boolean
  messageId?: string
  error?: string
  channel?: 'whatsapp' | 'sms'
}

/** Thin adapter: send via the canonical lib/sms.ts sender, shaped as a SendResult. */
async function smsFallback(to: string, body: string): Promise<SendResult> {
  const ok = await sendSms(to, body)
  return { success: ok, channel: 'sms', error: ok ? undefined : 'SMS send failed' }
}

/**
 * Send a free-text message to a user, preferring WhatsApp and falling back to
 * SMS. When WHATSAPP_ENABLED=false the WhatsApp attempt is skipped entirely
 * (see note above) and the message goes straight to SMS.
 */
export async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<SendResult> {
  if (!client || !whatsappNumber) {
    console.error('Twilio not configured - missing credentials')
    // Even without WhatsApp config we may still be able to SMS.
    return smsFallback(to, body)
  }

  // WhatsApp channel is switched off (WABA down) — go straight to SMS.
  if (!whatsappEnabled) {
    return smsFallback(to, body)
  }

  try {
    // Format phone number for WhatsApp (must include country code)
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`

    const message = await client.messages.create({
      body,
      from: whatsappNumber,
      to: formattedTo,
    })

    console.log(`WhatsApp message sent: ${message.sid}`)
    return { success: true, messageId: message.sid, channel: 'whatsapp' }
  } catch (error) {
    // Hard failure at create time (e.g. sender rejected synchronously) — try SMS.
    console.error('WhatsApp send failed, falling back to SMS:', error)
    return smsFallback(to, body)
  }
}

/**
 * Send OTP code via WhatsApp using approved template
 */
export async function sendOTP(
  phone: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  if (!client || !whatsappNumber) {
    console.error('Twilio not configured - missing credentials')
    return { success: false, error: 'WhatsApp not configured' }
  }

  try {
    const formattedTo = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`

    // Use approved content template for OTP
    const message = await client.messages.create({
      from: whatsappNumber,
      to: formattedTo,
      contentSid: 'HX1bf4d7bc921048c623fa47605c777ce1',
      contentVariables: JSON.stringify({
        '1': code,
      }),
    })

    console.log(`WhatsApp OTP sent: ${message.sid}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to send WhatsApp OTP:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send booking confirmation via WhatsApp
 */
export async function sendBookingConfirmation(
  phone: string,
  details: {
    cleanerName: string
    date: string
    time: string
    address: string
    service: string
    price: string
  }
): Promise<{ success: boolean; error?: string }> {
  const message = `*Booking Confirmed!* ✅

Your cleaning has been scheduled:

*Cleaner:* ${details.cleanerName}
*Date:* ${details.date}
*Time:* ${details.time}
*Service:* ${details.service}
*Price:* ${details.price}

*Address:*
${details.address}

Questions? Reply to this message.

- VillaCare`

  return sendWhatsAppMessage(phone, message)
}

/**
 * Send booking reminder via WhatsApp (24 hours before)
 */
export async function sendBookingReminder(
  phone: string,
  details: {
    cleanerName: string
    date: string
    time: string
    address: string
  }
): Promise<{ success: boolean; error?: string }> {
  const message = `*Reminder: Cleaning Tomorrow* 🏠

*Cleaner:* ${details.cleanerName}
*Date:* ${details.date}
*Time:* ${details.time}

*Address:*
${details.address}

See you tomorrow!
- VillaCare`

  return sendWhatsAppMessage(phone, message)
}

/**
 * Send message to cleaner about new booking using approved template
 */
export async function notifyCleanerNewBooking(
  phone: string,
  details: {
    ownerName: string
    date: string
    time: string
    address: string
    service: string
    price: string
    shortCode?: string // Reference code for WhatsApp commands
  }
): Promise<SendResult> {
  // Include shortCode in service field for easy reference
  const serviceWithCode = details.shortCode
    ? `${details.service} - ${details.price} (#${details.shortCode})`
    : `${details.service} - ${details.price}`

  // Plain-text version used for the SMS fallback (WhatsApp templates can't be
  // sent over SMS, so we reproduce the same content as free text).
  const smsBody = `New booking${details.shortCode ? ` #${details.shortCode}` : ''} - VillaCare
Owner: ${details.ownerName}
Date: ${details.date} at ${details.time}
Service: ${serviceWithCode}
Address: ${details.address}
Reply ACCEPT ${details.shortCode || ''} or DECLINE ${details.shortCode || ''}, or open your dashboard.`.trim()

  // WhatsApp channel is switched off (WABA down) — go straight to SMS.
  if (!client || !whatsappNumber || !whatsappEnabled) {
    if (!client) {
      console.error('Twilio not configured - missing credentials')
      return { success: false, error: 'Twilio not configured' }
    }
    return smsFallback(phone, smsBody)
  }

  try {
    const formattedTo = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`

    // Use approved content template for new booking
    const message = await client.messages.create({
      from: whatsappNumber,
      to: formattedTo,
      contentSid: 'HX471e05200d0c4dfd136550601d4dd703',
      contentVariables: JSON.stringify({
        '1': details.ownerName,
        '2': details.date,
        '3': details.time,
        '4': serviceWithCode,
        '5': details.address,
      }),
    })

    console.log(`WhatsApp new booking notification sent: ${message.sid}`)
    return { success: true, channel: 'whatsapp' }
  } catch (error) {
    // Hard failure at create time — fall back to SMS so the cleaner still hears.
    console.error('WhatsApp booking notification failed, falling back to SMS:', error)
    return smsFallback(phone, smsBody)
  }
}

/**
 * Send message when booking is completed
 */
export async function sendBookingCompleted(
  phone: string,
  details: {
    cleanerName: string
    reviewLink: string
  }
): Promise<{ success: boolean; error?: string }> {
  const message = `*Cleaning Complete!* ✨

${details.cleanerName} has finished cleaning your villa.

We'd love to hear how it went! Leave a review:
${details.reviewLink}

Thank you for using VillaCare!`

  return sendWhatsAppMessage(phone, message)
}
