import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, cleanerSlug, referrer, sessionId } = body

    if (!path) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 })
    }

    // Get session if logged in
    const session = await getServerSession(authOptions)

    // Get headers for analytics
    const userAgent = request.headers.get('user-agent') || undefined
    const country = request.headers.get('x-vercel-ip-country') || undefined

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
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking page view:', error)
    // Don't fail the request for tracking errors
    return NextResponse.json({ success: false })
  }
}
