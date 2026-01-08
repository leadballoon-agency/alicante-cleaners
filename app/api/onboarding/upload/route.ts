import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import sharp from 'sharp'

/**
 * Public upload endpoint for cleaner onboarding
 * Since users aren't logged in during onboarding, this endpoint
 * allows unauthenticated uploads with basic validation.
 * Images are compressed to reduce storage and improve load times.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB before compression)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Compress and resize image
    // Profile photos: max 800x800, 80% quality JPEG
    const compressedBuffer = await sharp(buffer)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 80,
        mozjpeg: true, // Better compression
      })
      .toBuffer()

    // Generate unique filename for onboarding uploads
    const filename = `onboarding/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`

    // Upload compressed image to Vercel Blob
    const blob = await put(filename, compressedBuffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'image/jpeg',
    })

    // Log compression savings
    const savings = Math.round((1 - compressedBuffer.length / buffer.length) * 100)
    console.log(`Onboarding image compressed: ${file.size} → ${compressedBuffer.length} bytes (${savings}% smaller)`)

    return NextResponse.json({
      success: true,
      url: blob.url,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
