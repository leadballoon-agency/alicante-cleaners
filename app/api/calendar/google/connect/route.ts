/**
 * Google Calendar OAuth Connect
 * Initiates OAuth flow WITHOUT replacing the user's session
 *
 * Unlike signIn('google'), this preserves the cleaner's phone auth session
 * and only links their Google account for calendar access.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL || 'https://www.alicantecleaners.com'))
    }

    // Verify this is a cleaner
    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
    })

    if (!cleaner) {
      return NextResponse.redirect(new URL('/dashboard/availability?error=not_cleaner', process.env.NEXTAUTH_URL || 'https://www.alicantecleaners.com'))
    }

    // Generate a secure state token
    const nonce = crypto.randomBytes(16).toString('hex')
    const stateData = {
      userId: session.user.id,
      cleanerId: cleaner.id,
      nonce,
    }
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64url')

    // Store nonce in a secure cookie for verification
    const cookieStore = await cookies()
    cookieStore.set('google_oauth_state', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    })

    // Build Google OAuth URL
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      return NextResponse.redirect(new URL('/dashboard/availability?error=oauth_not_configured', process.env.NEXTAUTH_URL || 'https://www.alicantecleaners.com'))
    }

    // Always use www version to match Google OAuth redirect URI
    const baseUrl = 'https://www.alicantecleaners.com'
    const redirectUri = `${baseUrl}/api/calendar/google/callback`

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      access_type: 'offline',
      prompt: 'consent', // Always prompt to get refresh token
      state,
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Google connect error:', error)
    return NextResponse.redirect(new URL('/dashboard/availability?error=connect_failed', process.env.NEXTAUTH_URL || 'https://www.alicantecleaners.com'))
  }
}
