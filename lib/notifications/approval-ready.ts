import { db } from '@/lib/db'
import { sendPushToStaff } from '@/lib/push'
import type { Prisma } from '@prisma/client'

/**
 * Minimal shape needed to evaluate approval-readiness. Callers pass either a
 * freshly-loaded Prisma row (see `notifyIfApprovalReady` below) or a
 * before-update snapshot fetched with the same select shape.
 */
export interface ApprovalReadyCleaner {
  status: string
  bio: string | null
  serviceAreas: string[]
  hourlyRate: Prisma.Decimal | number | string | null
  user: { image: string | null }
}

/**
 * The four criteria that gate a PENDING cleaner's "Request approval on
 * WhatsApp" CTA. This MUST stay in lockstep with `isProfileReady()` in
 * app/dashboard/components/GetStartedCard.tsx (a client component computing
 * the same thing from a different, UI-shaped `ProfileHealth` object fetched
 * from /api/dashboard/cleaner/profile-health) — see the comment there
 * pointing back at this file. Duplicated on purpose rather than shared
 * across the server/client boundary; keep both in sync by hand.
 */
export function isApprovalReady(cleaner: ApprovalReadyCleaner): boolean {
  const hasPhoto = !!cleaner.user.image
  const hasGoodBio = (cleaner.bio?.length ?? 0) >= 100
  const hasEnoughAreas = cleaner.serviceAreas.length >= 3
  const hasRate = Number(cleaner.hourlyRate) > 0
  return hasPhoto && hasGoodBio && hasEnoughAreas && hasRate
}

/**
 * Fires a one-time staff push the moment a PENDING cleaner's profile crosses
 * from incomplete to complete (photo + bio ≥100 chars + 3+ service areas +
 * hourly rate > 0 — see `isApprovalReady` above). Call sites must compute
 * `wasReadyBefore` themselves (via `isApprovalReady` on the pre-update row)
 * BEFORE applying their update, then call this AFTER the update commits.
 *
 * Best-effort: loads the cleaner fresh and never throws — a failure here
 * must never fail the profile update it's attached to. Route handlers
 * should still await this (via lib/side-effects.ts `runSideEffects`, not a
 * bare `.catch()`) so Vercel's serverless runtime doesn't freeze the
 * function before the push actually goes out.
 */
export async function notifyIfApprovalReady(cleanerId: string, wasReadyBefore: boolean): Promise<void> {
  try {
    if (wasReadyBefore) return

    const cleaner = await db.cleaner.findUnique({
      where: { id: cleanerId },
      select: {
        status: true,
        bio: true,
        serviceAreas: true,
        hourlyRate: true,
        user: { select: { name: true, image: true } },
      },
    })

    if (!cleaner || cleaner.status !== 'PENDING') return
    if (!isApprovalReady(cleaner)) return

    const name = cleaner.user.name || 'A cleaner'
    await sendPushToStaff({
      title: 'Cleaner ready for approval ✅',
      body: `${name} completed her profile — review and approve`,
      url: `/admin?tab=cleaners&search=${encodeURIComponent(name)}`,
      tag: `approval-ready-${cleanerId}`,
    })
  } catch (err) {
    console.error('notifyIfApprovalReady failed:', err)
  }
}
