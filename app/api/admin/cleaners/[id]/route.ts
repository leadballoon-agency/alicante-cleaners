import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasStaffAccess } from '@/lib/staff-access'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { triggerCleanerWelcomeEmail } from '@/lib/nurturing/send-email'
import { detectLanguage, translateText, type LanguageCode } from '@/lib/translate'

type VettingFields = {
  vettedNote: string | null
  vettedByName: string | null
  vettedAt: Date | null
  vettedNoteLang: string | null
  vettedNoteTranslated: string | null
}

// Builds the full set of vetting columns for a non-empty note: stores the
// note as-is plus its auto-translated counterpart (EN if written in ES, ES
// if written in EN, EN for anything else) so owners reading the public
// profile in either language see it. Detection/translation never throws —
// lib/translate.ts already swallows its own errors — but we defensively
// fall back to "note saved, translation columns null" so a translation
// hiccup can never block an approve or a vouch.
async function buildVettingFields(trimmedNote: string, staffName: string): Promise<VettingFields> {
  let vettedNoteLang: string | null = null
  let vettedNoteTranslated: string | null = null
  try {
    const detected = await detectLanguage(trimmedNote)
    const target: LanguageCode = detected === 'es' ? 'en' : detected === 'en' ? 'es' : 'en'
    vettedNoteTranslated = await translateText(trimmedNote, detected, target)
    vettedNoteLang = detected
  } catch (err) {
    console.error('Vetting note translation error (continuing without translation):', err)
    vettedNoteLang = null
    vettedNoteTranslated = null
  }
  return {
    vettedNote: trimmedNote,
    vettedByName: staffName,
    vettedAt: new Date(),
    vettedNoteLang,
    vettedNoteTranslated,
  }
}

const CLEARED_VETTING_FIELDS: VettingFields = {
  vettedNote: null,
  vettedByName: null,
  vettedAt: null,
  vettedNoteLang: null,
  vettedNoteTranslated: null,
}

