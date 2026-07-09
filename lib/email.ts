import { Resend } from 'resend'
import { sendPushToStaff } from '@/lib/push'

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

// Multi-language email content
type SupportedLang = 'en' | 'es' | 'de' | 'fr' | 'nl' | 'pt' | 'it'

const COMPLETION_EMAIL_CONTENT: Record<SupportedLang, {
  subject: (cleanerName: string) => string
  greeting: (name: string) => string
  intro: (cleanerName: string, property: string) => string
  checklistTitle: string
  reviewPrompt: string
  reviewButton: string
  footer: string
}> = {
  en: {
    subject: (cleanerName) => `✨ ${cleanerName} has finished cleaning your villa`,
    greeting: (name) => `Hi ${name}!`,
    intro: (cleanerName, property) => `Great news! ${cleanerName} has just finished cleaning ${property}. Everything is sparkling and ready for you.`,
    checklistTitle: 'Completion Checklist',
    reviewPrompt: 'How was your clean? Your feedback helps us maintain our high standards.',
    reviewButton: 'Leave a Review',
    footer: 'Thank you for choosing VillaCare.'
  },
  es: {
    subject: (cleanerName) => `✨ ${cleanerName} ha terminado de limpiar tu villa`,
    greeting: (name) => `¡Hola ${name}!`,
    intro: (cleanerName, property) => `¡Buenas noticias! ${cleanerName} acaba de terminar la limpieza de ${property}. Todo está impecable y listo para ti.`,
    checklistTitle: 'Lista de Verificación',
    reviewPrompt: '¿Qué tal la limpieza? Tu opinión nos ayuda a mantener nuestros altos estándares.',
    reviewButton: 'Dejar una Reseña',
    footer: 'Gracias por elegir VillaCare.'
  },
  de: {
    subject: (cleanerName) => `✨ ${cleanerName} hat die Reinigung Ihrer Villa abgeschlossen`,
    greeting: (name) => `Hallo ${name}!`,
    intro: (cleanerName, property) => `Gute Nachrichten! ${cleanerName} hat die Reinigung von ${property} abgeschlossen. Alles glänzt und ist bereit für Sie.`,
    checklistTitle: 'Checkliste',
    reviewPrompt: 'Wie war Ihre Reinigung? Ihr Feedback hilft uns, unsere hohen Standards zu halten.',
    reviewButton: 'Bewertung Abgeben',
    footer: 'Vielen Dank, dass Sie VillaCare gewählt haben.'
  },
  fr: {
    subject: (cleanerName) => `✨ ${cleanerName} a terminé le ménage de votre villa`,
    greeting: (name) => `Bonjour ${name} !`,
    intro: (cleanerName, property) => `Bonne nouvelle ! ${cleanerName} vient de terminer le ménage de ${property}. Tout est impeccable et prêt pour vous.`,
    checklistTitle: 'Liste de Vérification',
    reviewPrompt: 'Comment était votre ménage ? Vos commentaires nous aident à maintenir nos standards élevés.',
    reviewButton: 'Laisser un Avis',
    footer: 'Merci d\'avoir choisi VillaCare.'
  },
  nl: {
    subject: (cleanerName) => `✨ ${cleanerName} is klaar met het schoonmaken van je villa`,
    greeting: (name) => `Hallo ${name}!`,
    intro: (cleanerName, property) => `Goed nieuws! ${cleanerName} is net klaar met het schoonmaken van ${property}. Alles blinkt en is klaar voor je.`,
    checklistTitle: 'Checklist',
    reviewPrompt: 'Hoe was je schoonmaak? Je feedback helpt ons om onze hoge standaarden te behouden.',
    reviewButton: 'Review Achterlaten',
    footer: 'Bedankt voor het kiezen van VillaCare.'
  },
  pt: {
    subject: (cleanerName) => `✨ ${cleanerName} terminou a limpeza da sua villa`,
    greeting: (name) => `Olá ${name}!`,
    intro: (cleanerName, property) => `Boas notícias! ${cleanerName} acabou de terminar a limpeza de ${property}. Tudo está impecável e pronto para você.`,
    checklistTitle: 'Lista de Verificação',
    reviewPrompt: 'Como foi a sua limpeza? Seu feedback nos ajuda a manter nossos altos padrões.',
    reviewButton: 'Deixar uma Avaliação',
    footer: 'Obrigado por escolher a VillaCare.'
  },
  it: {
    subject: (cleanerName) => `✨ ${cleanerName} ha finito di pulire la tua villa`,
    greeting: (name) => `Ciao ${name}!`,
    intro: (cleanerName, property) => `Ottime notizie! ${cleanerName} ha appena finito di pulire ${property}. Tutto splende ed è pronto per te.`,
    checklistTitle: 'Checklist',
    reviewPrompt: 'Com\'è stata la pulizia? Il tuo feedback ci aiuta a mantenere i nostri alti standard.',
    reviewButton: 'Lascia una Recensione',
    footer: 'Grazie per aver scelto VillaCare.'
  }
}

