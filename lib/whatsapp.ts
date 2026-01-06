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
      contentSid: 'HXdfb10f6cd1fe20796fb566a4c75d40f4',
      contentVariables: JSON.stringify({
        '1': code,
      }),
    })

    console.log(`WhatsApp OTP sent: ${message.sid}`)
    return { success: true, messageId: message.sid }
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
  }
): Promise<{ success: boolean; error?: string }> {
  if (!client || !whatsappNumber) {
    console.error('Twilio not configured - missing credentials')
    return { success: false, error: 'WhatsApp not configured' }
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
        '4': `${details.service} - ${details.price}`,
        '5': details.address,
      }),
    })

    console.log(`WhatsApp new booking notification sent: ${message.sid}`)
    return { success: true, messageId: message.sid }
  } catch (error) {
    console.error('Failed to send WhatsApp booking notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
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
