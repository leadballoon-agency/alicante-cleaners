/**
 * OpenAI Function Tools for AI Sales Agent
 *
 * These tools allow the AI to:
 * 1. check_availability - Query the cleaner's calendar for specific dates
 * 2. create_booking - Create a confirmed booking directly (with optional extras)
 * 3. request_human_handoff - Flag conversation for cleaner's personal attention
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
      description: 'Create a confirmed booking for the owner. Only use after confirming all details with the owner. For Arrival prep, you can include extras.',
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
          extras: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['fridge', 'flowers', 'linens', 'basket'],
            },
            description: 'Optional extras for Arrival prep: fridge (stock essentials), flowers (fresh arrangement), linens (fresh bedding), basket (welcome treats)',
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
  {
    type: 'function',
    function: {
      name: 'request_human_handoff',
      description: 'Flag this conversation for the cleaner\'s personal attention. Use when: owner is frustrated/angry, complex negotiations needed, complaints about past service, requests you cannot handle, or anything you\'re uncertain about.',
      parameters: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            enum: ['complaint', 'complex_question', 'price_negotiation', 'special_request', 'angry_customer', 'uncertain'],
            description: 'Why human attention is needed',
          },
          summary: {
            type: 'string',
            description: 'Brief summary of the situation for the cleaner',
          },
        },
        required: ['reason', 'summary'],
      },
    },
  },
]

export interface ToolResult {
  success: boolean
  message: string
  data?: Record<string, unknown>
  bookingId?: string
  handoffRequested?: boolean
  handoffReason?: string
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
    extras?: string[]
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

  // Extras pricing
  const extrasPricing: Record<string, number> = {
    'fridge': 25,
    'flowers': 20,
    'linens': 20,
    'basket': 30,
  }

  const hours = serviceHours[params.service] || 3
  const price = context.hourlyRate * hours

  // Calculate extras cost
  const selectedExtras = params.extras || []
  const extrasCost = selectedExtras.reduce((sum, extra) => sum + (extrasPricing[extra] || 0), 0)
  const totalPrice = price + extrasCost

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

  // Build notes with extras info
  let bookingNotes = params.notes || ''
  if (selectedExtras.length > 0) {
    const extrasNote = `Arrival extras requested: ${selectedExtras.join(', ')}`
    bookingNotes = bookingNotes ? `${bookingNotes}\n${extrasNote}` : extrasNote
  }

  // Create the booking as CONFIRMED (AI has authority)
  const booking = await db.booking.create({
    data: {
      cleanerId: context.cleanerId,
      ownerId: conversation.ownerId,
      propertyId: propertyId,
      status: 'CONFIRMED',
      service: params.service,
      price: totalPrice,
      hours,
      date: bookingDate,
      time: params.time,
      notes: bookingNotes || null,
      createdByAI: true,
    },
  })

  // Create ArrivalPrep record if extras were selected
  if (params.service === 'Arrival prep' && selectedExtras.length > 0) {
    await db.arrivalPrep.create({
      data: {
        ownerId: conversation.ownerId,
        propertyId: propertyId,
        cleanerId: context.cleanerId,
        arrivalDate: bookingDate,
        arrivalTime: params.time,
        extras: selectedExtras,
        notes: params.notes || null,
        status: 'CONFIRMED',
      },
    })

    // Update owner's preferred extras to remember their choices
    const currentExtras = conversation.owner?.preferredExtras || []
    const newExtras = Array.from(new Set([...currentExtras, ...selectedExtras]))
    await db.owner.update({
      where: { id: conversation.ownerId },
      data: { preferredExtras: newExtras },
    })
  }

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

  // Create notification for cleaner
  await db.notification.create({
    data: {
      userId: context.cleanerUserId,
      type: 'AI_ACTION',
      title: 'AI Created Booking',
      message: `Your AI assistant confirmed a ${params.service} for ${context.ownerName} on ${params.date} at ${params.time}. Total: €${totalPrice.toFixed(2)}${selectedExtras.length > 0 ? ` (includes: ${selectedExtras.join(', ')})` : ''}`,
      data: { bookingId: booking.id, extras: selectedExtras },
      actionUrl: '/dashboard?tab=bookings',
    },
  })

  // Create conversation summary
  const extrasSummary = selectedExtras.length > 0 ? ` with extras: ${selectedExtras.join(', ')}` : ''
  await db.conversationSummary.create({
    data: {
      conversationId: context.conversationId,
      cleanerId: context.cleanerId,
      summary: `AI created booking: ${params.service} on ${params.date} at ${params.time} for ${context.ownerName}${extrasSummary}. Total: €${totalPrice.toFixed(2)}`,
      bookingCreated: true,
      bookingId: booking.id,
    },
  })

  // Build confirmation message
  let confirmationMessage = `Booking confirmed! ${params.service} on ${params.date} at ${params.time}`
  if (selectedExtras.length > 0) {
    confirmationMessage += ` with ${selectedExtras.join(', ')}`
  }
  confirmationMessage += `. Total: €${totalPrice.toFixed(2)}`

  return {
    success: true,
    message: confirmationMessage,
    bookingId: booking.id,
    data: {
      bookingId: booking.id,
      service: params.service,
      date: params.date,
      time: params.time,
      extras: selectedExtras,
      servicePrice: price,
      extrasCost,
      totalPrice,
      hours,
    },
  }
}

/**
 * Request human handoff - flags conversation for cleaner's personal attention
 */
async function requestHumanHandoff(
  params: {
    reason: string
    summary: string
  },
  context: SalesAgentContext
): Promise<ToolResult> {
  // Create notification for cleaner
  await db.notification.create({
    data: {
      userId: context.cleanerUserId,
      type: 'BOOKING_REQUEST', // Reusing existing type that implies action needed
      title: 'Conversation Needs Your Attention',
      message: `AI flagged a conversation with ${context.ownerName} for your attention. Reason: ${params.reason}. Summary: ${params.summary}`,
      data: {
        conversationId: context.conversationId,
        reason: params.reason,
        summary: params.summary,
      },
      actionUrl: '/dashboard?tab=messages',
    },
  })

  // Create conversation summary
  await db.conversationSummary.create({
    data: {
      conversationId: context.conversationId,
      cleanerId: context.cleanerId,
      summary: `AI requested human handoff. Reason: ${params.reason}. Summary: ${params.summary}`,
      bookingCreated: false,
    },
  })

  return {
    success: true,
    message: `Flagged for ${context.cleanerName}'s attention. They will respond personally soon.`,
    handoffRequested: true,
    handoffReason: params.reason,
    data: {
      reason: params.reason,
      summary: params.summary,
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
          extras?: string[]
          propertyAddress?: string
          notes?: string
        },
        context
      )

    case 'request_human_handoff':
      return requestHumanHandoff(
        args as {
          reason: string
          summary: string
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
