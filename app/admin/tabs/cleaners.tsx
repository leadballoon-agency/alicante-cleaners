'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Cleaner } from '../page'
import { getRelativeTime, CLEANER_STATUS_COLORS } from '@/lib/admin/card-types'

type Props = {
  cleaners: Cleaner[]
  onApprove: (id: string, vettedNote?: string) => void
  onReject: (id: string) => void
  onArchive: (id: string) => void
  onReactivate: (id: string) => void
  onDelete: (id: string) => Promise<void>
  onToggleTeamLeader: (id: string) => void
  onLoginAs: (id: string) => void
  onEdit: (id: string, data: { name?: string; phone?: string; email?: string }) => Promise<void>
  onMessage: (id: string) => void
  onVouch: (id: string, vettedNote: string) => Promise<void>
  // Seeds the search box from a deep link, e.g. /admin?tab=cleaners&search=Maria
  // (used by the cleaner-side "request approval" WhatsApp link so staff land
  // on this tab with the right cleaner already filtered).
  initialSearch?: string
}

type Filter = 'all' | 'active' | 'pending' | 'suspended'

type EditingCleaner = {
  id: string
  name: string
  phone: string
  email: string
} | null

// UI labels the SUSPENDED status as "Archived" — clearer for managers
// (it's reversible and keeps all data, per Ernesto's feedback).
const statusLabel = (s: string) =>
  s === 'active' ? '✓ Active' : s === 'suspended' ? 'Archived' : s.charAt(0).toUpperCase() + s.slice(1)
const statusChipClass = (s: string) =>
  s === 'suspended' ? 'bg-[#F0F0EE] text-[#6B6B6B]' : CLEANER_STATUS_COLORS[s]

const LANG_LABELS: Record<string, string> = {
  es: 'Español', en: 'English', de: 'Deutsch', fr: 'Français', nl: 'Nederlands', it: 'Italiano', pt: 'Português',
}

// Strip everything but digits so a wa.me link works regardless of how the
// phone was entered (+34 612 345 678, 34-612-345-678, etc).
function phoneDigitsOnly(phone: string): string {
  return phone.replace(/\D/g, '')
}

// Spanish-first nudge — these applicants are Spanish-first, and this is the
// one thing standing between them and being approved.
function buildNudgeMessage(firstName: string): string {
  return `¡Hola ${firstName}! Gracias por tu solicitud en VillaCare 🙌 Para poder aprobarte, completa tu perfil: entra en https://alicantecleaners.com e inicia sesión — la guía paso a paso te lo pone fácil (foto + unas líneas sobre ti). ¡Avísame cuando esté listo!`
}

// Nudge for already-APPROVED cleaners with an incomplete profile — the
// motivator here is the homepage showcase, not approval (they're already in).
function buildActiveNudgeMessage(firstName: string): string {
  return `¡Hola ${firstName}! Tu perfil en VillaCare está casi listo 💪 Entra en https://alicantecleaners.com — la guía paso a paso te ayuda a completarlo (foto + unas líneas sobre ti). Los perfiles completos salen destacados en la portada ✨`
}

