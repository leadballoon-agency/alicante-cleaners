import { db } from '@/lib/db'
import { sendPushToUser, PushPayload } from '@/lib/push'
import { Cleaner, CleanerNurturingEmailType, User } from '@prisma/client'

/**
 * Push fallback for cleaner nurturing nudges. Only the four types below have
 * a push arm — the rest (BOOKING_MANAGEMENT_TIPS, TEAM_OPPORTUNITY,
 * PROMOTE_PROFILE_TIPS) are content-heavy and stay email-only by design.
 *
 * Copy is fixed ES/EN strings, matching the pattern in lib/push.ts'
 * cleanerPushText — deliberately NOT routed through lib/translate.ts (OpenAI).
 * This is a separate, small nurture-specific copy map (not a duplicate of
 * cleanerPushText, which covers transactional booking/message events).
 */
export type CleanerNurturingPushType =
  | 'PROFILE_TIPS'
  | 'CALENDAR_SYNC_GUIDE'
  | 'SUCCESS_COACH_INTRO'
  | 'CLEANER_REACTIVATION'

const NURTURING_PUSH_COPY: Record<CleanerNurturingPushType, { es: PushPayload; en: PushPayload }> = {
  PROFILE_TIPS: {
    es: { title: 'Tu perfil está casi listo 📸', body: 'Añade tu foto y consigue 3x más reservas', url: '/dashboard' },
    en: { title: 'Your profile is almost ready 📸', body: 'Add your photo and get 3x more bookings', url: '/dashboard' },
  },
  CALENDAR_SYNC_GUIDE: {
    es: { title: 'Conecta tu calendario 📅', body: 'Evita dobles reservas — se sincroniza solo', url: '/dashboard/availability' },
    en: { title: 'Connect your calendar 📅', body: 'Avoid double bookings — it syncs automatically', url: '/dashboard/availability' },
  },
  SUCCESS_COACH_INTRO: {
    es: { title: 'Has desbloqueado tu Success Coach 🎯', body: 'Consejos personalizados para conseguir más reservas', url: '/dashboard?tab=success' },
    en: { title: "You've unlocked your Success Coach 🎯", body: 'Personalized tips to get more bookings', url: '/dashboard?tab=success' },
  },
  CLEANER_REACTIVATION: {
    es: { title: 'Te echamos de menos 👋', body: 'Tus clientes te están buscando en VillaCare', url: '/dashboard' },
    en: { title: 'We miss you 👋', body: 'Your clients are looking for you on VillaCare', url: '/dashboard' },
  },
}

function nurturingPushText(type: CleanerNurturingPushType, preferredLanguage: string | null | undefined): PushPayload {
  const lang = preferredLanguage === 'en' ? 'en' : 'es'
  return NURTURING_PUSH_COPY[type][lang]
}

type CleanerWithUser = Cleaner & { user: User }

/**
 * Push-channel fallback for a cleaner nurturing nudge. Only called when the
 * cleaner has no email (the email arm already failed with 'Cleaner has no
 * email'). If she also has no push subscription, we deliberately do NOT
 * write a campaign row — she keeps the nudge pending until she gains a
 * channel (email or push), same "no channel, no row" rule that fixes the
 * daily error-spam for phone-only cleaners.
 */
export async function sendCleanerNurturingPush(
  cleaner: CleanerWithUser,
  emailType: CleanerNurturingEmailType
): Promise<{ success: boolean; error?: string }> {
  const pushType = emailType as CleanerNurturingPushType
  if (!(pushType in NURTURING_PUSH_COPY)) {
    return { success: false, error: 'No push arm for this nurture type' }
  }

  const subCount = await db.pushSubscription.count({ where: { userId: cleaner.userId } })
  if (subCount === 0) {
    return { success: false, error: 'No push subscription' }
  }

  const payload = nurturingPushText(pushType, cleaner.user.preferredLanguage)

  // sendPushToUser is best-effort and never throws — a cleaner with a dead
  // subscription still gets her campaign row written below (same once-ever
  // semantics as email; dead subscriptions are auto-pruned by lib/push.ts).
  await sendPushToUser(cleaner.userId, payload)

  await db.cleanerNurturingCampaign.create({
    data: {
      cleanerId: cleaner.id,
      emailType,
      channel: 'PUSH',
      subject: payload.title,
      body: payload.body,
      messageId: null,
    },
  })

  console.log(`[Cleaner Nurturing] Sent push ${emailType} to cleaner ${cleaner.id}`)
  return { success: true }
}
