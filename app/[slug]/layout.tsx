import { Metadata } from 'next'
import { db } from '@/lib/db'
import { SchemaScript } from '@/components/seo/schema-script'
import {
  generateCleanerSchema,
  generateBreadcrumbSchema,
  generateServiceSchema,
} from '@/lib/seo/schema'

interface Props {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}

// Generate dynamic metadata for cleaner pages
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params

  const cleaner = await db.cleaner.findUnique({
    where: { slug },
    include: { user: true },
  })

  if (!cleaner) {
    return {
      title: 'Cleaner Not Found | VillaCare',
    }
  }

  const name = cleaner.user.name || 'Cleaner'
  const description = cleaner.bio || `Book ${name} for professional villa cleaning in Alicante, Spain. Rated ${cleaner.rating}/5 with ${cleaner.reviewCount} reviews.`

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alicantecleaners.com'
  // Ensure www prefix for OG images (social crawlers don't follow redirects well)
  const ogBaseUrl = baseUrl.replace('://alicantecleaners.com', '://www.alicantecleaners.com')
  const ogImageUrl = `${ogBaseUrl}/api/og/cleaner/${slug}`

  return {
    title: `${name} - Villa Cleaner in Alicante | VillaCare`,
    description,
    keywords: [
      'villa cleaning',
      'house cleaner',
      'Alicante',
      'professional cleaning',
      'holiday home cleaning',
      name,
    ],
    openGraph: {
      title: `${name} - Villa Cleaner | VillaCare`,
      description,
      type: 'profile',
      url: `${baseUrl}/${slug}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${name} - VillaCare Cleaner`,
        },
      ],
      siteName: 'VillaCare',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} - Villa Cleaner | VillaCare`,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `${baseUrl}/${slug}`,
    },
  }
}

export default async function CleanerLayout({ params, children }: Props) {
  const { slug } = await params

  // Fetch cleaner data for schema
  const cleaner = await db.cleaner.findUnique({
    where: { slug },
    include: {
      user: true,
      reviews: {
        where: { approved: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!cleaner) {
    return <>{children}</>
  }

  const hourlyRate = cleaner.hourlyRate?.toNumber() || 18

  // Generate services
  const services = [
    {
      name: 'Regular Clean',
      description: 'Standard cleaning service for maintained homes',
      hours: 3,
      price: hourlyRate * 3,
    },
    {
      name: 'Deep Clean',
      description: 'Thorough deep cleaning including hard-to-reach areas',
      hours: 5,
      price: hourlyRate * 5,
    },
    {
      name: 'Arrival Prep',
      description: 'Get your villa ready before you arrive',
      hours: 4,
      price: hourlyRate * 4,
    },
  ]

  // Generate schemas
  const cleanerSchema = generateCleanerSchema({
    name: cleaner.user.name || 'Cleaner',
    slug: cleaner.slug,
    bio: cleaner.bio || '',
    photo: cleaner.user.image,
    rating: cleaner.rating?.toNumber() || 5,
    reviewCount: cleaner.reviewCount,
    hourlyRate,
    serviceAreas: cleaner.serviceAreas,
    services,
  })

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: cleaner.user.name || 'Cleaner', url: `/${cleaner.slug}` },
  ])

  const serviceSchemas = services.map(service =>
    generateServiceSchema({
      ...service,
      cleanerName: cleaner.user.name || 'Cleaner',
      cleanerSlug: cleaner.slug,
    })
  )

  return (
    <>
      <SchemaScript schema={[cleanerSchema, breadcrumbSchema, ...serviceSchemas]} />
      {children}
    </>
  )
}
