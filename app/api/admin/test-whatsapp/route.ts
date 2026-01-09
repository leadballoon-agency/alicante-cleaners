/**
 * Admin WhatsApp Test Endpoint
 *
 * POST /api/admin/test-whatsapp
 *
 * Test WhatsApp messaging functionality by sending test messages
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendWhatsAppMessage, notifyCleanerNewBooking } from '@/lib/whatsapp'

const ADMIN_EMAILS = [
  'admin@villacare.com',
  'mark@leadballoon.co.uk',
  'kerry@leadballoon.co.uk',
]

export async function POST(request: Request) {
  try {
    // Check admin auth
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, phone, message } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Validate phone format (should include country code)
    const phoneRegex = /^\+[1-9]\d{6,14}$/
    const cleanPhone = phone.replace(/\s/g, '')
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone format. Use international format: +34612345678' },
        { status: 400 }
      )
    }

    let result

    switch (type) {
      case 'simple':
        // Simple text message test
        result = await sendWhatsAppMessage(
          cleanPhone,
          message || '🧪 This is a test message from VillaCare Admin.\n\nIf you received this, WhatsApp notifications are working!\n\n- VillaCare'
        )
        break

      case 'booking':
        // Test booking notification template
        result = await notifyCleanerNewBooking(cleanPhone, {
          ownerName: 'Test Owner',
          date: new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }),
          time: '10:00',
          service: 'Regular Clean',
          price: '€60',
          address: '123 Test Villa, San Juan, Alicante',
          shortCode: 'TEST',
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid test type. Use "simple" or "booking"' },
          { status: 400 }
        )
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test message sent to ${cleanPhone}`,
        messageId: 'messageId' in result ? result.messageId : undefined,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send message',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('WhatsApp test error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}
