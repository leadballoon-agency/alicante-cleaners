/**
 * SEO Structured Data (JSON-LD Schema.org)
 *
 * Comprehensive schema markup for search engine optimization.
 * Helps Google understand our content and display rich results.
 */

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.alicantecleaners.com'
const SITE_NAME = 'VillaCare'

// ============================================
// Organization Schema (Site-wide)
// ============================================

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    alternateName: 'Alicante Cleaners',
    url: SITE_URL,
    logo: `${SITE_URL}/villacare-horizontal-logo.png`,
    description: 'Trusted villa cleaning services in Alicante, Spain. Connect with verified, local cleaners for your holiday home.',
    foundingDate: '2024',
    areaServed: {
      '@type': 'Place',
      name: 'Alicante Province, Spain',
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 38.3452,
        longitude: -0.4815,
      },
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'hello@alicantecleaners.com',
      availableLanguage: ['English', 'Spanish', 'German', 'French', 'Dutch'],
    },
    sameAs: [
      // Add social media URLs when available
    ],
  }
}

// ============================================
// WebSite Schema (Site-wide with search)
// ============================================

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'Find trusted villa cleaners in Alicante, Spain',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/?area={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

// ============================================
// LocalBusiness Schema (Cleaner Profiles)
// ============================================

interface CleanerSchemaInput {
  name: string
  slug: string
  bio: string
  photo: string | null
  rating: number
  reviewCount: number
  hourlyRate: number
  serviceAreas: string[]
  services: Array<{
    name: string
    description: string
    hours: number
    price: number
  }>
}

export function generateCleanerSchema(cleaner: CleanerSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${SITE_URL}/${cleaner.slug}`,
    name: cleaner.name,
    description: cleaner.bio,
    url: `${SITE_URL}/${cleaner.slug}`,
    image: cleaner.photo || `${SITE_URL}/default-avatar.png`,
    priceRange: `€${cleaner.hourlyRate}/hr`,
    telephone: '', // Not exposed publicly
    areaServed: cleaner.serviceAreas.map(area => ({
      '@type': 'Place',
      name: `${area}, Alicante, Spain`,
    })),
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 38.3452,
      longitude: -0.4815,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Alicante',
      addressRegion: 'Comunidad Valenciana',
      addressCountry: 'ES',
    },
    aggregateRating: cleaner.reviewCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: cleaner.rating.toFixed(1),
      bestRating: '5',
      worstRating: '1',
      ratingCount: cleaner.reviewCount,
    } : undefined,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Cleaning Services',
      itemListElement: cleaner.services.map(service => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: service.name,
          description: service.description,
        },
        price: service.price,
        priceCurrency: 'EUR',
      })),
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '08:00',
      closes: '18:00',
    },
  }
}

// ============================================
// Service Schema (Individual Services)
// ============================================

interface ServiceSchemaInput {
  name: string
  description: string
  hours: number
  price: number
  cleanerName: string
  cleanerSlug: string
}

export function generateServiceSchema(service: ServiceSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'HomeAndConstructionBusiness',
      name: service.cleanerName,
      url: `${SITE_URL}/${service.cleanerSlug}`,
    },
    areaServed: {
      '@type': 'Place',
      name: 'Alicante, Spain',
    },
    offers: {
      '@type': 'Offer',
      price: service.price,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString().split('T')[0],
    },
    serviceType: 'House Cleaning',
    termsOfService: `${SITE_URL}/terms`,
  }
}

// ============================================
// Review Schema (Individual Reviews)
// ============================================

interface ReviewSchemaInput {
  rating: number
  comment: string
  authorName: string
  datePublished: Date
  cleanerName: string
  cleanerSlug: string
}

export function generateReviewSchema(review: ReviewSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: '5',
      worstRating: '1',
    },
    reviewBody: review.comment,
    author: {
      '@type': 'Person',
      name: review.authorName,
    },
    datePublished: review.datePublished.toISOString().split('T')[0],
    itemReviewed: {
      '@type': 'HomeAndConstructionBusiness',
      name: review.cleanerName,
      url: `${SITE_URL}/${review.cleanerSlug}`,
    },
  }
}

// ============================================
// BreadcrumbList Schema (Navigation)
// ============================================

interface BreadcrumbItem {
  name: string
  url: string
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  }
}

// ============================================
// FAQ Schema (For FAQ sections)
// ============================================

interface FAQItem {
  question: string
  answer: string
}

export function generateFAQSchema(faqs: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

// ============================================
// ItemList Schema (For directory pages)
// ============================================

interface CleanerListItem {
  name: string
  slug: string
  photo: string | null
  rating: number
  reviewCount: number
  hourlyRate: number
}

export function generateCleanerListSchema(cleaners: CleanerListItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Villa Cleaners in Alicante',
    description: 'Trusted villa cleaning professionals in Alicante, Spain',
    numberOfItems: cleaners.length,
    itemListElement: cleaners.map((cleaner, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'HomeAndConstructionBusiness',
        name: cleaner.name,
        url: `${SITE_URL}/${cleaner.slug}`,
        image: cleaner.photo || `${SITE_URL}/default-avatar.png`,
        priceRange: `€${cleaner.hourlyRate}/hr`,
        aggregateRating: cleaner.reviewCount > 0 ? {
          '@type': 'AggregateRating',
          ratingValue: cleaner.rating.toFixed(1),
          reviewCount: cleaner.reviewCount,
        } : undefined,
      },
    })),
  }
}

// ============================================
// HowTo Schema (Step-by-step guides)
// ============================================

interface HowToStep {
  name: string
  text: string
  image?: string
}

interface HowToSchemaInput {
  name: string
  description: string
  totalTime?: string // ISO 8601 duration, e.g., "PT5M" for 5 minutes
  steps: HowToStep[]
  image?: string
}

export function generateHowToSchema(howTo: HowToSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howTo.name,
    description: howTo.description,
    totalTime: howTo.totalTime,
    image: howTo.image ? `${SITE_URL}${howTo.image}` : undefined,
    step: howTo.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image ? `${SITE_URL}${step.image}` : undefined,
    })),
  }
}

// ============================================
// SoftwareApplication Schema (AI Assistant)
// ============================================

interface SoftwareAppSchemaInput {
  name: string
  description: string
  applicationCategory: string
  operatingSystem?: string
  offers?: {
    price: string
    priceCurrency: string
  }
  featureList?: string[]
}

export function generateSoftwareApplicationSchema(app: SoftwareAppSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: app.name,
    description: app.description,
    applicationCategory: app.applicationCategory,
    operatingSystem: app.operatingSystem || 'Web',
    offers: app.offers || {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    featureList: app.featureList,
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
}

// ============================================
// AboutPage Schema
// ============================================

interface AboutPageSchemaInput {
  name: string
  description: string
  url: string
  mainEntity?: {
    name: string
    foundingDate: string
    founders: Array<{ name: string; role: string }>
  }
}

export function generateAboutPageSchema(about: AboutPageSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: about.name,
    description: about.description,
    url: about.url,
    mainEntity: about.mainEntity ? {
      '@type': 'Organization',
      name: about.mainEntity.name,
      foundingDate: about.mainEntity.foundingDate,
      founder: about.mainEntity.founders.map(f => ({
        '@type': 'Person',
        name: f.name,
        jobTitle: f.role,
      })),
    } : undefined,
  }
}

// ============================================
// ProfessionalService Schema (Enhanced for cleaners)
// ============================================

export function generateProfessionalServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: SITE_NAME,
    description: 'Professional villa cleaning services in Alicante, Spain. Trusted, verified cleaners with AI-powered booking and multilingual support.',
    url: SITE_URL,
    logo: `${SITE_URL}/villacare-horizontal-logo.png`,
    image: `${SITE_URL}/og-image.png`,
    priceRange: '€15-25/hour',
    areaServed: [
      { '@type': 'City', name: 'Alicante' },
      { '@type': 'City', name: 'San Juan' },
      { '@type': 'City', name: 'El Campello' },
      { '@type': 'City', name: 'Mutxamel' },
      { '@type': 'City', name: 'San Vicente del Raspeig' },
      { '@type': 'City', name: 'Jijona' },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Villa Cleaning Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Regular Clean',
            description: 'Standard villa cleaning service (3 hours)',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Deep Clean',
            description: 'Thorough deep cleaning service (5 hours)',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Arrival Prep',
            description: 'Pre-arrival preparation for guests (4 hours)',
          },
        },
      ],
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      bestRating: '5',
      ratingCount: '50',
    },
  }
}

// ============================================
// Helper: Combine multiple schemas
// ============================================

export function combineSchemas(...schemas: object[]) {
  return schemas.filter(Boolean)
}

// ============================================
// Helper: Render as script tag
// ============================================

export function schemaToScript(schema: object | object[]): string {
  const data = Array.isArray(schema) ? schema : [schema]
  return data
    .filter(Boolean)
    .map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join('\n')
}
