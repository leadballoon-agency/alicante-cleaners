import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Cache for 5 minutes

export async function GET() {
  try {
    const settings = await db.platformSettings.findUnique({
      where: { id: 'default' },
      select: {
        googleTagManagerId: true,
        facebookPixelId: true,
        googleAnalyticsId: true,
        convertBoxScriptId: true,
        customHeadScripts: true,
        customBodyScripts: true,
      },
    })

    if (!settings) {
      return NextResponse.json({})
    }

    return NextResponse.json({
      googleTagManagerId: settings.googleTagManagerId,
      facebookPixelId: settings.facebookPixelId,
      googleAnalyticsId: settings.googleAnalyticsId,
      convertBoxScriptId: settings.convertBoxScriptId,
      customHeadScripts: settings.customHeadScripts ? JSON.parse(settings.customHeadScripts) : [],
      customBodyScripts: settings.customBodyScripts ? JSON.parse(settings.customBodyScripts) : [],
    })
  } catch (error) {
    console.error('Error fetching scripts:', error)
    return NextResponse.json({})
  }
}
