import crypto from 'crypto'
import { db } from './db'

/**
 * Short-lived, single-use tokens that let the cleaner onboarding flow sign a
 * brand-new cleaner in immediately after her account is created.
 *
 * Why not just replay the OTP through NextAuth? Twilio Verify codes are
 * single-use (see lib/otp.ts) - the code was already consumed by the
 * onboarding phone-verify step (POST /api/auth/otp, action=verify), so it
 * can't be checked again by the `cleaner-login` credentials provider.
 *
 * Instead of adding a new table, this reuses the NextAuth `VerificationToken`
 * table (already provisioned by the Prisma adapter for the email magic-link
 * provider). Only the SHA-256 hash of the token is ever stored; the raw
 * token is returned once by mintAutoLoginToken and never persisted.
 */

const TOKEN_TTL_MS = 10 * 60 * 1000 // 10 minutes
const IDENTIFIER_PREFIX = 'cleaner-onboarding-auto-login'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Mint a token for the given user. Returns the raw (unhashed) token - hand
 * it straight to the client and exchange it via the `cleaner-auto-login`
 * credentials provider. Never log or store the raw value.
 */
export async function mintAutoLoginToken(userId: string): Promise<string> {
  const identifier = `${IDENTIFIER_PREFIX}:${userId}`

  // Clear out any stale tokens for this user (e.g. an abandoned retry) so we
  // never accumulate unused rows.
  await db.verificationToken.deleteMany({ where: { identifier } })

  const rawToken = crypto.randomBytes(32).toString('hex') // 256 bits of entropy
  await db.verificationToken.create({
    data: {
      identifier,
      token: hashToken(rawToken),
      expires: new Date(Date.now() + TOKEN_TTL_MS),
    },
  })

  return rawToken
}

/**
 * Verify and consume a token minted by mintAutoLoginToken. Always single-use:
 * the row is deleted as soon as it's looked up, whether or not it turns out
 * to be valid. Returns the userId on success, or null if the token is
 * missing, already used, or expired.
 */
export async function consumeAutoLoginToken(rawToken: string): Promise<string | null> {
  if (!rawToken) return null

  const hashed = hashToken(rawToken)
  const record = await db.verificationToken.findUnique({ where: { token: hashed } })

  if (!record) return null

  // Delete immediately so the token can never be used twice, even if it
  // turns out to be expired or malformed below.
  await db.verificationToken.delete({ where: { token: hashed } }).catch(() => {
    // Already deleted by a concurrent request - treat as consumed.
  })

  if (record.expires < new Date()) return null
  if (!record.identifier.startsWith(`${IDENTIFIER_PREFIX}:`)) return null

  return record.identifier.slice(IDENTIFIER_PREFIX.length + 1)
}
