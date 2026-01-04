import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { SUPPORTED_LANGUAGES } from '@/lib/translate'

// GET /api/user/preferences - Get user preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { preferredLanguage: true },
    })

    return NextResponse.json({
      preferredLanguage: user?.preferredLanguage || 'en',
      supportedLanguages: SUPPORTED_LANGUAGES,
    })
  } catch (error) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

// PATCH /api/user/preferences - Update user preferences
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { preferredLanguage } = await request.json()

    // Validate language
    if (!preferredLanguage || !(preferredLanguage in SUPPORTED_LANGUAGES)) {
      return NextResponse.json(
        { error: 'Invalid language. Supported: ' + Object.keys(SUPPORTED_LANGUAGES).join(', ') },
        { status: 400 }
      )
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: { preferredLanguage },
      select: { preferredLanguage: true },
    })

    return NextResponse.json({
      preferredLanguage: user.preferredLanguage,
    })
  } catch (error) {
    console.error('Error updating preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
