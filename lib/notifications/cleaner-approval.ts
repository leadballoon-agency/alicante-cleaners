import { db } from '@/lib/db'
import { sendPushToUser, cleanerPushText } from '@/lib/push'
import { triggerCleanerWelcomeEmail } from '@/lib/nurturing/send-email'

/**
 * Fires the welcome email + approval push notification for a newly-approved
 * cleaner. Shared by the manual admin PATCH route
 * (app/api/admin/cleaners/[id]/route.ts) and the AI admin agent's
 * approve_cleaner tool (lib/ai/admin-agent.ts `handleApproveCleaner`) so
 * both paths fire identical onboarding side effects — the AI agent path
 * previously fired nothing at all on approval, a pre-existing gap.
 *
 * Never throws: both underlying calls are best-effort (triggerCleanerWelcomeEmail
 * already swallows its own errors; sendPushToUser does too), but this also
 * wraps them in Promise.allSettled defensively so a failure in one never
 * blocks the other.
 */
export async function triggerCleanerApprovalEffects(cleanerId: string): Promise<void> {
  const cleaner = await db.cleaner.findUnique({
    where: { id: cleanerId },
    select: { userId: true, user: { select: { preferredLanguage: true } } },
  })

  const results = await Promise.allSettled([
    triggerCleanerWelcomeEmail(cleanerId),
    cleaner
      ? sendPushToUser(cleaner.userId, cleanerPushText('approved', cleaner.user.preferredLanguage))
      : Promise.resolve(),
  ])

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const label = i === 0 ? 'welcome-email' : 'approval-push'
      console.error(`[cleaner-approval:${label}] failed for cleaner ${cleanerId}:`, result.reason)
    }
  })
}
