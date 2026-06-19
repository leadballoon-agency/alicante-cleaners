// Staff access control — decoupled from `role` so one user can be BOTH a
// CLEANER (e.g. a specialist on a team) AND a platform operator.
//
// Why an env-var allowlist of user IDs rather than a DB column:
//  - No schema migration / no risk of locking the founder out mid-deploy.
//  - Staff is a tiny set (founder + 1–2 operators); changing it is rare and
//    a redeploy is an acceptable (even desirable) gate for granting power.
//  - Keyed on USER ID, which every session carries regardless of whether the
//    person logged in by email (owners/admin) or phone OTP (cleaners).
// If staff ever grows large, swap computeStaffLevel() to read a DB column —
// every caller goes through this one function, so nothing else changes.
//
// IMPORTANT: this module must stay edge-safe (no DB, no Node-only APIs) so it
// can be imported by middleware.

export type StaffLevel = 'NONE' | 'MANAGER' | 'ADMIN'

function parseIds(raw: string | undefined): string[] {
  return (raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Resolve a user's staff level from env allowlists, with a role fallback.
 * Fallback: any legacy `role === 'ADMIN'` user is treated as ADMIN so the
 * founder can never be locked out, even if the env lists are empty/misconfigured.
 */
export function computeStaffLevel(user: { id?: string | null; role?: string | null } | null | undefined): StaffLevel {
  if (!user) return 'NONE'
  const id = user.id || ''
  const adminIds = parseIds(process.env.PLATFORM_ADMIN_IDS)
  const managerIds = parseIds(process.env.PLATFORM_MANAGER_IDS)

  if (id && adminIds.includes(id)) return 'ADMIN'
  if (user.role === 'ADMIN') return 'ADMIN' // legacy fallback — never lock out the founder
  if (id && managerIds.includes(id)) return 'MANAGER'
  return 'NONE'
}

/** True if the user meets at least the required level. */
export function hasStaffAccess(
  level: StaffLevel | null | undefined,
  required: StaffLevel = 'MANAGER'
): boolean {
  if (required === 'ADMIN') return level === 'ADMIN'
  if (required === 'MANAGER') return level === 'ADMIN' || level === 'MANAGER'
  return true
}
