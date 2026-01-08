import { Resend } from 'resend'
import { db } from '@/lib/db'
import { NurturingEmailType, Owner, User, Property, Booking, PublicChatConversation } from '@prisma/client'
import { generateNurturingEmail, getCTAUrl, getCTAText, OwnerContext } from './email-generator'
import { parseNameFromEmail } from './name-extraction'
import { logAudit } from '@/lib/audit'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'VillaCare <hello@alicantecleaners.com>'

type OwnerWithRelations = Owner & {
  user: User
  properties?: Property[]
  bookings?: Booking[]
  publicChatConversations?: PublicChatConversation[]
}

/**
 * Send a nurturing email to an owner
 * Returns success status and any error
 */
export async function sendNurturingEmail(
  owner: OwnerWithRelations,
  emailType: NurturingEmailType
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Check if email already sent (database constraint will also catch this)
    const existing = await db.nurturingCampaign.findUnique({
      where: {
        ownerId_emailType: {
          ownerId: owner.id,
          emailType,
        },
      },
    })

    if (existing) {
      return { success: false, error: 'Email already sent' }
    }

    // Make sure owner has an email
    if (!owner.user.email) {
      return { success: false, error: 'Owner has no email' }
    }

    // Get or derive name from email
    let derivedName = owner.derivedName
    if (!derivedName && !owner.user.name) {
      derivedName = await parseNameFromEmail(owner.user.email)
      if (derivedName) {
        await db.owner.update({
          where: { id: owner.id },
          data: { derivedName },
        })
      }
    }

    // Build chat history summary for context
    const chatSummary = owner.publicChatConversations
      ?.filter(c => c.summary)
      .map(c => c.summary)
      .join('; ') || null

    // Get cleaner interest from chat conversations
    const cleanerInterest = owner.publicChatConversations
      ?.map(c => c.cleanerSlug)
      .filter((v, i, a) => a.indexOf(v) === i) // unique
      .join(', ') || undefined

    // Build context for AI generation
    const context: OwnerContext = {
      name: owner.user.name,
      email: owner.user.email,
      derivedName,
      propertyCount: owner.properties?.length || 0,
      bookingCount: owner.bookings?.length || 0,
      lastBookingDate: owner.bookings?.[0]?.createdAt || null,
      chatHistory: chatSummary,
      daysOnPlatform: Math.floor(
        (Date.now() - owner.createdAt.getTime()) / (24 * 60 * 60 * 1000)
      ),
      cleanerInterest,
    }

    // Generate personalized email
    const { subject, body } = await generateNurturingEmail(emailType, context)

    // Build HTML email
    const ctaUrl = getCTAUrl(emailType)
    const ctaText = getCTAText(emailType)
    const displayName = owner.user.name || derivedName || 'there'
    const html = buildEmailHTML(displayName, body, ctaUrl, ctaText)

    // Send via Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [owner.user.email],
      subject,
      html,
    })

    // Record the campaign
    await db.nurturingCampaign.create({
      data: {
        ownerId: owner.id,
        emailType,
        subject,
        body,
        context: context as object,
        messageId: data?.id,
        error: error?.message,
      },
    })

    // Update welcome email timestamp if applicable
    if (emailType === 'WELCOME') {
      await db.owner.update({
        where: { id: owner.id },
        data: { welcomeEmailSentAt: new Date() },
      })
    }

    // Log to audit
    await logAudit({
      userId: 'SYSTEM',
      action: 'SEND_NURTURING_EMAIL',
      target: owner.id,
      targetType: 'OWNER',
      details: {
        emailType,
        subject,
        messageId: data?.id,
        error: error?.message,
      },
    })

    if (error) {
      console.error('[Nurturing] Resend error:', error)
      return { success: false, error: error.message }
    }

    console.log(`[Nurturing] Sent ${emailType} to ${owner.user.email}, messageId: ${data?.id}`)
    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('[Nurturing] Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Trigger welcome email for a new owner
 * Called from signup entry points
 */
export async function triggerWelcomeEmail(ownerId: string): Promise<void> {
  try {
    const owner = await db.owner.findUnique({
      where: { id: ownerId },
      include: {
        user: true,
        properties: true,
        bookings: { orderBy: { createdAt: 'desc' }, take: 1 },
        publicChatConversations: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })

    if (!owner) {
      console.error('[Nurturing] Owner not found:', ownerId)
      return
    }

    // Check if already sent
    if (owner.welcomeEmailSentAt) {
      console.log('[Nurturing] Welcome email already sent to:', owner.user.email)
      return
    }

    await sendNurturingEmail(owner, 'WELCOME')
  } catch (error) {
    console.error('[Nurturing] Error triggering welcome email:', error)
  }
}

/**
 * Build HTML email with VillaCare branding
 */
function buildEmailHTML(
  name: string,
  body: string,
  ctaUrl: string,
  ctaText: string
): string {
  // Convert line breaks to HTML
  const htmlBody = body
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<p style="margin: 0 0 16px 0; color: #1A1A1A; font-size: 15px; line-height: 1.6;">${line}</p>`)
    .join('')

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; background-color: #FAFAF8; margin: 0;">
    <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
      <!-- Logo -->
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #C4785A, #A66347); border-radius: 12px; line-height: 48px; color: white; font-weight: bold; font-size: 20px;">V</div>
      </div>

      <!-- Body -->
      <div>
        ${htmlBody}
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${ctaUrl}" style="display: inline-block; background: #1A1A1A; color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 500; font-size: 14px;">
          ${ctaText}
        </a>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #EBEBEB; padding-top: 24px; margin-top: 24px;">
        <p style="color: #9B9B9B; font-size: 12px; text-align: center; margin: 0;">
          <a href="https://alicantecleaners.com" style="color: #C4785A; text-decoration: none;">VillaCare</a> - Villa cleaning in Alicante, Spain
        </p>
      </div>
    </div>
  </body>
</html>
`
}
