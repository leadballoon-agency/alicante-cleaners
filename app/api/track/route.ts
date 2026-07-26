import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { isPlausibleRefValue, rememberReferralCookie } from '@/lib/referrals'

// Advocacy loop: sanitize a client-supplied `ref` before it's ever persisted
// (cookie or PageView row). Defense in depth — the client already applies
// the same format check, but this endpoint can't trust that.
function sanitizeRef(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().slice(0, 64)
  return isPlausibleRefValue(trimmed) ? trimmed : null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, cleanerSlug, referrer, sessionId, ref } = body

    if (!path) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 })
    }

    // Get session if logged in
    const session = await getServerSession(authOptions)

    // Get headers for analytics
    const userAgent = request.headers.get('user-agent') || undefined
    const country = request.headers.get('x-vercel-ip-country') || undefined

    const sanitizedRef = sanitizeRef(ref)

    // Persist the ref in a first-party cookie so it survives to whenever an
    // Owner account eventually gets created (guest booking, magic-link
    // login, AI onboarding) — see lib/referrals.ts. Done before the
    // PageView write, and independently of whether that write succeeds, so
    // a transient analytics-table failure can never cost an attribution.
    if (sanitizedRef) {
      await rememberReferralCookie(sanitizedRef)
    }

    // Create page view record
    await db.pageView.create({
      data: {
        path,
        cleanerSlug: cleanerSlug || null,
        referrer: referrer || null,
        userAgent,
        country,
        sessionId: sessionId || null,
        userId: session?.user?.id || null,
        ref: sanitizedRef,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking page view:', error)
    // Don't fail the request for tracking errors
    return NextResponse.json({ success: false })
  }
}
