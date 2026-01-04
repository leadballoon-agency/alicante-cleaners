'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Cleaner } from '../page'

type Props = {
  cleaners: Cleaner[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

type Filter = 'all' | 'active' | 'pending'

export default function CleanersTab({ cleaners, onApprove, onReject }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const filteredCleaners = cleaners
    .filter(c => filter === 'all' || c.status === filter)
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    )

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const pendingCount = cleaners.filter(c => c.status === 'pending').length
  const activeCount = cleaners.filter(c => c.status === 'active').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Cleaners</h2>
          <p className="text-sm text-[#6B6B6B]">{activeCount} active, {pendingCount} pending approval</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search cleaners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-lg border border-[#DEDEDE] text-sm focus:outline-none focus:border-[#1A1A1A]"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'active'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-white border border-[#EBEBEB] text-[#6B6B6B] hover:bg-[#F5F5F3]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-[#C4785A] text-white">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pending applications */}
      {filter !== 'active' && pendingCount > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[#6B6B6B]">Pending Applications</h3>
          {filteredCleaners
            .filter(c => c.status === 'pending')
            .map((cleaner) => (
              <div key={cleaner.id} className="bg-[#FFF8F5] rounded-xl p-4 border border-[#F5E6E0]">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#F5F5F3] flex items-center justify-center">
                      <span className="text-xl">👤</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-[#1A1A1A]">{cleaner.name}</h4>
                      <p className="text-sm text-[#6B6B6B]">{cleaner.email}</p>
                      <p className="text-sm text-[#6B6B6B]">{cleaner.phone}</p>
                      <div className="flex gap-2 mt-2">
                        {cleaner.areas.map(area => (
                          <span key={area} className="text-xs bg-white px-2 py-1 rounded-full text-[#6B6B6B]">
                            {area}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-[#6B6B6B] mt-2">
                        €{cleaner.hourlyRate}/hour · Applied {formatDate(cleaner.joinedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onApprove(cleaner.id)}
                      className="px-4 py-2 bg-[#2E7D32] text-white rounded-lg text-sm font-medium hover:bg-[#1B5E20] transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onReject(cleaner.id)}
                      className="px-4 py-2 bg-white border border-[#DEDEDE] text-[#6B6B6B] rounded-lg text-sm font-medium hover:bg-[#F5F5F3] transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Active cleaners table */}
      {filter !== 'pending' && (
        <div>
          <h3 className="text-sm font-medium text-[#6B6B6B] mb-3">Active Cleaners</h3>
          <div className="bg-white rounded-xl border border-[#EBEBEB] overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#F5F5F3] border-b border-[#EBEBEB]">
                <tr>
                  <th className="text-left text-xs font-medium text-[#6B6B6B] px-4 py-3">Cleaner</th>
                  <th className="text-left text-xs font-medium text-[#6B6B6B] px-4 py-3">Areas</th>
                  <th className="text-left text-xs font-medium text-[#6B6B6B] px-4 py-3">Rate</th>
                  <th className="text-left text-xs font-medium text-[#6B6B6B] px-4 py-3">Bookings</th>
                  <th className="text-left text-xs font-medium text-[#6B6B6B] px-4 py-3">Rating</th>
                  <th className="text-left text-xs font-medium text-[#6B6B6B] px-4 py-3">Joined</th>
                  <th className="text-right text-xs font-medium text-[#6B6B6B] px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBEB]">
                {filteredCleaners
                  .filter(c => c.status === 'active')
                  .map((cleaner) => (
                    <tr key={cleaner.id} className="hover:bg-[#F5F5F3]/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center">
                            <span className="text-sm">👤</span>
                          </div>
                          <div>
                            <p className="font-medium text-[#1A1A1A] text-sm">{cleaner.name}</p>
                            <p className="text-xs text-[#6B6B6B]">{cleaner.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {cleaner.areas.slice(0, 2).map(area => (
                            <span key={area} className="text-xs bg-[#F5F5F3] px-2 py-0.5 rounded text-[#6B6B6B]">
                              {area}
                            </span>
                          ))}
                          {cleaner.areas.length > 2 && (
                            <span className="text-xs text-[#6B6B6B]">+{cleaner.areas.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#1A1A1A]">€{cleaner.hourlyRate}/h</td>
                      <td className="px-4 py-3 text-sm text-[#1A1A1A]">{cleaner.totalBookings}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-[#C4785A]">★</span>
                          <span className="text-sm text-[#1A1A1A]">{cleaner.rating || '-'}</span>
                          <span className="text-xs text-[#6B6B6B]">({cleaner.reviewCount})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6B6B6B]">{formatDate(cleaner.joinedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/${cleaner.slug}`}
                          className="text-sm text-[#C4785A] font-medium hover:underline"
                        >
                          View profile
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