// Checklist labels in different languages
const CHECKLIST_LABELS: Record<SupportedLang, Record<string, string>> = {
  en: { keys: 'Keys returned', doors: 'All doors locked', windows: 'Windows closed', pool: 'Pool pump on', lights: 'Lights off', alarm: 'Alarm set', ac: 'AC/heating off', bins: 'Bins taken out' },
  es: { keys: 'Llaves entregadas', doors: 'Puertas cerradas', windows: 'Ventanas cerradas', pool: 'Bomba piscina encendida', lights: 'Luces apagadas', alarm: 'Alarma activada', ac: 'Aire/calefacción apagado', bins: 'Basura sacada' },
  de: { keys: 'Schlüssel zurückgegeben', doors: 'Türen abgeschlossen', windows: 'Fenster geschlossen', pool: 'Poolpumpe an', lights: 'Lichter aus', alarm: 'Alarm aktiviert', ac: 'Klimaanlage/Heizung aus', bins: 'Müll rausgebracht' },
  fr: { keys: 'Clés rendues', doors: 'Portes verrouillées', windows: 'Fenêtres fermées', pool: 'Pompe piscine allumée', lights: 'Lumières éteintes', alarm: 'Alarme activée', ac: 'Climatisation/chauffage éteint', bins: 'Poubelles sorties' },
  nl: { keys: 'Sleutels teruggegeven', doors: 'Deuren op slot', windows: 'Ramen gesloten', pool: 'Zwembadpomp aan', lights: 'Lichten uit', alarm: 'Alarm ingesteld', ac: 'Airco/verwarming uit', bins: 'Afval buiten gezet' },
  pt: { keys: 'Chaves devolvidas', doors: 'Portas trancadas', windows: 'Janelas fechadas', pool: 'Bomba piscina ligada', lights: 'Luzes apagadas', alarm: 'Alarme ativado', ac: 'Ar condicionado/aquecimento desligado', bins: 'Lixo retirado' },
  it: { keys: 'Chiavi restituite', doors: 'Porte chiuse', windows: 'Finestre chiuse', pool: 'Pompa piscina accesa', lights: 'Luci spente', alarm: 'Allarme attivato', ac: 'Aria condizionata/riscaldamento spento', bins: 'Spazzatura portata fuori' }
}

/**
 * Send beautiful completion email to owner when cleaner finishes a job
 */
