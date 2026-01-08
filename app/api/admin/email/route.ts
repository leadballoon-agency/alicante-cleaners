import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Resend } from 'resend'
import { logAudit } from '@/lib/audit'

const resend = new Resend(process.env.RESEND_API_KEY)

const SUPPORT_EMAIL = 'VillaCare Support <support@alicantecleaners.com>'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { to, toName, subject, message, replyTo } = await request.json()

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, message' },
        { status: 400 }
      )
    }

    // Build HTML email
    const html = `
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

            ${toName ? `<p style="color: #1A1A1A; font-size: 16px; margin-bottom: 16px;">Hi ${toName},</p>` : ''}

            <div style="color: #1A1A1A; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</div>

            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #EBEBEB;">
              <p style="color: #6B6B6B; font-size: 14px; margin: 0;">Best regards,</p>
              <p style="color: #1A1A1A; font-size: 14px; font-weight: 500; margin: 4px 0 0 0;">The VillaCare Team</p>
            </div>

            <p style="color: #9B9B9B; font-size: 12px; text-align: center; margin-top: 24px;">
              <a href="https://alicantecleaners.com" style="color: #C4785A; text-decoration: none;">alicantecleaners.com</a>
            </p>
          </div>
        </body>
      </html>
    `

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: SUPPORT_EMAIL,
      to: [to],
      subject: subject,
      replyTo: replyTo || 'support@alicantecleaners.com',
      html: html,
    })

    if (error) {
      console.error('[EMAIL] Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log to audit
    await logAudit({
      userId: session.user.id,
      action: 'SEND_EMAIL',
      target: to,
      details: {
        subject,
        recipientName: toName,
        replyTo: replyTo || 'support@alicantecleaners.com',
        messageId: data?.id,
      },
    })

    console.log('[EMAIL] Sent to', to, 'messageId:', data?.id)

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (error) {
    console.error('[EMAIL] Error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
