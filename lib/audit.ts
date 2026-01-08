/**
 * Server-only audit functions
 * These functions use next/headers and can only be used in server components and API routes
 *
 * IMPORTANT: For client components, import from '@/lib/audit-utils' instead
 */

import { db } from './db'
import { headers } from 'next/headers'
import type { AuditAction, TargetType } from './audit-utils'
import { Prisma } from '@prisma/client'

export type { AuditAction, TargetType }

interface AuditLogParams {
  userId: string
  action: AuditAction
  target?: string
  targetType?: TargetType
  details?: Record<string, unknown>
}

/**
 * Log an audit event to the database
 *
 * @example
 * await logAudit({
 *   userId: adminId,
 *   action: 'APPROVE_CLEANER',
 *   target: cleanerId,
 *   targetType: 'CLEANER',
 *   details: { reason: 'Profile complete' }
 * })
 */
export async function logAudit({
  userId,
  action,
  target,
  targetType,
  details,
}: AuditLogParams): Promise<void> {
  try {
    // Get request info if available
    let ipAddress: string | undefined
    let userAgent: string | undefined

    try {
      const headersList = await headers()
      // Get IP from various headers (Vercel, Cloudflare, etc.)
      ipAddress =
        headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headersList.get('x-real-ip') ||
        headersList.get('cf-connecting-ip') ||
        undefined
      userAgent = headersList.get('user-agent') || undefined
    } catch {
      // Headers not available in this context (e.g., during auth callback)
    }

    await db.auditLog.create({
      data: {
        userId,
        action,
        target,
        targetType,
        details: details ? (details as Prisma.InputJsonValue) : undefined,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    // Log error but don't throw - audit logging should not break operations
    console.error('Failed to log audit event:', error)
  }
}

/**
 * Get audit logs with pagination and filters
 */
export async function getAuditLogs({
  userId,
  action,
  targetType,
  startDate,
  endDate,
  page = 1,
  limit = 50,
}: {
  userId?: string
  action?: AuditAction
  targetType?: TargetType
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}) {
  const where: {
    userId?: string
    action?: AuditAction
    targetType?: TargetType
    createdAt?: { gte?: Date; lte?: Date }
  } = {}

  if (userId) where.userId = userId
  if (action) where.action = action
  if (targetType) where.targetType = targetType
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.auditLog.count({ where }),
  ])

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