export async function sendCompletionEmail(details: {
  to: string
  ownerName: string
  cleanerName: string
  propertyName: string
  propertyAddress: string
  service: string
  date: string
  checklist: Record<string, boolean>
  language: string
  bookingId: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const lang = (['en', 'es', 'de', 'fr', 'nl', 'pt', 'it'].includes(details.language)
      ? details.language
      : 'en') as SupportedLang

    const content = COMPLETION_EMAIL_CONTENT[lang]
    const checklistLabels = CHECKLIST_LABELS[lang]

    // Build checklist HTML
    const checklistItems = Object.entries(details.checklist)
      .filter(([, checked]) => checked)
      .map(([key]) => {
        const label = checklistLabels[key] || key
        return `<tr><td style="padding: 8px 12px; color: #2E7D32; font-size: 14px;">✓</td><td style="padding: 8px 0; color: #1A1A1A; font-size: 14px;">${label}</td></tr>`
      })
      .join('')

    const reviewUrl = `https://alicantecleaners.com/owner/dashboard?review=${details.bookingId}`

    await getResend().emails.send({
      from: EMAIL_FROM,
      to: details.to,
      subject: content.subject(details.cleanerName),
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; background-color: #FAFAF8; margin: 0;">
            <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">

              <!-- Header with gradient -->
              <div style="background: linear-gradient(135deg, #2E7D32 0%, #43A047 100%); padding: 32px 24px; text-align: center;">
                <div style="display: inline-block; width: 64px; height: 64px; background: white; border-radius: 50%; line-height: 64px; font-size: 32px; margin-bottom: 16px;">
                  ✨
                </div>
                <h1 style="color: white; font-size: 24px; margin: 0; font-weight: 600;">
                  ${content.greeting(details.ownerName)}
                </h1>
              </div>

              <!-- Main content -->
              <div style="padding: 32px 24px;">

                <!-- Intro text -->
                <p style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                  ${content.intro(details.cleanerName, details.propertyName)}
                </p>

                <!-- Property card -->
                <div style="background: #F5F5F3; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; background: white; border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">🏠</div>
                    <div>
                      <p style="margin: 0; font-weight: 600; color: #1A1A1A; font-size: 14px;">${details.propertyName}</p>
                      <p style="margin: 4px 0 0 0; color: #6B6B6B; font-size: 13px;">${details.date} · ${details.service}</p>
                    </div>
                  </div>
                </div>

                <!-- Checklist -->
                ${checklistItems ? `
                <div style="margin-bottom: 24px;">
                  <h2 style="color: #1A1A1A; font-size: 14px; font-weight: 600; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${content.checklistTitle}
                  </h2>
                  <div style="background: #E8F5E9; border-radius: 12px; padding: 8px;">
                    <table style="width: 100%; border-collapse: collapse;">
                      ${checklistItems}
                    </table>
                  </div>
                </div>
                ` : ''}

                <!-- Review prompt -->
                <div style="background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                  <p style="margin: 0 0 16px 0; color: #1A1A1A; font-size: 14px;">
                    ${content.reviewPrompt}
                  </p>
                  <a href="${reviewUrl}" style="display: inline-block; background: #1A1A1A; color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 14px;">
                    ⭐ ${content.reviewButton}
                  </a>
                </div>

              </div>

              <!-- Footer -->
              <div style="padding: 24px; border-top: 1px solid #EBEBEB; text-align: center;">
                <p style="margin: 0 0 8px 0; color: #6B6B6B; font-size: 13px;">
                  ${content.footer}
                </p>
                <a href="https://alicantecleaners.com" style="color: #C4785A; font-size: 12px; text-decoration: none; font-weight: 500;">
                  VillaCare
                </a>
              </div>

            </div>
          </body>
        </html>
      `,
    })

    console.log('[EMAIL] Completion email sent to:', details.to)
    return { success: true }
  } catch (error) {
    console.error('[EMAIL] Failed to send completion email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}

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
    // Web push to staff devices (best-effort — never blocks the email)
    sendPushToStaff({
      title: '📅 New booking',
      body: `${details.ownerName} booked ${details.service} with ${details.cleanerName} — ${details.date}`,
      url: '/admin?tab=bookings',
      tag: `booking-${details.bookingId}`,
    }).catch(() => {})

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

              <a href="https://alicantecleaners.com/admin?tab=bookings" style="display: block; background: #1A1A1A; color: white; text-decoration: none; padding: 14px 24px; border-radius: 12px; text-align: center; font-weight: 500; font-size: 14px;">
                View Booking
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

/**
 * Notify all admins when a cleaner sends a message
 */
export async function notifyAdminNewMessage(details: {
  cleanerName: string
  cleanerSlug: string
  messageText: string
  conversationId: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const conversationUrl = `https://alicantecleaners.com/admin?tab=messages&conversation=${details.conversationId}`

    // Truncate message if too long
    const previewText = details.messageText.length > 200
      ? details.messageText.substring(0, 200) + '...'
      : details.messageText

    // Web push to staff devices (best-effort — never blocks the email)
    sendPushToStaff({
      title: `💬 ${details.cleanerName}`,
      body: previewText,
      url: `/admin?tab=messages&conversation=${details.conversationId}`,
      tag: `msg-${details.conversationId}`,
    }).catch(() => {})

    await getResend().emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAILS,
      subject: `💬 New message from ${details.cleanerName}`,
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
                <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #C4785A, #A66347); border-radius: 50%; line-height: 48px; color: white; font-size: 24px;">💬</div>
              </div>

              <h1 style="color: #1A1A1A; font-size: 20px; text-align: center; margin-bottom: 8px;">
                New Message
              </h1>

              <p style="color: #6B6B6B; font-size: 14px; text-align: center; margin-bottom: 24px;">
                from <strong style="color: #1A1A1A;">${details.cleanerName}</strong>
              </p>

              <div style="background: #F5F5F3; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="color: #1A1A1A; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${previewText}</p>
              </div>

              <a href="${conversationUrl}" style="display: block; background: #1A1A1A; color: white; text-decoration: none; padding: 14px 24px; border-radius: 12px; text-align: center; font-weight: 500; font-size: 14px;">
                View & Reply
              </a>

              <p style="color: #9B9B9B; font-size: 12px; text-align: center; margin-top: 24px;">
                Reply directly from the admin dashboard.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    console.log('[EMAIL] Admin message notification sent for cleaner:', details.cleanerName)
    return { success: true }
  } catch (error) {
    console.error('[EMAIL] Failed to send admin message notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}
