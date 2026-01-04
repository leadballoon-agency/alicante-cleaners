import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/dashboard/cleaner/comments - Get internal comments for properties
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!cleaner) {
      return NextResponse.json(
        { error: 'Cleaner profile not found' },
        { status: 404 }
      )
    }

    // Get property IDs from query params if provided
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    const whereClause = propertyId ? { propertyId } : {}

    const comments = await db.internalComment.findMany({
      where: whereClause,
      include: {
        property: {
          select: {
            id: true,
            address: true,
            ownerId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedComments = comments.map(c => ({
      id: c.id,
      propertyId: c.propertyId,
      ownerId: c.property.ownerId,
      cleanerId: c.cleanerId,
      cleanerName: c.cleanerName,
      text: c.text,
      createdAt: c.createdAt,
    }))

    return NextResponse.json({ comments: formattedComments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/dashboard/cleaner/comments - Add internal comment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { propertyId, text } = await request.json()

    if (!propertyId || !text?.trim()) {
      return NextResponse.json(
        { error: 'Property ID and text are required' },
        { status: 400 }
      )
    }

    const cleaner = await db.cleaner.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: { name: true },
        },
      },
    })

    if (!cleaner) {
      return NextResponse.json(
        { error: 'Cleaner profile not found' },
        { status: 404 }
      )
    }

    // Verify the property exists
    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: { id: true, ownerId: true },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Create cleaner name abbreviation (e.g., "Clara G.")
    const nameParts = (cleaner.user.name || 'Unknown').split(' ')
    const cleanerName = nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[1][0]}.`
      : nameParts[0]

    const comment = await db.internalComment.create({
      data: {
        propertyId,
        cleanerId: cleaner.id,
        cleanerName,
        text: text.trim(),
      },
    })

    return NextResponse.json({
      success: true,
      comment: {
        id: comment.id,
        propertyId: comment.propertyId,
        ownerId: property.ownerId,
        cleanerId: comment.cleanerId,
        cleanerName: comment.cleanerName,
        text: comment.text,
        createdAt: comment.createdAt,
      },
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
