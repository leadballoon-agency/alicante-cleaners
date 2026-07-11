import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendPushToStaff } from '@/lib/push'
import { runSideEffects } from '@/lib/side-effects'
import { mintAutoLoginToken } from '@/lib/auto-login-token'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .split(' ')[0]
    .replace(/[^a-z0-9]/g, '')
}

export async function POST(request: NextRequest) {
  try {
    const {
      phone,
      name,
      photoUrl,
      bio,
      reviewsLink,
      serviceAreas,
      hourlyRate,
      email,
    } = await request.json()

    // Validation
    if (!phone || !name || !serviceAreas?.length || !hourlyRate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if phone already exists
    const existingUser = await db.user.findUnique({
      where: { phone },
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
            phone,
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
