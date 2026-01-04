import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { name, phone, referrer_name } = await request.json()

    if (!name || !phone || !referrer_name) {
      return NextResponse.json(
        { error: 'Name, phone, and referrer name are required' },
        { status: 400 }
      )
    }

    // Basic phone validation (should start with + or be numeric)
    const phoneRegex = /^\+?[\d\s-]{8,}$/
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number' },
        { status: 400 }
      )
    }

    await db.cleaner_applications.create({
      data: {
        name,
        phone,
        referrer_name,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cleaner application error:', error)

    // Handle unique constraint violation
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'This phone number is already registered' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
