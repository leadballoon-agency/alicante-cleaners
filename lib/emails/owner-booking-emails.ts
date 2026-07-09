/**
 * Owner Booking Lifecycle Emails
 *
 * Twilio WhatsApp (lib/whatsapp.ts) is the primary channel for owner booking
 * notifications, but the WABA is currently offline, so owners hear nothing
 * after booking. These functions add email (via Resend) as a reliable,
 * ADDITIONAL channel for the same lifecycle events — they are called
 * alongside the existing WhatsApp sends, never instead of them.
 *
 * Covers: booking received, booking confirmed, booking declined
 * (manual or auto-declined after 6h), and job completed + review request.
 */

import { getResend, EMAIL_FROM } from '@/lib/email'
import { translateText, SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/translate'
import { buildGoogleCalendarLink } from '@/lib/dates'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://alicantecleaners.com'

function resolveLang(preferredLanguage?: string | null): LanguageCode {
  const lang = (preferredLanguage || 'en') as LanguageCode
  return lang in SUPPORTED_LANGUAGES ? lang : 'en'
}

// Translate a short piece of English prose into the owner's preferred
// language. Never throws — falls back to the original English text on any
// translation error so a translation hiccup can never block the email send.
async function localize(text: string, lang: LanguageCode): Promise<string> {
  if (lang === 'en') return text
  try {
    return await translateText(text, 'en', lang)
  } catch (error) {
    console.error('[OwnerBookingEmail] Translation failed, sending English fallback:', error)
    return text
  }
}

// Shared visual shell — matches the card style already used in lib/email.ts
// (notifyAdminNewBooking / notifyAdminNewMessage): warm white page background,
// white rounded card, terracotta "V" wordmark tile, ink headline text.
function renderShell(headline: string, bodyHtml: string, ctaHtml: string, footnote: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; background-color: #FAFAF8; margin: 0;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #C4785A, #A66347); border-radius: 12px; line-height: 48px; color: white; font-weight: bold; font-size: 20px;">V</div>
          </div>

          <h1 style="color: #1A1A1A; font-size: 20px; text-align: center; margin: 0 0 20px 0;">
            ${headline}
          </h1>

          ${bodyHtml}

          ${ctaHtml}

          <p style="color: #9B9B9B; font-size: 12px; text-align: center; margin-top: 24px;">
            ${footnote}
          </p>
        </div>
      </body>
    </html>
  `
}

function detailsTable(rows: Array<[string, string, boolean?]>): string {
  const cells = rows
    .map(
      ([label, value, highlight]) => `
        <tr>
          <td style="padding: 6px 0; color: #6B6B6B; font-size: 14px;">${label}</td>
          <td style="padding: 6px 0; color: ${highlight ? '#C4785A' : '#1A1A1A'}; font-size: ${highlight ? '16px' : '14px'}; text-align: right; font-weight: ${highlight ? '600' : '500'};">${value}</td>
        </tr>`
    )
    .join('')

  return `
    <div style="background: #F5F5F3; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        ${cells}
      </table>
    </div>
  `
}

function ctaButton(href: string, label: string, color: string = '#1A1A1A'): string {
  return `
    <a href="${href}" style="display: block; background: ${color}; color: white; text-decoration: none; padding: 14px 24px; border-radius: 12px; text-align: center; font-weight: 600; font-size: 14px; margin-bottom: 8px;">
      ${label}
    </a>
  `
}

const FOOTNOTE_EN = 'This is an automated notification from VillaCare.'
const FOOTNOTE_TEXT: Record<LanguageCode, string> = {
  en: FOOTNOTE_EN,
  es: 'Esta es una notificación automática de VillaCare.',
  de: 'Dies ist eine automatische Benachrichtigung von VillaCare.',
  fr: 'Ceci est une notification automatique de VillaCare.',
  nl: 'Dit is een automatisch bericht van VillaCare.',
  pt: 'Esta é uma notificação automática da VillaCare.',
  it: 'Questa è una notifica automatica di VillaCare.',
}

/**
 * Booking received — sent immediately when an owner submits a booking
 * request, before the cleaner has responded.
 */
export async function sendOwnerBookingReceivedEmail(details: {
  to: string
  ownerName: string
  cleanerName: string
  service: string
  date: string
  time: string
  address: string
  price: string
  preferredLanguage?: string | null
}): Promise<void> {
  try {
    const lang = resolveLang(details.preferredLanguage)

    const subjectEn = `Your booking request is with ${details.cleanerName}`
    const introEn = `Hi ${details.ownerName}, your booking request has been sent to ${details.cleanerName}. We'll email you the moment they confirm — cleaners usually respond within a few hours.`

    const [subject, intro] = await Promise.all([
      localize(subjectEn, lang),
      localize(introEn, lang),
    ])

    const body = `
      <p style="color: #1A1A1A; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
        ${intro}
      </p>
      ${detailsTable([
        ['Service', details.service],
        ['Date', details.date],
        ['Time', details.time],
        ['Address', details.address],
        ['Price', details.price, true],
      ])}
    `

    await getResend().emails.send({
      from: EMAIL_FROM,
      to: details.to,
      subject,
      html: renderShell(subject, body, '', FOOTNOTE_TEXT[lang]),
    })

    console.log('[EMAIL] Owner booking-received email sent to:', details.to)
  } catch (error) {
    console.error('[EMAIL] Failed to send owner booking-received email:', error)
  }
}

