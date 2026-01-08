/**
 * Google Calendar OAuth Callback
 * Handles the OAuth callback, exchanges code for tokens,
 * and stores them linked to the cleaner's existing user account.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

export async function GET(request: NextRequest) {
  // Always use www version to match Google OAuth redirect URI
  const baseUrl = 'https://www.alicantecleaners.com'

  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error)
      return NextResponse.redirect(new URL(`/dashboard/availability?error=${error}`, baseUrl))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/dashboard/availability?error=missing_params', baseUrl))
    }

    // Decode and verify state
    let stateData: { userId: string; cleanerId: string; nonce: string }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    } catch {
      return NextResponse.redirect(new URL('/dashboard/availability?error=invalid_state', baseUrl))
    }

    // Verify nonce from cookie
    const cookieStore = await cookies()
    const storedNonce = cookieStore.get('google_oauth_state')?.value

    if (!storedNonce || storedNonce !== stateData.nonce) {
      return NextResponse.redirect(new URL('/dashboard/availability?error=state_mismatch', baseUrl))
    }

    // Clear the state cookie
    cookieStore.delete('google_oauth_state')

    // Exchange authorization code for tokens
    const redirectUri = `${baseUrl}/api/calendar/google/callback`

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return NextResponse.redirect(new URL('/dashboard/availability?error=token_exchange_failed', baseUrl))
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json()

    // Verify the user and cleaner still exist
    const cleaner = await db.cleaner.findUnique({
      where: { id: stateData.cleanerId },
      include: { user: true },
    })

    if (!cleaner || cleaner.userId !== stateData.userId) {
      return NextResponse.redirect(new URL('/dashboard/availability?error=user_not_found', baseUrl))
    }

    // Store or update the Google account tokens
    // Use a special provider name to distinguish from login OAuth
    const expiresAt = Math.floor(Date.now() / 1000) + tokens.expires_in

    await db.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: stateData.userId, // Use user ID as provider account ID for calendar linking
        },
      },
      create: {
        userId: stateData.userId,
        type: 'oauth',
        provider: 'google',
        providerAccountId: stateData.userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        token_type: tokens.token_type,
        scope: tokens.scope,
      },
      update: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || undefined, // Keep existing if not provided
        expires_at: expiresAt,
        token_type: tokens.token_type,
        scope: tokens.scope,
      },
    })

    // Update cleaner's calendar connection status
    await db.cleaner.update({
      where: { id: stateData.cleanerId },
      data: {
        googleCalendarConnected: true,
        googleCalendarSyncedAt: new Date(),
      },
    })

    // Redirect back to availability page with success message
    return NextResponse.redirect(new URL('/dashboard/availability?success=connected', baseUrl))
  } catch (error) {
    console.error('Google callback error:', error)
    return NextResponse.redirect(new URL('/dashboard/availability?error=callback_failed', baseUrl))
  }
}