function whatsAppUrl(phone: string, message: string): string {
  const digits = phoneDigitsOnly(phone)
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

// A profile is "incomplete enough to flag" on an ACTIVE card when its health
// score is below 90 or it's still missing a checklist item — complete
// profiles stay clean with no strip.
function needsHealthNudge(health: { score: number; missing: string[] } | null | undefined): boolean {
  if (!health) return false
  return health.score < 90 || health.missing.length > 0
}

export default function CleanersTab({ cleaners, onApprove, onReject, onArchive, onReactivate, onDelete, onToggleTeamLeader, onLoginAs, onEdit, onMessage, onVouch, initialSearch }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState(initialSearch || '')
  const [editing, setEditing] = useState<EditingCleaner>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  // mode 'approve' -> PENDING → ACTIVE with an optional vouch (existing flow).
  // mode 'vouch' -> retroactive vouch on an already-ACTIVE cleaner; no status
  // change, and saving an empty note clears the vouch.
  const [vouching, setVouching] = useState<{ id: string; name: string; mode: 'approve' | 'vouch' } | null>(null)
  const [vouchNote, setVouchNote] = useState('')
  const [vouchBusy, setVouchBusy] = useState(false)

  const filteredCleaners = cleaners
    .filter(c => filter === 'all' || c.status === filter)
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    )

  const pendingCount = cleaners.filter(c => c.status === 'pending').length
  const activeCount = cleaners.filter(c => c.status === 'active').length
  const archivedCount = cleaners.filter(c => c.status === 'suspended').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-[#1A1A1A]">Cleaners</h2>
        <p className="text-sm text-[#6B6B6B]">{activeCount} active, {pendingCount} pending{archivedCount > 0 ? `, ${archivedCount} archived` : ''}</p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] text-sm focus:outline-none focus:border-[#1A1A1A]"
      />

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'pending', 'active', 'suspended'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-white border border-[#EBEBEB] text-[#6B6B6B]'
            }`}
          >
            {f === 'suspended' ? 'Archived' : f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && pendingCount > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                filter === f ? 'bg-white/20 text-white' : 'bg-[#C4785A] text-white'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cleaner Cards */}
      <div className="space-y-3">
        {filteredCleaners.length === 0 ? (
          <div className="bg-[#F5F5F3] rounded-2xl p-8 text-center">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-[#6B6B6B]">No cleaners found</p>
          </div>
        ) : (
          filteredCleaners.map((cleaner) => {
            // ACTIVE cards only show the health strip/nudge when the profile
            // is still incomplete — PENDING cards always show it (there's no
            // "complete" bar to hide behind before approval).
            const showActiveHealthNudge = cleaner.status === 'active' && needsHealthNudge(cleaner.profileHealth)
            return (
            <div
              key={cleaner.id}
              className={`rounded-2xl p-4 border ${
                cleaner.status === 'pending'
                  ? 'bg-[#FFF8F5] border-[#F5E6E0]'
                  : 'bg-white border-[#EBEBEB]'
              }`}
            >
              {/* Header Row */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden relative flex-shrink-0">
                  {cleaner.photo ? (
                    <Image
                      src={cleaner.photo}
                      alt={cleaner.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-xl">👤</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-[#1A1A1A]">{cleaner.name}</h3>
                      <p className="text-sm text-[#6B6B6B]">{cleaner.phone}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${statusChipClass(cleaner.status)}`}>
                      {statusLabel(cleaner.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile-health strip — quick read on why this cleaner isn't
                  approval-ready (PENDING, always shown) or directory-ready
                  (ACTIVE, only shown while the profile is still incomplete). */}
              {(cleaner.status === 'pending' || showActiveHealthNudge) && cleaner.profileHealth && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-1.5 rounded-full bg-[#F0E6E0] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#C4785A] transition-all"
                        style={{ width: `${Math.max(4, cleaner.profileHealth.score)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-[#B59B8E] whitespace-nowrap">
                      {cleaner.profileHealth.score}% ready
                    </span>
                  </div>
                  {cleaner.profileHealth.missing.length > 0 && (
                    <p className="text-xs text-[#B59B8E]">
                      {cleaner.profileHealth.missing.join(' · ')}
                    </p>
                  )}
                </div>
              )}

              {/* Pending review info — what a manager needs to vet a new cleaner */}
              {cleaner.status === 'pending' && (
                <div className="mb-3 space-y-2">
                  {cleaner.bio ? (
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-[#B59B8E] font-semibold mb-1">About / experience</p>
                      <p className="text-sm text-[#4A4A4A] bg-white border border-[#F0E6E0] rounded-xl p-3 whitespace-pre-wrap">{cleaner.bio}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-[#B59B8E] italic">No bio or experience added yet.</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#6B6B6B]">
                    <span>💶 {cleaner.hourlyRate ? `€${cleaner.hourlyRate}/hr` : 'No rate set'}</span>
                    <span>🗣️ {cleaner.languages && cleaner.languages.length > 0 ? cleaner.languages.map(l => LANG_LABELS[l] || l).join(', ') : 'No languages set'}</span>
                  </div>
                </div>
              )}

              {/* Stats Row */}
              {cleaner.status === 'active' && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mb-3">
                  <div className="flex items-center gap-1">
                    <span className="text-[#C4785A]">★</span>
                    <span className="text-[#1A1A1A]">{cleaner.rating || '-'}</span>
                    <span className="text-[#9B9B9B]">({cleaner.reviewCount})</span>
                  </div>
                  <span className="text-[#6B6B6B]">€{cleaner.hourlyRate}/hr</span>
                  <span className="text-[#6B6B6B]">{cleaner.totalBookings} bookings</span>
                  {cleaner.teamLeader && (
                    <span className="text-[#C4785A] font-medium">👑 Leader</span>
                  )}
                  <span className="text-[#9B9B9B] text-xs">
                    Last seen: {getRelativeTime(cleaner.lastLoginAt)}
                  </span>
                </div>
              )}

              {/* Areas */}
              {cleaner.areas.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {cleaner.areas.map(area => (
                    <span
                      key={area}
                      className="text-xs bg-[#F5F5F3] text-[#6B6B6B] px-2 py-1 rounded-full"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              ) : cleaner.status === 'pending' ? (
                <p className="text-sm text-[#B59B8E] italic mb-3">No service areas selected yet.</p>
              ) : null}

              {/* Actions */}
              <div className="pt-2 border-t border-[#EBEBEB]/50 space-y-2">
                {cleaner.status === 'pending' ? (
                  <>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setVouchNote(''); setVouching({ id: cleaner.id, name: cleaner.name, mode: 'approve' }) }}
                        className="flex-1 py-2.5 bg-[#2E7D32] text-white rounded-xl text-sm font-medium active:scale-[0.98] transition-transform"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onReject(cleaner.id)}
                        className="flex-1 py-2.5 bg-white border border-[#DEDEDE] text-[#6B6B6B] rounded-xl text-sm font-medium active:scale-[0.98] transition-transform"
                      >
                        Reject
                      </button>
                    </div>
                    {/* Nudge — help the applicant become approvable */}
                    <div className="flex gap-2">
                      {cleaner.phone && (
                        <a
                          href={whatsAppUrl(cleaner.phone, buildNudgeMessage(cleaner.name.split(' ')[0] || cleaner.name))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 bg-white border border-[#DEDEDE] text-[#2E7D32] rounded-xl text-sm font-medium text-center active:scale-[0.98] transition-transform"
                          title="Send a WhatsApp nudge to help them complete their profile"
                        >
                          💬 WhatsApp
                        </a>
                      )}
                      <button
                        onClick={() => onMessage(cleaner.id)}
                        className="flex-1 py-2 bg-white border border-[#DEDEDE] text-[#6B6B6B] rounded-xl text-sm font-medium active:scale-[0.98] transition-transform"
                        title="Message this cleaner in-app"
                      >
                        ✉️ Message
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Primary actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => onLoginAs(cleaner.id)}
                        className="flex-1 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium active:scale-[0.98] transition-transform"
                      >
                        Login As
                      </button>
                      <button
                        onClick={() => setEditing({
                          id: cleaner.id,
                          name: cleaner.name,
                          phone: cleaner.phone || '',
                          email: cleaner.email || '',
                        })}
                        className="px-4 py-2.5 bg-white border border-[#DEDEDE] text-[#1A1A1A] rounded-xl text-sm font-medium active:scale-[0.98] transition-transform"
                        title="Edit cleaner details"
                      >
                        Edit
                      </button>
                      <Link
                        href={`/${cleaner.slug}`}
                        className="px-4 py-2.5 bg-white border border-[#DEDEDE] text-[#1A1A1A] rounded-xl text-sm font-medium text-center active:scale-[0.98] transition-transform"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => onToggleTeamLeader(cleaner.id)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition-all ${
                          cleaner.teamLeader
                            ? 'bg-[#C4785A] text-white'
                            : 'bg-white border border-[#DEDEDE] text-[#6B6B6B]'
                        }`}
                        title={cleaner.teamLeader ? 'Remove as team leader' : 'Make team leader'}
                      >
                        👑
                      </button>
                    </div>

                    {/* Vouch — founders/managers can retroactively vouch for
                        an already-active cleaner (e.g. Mara), same modal as
                        the approve-time vouch but no status change. Also
                        shown here so it's easy to find even on complete
                        profiles, unlike the health nudge below. */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setVouchNote(cleaner.vettedNote || '')
                          setVouching({ id: cleaner.id, name: cleaner.name, mode: 'vouch' })
                        }}
                        className="flex-1 py-2 bg-white border border-[#C4785A]/40 text-[#C4785A] rounded-xl text-sm font-medium active:scale-[0.98] transition-transform"
                        title="Record why you trust this cleaner — shown on their public profile"
                      >
                        {cleaner.vettedNote ? '✓ Edit vetting note' : '🤝 Vouch'}
                      </button>
                      {cleaner.status === 'active' && showActiveHealthNudge && cleaner.phone && (
                        <a
                          href={whatsAppUrl(cleaner.phone, buildActiveNudgeMessage(cleaner.name.split(' ')[0] || cleaner.name))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 bg-white border border-[#DEDEDE] text-[#2E7D32] rounded-xl text-sm font-medium text-center active:scale-[0.98] transition-transform"
                          title="Send a WhatsApp nudge to help them complete their profile"
                        >
                          💬 WhatsApp
                        </a>
                      )}
                    </div>

                    {/* Management: archive (reversible) vs delete (permanent) */}
                    <div className="flex gap-2">
                      {cleaner.status === 'suspended' ? (
                        <button
                          onClick={() => onReactivate(cleaner.id)}
                          className="flex-1 py-2 bg-[#E8F5E9] border border-[#2E7D32]/30 text-[#2E7D32] rounded-xl text-sm font-medium active:scale-[0.98] transition-transform"
                          title="Restore this cleaner to the active list"
                        >
                          ↩︎ Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => onArchive(cleaner.id)}
                          className="flex-1 py-2 bg-white border border-[#DEDEDE] text-[#6B6B6B] rounded-xl text-sm font-medium active:scale-[0.98] transition-transform"
                          title="Hide from the active list but keep all their information. You can reactivate them later."
                        >
                          🗄 Archive
                        </button>
                      )}
                      <button
                        onClick={() => { setDeleteError(''); setDeleting({ id: cleaner.id, name: cleaner.name }) }}
                        className="px-4 py-2 bg-white border border-[#F0D6D6] text-[#C62828] rounded-xl text-sm font-medium active:scale-[0.98] transition-transform"
                        title="Permanently delete this cleaner and their account"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            )
          })
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Edit Cleaner</h2>
              <button
                onClick={() => setEditing(null)}
                className="text-[#9B9B9B] hover:text-[#1A1A1A]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editing.phone}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none"
                  placeholder="+34 612 345 678"
                />
                <p className="text-xs text-[#9B9B9B] mt-1">
                  Used for login and contact. Include country code.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={editing.email}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] focus:border-[#1A1A1A] focus:outline-none"
                  placeholder="cleaner@email.com"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-3 rounded-xl border border-[#DEDEDE] text-[#6B6B6B] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setSaving(true)
                  try {
                    await onEdit(editing.id, {
                      name: editing.name,
                      phone: editing.phone,
                      email: editing.email,
                    })
                    setEditing(null)
                  } catch (err) {
                    console.error('Error saving:', err)
                  } finally {
                    setSaving(false)
                  }
                }}
                disabled={saving || !editing.name.trim()}
                className="flex-1 py-3 rounded-xl bg-[#1A1A1A] text-white font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation — permanent, so require an explicit confirm */}
      {deleting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FFEBEE] flex items-center justify-center flex-shrink-0 text-lg">⚠️</div>
              <div>
                <h2 className="text-lg font-semibold text-[#1A1A1A]">Delete {deleting.name}?</h2>
                <p className="text-sm text-[#6B6B6B] mt-1">
                  This permanently removes their profile and account. This <strong>cannot be undone</strong>.
                  If you only want to take them off the active list, use <strong>Archive</strong> instead.
                </p>
              </div>
            </div>

            {deleteError && (
              <p className="text-sm text-[#C62828] bg-[#FFEBEE] rounded-xl p-3 mb-3">{deleteError}</p>
            )}

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => { setDeleting(null); setDeleteError('') }}
                disabled={deleteBusy}
                className="flex-1 py-3 rounded-xl border border-[#DEDEDE] text-[#6B6B6B] font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setDeleteBusy(true)
                  setDeleteError('')
                  try {
                    await onDelete(deleting.id)
                    setDeleting(null)
                  } catch (err) {
                    setDeleteError((err as Error)?.message || 'Could not delete this cleaner.')
                  } finally {
                    setDeleteBusy(false)
                  }
                }}
                disabled={deleteBusy}
                className="flex-1 py-3 rounded-xl bg-[#C62828] text-white font-medium disabled:opacity-50"
              >
                {deleteBusy ? 'Deleting...' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vouch modal — shared by two entry points:
          - mode 'approve': shown before Approve (PENDING → ACTIVE). Optional
            note; empty note still approves, it just skips recording a vouch.
          - mode 'vouch': retroactive vouch on an already-ACTIVE cleaner, no
            status change. Prefilled when a note already exists; saving an
            empty note clears it. */}
      {vouching && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Vouch for {vouching.name}</h2>
              <button
                onClick={() => setVouching(null)}
                className="text-[#9B9B9B] hover:text-[#1A1A1A]"
                disabled={vouchBusy}
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-[#6B6B6B] mb-3">
              Why do you trust this cleaner? (shown on their public profile)
            </p>
            <textarea
              value={vouchNote}
              onChange={(e) => setVouchNote(e.target.value)}
              rows={4}
              placeholder="e.g. how you met them, who referred them, experience you know of"
              className="w-full px-4 py-3 rounded-xl border border-[#DEDEDE] text-sm focus:outline-none focus:border-[#1A1A1A] resize-none"
            />
            <p className="text-xs text-[#9B9B9B] mt-1.5">
              {vouching.mode === 'approve'
                ? 'Optional but encouraged — this becomes a trust signal on their profile, separate from customer reviews.'
                : 'Leave blank and save to remove an existing vouch. Auto-translated for owners reading in the other language.'}
            </p>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setVouching(null)}
                disabled={vouchBusy}
                className="flex-1 py-3 rounded-xl border border-[#DEDEDE] text-[#6B6B6B] font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setVouchBusy(true)
                  try {
                    if (vouching.mode === 'approve') {
                      await onApprove(vouching.id, vouchNote.trim())
                    } else {
                      await onVouch(vouching.id, vouchNote.trim())
                    }
                    setVouching(null)
                    setVouchNote('')
                  } finally {
                    setVouchBusy(false)
                  }
                }}
                disabled={vouchBusy}
                className={`flex-1 py-3 rounded-xl text-white font-medium disabled:opacity-50 ${
                  vouching.mode === 'approve' ? 'bg-[#2E7D32]' : 'bg-[#C4785A]'
                }`}
              >
                {vouchBusy
                  ? (vouching.mode === 'approve' ? 'Approving...' : 'Saving...')
                  : (vouching.mode === 'approve' ? 'Approve' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
