import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// PATCH /api/dashboard/owner/properties/[id] - Update property
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const updates = await request.json()

    const owner = await db.owner.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!owner) {
      return NextResponse.json(
        { error: 'Owner profile not found' },
        { status: 404 }
      )
    }

    // Verify property belongs to this owner
    const property = await db.property.findFirst({
      where: {
        id,
        ownerId: owner.id,
      },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Build update object
    const updateData: {
      name?: string
      address?: string
      bedrooms?: number
      bathrooms?: number
      notes?: string
    } = {}

    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.address !== undefined) updateData.address = updates.address
    if (updates.bedrooms !== undefined) updateData.bedrooms = updates.bedrooms
    if (updates.bathrooms !== undefined) updateData.bathrooms = updates.bathrooms
    if (updates.notes !== undefined) updateData.notes = updates.notes

    const updatedProperty = await db.property.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      property: {
        id: updatedProperty.id,
        name: updatedProperty.name,
        address: updatedProperty.address,
        bedrooms: updatedProperty.bedrooms,
        savedCleaner: null,
      },
    })
  } catch (error) {
    console.error('Error updating property:', error)
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    )
  }
}

// DELETE /api/dashboard/owner/properties/[id] - Delete property
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const owner = await db.owner.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!owner) {
      return NextResponse.json(
        { error: 'Owner profile not found' },
        { status: 404 }
      )
    }

    // Verify property belongs to this owner
    const property = await db.property.findFirst({
      where: {
        id,
        ownerId: owner.id,
      },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Check if property has bookings
    const bookingsCount = await db.booking.count({
      where: { propertyId: id },
    })

    if (bookingsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete property with existing bookings' },
        { status: 400 }
      )
    }

    await db.property.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Error deleting property:', error)
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    )
  }
}
