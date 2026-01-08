/**
 * Just-in-Time Access Control for Sensitive Property Information
 *
 * Controls when cleaners can view access notes (key locations, codes, etc.)
 * to minimize exposure window.
 */

import { decryptAccessNotes } from './encryption'

// Hours before booking when access notes become visible
const ACCESS_WINDOW_HOURS = 24

/**
 * Check if a cleaner can view access notes for a booking
 * Access notes are only visible within 24 hours of the booking date/time
 */
export function canViewAccessNotes(bookingDate: Date, bookingTime: string): boolean {
  const now = new Date()

  // Parse booking datetime
  const [hours, minutes] = bookingTime.split(':').map(Number)
  const bookingDateTime = new Date(bookingDate)
  bookingDateTime.setHours(hours || 9, minutes || 0, 0, 0)

  // Calculate the access window start (24 hours before booking)
  const accessWindowStart = new Date(bookingDateTime)
  accessWindowStart.setHours(accessWindowStart.getHours() - ACCESS_WINDOW_HOURS)

  // Access is allowed from 24h before until the booking time
  return now >= accessWindowStart && now <= bookingDateTime
}

/**
 * Get access notes with just-in-time control
 * Returns the decrypted notes if within access window, otherwise returns a message
 */
export function getAccessNotesWithJIT(
  encryptedNotes: string | null,
  bookingDate: Date,
  bookingTime: string
): { notes: string | null; canView: boolean; availableAt: Date | null } {
  if (!encryptedNotes) {
    return { notes: null, canView: true, availableAt: null }
  }

  // Parse booking datetime
  const [hours, minutes] = bookingTime.split(':').map(Number)
  const bookingDateTime = new Date(bookingDate)
  bookingDateTime.setHours(hours || 9, minutes || 0, 0, 0)

  // Calculate when access becomes available
  const accessWindowStart = new Date(bookingDateTime)
  accessWindowStart.setHours(accessWindowStart.getHours() - ACCESS_WINDOW_HOURS)

  const now = new Date()

  // Check if booking is in the past (completed)
  if (now > bookingDateTime) {
    // After booking, hide access notes
    return {
      notes: null,
      canView: false,
      availableAt: null,
    }
  }

  // Check if within access window
  if (now >= accessWindowStart) {
    // Within 24 hours - decrypt and return
    const decrypted = decryptAccessNotes(encryptedNotes)
    return {
      notes: decrypted,
      canView: true,
      availableAt: null,
    }
  }

  // Not yet within access window
  return {
    notes: null,
    canView: false,
    availableAt: accessWindowStart,
  }
}

/**
 * Format the "available at" time for display
 */
export function formatAccessAvailableAt(availableAt: Date): string {
  const now = new Date()
  const diffMs = availableAt.getTime() - now.getTime()
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))

  if (diffHours <= 1) {
    const diffMins = Math.ceil(diffMs / (1000 * 60))
    return `Available in ${diffMins} minutes`
  } else if (diffHours <= 24) {
    return `Available in ${diffHours} hours`
  } else {
    const diffDays = Math.ceil(diffHours / 24)
    return `Available in ${diffDays} days`
  }
}

/**
 * Type for access notes result
 */
export type AccessNotesResult = {
  notes: string | null
  canView: boolean
  availableAt: Date | null
  message?: string
}

/**
 * Get access notes with formatted message for UI
 */
export function getAccessNotesForUI(
  encryptedNotes: string | null,
  bookingDate: Date,
  bookingTime: string
): AccessNotesResult {
  const result = getAccessNotesWithJIT(encryptedNotes, bookingDate, bookingTime)

  if (result.canView) {
    return result
  }

  if (result.availableAt) {
    return {
      ...result,
      message: formatAccessAvailableAt(result.availableAt),
    }
  }

  return {
    ...result,
    message: 'Access notes are no longer available for past bookings',
  }
}
