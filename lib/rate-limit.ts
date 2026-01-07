import { db } from './db'

type RateLimitConfig = {
  maxRequests: number  // Max requests per window
  windowMs: number     // Window size in milliseconds
}

// Default configs for different endpoint types
export const RATE_LIMITS = {
  // OTP: Prevent brute-force attacks
  otp: { maxRequests: 5, windowMs: 15 * 60 * 1000 },    // 5 per 15 minutes
  // Auth: Prevent credential stuffing
  auth: { maxRequests: 10, windowMs: 15 * 60 * 1000 },  // 10 per 15 minutes
  // Bookings: Prevent spam
  booking: { maxRequests: 10, windowMs: 60 * 1000 },    // 10 per minute
  // Messages: Prevent spam
  message: { maxRequests: 30, windowMs: 60 * 1000 },    // 30 per minute
  // API general
  api: { maxRequests: 100, windowMs: 60 * 1000 },       // 100 per minute
} as const

type RateLimitResult = {
  success: boolean
  remaining: number
  reset: Date
  retryAfter?: number  // Seconds until can retry
}

/**
 * Check if a request is within rate limits
 * Uses database for state (works in serverless)
 *
 * @param identifier - Unique identifier (IP, user ID, phone number)
 * @param endpoint - The endpoint being accessed (for tracking)
 * @param config - Rate limit configuration
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - config.windowMs)
  const key = `${endpoint}:${identifier}`

  try {
    // Count requests in current window
    const requestCount = await db.rateLimitEntry.count({
      where: {
        key,
        createdAt: { gte: windowStart },
      },
    })

    if (requestCount >= config.maxRequests) {
      // Rate limited - find when window resets
      const oldestInWindow = await db.rateLimitEntry.findFirst({
        where: {
          key,
          createdAt: { gte: windowStart },
        },
        orderBy: { createdAt: 'asc' },
      })

      const resetTime = oldestInWindow
        ? new Date(oldestInWindow.createdAt.getTime() + config.windowMs)
        : new Date(now.getTime() + config.windowMs)

      return {
        success: false,
        remaining: 0,
        reset: resetTime,
        retryAfter: Math.ceil((resetTime.getTime() - now.getTime()) / 1000),
      }
    }

    // Record this request
    await db.rateLimitEntry.create({
      data: { key },
    })

    // Clean up old entries (older than window) - do async, don't wait
    cleanupOldEntries(key, windowStart).catch(console.error)

    return {
      success: true,
      remaining: config.maxRequests - requestCount - 1,
      reset: new Date(now.getTime() + config.windowMs),
    }
  } catch (error) {
    // If rate limiting fails, behavior depends on endpoint criticality
    console.error('Rate limit check failed:', error)
    return {
      success: true, // Default fail-open for non-critical endpoints
      remaining: config.maxRequests,
      reset: new Date(now.getTime() + config.windowMs),
    }
  }
}

/**
 * Check rate limit with fail-closed behavior (for security-critical endpoints)
 * If DB errors occur, request is DENIED (prevents brute-force during outages)
 */
export async function checkRateLimitStrict(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - config.windowMs)
  const key = `${endpoint}:${identifier}`

  try {
    const requestCount = await db.rateLimitEntry.count({
      where: {
        key,
        createdAt: { gte: windowStart },
      },
    })

    if (requestCount >= config.maxRequests) {
      const oldestInWindow = await db.rateLimitEntry.findFirst({
        where: { key, createdAt: { gte: windowStart } },
        orderBy: { createdAt: 'asc' },
      })

      const resetTime = oldestInWindow
        ? new Date(oldestInWindow.createdAt.getTime() + config.windowMs)
        : new Date(now.getTime() + config.windowMs)

      return {
        success: false,
        remaining: 0,
        reset: resetTime,
        retryAfter: Math.ceil((resetTime.getTime() - now.getTime()) / 1000),
      }
    }

    await db.rateLimitEntry.create({ data: { key } })
    cleanupOldEntries(key, windowStart).catch(console.error)

    return {
      success: true,
      remaining: config.maxRequests - requestCount - 1,
      reset: new Date(now.getTime() + config.windowMs),
    }
  } catch (error) {
    // FAIL-CLOSED: If rate limiting fails, DENY the request
    // This prevents brute-force attacks during DB outages
    console.error('Rate limit check failed (strict mode - denying):', error)
    return {
      success: false,
      remaining: 0,
      reset: new Date(now.getTime() + 60000), // Retry in 1 minute
      retryAfter: 60,
    }
  }
}

/**
 * Clean up expired rate limit entries
 */
async function cleanupOldEntries(key: string, windowStart: Date): Promise<void> {
  await db.rateLimitEntry.deleteMany({
    where: {
      key,
      createdAt: { lt: windowStart },
    },
  })
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
  // Try various headers for real IP (Vercel, Cloudflare, etc.)
  const headers = new Headers(request.headers)

  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Vercel specific
  const vercelIp = headers.get('x-vercel-forwarded-for')
  if (vercelIp) {
    return vercelIp.split(',')[0].trim()
  }

  // Fallback to unknown
  return 'unknown'
}

/**
 * Helper to create rate limit response headers
 */
export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toISOString(),
    ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() }),
  }
}
