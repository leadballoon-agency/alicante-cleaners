/**
 * WhatsApp sending via the Meta Cloud API (Graph API).
 *
 * Replaces the dead Twilio WhatsApp path (lib/whatsapp.ts, WABA disabled) for
 * business-initiated and in-session messages. Designed for WhatsApp
 * Coexistence: this module sends automated messages (booking alerts,
 * reminders, etc.) on the SAME number Ernesto runs day-to-day in the WhatsApp
 * Business App. Platform sends here; Ernesto's manual replies happen in the app.
 *
 * SAFE TO MERGE BEFORE THE WABA IS LIVE: inert until configured. If the env
 * vars are missing, every send returns { success: false, skipped: true } and
 * logs a warning — same pattern as the web-push rollout. Nothing calls it yet,
 * so it can't affect the running app.
 *
 * Does NOT touch login OTP — that stays on Twilio Verify SMS (confirmed
 * SMS-only). This module is only for outbound WhatsApp notifications/messaging.
 *
 * Required env (filled in after WABA setup + coexistence onboarding):
 *   WHATSAPP_PHONE_NUMBER_ID  — Meta's numeric ID for the registered number
 *   WHATSAPP_ACCESS_TOKEN     — permanent system-user access token
 * Optional:
 *   WHATSAPP_API_VERSION      — Graph API version (default 'v21.0')
 *
 * Templates to (re)create + get approved in the WABA, replacing the old Twilio
 * content SIDs:
 *   - booking_alert   (was HX471e05200d0c4dfd136550601d4dd703) — notify cleaner of a new booking
 *   - otp             (was HX1bf4d7bc921048c623fa47605c777ce1) — only if WhatsApp OTP is ever wanted; login is SMS today
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
 */

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0'

export type WhatsAppSendResult = {
  success: boolean
  messageId?: string
  error?: string
  /** true when the send was skipped because the integration isn't configured */
  skipped?: boolean
}

/** Whether the Meta Cloud API credentials are present. */
export function isMetaWhatsAppConfigured(): boolean {
  return Boolean(PHONE_NUMBER_ID && ACCESS_TOKEN)
}

/** Meta wants the recipient as digits only — E.164 without the leading '+'. */
function normalizeRecipient(phone: string): string {
  return phone.replace(/^whatsapp:/i, '').replace(/\D/g, '')
}

/** Low-level POST to the Cloud API messages endpoint. */
async function postMessage(payload: Record<string, unknown>): Promise<WhatsAppSendResult> {
  if (!isMetaWhatsAppConfigured()) {
    console.warn(
      '[wa-meta] not configured — skipping send. Set WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_ACCESS_TOKEN.'
    )
    return { success: false, skipped: true, error: 'WhatsApp (Meta) not configured' }
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
      }
    )

    const data = await res.json().catch(() => ({} as Record<string, unknown>))

    if (!res.ok) {
      const error = (data as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`
      console.error('[wa-meta] send failed:', error, JSON.stringify((data as { error?: unknown })?.error ?? {}))
      return { success: false, error }
    }

    const messageId = (data as { messages?: { id?: string }[] })?.messages?.[0]?.id
    console.log('[wa-meta] sent:', messageId)
    return { success: true, messageId }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    console.error('[wa-meta] send error:', error)
    return { success: false, error }
  }
}

/**
 * Free-form text message. ONLY deliverable inside the 24-hour customer-service
 * window (the recipient messaged us within the last 24h). Outside that window,
 * business-initiated messages must use sendTemplate().
 */
export async function sendText(
  to: string,
  body: string,
  opts?: { previewUrl?: boolean }
): Promise<WhatsAppSendResult> {
  return postMessage({
    to: normalizeRecipient(to),
    type: 'text',
    text: { preview_url: opts?.previewUrl ?? false, body },
  })
}

/**
 * Pre-approved template message — required for business-initiated messages
 * outside the 24-hour window (booking alerts, reminders, etc.).
 *
 * @param to            recipient phone (any format; normalized here)
 * @param templateName  the template's name exactly as approved in the WABA
 * @param languageCode  e.g. 'es', 'en', 'en_GB'
 * @param bodyParams    ordered values for the {{1}}, {{2}}… body placeholders;
 *                      omit for templates with no variables
 * @param extraComponents optional raw components (header media, buttons) for
 *                      advanced templates; appended after the body component
 */
export async function sendTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  bodyParams: string[] = [],
  extraComponents: Record<string, unknown>[] = []
): Promise<WhatsAppSendResult> {
  const components: Record<string, unknown>[] = []
  if (bodyParams.length > 0) {
    components.push({
      type: 'body',
      parameters: bodyParams.map((text) => ({ type: 'text', text })),
    })
  }
  components.push(...extraComponents)

  return postMessage({
    to: normalizeRecipient(to),
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components.length > 0 ? { components } : {}),
    },
  })
}
