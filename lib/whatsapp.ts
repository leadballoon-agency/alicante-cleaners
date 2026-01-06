import Twilio from 'twilio'

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER // e.g., 'whatsapp:+14155238886'

const client = accountSid && authToken ? Twilio(accountSid, authToken) : null

/**
 * Send a WhatsApp message via Twilio
 */
export async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!client || !whatsappNumber) {
    console.error('Twilio not configured - missing credentials')
    return { success: false, error: 'WhatsApp not configured' }
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
    return { success: true, messageId: message.sid }
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send OTP code via WhatsApp
 */
export async function sendOTP(
  phone: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const message = `Your VillaCare verification code is: *${code}*\n\nThis code expires in 10 minutes. Do not share it with anyone.`

  return sendWhatsAppMessage(phone, message)
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
 * Send message to cleaner about new booking
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
  }
): Promise<{ success: boolean; error?: string }> {
  const message = `*New Booking Request!* 🎉

*Client:* ${details.ownerName}
*Date:* ${details.date}
*Time:* ${details.time}
*Service:* ${details.service}
*Price:* ${details.price}

*Address:*
${details.address}

Reply ACCEPT or DECLINE`

  return sendWhatsAppMessage(phone, message)
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
