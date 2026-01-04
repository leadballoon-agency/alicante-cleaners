import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Service definitions with pricing
const SERVICES = [
  {
    type: 'regular',
    name: 'Regular Clean',
    description: 'Standard cleaning service for maintained homes',
    hoursMultiplier: 3, // hours per cleaning
  },
  {
    type: 'deep',
    name: 'Deep Clean',
    description: 'Thorough deep cleaning including hard-to-reach areas',
    hoursMultiplier: 5,
  },
  {
    type: 'arrival',
    name: 'Arrival Prep',
    description: 'Get your villa ready before you arrive',
    hoursMultiplier: 4,
  },
]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const cleaner = await db.cleaner.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    })

    if (!cleaner || cleaner.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cleaner not found' },
        { status: 404 }
      )
    }

    // Get featured review for this cleaner
    const featuredReview = await db.review.findFirst({
      where: {
        cleanerId: cleaner.id,
        featured: true,
        approved: true,
      },
      include: {
        owner: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate services with pricing based on hourly rate
    const services = SERVICES.map((service) => ({
      type: service.type,
      name: service.name,
      description: service.description,
      hours: service.hoursMultiplier,
      price: Number(cleaner.hourlyRate) * service.hoursMultiplier,
    }))

    const response = {
      id: cleaner.id,
      slug: cleaner.slug,
      name: cleaner.user.name,
      photo: cleaner.user.image,
      rating: Number(cleaner.rating),
      reviewCount: cleaner.reviewCount,
      areas: cleaner.serviceAreas,
      hourlyRate: Number(cleaner.hourlyRate),
      bio: cleaner.bio,
      services,
      testimonial: featuredReview
        ? {
            text: featuredReview.text,
            author: featuredReview.owner.user.name || 'Villa Owner',
            location: 'Alicante',
            rating: featuredReview.rating,
          }
        : null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching cleaner:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cleaner' },
      { status: 500 }
    )
  }
}
