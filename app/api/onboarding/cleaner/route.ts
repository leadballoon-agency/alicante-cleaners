import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .split(' ')[0]
    .replace(/[^a-z0-9]/g, '')
}

export async function POST(request: NextRequest) {
  try {
    const {
      phone,
      name,
      photoUrl,
      bio,
      reviewsLink,
      serviceAreas,
      hourlyRate,
    } = await request.json()

    // Validation
    if (!phone || !name || !serviceAreas?.length || !hourlyRate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if phone already exists
    const existingUser = await db.user.findUnique({
      where: { phone },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this phone number already exists' },
        { status: 400 }
      )
    }

    // Generate unique slug
    let slug = generateSlug(name)
    let slugAttempts = 0
    while (slugAttempts < 10) {
      const existingCleaner = await db.cleaner.findUnique({
        where: { slug },
      })
      if (!existingCleaner) break
      slug = `${generateSlug(name)}${Math.floor(Math.random() * 1000)}`
      slugAttempts++
    }

    // Create user and cleaner in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          phone,
          name,
          image: photoUrl || null,
          role: 'CLEANER',
          phoneVerified: new Date(),
        },
      })

      // Create cleaner profile
      const cleaner = await tx.cleaner.create({
        data: {
          userId: user.id,
          slug,
          bio: bio || null,
          reviewsLink: reviewsLink || null,
          serviceAreas,
          hourlyRate,
          status: 'ACTIVE',
          rating: 5.0,
          reviewCount: 0,
          totalBookings: 0,
        },
      })

      return { user, cleaner }
    })

    return NextResponse.json({
      success: true,
      cleaner: {
        id: result.cleaner.id,
        slug: result.cleaner.slug,
        profileUrl: `/${result.cleaner.slug}`,
      },
    })
  } catch (error) {
    console.error('Error creating cleaner:', error)
    return NextResponse.json(
      { error: 'Failed to create cleaner account' },
      { status: 500 }
    )
  }
}
