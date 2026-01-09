import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { db } from '@/lib/db'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Store the lead in database
    await db.investorLead.create({
      data: {
        email,
        name,
      },
    })

    // Send email with pitch deck link
    await resend.emails.send({
      from: 'VillaCare <noreply@alicantecleaners.com>',
      to: email,
      subject: 'VillaCare Investor Deck',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1A1A1A; padding: 30px; text-align: center;">
            <img src="https://alicantecleaners.com/icon-512.png" alt="VillaCare" width="60" height="60" style="border-radius: 12px;" />
            <h1 style="color: white; margin-top: 16px; font-size: 24px;">VillaCare</h1>
          </div>

          <div style="padding: 30px; background: white;">
            <h2 style="color: #1A1A1A; margin-bottom: 16px;">Hi ${name},</h2>

            <p style="color: #6B6B6B; line-height: 1.6;">
              Thank you for your interest in VillaCare. We're building the future of villa services in Europe -
              transforming individual cleaners into business owners running full-service villa management teams.
            </p>

            <div style="background: #F5F5F3; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="color: #1A1A1A; margin-bottom: 12px;">📊 The Pitch Deck</h3>
              <p style="color: #6B6B6B; margin-bottom: 16px;">
                Get the full investor presentation with market analysis, business model, and growth projections.
              </p>
              <a href="https://alicantecleaners.com/pitch/deck"
                 style="display: inline-block; background: #1A1A1A; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                View Pitch Deck
              </a>
            </div>

            <p style="color: #6B6B6B; line-height: 1.6;">
              Want to discuss further? Reply to this email or schedule a call with our team.
            </p>

            <p style="color: #6B6B6B; margin-top: 24px;">
              Best regards,<br />
              <strong style="color: #1A1A1A;">Mark Taylor</strong><br />
              <span style="color: #9B9B9B;">Co-founder, VillaCare</span>
            </p>
          </div>

          <div style="background: #F5F5F3; padding: 20px; text-align: center;">
            <p style="color: #9B9B9B; font-size: 12px; margin: 0;">
              VillaCare by Lead Balloon Ltd<br />
              <a href="https://alicantecleaners.com" style="color: #C4785A;">alicantecleaners.com</a>
            </p>
          </div>
        </div>
      `,
    })

    // Also notify admin
    await resend.emails.send({
      from: 'VillaCare <noreply@alicantecleaners.com>',
      to: 'mark@leadballoon.co.uk',
      subject: `New Investor Interest: ${name}`,
      html: `
        <p>New investor lead signed up:</p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Time:</strong> ${new Date().toISOString()}</li>
        </ul>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing pitch signup:', error)
    return NextResponse.json(
      { error: 'Failed to process signup' },
      { status: 500 }
    )
  }
}
