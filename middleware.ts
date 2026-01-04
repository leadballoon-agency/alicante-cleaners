import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Admin routes - require ADMIN role
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login?error=unauthorized', req.url))
    }

    // Cleaner dashboard - require CLEANER role
    if (path.startsWith('/dashboard') && token?.role !== 'CLEANER') {
      return NextResponse.redirect(new URL('/login?error=unauthorized', req.url))
    }

    // Owner dashboard - require OWNER role
    if (path.startsWith('/owner/dashboard') && token?.role !== 'OWNER') {
      return NextResponse.redirect(new URL('/login?error=unauthorized', req.url))
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
