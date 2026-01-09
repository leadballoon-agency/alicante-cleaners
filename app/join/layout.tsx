import { Metadata } from 'next'
import { SchemaScript } from '@/components/seo/schema-script'
import {
  generateFAQSchema,
  generateHowToSchema,
  generateBreadcrumbSchema,
  generateProfessionalServiceSchema,
} from '@/lib/seo/schema'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.alicantecleaners.com'

export const metadata: Metadata = {
  title: 'Join as a Cleaner - Grow Your Cleaning Business',
  description: 'Join VillaCare and grow your cleaning business in Alicante. Get your own profile page, AI sales assistant, calendar sync, team features, and auto-translation. No platform fees.',
  keywords: ['cleaner jobs Alicante', 'villa cleaning work Spain', 'professional cleaner platform', 'cleaning business Alicante'],
  openGraph: {
    title: 'Join VillaCare as a Cleaner',
    description: 'Grow your cleaning business with AI-powered tools, automatic translation, and team features.',
    url: `${SITE_URL}/join`,
    type: 'website',
    images: [{ url: `${SITE_URL}/screenshots/cleaner-dashboard-home.png`, width: 1200, height: 630, alt: 'VillaCare Cleaner Dashboard' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Join VillaCare as a Cleaner',
    description: 'Grow your cleaning business with AI-powered tools.',
    images: [`${SITE_URL}/screenshots/cleaner-dashboard-home.png`],
  },
  alternates: {
    languages: {
      'en': `${SITE_URL}/join`,
      'es': `${SITE_URL}/join`,
    },
  },
}

// FAQ content for schema
const joinFAQs = [
  {
    question: 'Is VillaCare free for cleaners?',
    answer: 'Yes, during our beta period VillaCare is completely free for cleaners. You keep 100% of what you earn. When we introduce online payments, there will be a small processing fee similar to other booking platforms.',
  },
  {
    question: 'How does the AI assistant work?',
    answer: 'Your AI assistant handles inquiries from potential clients 24/7. It answers questions about your services, checks your calendar availability, and can book jobs for you while you focus on cleaning.',
  },
  {
    question: 'What languages does VillaCare support?',
    answer: 'VillaCare supports 7 languages: English, Spanish, German, French, Dutch, Italian, and Portuguese. All messages are automatically translated between you and property owners.',
  },
  {
    question: 'Can I build a team on VillaCare?',
    answer: 'Yes! Once you reach 200 hours of completed work and maintain a 4.5+ star rating, you can become a team leader. You can then invite other cleaners to join your team for coverage and support.',
  },
  {
    question: 'How do I get my first clients?',
    answer: 'Your profile page is shareable and SEO-optimized. Property owners can find you through our directory. Your AI assistant handles inquiries automatically, so you never miss a potential booking.',
  },
]

// HowTo steps for joining
const joinSteps = [
  {
    name: 'Verify your phone number',
    text: 'Enter your Spanish phone number and verify with a code sent via WhatsApp. This takes about 30 seconds.',
  },
  {
    name: 'Create your profile',
    text: 'Add your name, photo, and bio. Tell property owners about your experience and what makes you special.',
  },
  {
    name: 'Set your service areas',
    text: 'Choose which areas of Alicante you serve. You can select multiple areas including Alicante City, San Juan, El Campello, and more.',
  },
  {
    name: 'Set your hourly rate',
    text: 'Choose your hourly rate. Most cleaners charge between €15-25 per hour depending on experience.',
  },
  {
    name: 'Start receiving bookings',
    text: 'Your profile goes live and your AI assistant starts handling inquiries. You can accept or decline bookings directly via WhatsApp.',
  },
]

// Generate schemas
const faqSchema = generateFAQSchema(joinFAQs)
const howToSchema = generateHowToSchema({
  name: 'How to Join VillaCare as a Cleaner',
  description: 'Step-by-step guide to joining VillaCare and starting your professional cleaning profile in Alicante.',
  totalTime: 'PT5M',
  steps: joinSteps,
})
const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Join as Cleaner', url: '/join' },
])
const serviceSchema = generateProfessionalServiceSchema()

export default function JoinLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SchemaScript schema={[faqSchema, howToSchema, breadcrumbSchema, serviceSchema]} />
      {children}
    </>
  )
}
