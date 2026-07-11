import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasStaffAccess } from '@/lib/staff-access'
import { db } from '@/lib/db'
import { PushAudience } from '@prisma/client'

// POST /api/push/subscribe — save a web-push subscription for the current
// user. Audience (STAFF vs CLEANER) is computed server-side — never trust
// the client — so a staff-only broadcast (sendPushToStaff) can never leak
// to a cleaner's device just because they also subscribed.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let audience: PushAudience
  if (hasStaffAccess(session.user.staffLevel, 'MANAGER')) {
    audience = 'STAFF'
  } else {
    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!cleaner) {
      // Owners aren't in scope for push yet.
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    audience = 'CLEANER'
  }

  try {
    const { endpoint, keys, userAgent } = await request.json()
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    await db.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: session.user.id,
        audience,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || null,
      },
      create: {
        userId: session.user.id,
        audience,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error saving push subscription:', error)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}

// DELETE /api/push/subscribe — remove a subscription (e.g. on unsubscribe)
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { endpoint } = await request.json()
    if (endpoint) {
      await db.pushSubscription.deleteMany({ where: { endpoint } })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error removing push subscription:', error)
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }
}
