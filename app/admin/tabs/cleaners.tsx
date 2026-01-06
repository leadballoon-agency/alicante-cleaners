'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Cleaner } from '../page'

type Props = {
  cleaners: Cleaner[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onToggleTeamLeader: (id: string) => void
  onLoginAs: (id: string) => void
}

type Filter = 'all' | 'active' | 'pending'

export default function CleanersTab({ cleaners, onApprove, onReject, onToggleTeamLeader, onLoginAs }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const filteredCleaners = cleaners
    .filter(c => filter === 'all' || c.status === filter)
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    )

  const pendingCount = cleaners.filter(c => c.status === 'pending').length
  const activeCount = cleaners.filter(c => c.status === 'active').length

  const statusColors = {
    pending: 'bg-[#FFF3E0] text-[#E65100]',
    active: 'bg-[#E8F5E9] text-[#2E7D32]',
    suspended: 'bg-[#FFEBEE] text-[#C62828]',
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-[#1A1A1A]">Cleaners</h2>
        <p className="text-sm text-[#6B6B6B]">{activeCount} active, {pendingCount} pending</p>
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
        {(['all', 'pending', 'active'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-white border border-[#EBEBEB] text-[#6B6B6B]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
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
          filteredCleaners.map((cleaner) => (
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
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${statusColors[cleaner.status]}`}>
                      {cleaner.status === 'active' ? '✓ Active' : cleaner.status.charAt(0).toUpperCase() + cleaner.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              {cleaner.status === 'active' && (
                <div className="flex items-center gap-4 text-sm mb-3">
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
                </div>
              )}

              {/* Areas */}
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

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-[#EBEBEB]/50">
                {cleaner.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => onApprove(cleaner.id)}
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
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onLoginAs(cleaner.id)}
                      className="flex-1 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium active:scale-[0.98] transition-transform"
                    >
                      Login As
                    </button>
                    <Link
                      href={`/${cleaner.slug}`}
                      className="flex-1 py-2.5 bg-white border border-[#DEDEDE] text-[#1A1A1A] rounded-xl text-sm font-medium text-center active:scale-[0.98] transition-transform"
                    >
                      View Profile
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
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