/**
 * Booking confirmed — sent when the cleaner accepts the booking (whether via
 * the dashboard or by replying ACCEPT on WhatsApp). This is the moment a
 * booking is actually worth putting on a calendar (a PENDING request might
 * still be declined), so this is the one email that includes an "Add to
 * calendar" link — never the booking-received email.
 */
export async function sendOwnerBookingConfirmedEmail(details: {
  to: string
  ownerName: string
  cleanerName: string
  service: string
  date: string
  time: string
  address: string
  preferredLanguage?: string | null
  /** Canonical UTC instant of the booking (Booking.date) + duration, used to build the calendar link. */
  startAt: Date
  hours: number
}): Promise<void> {
  try {
    const lang = resolveLang(details.preferredLanguage)

    const subjectEn = `✅ ${details.cleanerName} confirmed your booking`
    const introEn = `Good news, ${details.ownerName}! ${details.cleanerName} has confirmed your booking.`

    const [subject, intro, addToCalendarLabel] = await Promise.all([
      localize(subjectEn, lang),
      localize(introEn, lang),
      localize('Add to Calendar', lang),
    ])

    const body = `
      <p style="color: #1A1A1A; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
        ${intro}
      </p>
      ${detailsTable([
        ['Service', details.service],
        ['Date', details.date],
        ['Time', details.time],
        ['Address', details.address],
      ])}
    `

    const calendarUrl = buildGoogleCalendarLink({
      start: details.startAt,
      hours: details.hours,
      title: `${details.service} - ${details.cleanerName}`,
      details: `Cleaning by ${details.cleanerName}\n${details.address}`,
      location: details.address,
    })

    await getResend().emails.send({
      from: EMAIL_FROM,
      to: details.to,
      subject,
      html: renderShell(subject, body, ctaButton(calendarUrl, `📅 ${addToCalendarLabel}`, '#C4785A'), FOOTNOTE_TEXT[lang]),
    })

    console.log('[EMAIL] Owner booking-confirmed email sent to:', details.to)
  } catch (error) {
    console.error('[EMAIL] Failed to send owner booking-confirmed email:', error)
  }
}

/**
 * Booking declined — either the cleaner manually declined, or the booking
 * was auto-declined after 6 hours of no response. Same template, tone
 * adjusted slightly by `reason`.
 */
