import { Resend } from 'resend'

// Lazy initialize Resend
let resendClient: Resend | null = null
const getResend = () => {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY || 'dummy_key_for_build')
  }
  return resendClient
}

const ADMIN_EMAILS = [
  'mark@leadballoon.co.uk',
  'kerry@leadballoon.co.uk',
]

const EMAIL_FROM = process.env.EMAIL_FROM || 'VillaCare <noreply@alicantecleaners.com>'

/**
 * Send email notification to admins when a new booking is created
 */
export async function notifyAdminNewBooking(details: {
  ownerName: string
  ownerEmail: string
  cleanerName: string
  service: string
  date: string
  time: string
  address: string
  price: string
  bookingId: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    await getResend().emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAILS,
      subject: `New Booking: ${details.service} - ${details.cleanerName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; background-color: #FAFAF8;">
            <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #C4785A, #A66347); border-radius: 12px; line-height: 48px; color: white; font-weight: bold; font-size: 20px;">V</div>
              </div>

              <h1 style="color: #1A1A1A; font-size: 20px; text-align: center; margin-bottom: 24px;">
                New Booking Request
              </h1>

              <div style="background: #F5F5F3; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6B6B6B; font-size: 14px;">Service</td>
                    <td style="padding: 8px 0; color: #1A1A1A; font-size: 14px; text-align: right; font-weight: 500;">${details.service}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B6B6B; font-size: 14px;">Cleaner</td>
                    <td style="padding: 8px 0; color: #1A1A1A; font-size: 14px; text-align: right; font-weight: 500;">${details.cleanerName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B6B6B; font-size: 14px;">Owner</td>
                    <td style="padding: 8px 0; color: #1A1A1A; font-size: 14px; text-align: right; font-weight: 500;">${details.ownerName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B6B6B; font-size: 14px;">Date</td>
                    <td style="padding: 8px 0; color: #1A1A1A; font-size: 14px; text-align: right; font-weight: 500;">${details.date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B6B6B; font-size: 14px;">Time</td>
                    <td style="padding: 8px 0; color: #1A1A1A; font-size: 14px; text-align: right; font-weight: 500;">${details.time}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B6B6B; font-size: 14px;">Address</td>
                    <td style="padding: 8px 0; color: #1A1A1A; font-size: 14px; text-align: right; font-weight: 500;">${details.address}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B6B6B; font-size: 14px;">Price</td>
                    <td style="padding: 8px 0; color: #C4785A; font-size: 16px; text-align: right; font-weight: 600;">${details.price}</td>
                  </tr>
                </table>
              </div>

              <a href="https://alicantecleaners.com/admin" style="display: block; background: #1A1A1A; color: white; text-decoration: none; padding: 14px 24px; border-radius: 12px; text-align: center; font-weight: 500; font-size: 14px;">
                View in Admin Dashboard
              </a>

              <p style="color: #9B9B9B; font-size: 12px; text-align: center; margin-top: 24px;">
                This is an automated notification from VillaCare.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    console.log('[EMAIL] Admin notification sent for booking:', details.bookingId)
    return { success: true }
  } catch (error) {
    console.error('[EMAIL] Failed to send admin notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}
