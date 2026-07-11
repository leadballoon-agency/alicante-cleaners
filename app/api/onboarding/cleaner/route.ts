import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendPushToStaff } from '@/lib/push'
import { runSideEffects } from '@/lib/side-effects'
import { mintAutoLoginToken, consumePhoneVerifiedToken } from '@/lib/auto-login-token'
import { normalizePhone } from '@/lib/otp'
import { checkRateLimit, getClientIdentifier, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Mirrors the dev OTP bypass guard in lib/otp.ts: in local development with
// the explicit flag set, the "[Dev] Skip phone verification" button skips
// the OTP step entirely, so there is no phone-verified token to present. A
// token that IS supplied is always validated strictly, even in dev.
const allowDevBypass =
  process.env.ALLOW_DEV_OTP_BYPASS === 'true' && process.env.NODE_ENV === 'development'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .split(' ')[0]
    .replace(/[^a-z0-9]/g, '')
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit account creation by IP - conservative, nobody legitimately
    // signs up more than a handful of cleaner accounts from one IP per hour.
    const clientId = getClientIdentifier(request)
    const rateLimit = await checkRateLimit(clientId, 'signup', RATE_LIMITS.signup)

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      )
    }

    const {
      phone,
      name,
      photoUrl,
      bio,
      reviewsLink,
      serviceAreas,
      hourlyRate,
      email,
      phoneVerificationToken,
    } = await request.json()

    // Validation
    if (!phone || !name || !serviceAreas?.length || !hourlyRate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Normalize once and use everywhere below (token check, duplicate check,
    // user creation) so formatting differences can't cause mismatches.
    const normalizedPhone = normalizePhone(phone)

    // Require proof that the caller actually passed OTP for this phone. The
    // token was minted by POST /api/auth/otp (action=verify) on success and
    // is single-use, hashed at rest, and bound to the normalized phone.
    // Without this check anyone could create an account - with phoneVerified
    // stamped and (via autoLoginToken below) a live session - for any unused
    // phone number they don't own.
    if (phoneVerificationToken) {
      const verifiedPhone = await consumePhoneVerifiedToken(phoneVerificationToken)
      if (!verifiedPhone || verifiedPhone !== normalizedPhone) {
        return NextResponse.json(
          { error: 'Phone verification expired or invalid. Please verify your phone again.' },
          { status: 403 }
        )
      }
    } else if (allowDevBypass) {
      // Dev-only: the "[Dev] Skip phone verification" button never runs the
      // OTP step, so no token exists. Same guard as lib/otp.ts.
      console.log(`[DEV BYPASS] Accepting onboarding for ${normalizedPhone} without phone-verified token`)
    } else {
      return NextResponse.json(
        { error: 'Phone verification required. Please verify your phone again.' },
        { status: 403 }
      )
    }

    // Check if phone already exists
    const existingUser = await db.user.findUnique({
      where: { phone: normalizedPhone },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this phone number already exists' },
        { status: 400 }
      )
    }

    // Email is optional (used for nurturing emails - see
    // lib/nurturing/send-email.ts) and must never block signup. Ignore it
    // entirely if it's malformed or already claimed by another account
    // rather than failing the whole request over an optional field.
    let normalizedEmail: string | null = null
    if (typeof email === 'string' && email.trim()) {
      const candidate = email.trim().toLowerCase()
      if (EMAIL_REGEX.test(candidate)) {
        const emailTaken = await db.user.findUnique({ where: { email: candidate } })
        if (!emailTaken) {
          normalizedEmail = candidate
        } else {
          console.log(`[onboarding] Email ${candidate} already in use - creating cleaner account without it`)
        }
      }
    }

    // Generate unique slug
    let slug = generateSlug(name)
    let slugAttempts = 0
    while (slugAttempts < 10) {
      const existingCleaner = await db.cleaner.findUnique({
        where: { slug },
      })
      if (!existingCleaner) break
      slug = `${generateSlug(name)}${Math.floor(Math.random() * 1000)}`
      slugAttempts++
    }

    // Create user and cleaner in a transaction. Wrapped in a helper so we
    // can retry once without the email if a race lets someone else claim it
    // between the check above and this insert - an optional field must
    // never fail the whole signup.
    const createUserAndCleaner = (emailToUse: string | null) =>
      db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            phone: normalizedPhone,
            name,
            email: emailToUse,
            image: photoUrl || null,
            role: 'CLEANER',
            phoneVerified: new Date(),
          },
        })

        // Create cleaner profile (PENDING until verified by Team Leader)
        const cleaner = await tx.cleaner.create({
          data: {
            userId: user.id,
            slug,
            bio: bio || null,
            reviewsLink: reviewsLink || null,
            serviceAreas,
            hourlyRate,
            status: 'PENDING', // Must be verified by Team Leader to become ACTIVE
            rating: 5.0,
            reviewCount: 0,
            totalBookings: 0,
          },
        })

        return { user, cleaner }
      })

    let result
    try {
      result = await createUserAndCleaner(normalizedEmail)
    } catch (err) {
      const isEmailConflict =
        normalizedEmail &&
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code?: string }).code === 'P2002' &&
        (err as { meta?: { target?: string[] } }).meta?.target?.includes('email')

      if (!isEmailConflict) {
        throw err
      }

      console.log(`[onboarding] Email ${normalizedEmail} conflicted at creation time - retrying without it`)
      result = await createUserAndCleaner(null)
    }

    // Mint a single-use auto-login token so the client can sign this cleaner
    // in immediately (see lib/auto-login-token.ts) instead of forcing a
    // second phone OTP right after this one.
    const autoLoginToken = await mintAutoLoginToken(result.user.id)

    // Notify staff (web push) of the new pending application
    await runSideEffects([
      {
        label: `push:staff-new-cleaner-application:${result.cleaner.id}`,
        promise: sendPushToStaff({
          title: '🧹 New cleaner application',
          body: `${name} — ${Array.isArray(serviceAreas) ? serviceAreas.join(', ') : serviceAreas}`,
          url: '/admin?tab=cleaners',
          tag: `cleaner-application-${result.cleaner.id}`,
        }),
      },
    ])

    return NextResponse.json({
      success: true,
      cleaner: {
        id: result.cleaner.id,
        slug: result.cleaner.slug,
        profileUrl: `/${result.cleaner.slug}`,
        status: result.cleaner.status, // PENDING - needs team verification
      },
      userId: result.user.id,
      autoLoginToken,
    })
  } catch (error) {
    console.error('Error creating cleaner:', error)
    return NextResponse.json(
      { error: 'Failed to create cleaner account' },
      { status: 500 }
    )
  }
}
