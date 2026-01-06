/**
 * OpenAI Function Tools for AI Sales Agent
 *
 * These tools allow the AI to:
 * 1. check_availability - Query the cleaner's calendar for specific dates
 * 2. create_booking - Create a confirmed booking directly
 *
 * Tool execution happens server-side with full database access.
 */

import { db } from '@/lib/db'
import { ChatCompletionTool } from 'openai/resources/chat/completions'
import type { SalesAgentContext } from './sales-agent'

/**
 * Tool definitions for OpenAI function calling
 */
export const salesAgentTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'check_availability',
      description: 'Check if the cleaner is available on specific dates. Use this before confirming a booking.',
      parameters: {
        type: 'object',
        properties: {
          dates: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of dates to check in YYYY-MM-DD format',
          },
        },
        required: ['dates'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_booking',
      description: 'Create a confirmed booking for the owner. Only use after confirming all details with the owner.',
      parameters: {
        type: 'object',
        properties: {
          service: {
            type: 'string',
            enum: ['Regular clean', 'Deep clean', 'Arrival prep'],
            description: 'Type of cleaning service',
          },
          date: {
            type: 'string',
            description: 'Booking date in YYYY-MM-DD format',
          },
          time: {
            type: 'string',
            description: 'Preferred start time in HH:MM format (e.g., "10:00")',
          },
          propertyAddress: {
            type: 'string',
            description: 'Property address if not already known from conversation',
          },
          notes: {
            type: 'string',
            description: 'Any special instructions from the owner',
          },
        },
        required: ['service', 'date', 'time'],
      },
    },
  },
]

export interface ToolResult {
  success: boolean
  message: string
  data?: Record<string, unknown>
  bookingId?: string
}

/**
 * Check availability for specific dates
 */
