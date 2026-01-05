import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// POST /api/admin/impersonate - Start impersonating a user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { cleanerId } = await request.json()

    if (!cleanerId) {
      return NextResponse.json(
        { error: 'Cleaner ID is required' },
        { status: 400 }
      )
    }

    // Get the cleaner and their user
    const cleaner = await db.cleaner.findUnique({
      where: { id: cleanerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    })

    if (!cleaner) {
      return NextResponse.json(
        { error: 'Cleaner not found' },
        { status: 404 }
      )
    }

    // Set impersonation cookies
    const cookieStore = await cookies()

    // Store admin's user ID for returning later
    cookieStore.set('admin_user_id', session.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 4, // 4 hours
    })

    // Store the impersonated user's ID
    cookieStore.set('impersonating_user_id', cleaner.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 4, // 4 hours
    })

    // Store impersonated user's name for the banner
    cookieStore.set('impersonating_user_name', cleaner.user.name || 'Unknown', {
      httpOnly: false, // Readable by client for banner
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 4, // 4 hours
    })

    return NextResponse.json({
      success: true,
      message: `Now viewing as ${cleaner.user.name}`,
      redirectTo: '/dashboard',
    })
  } catch (error) {
    console.error('Error starting impersonation:', error)
    return NextResponse.json(
      { error: 'Failed to start impersonation' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/impersonate - Stop impersonating
export async function DELETE() {
  try {
    const cookieStore = await cookies()

    // Check if actually impersonating
    const adminUserId = cookieStore.get('admin_user_id')?.value

    if (!adminUserId) {
      return NextResponse.json(
        { error: 'Not currently impersonating' },
        { status: 400 }
      )
    }

    // Clear impersonation cookies
    cookieStore.delete('admin_user_id')
    cookieStore.delete('impersonating_user_id')
    cookieStore.delete('impersonating_user_name')

    return NextResponse.json({
      success: true,
      message: 'Impersonation ended',
      redirectTo: '/admin',
    })
  } catch (error) {
    console.error('Error ending impersonation:', error)
    return NextResponse.json(
      { error: 'Failed to end impersonation' },
      { status: 500 }
    )
  }
}