export async function sendOwnerBookingDeclinedEmail(details: {
  to: string
  ownerName: string
  cleanerName: string
  date?: string
  reason?: 'declined' | 'auto_declined'
  preferredLanguage?: string | null
}): Promise<void> {
  try {
    const lang = resolveLang(details.preferredLanguage)
    const isAutoDeclined = details.reason === 'auto_declined'

    const subjectEn = isAutoDeclined
      ? `We couldn't confirm your booking with ${details.cleanerName}`
      : `${details.cleanerName} isn't available for your booking`

    const introEn = isAutoDeclined
      ? `Hi ${details.ownerName}, unfortunately ${details.cleanerName} didn't respond in time to confirm your booking${details.date ? ` for ${details.date}` : ''}, so we've released the slot. We're sorry for the inconvenience.`
      : `Hi ${details.ownerName}, unfortunately ${details.cleanerName} isn't able to take your booking${details.date ? ` for ${details.date}` : ''}.`

    const ctaEn = 'Browse other trusted cleaners in your area and pick a new time that works for you.'

    const [subject, intro, ctaText] = await Promise.all([
      localize(subjectEn, lang),
      localize(introEn, lang),
      localize(ctaEn, lang),
    ])

    const buttonLabelEn = 'Find Another Cleaner'
    const buttonLabel = await localize(buttonLabelEn, lang)

    const body = `
      <p style="color: #1A1A1A; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
        ${intro}
      </p>
      <p style="color: #6B6B6B; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
        ${ctaText}
      </p>
    `

    await getResend().emails.send({
      from: EMAIL_FROM,
      to: details.to,
      subject,
      html: renderShell(subject, body, ctaButton(`${APP_URL}/`, buttonLabel, '#C4785A'), FOOTNOTE_TEXT[lang]),
    })

    console.log('[EMAIL] Owner booking-declined email sent to:', details.to, '(reason:', details.reason || 'declined', ')')
  } catch (error) {
    console.error('[EMAIL] Failed to send owner booking-declined email:', error)
  }
}

/**
 * Job completed + review request — sent when a confirmed booking transitions
 * to COMPLETED. `reviewLink` should be the exact same URL used in the
 * WhatsApp completion message (see sendBookingCompleted in lib/whatsapp.ts).
 */
export async function sendOwnerBookingCompletedEmail(details: {
  to: string
  ownerName: string
  cleanerName: string
  reviewLink: string
  preferredLanguage?: string | null
}): Promise<void> {
  try {
    const lang = resolveLang(details.preferredLanguage)

    const subjectEn = `✨ ${details.cleanerName} has completed your clean`
    const introEn = `Hi ${details.ownerName}, ${details.cleanerName} has just finished cleaning your villa. Everything is sparkling and ready for you.`
    const reviewPromptEn = "We'd love to hear how it went — your feedback helps us maintain our high standards."
    const buttonLabelEn = 'Leave a Review'

    const [subject, intro, reviewPrompt, buttonLabel] = await Promise.all([
      localize(subjectEn, lang),
      localize(introEn, lang),
      localize(reviewPromptEn, lang),
      localize(buttonLabelEn, lang),
    ])

    const body = `
      <p style="color: #1A1A1A; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
        ${intro}
      </p>
      <div style="background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <p style="margin: 0 0 16px 0; color: #1A1A1A; font-size: 14px;">
          ${reviewPrompt}
        </p>
      </div>
    `

    await getResend().emails.send({
      from: EMAIL_FROM,
      to: details.to,
      subject,
      html: renderShell(subject, body, ctaButton(details.reviewLink, `⭐ ${buttonLabel}`, '#1A1A1A'), FOOTNOTE_TEXT[lang]),
    })

    console.log('[EMAIL] Owner booking-completed email sent to:', details.to)
  } catch (error) {
    console.error('[EMAIL] Failed to send owner booking-completed email:', error)
  }
}
