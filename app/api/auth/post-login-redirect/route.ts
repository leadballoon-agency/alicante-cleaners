import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasStaffAccess } from '@/lib/staff-access'

// GET /api/auth/post-login-redirect
//
// Bounce target used ONLY when the login page had no explicit callbackUrl
// (i.e. the user just picked "Owner" and signed in normally, rather than
// deep-linking to a specific page). NextAuth's magic-link callback route
// redirects here first; by the time this request lands the session cookie
// is already set, so we can read the real role/staffLevel and send staff to
// /admin instead of the default /owner/dashboard.
//
// Any explicit callbackUrl (e.g. /admin?tab=messages, or a deep link that
// was preserved through middleware) bypasses this route entirely — the
// login page passes it straight to next-auth and it's honored as-is.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const destination = hasStaffAccess(session?.user?.staffLevel, 'ADMIN')
    ? '/admin'
    : '/owner/dashboard'

  return NextResponse.redirect(new URL(destination, req.url))
}
