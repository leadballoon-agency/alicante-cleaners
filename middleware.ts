import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    const role = token?.role
    // Staff access is decoupled from role: a CLEANER can also be a platform
    // MANAGER. Fall back to role==='ADMIN' so existing admins are never locked
    // out even on a token issued before staffLevel existed.
    const staffLevel = (token?.staffLevel as string) || (role === 'ADMIN' ? 'ADMIN' : 'NONE')
    const isStaff = staffLevel === 'ADMIN' || staffLevel === 'MANAGER'

    // Full-access staff (ADMIN) can access everything
    if (staffLevel === 'ADMIN') {
      return NextResponse.next()
    }

    // Preserve the exact path + query the user was trying to reach (e.g.
    // /admin?tab=messages) so login sends them right back there instead of
    // dropping them on the section root.
    const requestedUrl = path + req.nextUrl.search

    // Admin area - require staff access (MANAGER or ADMIN)
    if (path.startsWith('/admin')) {
      if (isStaff) {
        return NextResponse.next()
      }
      return NextResponse.redirect(new URL(`/login?error=admin_only&callbackUrl=${encodeURIComponent(requestedUrl)}`, req.url))
    }

    // Cleaner dashboard - require CLEANER role (or ADMIN, handled above)
    if (path.startsWith('/dashboard') && role !== 'CLEANER') {
      return NextResponse.redirect(new URL(`/login?error=cleaner_only&callbackUrl=${encodeURIComponent(requestedUrl)}`, req.url))
    }

    // Owner dashboard - require OWNER role (or ADMIN, handled above)
    if (path.startsWith('/owner/dashboard') && role !== 'OWNER') {
      return NextResponse.redirect(new URL(`/login?error=owner_only&callbackUrl=${encodeURIComponent(requestedUrl)}`, req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        // These paths require authentication
        const protectedPaths = ['/dashboard', '/owner/dashboard', '/admin']
        const isProtected = protectedPaths.some(p => path.startsWith(p))

        if (isProtected) {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/owner/dashboard/:path*',
    '/admin/:path*',
  ],
}
