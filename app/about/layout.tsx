import { Metadata } from 'next'
import { SchemaScript } from '@/components/seo/schema-script'
import {
  generateAboutPageSchema,
  generateBreadcrumbSchema,
} from '@/lib/seo/schema'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.alicantecleaners.com'

export const metadata: Metadata = {
  title: 'Our Story - How VillaCare Started',
  description: 'VillaCare was born from a real problem: finding trusted cleaners for holiday villas in Alicante. Meet Clara and the team building a better way.',
  openGraph: {
    title: 'Our Story - How VillaCare Started',
    description: 'Meet Clara and the team building a better way to connect villa owners with trusted cleaners.',
    url: `${SITE_URL}/about`,
    type: 'website',
    images: [{ url: `${SITE_URL}/screenshots/homepage.png`, width: 1200, height: 630, alt: 'VillaCare - Our Story' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Our Story - How VillaCare Started',
    description: 'Meet Clara and the team building a better way.',
    images: [`${SITE_URL}/screenshots/homepage.png`],
  },
}

const aboutSchema = generateAboutPageSchema({
  name: 'About VillaCare',
  description: 'The story of VillaCare - connecting villa owners with trusted cleaners in Alicante, Spain.',
  url: `${SITE_URL}/about`,
  mainEntity: {
    name: 'VillaCare',
    foundingDate: '2024',
    founders: [
      { name: 'Mark Taylor', role: 'Product & Development' },
      { name: 'Kerry Taylor', role: 'Operations' },
      { name: 'Clara Rodrigues', role: 'Co-founder & Lead Cleaner' },
    ],
  },
})

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'About', url: '/about' },
])

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SchemaScript schema={[aboutSchema, breadcrumbSchema]} />
      {children}
    </>
  )
}
