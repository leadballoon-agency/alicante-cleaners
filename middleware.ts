import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    const role = token?.role

    // ADMIN can access everything
    if (role === 'ADMIN') {
      return NextResponse.next()
    }

    // Admin routes - require ADMIN role
    if (path.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/login?error=admin_only', req.url))
    }

    // Cleaner dashboard - require CLEANER role
    if (path.startsWith('/dashboard') && role !== 'CLEANER') {
      return NextResponse.redirect(new URL('/login?error=cleaner_only', req.url))
    }

    // Owner dashboard - require OWNER role
    if (path.startsWith('/owner/dashboard') && role !== 'OWNER') {
      return NextResponse.redirect(new URL('/login?error=owner_only', req.url))
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
