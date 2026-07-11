import crypto from 'crypto'
import { db } from './db'

/**
 * Short-lived, single-use tokens for the cleaner onboarding flow, stored in
 * the NextAuth `VerificationToken` table (already provisioned by the Prisma
 * adapter for the email magic-link provider - no schema changes). Only the
 * SHA-256 hash of a token is ever stored; the raw token is returned once by
 * the mint function and never persisted.
 *
 * Two token kinds:
 *
 * 1. PHONE-VERIFIED token - minted when the onboarding OTP verify succeeds
 *    (POST /api/auth/otp, action=verify), bound to the normalized phone.
 *    POST /api/onboarding/cleaner requires it, proving the caller actually
 *    passed OTP for the phone it's signing up with. Without this, anyone
 *    could create an account (with phoneVerified stamped!) for any unused
 *    phone number straight against the API. TTL is generous (60 min)
 *    because a real cleaner may take a while over the profile steps between
 *    OTP verify and account creation.
 *
 * 2. AUTO-LOGIN token - minted by POST /api/onboarding/cleaner right after
 *    the User+Cleaner rows are created, exchanged by the client via the
 *    `cleaner-auto-login` credentials provider to establish a session
 *    without a second OTP. Twilio Verify codes are single-use (lib/otp.ts),
 *    so the original OTP can't simply be replayed through NextAuth.
 *
 * Consumption is atomic: `delete` IS the lookup (a P2025 "not found" error
 * means the token was missing or already consumed), so two concurrent
 * requests with the same token can never both succeed.
 */

const AUTO_LOGIN_TTL_MS = 10 * 60 * 1000 // 10 minutes
const PHONE_VERIFIED_TTL_MS = 60 * 60 * 1000 // 60 minutes - covers a slow onboarding

const AUTO_LOGIN_PREFIX = 'cleaner-onboarding-auto-login'
const PHONE_VERIFIED_PREFIX = 'onboarding-phone-verified'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

async function mintToken(identifier: string, ttlMs: number): Promise<string> {
  // Clear out any stale tokens for this identifier (e.g. an abandoned
  // retry) so we never accumulate unused rows.
  await db.verificationToken.deleteMany({ where: { identifier } })

  const rawToken = crypto.randomBytes(32).toString('hex') // 256 bits of entropy
  await db.verificationToken.create({
    data: {
      identifier,
      token: hashToken(rawToken),
      expires: new Date(Date.now() + ttlMs),
    },
  })

  return rawToken
}

/**
 * Atomically consume a token: delete-as-lookup so it can never be used
 * twice, even by two concurrent requests. Returns the payload bound into
 * the identifier (userId / normalized phone) on success, or null if the
 * token is missing, already used, expired, or of a different kind.
 */
async function consumeToken(rawToken: string, prefix: string): Promise<string | null> {
  if (!rawToken) return null

  let record: { identifier: string; expires: Date }
  try {
    // delete() throws P2025 if no row matches - that IS our "not found or
    // already consumed" signal, with no find-then-delete race window.
    record = await db.verificationToken.delete({ where: { token: hashToken(rawToken) } })
  } catch {
    return null
  }

  if (record.expires < new Date()) return null
  if (!record.identifier.startsWith(`${prefix}:`)) return null

  return record.identifier.slice(prefix.length + 1)
}

/**
 * Mint an auto-login token for the given user. Returns the raw (unhashed)
 * token - hand it straight to the client and exchange it via the
 * `cleaner-auto-login` credentials provider. Never log or store the raw
 * value.
 */
export async function mintAutoLoginToken(userId: string): Promise<string> {
  return mintToken(`${AUTO_LOGIN_PREFIX}:${userId}`, AUTO_LOGIN_TTL_MS)
}

/**
 * Verify and consume an auto-login token. Returns the userId, or null.
 */
export async function consumeAutoLoginToken(rawToken: string): Promise<string | null> {
  return consumeToken(rawToken, AUTO_LOGIN_PREFIX)
}

/**
 * Mint a phone-verified token after a successful OTP check. `phone` MUST
 * already be normalized (lib/otp.ts normalizePhone) so mint and check can
 * never disagree over formatting.
 */
export async function mintPhoneVerifiedToken(phone: string): Promise<string> {
  return mintToken(`${PHONE_VERIFIED_PREFIX}:${phone}`, PHONE_VERIFIED_TTL_MS)
}

/**
 * Verify and consume a phone-verified token. Returns the normalized phone
 * it was minted for, or null. The caller must compare that phone against
 * the (normalized) phone it is about to act on.
 */
export async function consumePhoneVerifiedToken(rawToken: string): Promise<string | null> {
  return consumeToken(rawToken, PHONE_VERIFIED_PREFIX)
}