// PATCH /api/admin/cleaners/[id] - Approve/suspend cleaner
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !hasStaffAccess(session.user.staffLevel, 'MANAGER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { action, name, phone, email, vettedNote } = body

    const cleaner = await db.cleaner.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!cleaner) {
      return NextResponse.json(
        { error: 'Cleaner not found' },
        { status: 404 }
      )
    }

    // Handle edit action - update user details (name, phone, email)
    if (action === 'edit') {
      const updates: { name?: string; phone?: string | null; email?: string } = {}

      if (name && typeof name === 'string' && name.trim()) {
        updates.name = name.trim()
      }

      if (phone !== undefined) {
        if (phone && typeof phone === 'string') {
          // Basic phone validation - should start with + for international
          const cleanPhone = phone.trim()
          if (cleanPhone && !cleanPhone.match(/^\+?[\d\s-]{8,}$/)) {
            return NextResponse.json(
              { error: 'Invalid phone number format' },
              { status: 400 }
            )
          }
          updates.phone = cleanPhone || null
        } else {
          updates.phone = null
        }
      }

      if (email !== undefined) {
        if (email && typeof email === 'string') {
          const cleanEmail = email.trim().toLowerCase()
          if (!cleanEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return NextResponse.json(
              { error: 'Invalid email format' },
              { status: 400 }
            )
          }
          updates.email = cleanEmail
        }
      }

      if (Object.keys(updates).length === 0) {
        return NextResponse.json(
          { error: 'No valid fields to update' },
          { status: 400 }
        )
      }

      const updatedUser = await db.user.update({
        where: { id: cleaner.userId },
        data: updates,
      })

      // Log audit event
      await logAudit({
        userId: session.user.id,
        action: 'UPDATE_CLEANER',
        target: cleaner.id,
        targetType: 'CLEANER',
        details: { changes: updates, cleanerName: updatedUser.name },
      })

      return NextResponse.json({
        success: true,
        cleaner: {
          id: cleaner.id,
          name: updatedUser.name,
          phone: updatedUser.phone,
          email: updatedUser.email,
        },
      })
    }

    // Handle vouch action - record (or clear/edit) a vetting note WITHOUT
    // changing status. This is how managers retroactively vouch for
    // already-active cleaners (e.g. Ernesto vouching for Mara), separate
    // from the approve-time vouch captured for PENDING cleaners. Saving an
    // empty note clears all five vetting columns.
    if (action === 'vouch') {
      const trimmedNote = typeof vettedNote === 'string' ? vettedNote.trim() : ''
      const vettingUpdate: VettingFields = trimmedNote
        ? await buildVettingFields(trimmedNote, session.user.name || 'VillaCare')
        : CLEARED_VETTING_FIELDS

      const updatedCleaner = await db.cleaner.update({
        where: { id },
        data: vettingUpdate,
      })

      await logAudit({
        userId: session.user.id,
        action: 'UPDATE_CLEANER',
        target: cleaner.id,
        targetType: 'CLEANER',
        details: {
          cleanerName: cleaner.user.name,
          vouchNoteSet: !!trimmedNote,
        },
      })

      return NextResponse.json({
        success: true,
        cleaner: {
          id: updatedCleaner.id,
          vettedNote: updatedCleaner.vettedNote,
          vettedByName: updatedCleaner.vettedByName,
          vettedAt: updatedCleaner.vettedAt,
        },
      })
    }

    // Validate action for non-edit operations
    if (!action || !['approve', 'suspend', 'activate', 'makeTeamLeader', 'removeTeamLeader'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Handle team leader toggle
    if (action === 'makeTeamLeader' || action === 'removeTeamLeader') {
      const updatedCleaner = await db.cleaner.update({
        where: { id },
        data: { teamLeader: action === 'makeTeamLeader' },
      })

      return NextResponse.json({
        success: true,
        cleaner: {
          id: updatedCleaner.id,
          teamLeader: updatedCleaner.teamLeader,
        },
      })
    }

    // Handle status changes
    let newStatus: 'ACTIVE' | 'SUSPENDED' | 'PENDING'
    switch (action) {
      case 'approve':
        newStatus = 'ACTIVE'
        break
      case 'suspend':
        newStatus = 'SUSPENDED'
        break
      case 'activate':
        newStatus = 'ACTIVE'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Vetting note (vouch) — optional, only captured at approval time. An
    // empty/missing note approves the cleaner without recording a vouch.
    const trimmedApproveNote = action === 'approve' && typeof vettedNote === 'string' ? vettedNote.trim() : ''
    const hasVettedNote = trimmedApproveNote.length > 0
    const updateData: {
      status: 'ACTIVE' | 'SUSPENDED' | 'PENDING'
      vettedNote?: string | null
      vettedByName?: string | null
      vettedAt?: Date | null
      vettedNoteLang?: string | null
      vettedNoteTranslated?: string | null
    } = { status: newStatus }
    if (hasVettedNote) {
      Object.assign(updateData, await buildVettingFields(trimmedApproveNote, session.user.name || 'VillaCare'))
    }

    const updatedCleaner = await db.cleaner.update({
      where: { id },
      data: updateData,
    })

    // Log audit event
    const auditAction = action === 'approve' ? 'APPROVE_CLEANER' : action === 'suspend' ? 'SUSPEND_CLEANER' : 'UPDATE_CLEANER'
    await logAudit({
      userId: session.user.id,
      action: auditAction,
      target: cleaner.id,
      targetType: 'CLEANER',
      details: {
        cleanerName: cleaner.user.name,
        previousStatus: cleaner.status,
        newStatus: newStatus,
        vettedNoteAdded: hasVettedNote,
      },
    })

    // Send welcome email when cleaner is approved (only if previously PENDING)
    if (action === 'approve' && cleaner.status === 'PENDING') {
      triggerCleanerWelcomeEmail(cleaner.id).catch(console.error)
    }

    return NextResponse.json({
      success: true,
      cleaner: {
        id: updatedCleaner.id,
        status: updatedCleaner.status.toLowerCase(),
      },
    })
  } catch (error) {
    console.error('Error updating cleaner:', error)
    return NextResponse.json(
      { error: 'Failed to update cleaner' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/cleaners/[id] - Remove cleaner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !hasStaffAccess(session.user.staffLevel, 'MANAGER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const cleaner = await db.cleaner.findUnique({
      where: { id },
      include: { bookings: true },
    })

    if (!cleaner) {
      return NextResponse.json(
        { error: 'Cleaner not found' },
        { status: 404 }
      )
    }

    // Check for active bookings
    const activeBookings = cleaner.bookings.filter(
      b => b.status === 'PENDING' || b.status === 'CONFIRMED'
    )

    if (activeBookings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete cleaner with active bookings' },
        { status: 400 }
      )
    }

    // Delete cleaner and user
    await db.$transaction([
      db.cleaner.delete({ where: { id } }),
      db.user.delete({ where: { id: cleaner.userId } }),
    ])

    // Log audit event
    await logAudit({
      userId: session.user.id,
      action: 'REJECT_CLEANER',
      target: id,
      targetType: 'CLEANER',
      details: { cleanerUserId: cleaner.userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cleaner:', error)
    return NextResponse.json(
      { error: 'Failed to delete cleaner' },
      { status: 500 }
    )
  }
}
