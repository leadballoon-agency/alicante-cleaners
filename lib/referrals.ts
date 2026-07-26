/**
 * Advocacy loop: attribute new owner accounts to the owner whose share link
 * they arrived on.
 *
 * Flow:
 * 1. A visitor lands on `/{slug}?ref=<code>` (or any tracked page with a
 *    `ref` param — see components/analytics/page-tracker.tsx).
 * 2. `POST /api/track` sanitizes the ref and calls `rememberReferralCookie`,
 *    which stores it in a first-party cookie for 30 days.
 * 3. Whenever/wherever that visitor's Owner account gets created — same
 *    session, days later, guest checkout, magic-link login, AI onboarding —
 *    the owner-creation code calls `resolveReferredByFromCookie` to look up
 *    whether the cookie's value is a real Owner.referralCode, at CONSUMPTION
 *    time (not landing time). This means share-surface tags that aren't
 *    referral codes at all (e.g. "cleaner-share", "admin-share") simply find
 *    no match and attribute nothing — no special-casing needed.
 *
 * Never overwrites an existing `referredBy` (this module is only ever
 * called from owner-creation code, never from an update path) and never
 * attributes an owner to themselves.
 */

import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export const REFERRAL_COOKIE_NAME = 'vc_ref'
const REFERRAL_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60 // 30 days

/**
 * Cheap sanity check applied before a ref value is ever persisted (cookie or
 * PageView row). This is NOT the security boundary — it just keeps garbage
 * out of storage. The real check (does this code belong to an owner) always
 * happens later, at consumption time.
 */
export function isPlausibleRefValue(value: string): boolean {
  return /^[A-Za-z0-9_-]{1,64}$/.test(value)
}

/**
 * Store (or refresh) the visitor's most recent `ref` value in a first-party
 * cookie. Last-touch: a newer ref overwrites an older one. httpOnly since
 * nothing on the client needs to read it back — only server-side
 * owner-creation code ever consumes it.
 */
export async function rememberReferralCookie(ref: string): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.set(REFERRAL_COOKIE_NAME, ref, {
      maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
  } catch (error) {
    // Never let cookie-writing break page-view tracking.
    console.error('[referrals] Failed to set referral cookie:', error)
  }
}

/**
 * At owner-account creation, resolve `referredBy` from the visitor's
 * `vc_ref` cookie. Returns the referring owner's referralCode (to be stored
 * verbatim on the new Owner row) or null if there's no cookie, the code
 * doesn't belong to any owner, or it would be a self-referral.
 *
 * Deliberately fails closed (returns null) on any error — this must never
 * block login, booking, or onboarding.
 */
export async function resolveReferredByFromCookie(
  newOwnerUserId: string
): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const ref = cookieStore.get(REFERRAL_COOKIE_NAME)?.value
    if (!ref) return null

    const referringOwner = await db.owner.findUnique({
      where: { referralCode: ref },
      select: { userId: true, referralCode: true },
    })

    if (!referringOwner || referringOwner.userId === newOwnerUserId) {
      return null
    }

    return referringOwner.referralCode
  } catch (error) {
    console.error('[referrals] Failed to resolve referredBy from cookie:', error)
    return null
  }
}
