import Twilio from 'twilio'

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

// Explicit flag for dev OTP bypass (prevents accidental production leaks)
const allowDevBypass = process.env.ALLOW_DEV_OTP_BYPASS === 'true' && process.env.NODE_ENV === 'development'

const client = accountSid && authToken ? Twilio(accountSid, authToken) : null

/**
 * Send OTP code via Twilio Verify service
 * Defaults to SMS (works immediately, no WhatsApp template approvals needed)
 */
export async function sendVerificationCode(
  phone: string,
  channel: 'sms' | 'whatsapp' = 'sms'
): Promise<{ success: boolean; channel: string; error?: string }> {
  // Development bypass - requires explicit ALLOW_DEV_OTP_BYPASS=true
  if (allowDevBypass && !client) {
    console.log(`[DEV BYPASS] Would send OTP to ${phone} via ${channel} (use code 000000)`)
    return { success: true, channel: 'dev-bypass' }
  }

  if (!client || !verifyServiceSid) {
    console.error('Twilio Verify not configured - missing credentials or service SID')
    return { success: false, channel, error: 'OTP service not configured' }
  }

  try {
    // Ensure phone is in E.164 format
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`

    await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: formattedPhone,
        channel,
      })

    console.log(`OTP sent to ${formattedPhone} via ${channel}`)
    return { success: true, channel }
  } catch (error) {
    console.error(`Failed to send OTP via ${channel}:`, error)
    return {
      success: false,
      channel,
      error: error instanceof Error ? error.message : 'Failed to send verification code',
    }
  }
}

/**
 * Send OTP with automatic fallback (SMS first, WhatsApp fallback)
 * SMS is default because it works immediately without WhatsApp template approvals
 * WhatsApp can be tried if SMS fails (rare)
 */
export async function sendVerificationCodeWithFallback(
  phone: string
): Promise<{ success: boolean; channel: string; error?: string }> {
  // Try SMS first (works immediately, no approvals needed)
  const smsResult = await sendVerificationCode(phone, 'sms')

  if (smsResult.success) {
    return smsResult
  }

  // Check if error is delivery-related (not configuration error)
  // Twilio error 68008 = WhatsApp channel not configured
  const isDeliveryError = smsResult.error?.includes('delivery') ||
    smsResult.error?.includes('undeliverable') ||
    smsResult.error?.includes('not a valid') ||
    smsResult.error?.includes('unreachable')

  // Only fallback to WhatsApp for delivery errors, not config errors
  if (isDeliveryError) {
    console.log(`SMS delivery failed, trying WhatsApp for ${phone}`)
    return sendVerificationCode(phone, 'whatsapp')
  }

  return smsResult
}

/**
 * Verify OTP code via Twilio Verify service
 */
export async function verifyCode(
  phone: string,
  code: string
): Promise<{ success: boolean; valid: boolean; error?: string }> {
  // Development bypass - requires explicit ALLOW_DEV_OTP_BYPASS=true
  if (allowDevBypass) {
    if (code === '000000') {
      console.log(`[DEV BYPASS] Test code accepted for ${phone}`)
      return { success: true, valid: true }
    }
    // If Twilio is not configured with bypass enabled, reject other codes
    if (!client || !verifyServiceSid) {
      return { success: true, valid: false, error: 'Invalid code. Use 000000 with ALLOW_DEV_OTP_BYPASS=true.' }
    }
  }

  if (!client || !verifyServiceSid) {
    console.error('Twilio Verify not configured - missing credentials or service SID')
    return { success: false, valid: false, error: 'OTP service not configured' }
  }

  try {
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`

    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: formattedPhone,
        code,
      })

    const isValid = verification.status === 'approved'

    if (!isValid) {
      console.log(`OTP verification failed for ${formattedPhone}: ${verification.status}`)
    }

    return { success: true, valid: isValid }
  } catch (error) {
    // Twilio throws specific errors for invalid codes
    if (error instanceof Error && error.message.includes('not found')) {
      return { success: true, valid: false, error: 'Code expired or not found. Please request a new one.' }
    }
    if (error instanceof Error && error.message.includes('max check attempts')) {
      return { success: true, valid: false, error: 'Too many attempts. Please request a new code.' }
    }

    console.error('OTP verification error:', error)
    return {
      success: false,
      valid: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    }
  }
}

/**
 * Normalize phone number to E.164 format
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')

  // Handle Spanish numbers (starting with 6 or 7, or +34)
  if (cleaned.startsWith('34')) {
    cleaned = '+' + cleaned
  } else if (cleaned.match(/^[67]\d{8}$/)) {
    cleaned = '+34' + cleaned
  }

  // Handle UK numbers (starting with 07 or +44)
  if (cleaned.startsWith('07') && cleaned.length === 11) {
    cleaned = '+44' + cleaned.slice(1)
  } else if (cleaned.startsWith('44')) {
    cleaned = '+' + cleaned
  }

  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned
  }

  return cleaned
}
