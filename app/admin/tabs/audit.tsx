'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatAuditAction, getRelativeTime } from '@/lib/audit-utils'

type AuditLog = {
  id: string
  userId: string
  action: string
  target: string | null
  targetType: string | null
  details: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string | null
    role: string
  }
}

type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-[#E3F2FD] text-[#1565C0]',
  LOGOUT: 'bg-[#F5F5F3] text-[#6B6B6B]',
  IMPERSONATE_START: 'bg-[#FFF3E0] text-[#E65100]',
  IMPERSONATE_END: 'bg-[#FFF3E0] text-[#E65100]',
  APPROVE_CLEANER: 'bg-[#E8F5E9] text-[#2E7D32]',
  REJECT_CLEANER: 'bg-[#FFEBEE] text-[#C75050]',
  SUSPEND_CLEANER: 'bg-[#FFEBEE] text-[#C75050]',
  UPDATE_CLEANER: 'bg-[#E3F2FD] text-[#1565C0]',
  FEATURE_CLEANER: 'bg-[#F3E5F5] text-[#7B1FA2]',
  APPROVE_REVIEW: 'bg-[#E8F5E9] text-[#2E7D32]',
  REJECT_REVIEW: 'bg-[#FFEBEE] text-[#C75050]',
  UPDATE_OWNER: 'bg-[#E3F2FD] text-[#1565C0]',
  UPDATE_BOOKING: 'bg-[#E3F2FD] text-[#1565C0]',
  SEND_MESSAGE: 'bg-[#F5F5F3] text-[#6B6B6B]',
}

const ACTION_ICONS: Record<string, string> = {
  LOGIN: '🔑',
  LOGOUT: '👋',
  IMPERSONATE_START: '🎭',
  IMPERSONATE_END: '🎭',
  APPROVE_CLEANER: '✅',
  REJECT_CLEANER: '❌',
  SUSPEND_CLEANER: '⏸️',
  UPDATE_CLEANER: '✏️',
  FEATURE_CLEANER: '⭐',
  APPROVE_REVIEW: '✅',
  REJECT_REVIEW: '❌',
  UPDATE_OWNER: '✏️',
  UPDATE_BOOKING: '📋',
  SEND_MESSAGE: '💬',
}

export default function AuditTab() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState<string>('')
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (actionFilter) {
        params.set('action', actionFilter)
      }

      const response = await fetch(`/api/admin/audit?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        setPagination(data.pagination)
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err)
    } finally {
      setLoading(false)
    }
  }, [actionFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handlePageChange = (newPage: number) => {
    fetchLogs(newPage)
  }

  const actionTypes = [
    { value: '', label: 'All Actions' },
    { value: 'LOGIN', label: 'Logins' },
    { value: 'IMPERSONATE_START', label: 'Impersonations' },
    { value: 'APPROVE_CLEANER', label: 'Approvals' },
    { value: 'REJECT_CLEANER', label: 'Rejections' },
    { value: 'SUSPEND_CLEANER', label: 'Suspensions' },
    { value: 'UPDATE_CLEANER', label: 'Updates' },
  ]

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-[#1A1A1A]">Audit Log</h1>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-[#EBEBEB] animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F5F5F3]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#F5F5F3] rounded w-1/2" />
                  <div className="h-3 bg-[#F5F5F3] rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A]">Audit Log</h1>
          <p className="text-sm text-[#6B6B6B]">{pagination.total} events recorded</p>
        </div>
        <button
          onClick={() => fetchLogs(1)}
          className="p-2 rounded-xl bg-[#F5F5F3] hover:bg-[#EBEBEB] transition-colors"
          title="Refresh"
        >
          <span className="text-lg">🔄</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {actionTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setActionFilter(type.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              actionFilter === type.value
                ? 'bg-[#1A1A1A] text-white'
                : 'bg-white text-[#1A1A1A] border border-[#EBEBEB] hover:border-[#1A1A1A]'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Log List */}
      <div className="space-y-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className="bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden"
          >
            <button
              onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
              className="w-full p-4 text-left"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                  ACTION_COLORS[log.action] || 'bg-[#F5F5F3] text-[#6B6B6B]'
                }`}>
                  {ACTION_ICONS[log.action] || '📝'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-[#1A1A1A]">
                        {formatAuditAction(log.action)}
                      </p>
                      <p className="text-sm text-[#6B6B6B]">
                        by {log.user.name || log.user.email || 'Unknown'}
                      </p>
                    </div>
                    <span className="text-xs text-[#9B9B9B] whitespace-nowrap">
                      {getRelativeTime(new Date(log.createdAt))}
                    </span>
                  </div>

                  {/* Target info */}
                  {log.targetType && (
                    <div className="mt-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        ACTION_COLORS[log.action] || 'bg-[#F5F5F3] text-[#6B6B6B]'
                      }`}>
                        {log.targetType}
                      </span>
                    </div>
                  )}
                </div>

                {/* Expand indicator */}
                <span className={`text-[#9B9B9B] transition-transform ${
                  expandedLogId === log.id ? 'rotate-180' : ''
                }`}>
                  ▼
                </span>
              </div>
            </button>

            {/* Expanded details */}
            {expandedLogId === log.id && (
              <div className="px-4 pb-4 pt-0 border-t border-[#EBEBEB] mt-2">
                <div className="grid grid-cols-2 gap-3 text-sm pt-3">
                  {log.target && (
                    <div>
                      <p className="text-[#9B9B9B] text-xs">Target ID</p>
                      <p className="text-[#1A1A1A] font-mono text-xs break-all">{log.target}</p>
                    </div>
                  )}
                  {log.ipAddress && (
                    <div>
                      <p className="text-[#9B9B9B] text-xs">IP Address</p>
                      <p className="text-[#1A1A1A]">{log.ipAddress}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-[#9B9B9B] text-xs">Timestamp</p>
                    <p className="text-[#1A1A1A]">
                      {new Date(log.createdAt).toLocaleString('en-GB', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="col-span-2">
                      <p className="text-[#9B9B9B] text-xs mb-1">Details</p>
                      <div className="bg-[#F5F5F3] rounded-lg p-2 font-mono text-xs overflow-x-auto">
                        <pre className="whitespace-pre-wrap break-all">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  {log.userAgent && (
                    <div className="col-span-2">
                      <p className="text-[#9B9B9B] text-xs">User Agent</p>
                      <p className="text-[#6B6B6B] text-xs break-all">{log.userAgent}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {logs.length === 0 && (
          <div className="bg-white rounded-2xl p-8 border border-[#EBEBEB] text-center">
            <span className="text-4xl block mb-4">📋</span>
            <h3 className="font-medium text-[#1A1A1A] mb-2">No audit logs yet</h3>
            <p className="text-sm text-[#6B6B6B]">
              Admin actions will be recorded here for review
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-[#EBEBEB] disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#1A1A1A] transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-[#6B6B6B]">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-[#EBEBEB] disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#1A1A1A] transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
