import { NextRequest, NextResponse } from 'next/server'
import { getPublicCleanerProfile } from '@/lib/cleaners/get-public-profile'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const profile = await getPublicCleanerProfile(slug)

    if (!profile) {
      return NextResponse.json(
        { error: 'Cleaner not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching cleaner:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cleaner' },
      { status: 500 }
    )
  }
}