async function checkAvailability(
  dates: string[],
  context: SalesAgentContext
): Promise<ToolResult> {
  const results: { date: string; available: boolean; reason?: string }[] = []

  for (const dateStr of dates) {
    const date = new Date(dateStr)

    // Check if date is in the past
    if (date < new Date()) {
      results.push({ date: dateStr, available: false, reason: 'Date is in the past' })
      continue
    }

    // Check existing bookings
    const existingBooking = await db.booking.findFirst({
      where: {
        cleanerId: context.cleanerId,
        date: {
          gte: new Date(dateStr),
          lt: new Date(new Date(dateStr).getTime() + 24 * 60 * 60 * 1000),
        },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    })

    if (existingBooking) {
      results.push({ date: dateStr, available: false, reason: 'Already booked' })
      continue
    }

    // Check calendar blocks
    const block = await db.cleanerAvailability.findFirst({
      where: {
        cleanerId: context.cleanerId,
        date: new Date(dateStr),
        isAvailable: false,
      },
    })

    if (block) {
      results.push({ date: dateStr, available: false, reason: block.title || 'Blocked' })
      continue
    }

    results.push({ date: dateStr, available: true })
  }

  const available = results.filter(r => r.available).map(r => r.date)
  const unavailable = results.filter(r => !r.available)

  let message = ''
  if (available.length > 0) {
    message += `Available: ${available.join(', ')}. `
  }
  if (unavailable.length > 0) {
    message += `Unavailable: ${unavailable.map(r => `${r.date} (${r.reason})`).join(', ')}.`
  }

  return {
    success: true,
    message,
    data: { results },
  }
}

/**
 * Create a booking on behalf of the owner
 */
async function createBooking(
  params: {
    service: string
    date: string
    time: string
    propertyAddress?: string
    notes?: string
  },
  context: SalesAgentContext
): Promise<ToolResult> {
  // Service hours mapping
  const serviceHours: Record<string, number> = {
    'Regular clean': 3,
    'Deep clean': 5,
    'Arrival prep': 4,
  }

  const hours = serviceHours[params.service] || 3
  const price = context.hourlyRate * hours

  // Get owner and property
  const conversation = await db.conversation.findUnique({
    where: { id: context.conversationId },
    include: {
      owner: true,
      property: true,
    },
  })

  if (!conversation) {
    return {
      success: false,
      message: 'Could not find conversation details',
    }
  }

  if (!conversation.ownerId) {
    return {
      success: false,
      message: 'This conversation is not associated with an owner. Cannot create booking.',
    }
  }

  // Find or use property
  let propertyId = conversation.propertyId

  if (!propertyId && conversation.ownerId) {
    // Try to find property by address or create a placeholder
    if (params.propertyAddress) {
      const existingProperty = await db.property.findFirst({
        where: {
          ownerId: conversation.ownerId,
          address: { contains: params.propertyAddress },
        },
      })

      if (existingProperty) {
        propertyId = existingProperty.id
      } else {
        // Create new property
        const newProperty = await db.property.create({
          data: {
            ownerId: conversation.ownerId,
            name: 'My Villa',
            address: params.propertyAddress,
            bedrooms: 2, // Default
            bathrooms: 1, // Default
          },
        })
        propertyId = newProperty.id
      }
    } else {
      // Use first property if exists
      const firstProperty = await db.property.findFirst({
        where: { ownerId: conversation.ownerId },
      })

      if (firstProperty) {
        propertyId = firstProperty.id
      } else {
        return {
          success: false,
          message: 'No property found. Please ask for the property address.',
        }
      }
    }
  }

  if (!propertyId) {
    return {
      success: false,
      message: 'No property found. Please ask for the property address.',
    }
  }

  // Verify availability one more time
  const bookingDate = new Date(params.date)
  const existingBooking = await db.booking.findFirst({
    where: {
      cleanerId: context.cleanerId,
      date: {
        gte: bookingDate,
        lt: new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000),
      },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
  })

  if (existingBooking) {
    return {
      success: false,
      message: `Sorry, ${params.date} is no longer available. Please suggest another date.`,
    }
  }

  // Create the booking as CONFIRMED (AI has authority)
  const booking = await db.booking.create({
    data: {
      cleanerId: context.cleanerId,
      ownerId: conversation.ownerId,
      propertyId: propertyId,
      status: 'CONFIRMED',
      service: params.service,
      price,
      hours,
      date: bookingDate,
      time: params.time,
      notes: params.notes || null,
      createdByAI: true,
    },
  })

  // Update cleaner stats
  await db.cleaner.update({
    where: { id: context.cleanerId },
    data: {
      totalBookings: { increment: 1 },
    },
  })

  // Update owner stats
  await db.owner.update({
    where: { id: conversation.ownerId },
    data: {
      totalBookings: { increment: 1 },
    },
  })

  // Create conversation summary
  await db.conversationSummary.create({
    data: {
      conversationId: context.conversationId,
      cleanerId: context.cleanerId,
      summary: `AI created booking: ${params.service} on ${params.date} at ${params.time} for ${context.ownerName}. Price: ${price}`,
      bookingCreated: true,
      bookingId: booking.id,
    },
  })

  return {
    success: true,
    message: `Booking confirmed! ${params.service} on ${params.date} at ${params.time} for ${price} total.`,
    bookingId: booking.id,
    data: {
      bookingId: booking.id,
      service: params.service,
      date: params.date,
      time: params.time,
      price,
      hours,
    },
  }
}

/**
 * Execute a tool by name
 */
export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  context: SalesAgentContext
): Promise<ToolResult> {
  switch (toolName) {
    case 'check_availability':
      return checkAvailability(args.dates as string[], context)

    case 'create_booking':
      return createBooking(
        args as {
          service: string
          date: string
          time: string
          propertyAddress?: string
          notes?: string
        },
        context
      )

    default:
      return {
        success: false,
        message: `Unknown tool: ${toolName}`,
      }
  }
}
