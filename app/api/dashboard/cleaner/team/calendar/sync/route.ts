/**
 * Team Calendar Sync API
 *
 * POST /api/dashboard/cleaner/team/calendar/sync
 *
 * Triggers a sync of all team members' Google Calendars.
 * Only accessible by team leaders.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { syncCleanerCalendar } from '@/lib/google-calendar'

interface SyncResult {
  memberId: string
  memberName: string
  success: boolean
  synced?: number
  error?: string
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'CLEANER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get cleaner and verify they are a team leader
    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      include: {
        ledTeam: {
          include: {
            members: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        },
        user: { select: { name: true } },
      },
    })

    if (!cleaner) {
      return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 })
    }

    if (!cleaner.ledTeam) {
      return NextResponse.json(
        { error: 'You must be a team leader to sync team calendars' },
        { status: 403 }
      )
    }

    // All team members = team leader + team members
    const allMembers = [
      { id: cleaner.id, name: cleaner.user.name || 'Unknown', googleCalendarConnected: cleaner.googleCalendarConnected },
      ...cleaner.ledTeam.members.map((m) => ({
        id: m.id,
        name: m.user.name || 'Unknown',
        googleCalendarConnected: m.googleCalendarConnected,
      })),
    ]

    const results: SyncResult[] = []

    // Sync each member's calendar
    for (const member of allMembers) {
      if (!member.googleCalendarConnected) {
        results.push({
          memberId: member.id,
          memberName: member.name,
          success: false,
          error: 'Calendar not connected',
        })
        continue
      }

      try {
        // Update status to SYNCING
        await db.cleaner.update({
          where: { id: member.id },
          data: { calendarSyncStatus: 'SYNCING' },
        })

        const syncResult = await syncCleanerCalendar(member.id)

        if (syncResult.error) {
          // Update status to ERROR
          await db.cleaner.update({
            where: { id: member.id },
            data: { calendarSyncStatus: 'ERROR' },
          })

          results.push({
            memberId: member.id,
            memberName: member.name,
            success: false,
            error: syncResult.error,
          })
        } else {
          // Update status to SYNCED
          await db.cleaner.update({
            where: { id: member.id },
            data: { calendarSyncStatus: 'SYNCED' },
          })

          results.push({
            memberId: member.id,
            memberName: member.name,
            success: true,
            synced: syncResult.synced,
          })
        }
      } catch (error) {
        console.error(`Error syncing calendar for ${member.id}:`, error)

        await db.cleaner.update({
          where: { id: member.id },
          data: { calendarSyncStatus: 'ERROR' },
        })

        results.push({
          memberId: member.id,
          memberName: member.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const totalCount = results.length

    return NextResponse.json({
      message: `Synced ${successCount}/${totalCount} team members`,
      results,
      allSuccessful: successCount === totalCount,
    })
  } catch (error) {
    console.error('Error syncing team calendars:', error)
    return NextResponse.json(
      { error: 'Failed to sync team calendars' },
      { status: 500 }
    )
  }
}
