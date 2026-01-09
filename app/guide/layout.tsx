import { Metadata } from 'next'
import { SchemaScript } from '@/components/seo/schema-script'
import {
  generateHowToSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
} from '@/lib/seo/schema'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.alicantecleaners.com'

export const metadata: Metadata = {
  title: "Property Owner's Guide - How VillaCare Works",
  description: 'Learn how to book trusted cleaners for your Alicante villa. Simple booking, WhatsApp updates, photo proof of completion. No account required.',
  keywords: ['villa cleaning Alicante', 'book cleaner Spain', 'holiday home cleaning', 'property owner guide'],
  openGraph: {
    title: "Property Owner's Guide to VillaCare",
    description: 'Book trusted cleaners for your villa in Alicante. Simple, transparent, reliable.',
    url: `${SITE_URL}/guide`,
    type: 'website',
    images: [{ url: `${SITE_URL}/screenshots/owner-dashboard.png`, width: 1200, height: 630, alt: 'VillaCare Owner Dashboard' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Property Owner's Guide to VillaCare",
    description: 'Book trusted cleaners for your villa in Alicante.',
    images: [`${SITE_URL}/screenshots/owner-dashboard.png`],
  },
}

// FAQ content for owners
const ownerFAQs = [
  {
    question: 'Do I need to create an account?',
    answer: 'No account required for booking. We use magic links sent to your email or phone for secure access to your booking history and dashboard.',
  },
  {
    question: 'How quickly do cleaners respond?',
    answer: 'Most cleaners respond within 2 hours. You can also use our AI assistant to check availability instantly and book immediately.',
  },
  {
    question: 'What if I need to cancel?',
    answer: 'You can cancel or reschedule through your dashboard. We ask for 24 hours courtesy notice when possible.',
  },
  {
    question: 'How do I know the cleaning is done?',
    answer: 'You receive WhatsApp notifications at each stage: booking confirmed, cleaner on the way, and completion with optional photo proof.',
  },
  {
    question: 'Can cleaners access my property when I am not there?',
    answer: 'Yes, you can securely share access instructions that are only revealed to the cleaner 24 hours before the appointment. Your cleaner never sees the full details until they need them.',
  },
]

// HowTo steps for booking
const bookingSteps = [
  {
    name: 'Choose a cleaner',
    text: 'Browse our directory of vetted cleaners. Filter by service area, read reviews, and find someone you trust.',
  },
  {
    name: 'Select your service',
    text: 'Choose Regular Clean, Deep Clean, or Arrival Prep. Each includes specific tasks appropriate for villas.',
  },
  {
    name: 'Pick a date and time',
    text: 'See real-time availability and select a time that works for you. The calendar shows available slots.',
  },
  {
    name: 'Add your property details',
    text: 'Tell us about your villa: address, number of bedrooms, and any access instructions for the cleaner.',
  },
  {
    name: 'Confirm and relax',
    text: 'Your cleaner confirms via WhatsApp. Track the status of your booking and receive updates automatically.',
  },
]

const faqSchema = generateFAQSchema(ownerFAQs)
const howToSchema = generateHowToSchema({
  name: 'How to Book a Villa Cleaner on VillaCare',
  description: 'Simple guide to booking trusted cleaners for your Alicante villa through VillaCare.',
  totalTime: 'PT5M',
  steps: bookingSteps,
})
const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: "Owner's Guide", url: '/guide' },
])

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SchemaScript schema={[faqSchema, howToSchema, breadcrumbSchema]} />
      {children}
    </>
  )
}
