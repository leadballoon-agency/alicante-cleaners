import { Metadata } from 'next'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateHowToSchema, generateBreadcrumbSchema } from '@/lib/seo/schema'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.alicantecleaners.com'

export const metadata: Metadata = {
  title: "Owner's Booking Guide - Book in 2 Minutes",
  description: 'Simple guide to booking a villa cleaner on VillaCare. Choose your service, pick a date, add your property details, and confirm. Takes 2 minutes.',
  openGraph: {
    title: 'How to Book a Villa Cleaner',
    description: 'Book a trusted cleaner for your Alicante villa in just 2 minutes.',
    url: `${SITE_URL}/guide/booking`,
    images: [{ url: `${SITE_URL}/screenshots/booking-flow.png`, width: 1200, height: 630, alt: 'VillaCare Booking Flow' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Book a Villa Cleaner',
    images: [`${SITE_URL}/screenshots/booking-flow.png`],
  },
}

const howToSchema = generateHowToSchema({
  name: 'How to Book a Villa Cleaner on VillaCare',
  description: 'Simple 4-step booking process for property owners.',
  totalTime: 'PT2M',
  steps: [
    { name: 'Choose your service', text: 'Select Regular Clean, Deep Clean, or Arrival Prep based on your needs.' },
    { name: 'Pick date and time', text: 'See available slots and choose when you need the cleaning done.' },
    { name: 'Add property details', text: 'Enter your villa address, bedrooms, and any special instructions.' },
    { name: 'Confirm booking', text: 'Review and confirm. Your cleaner receives a WhatsApp notification immediately.' },
  ],
})

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: "Owner's Guide", url: '/guide' },
  { name: 'Booking Guide', url: '/guide/booking' },
])

export default function BookingGuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SchemaScript schema={[howToSchema, breadcrumbSchema]} />
      {children}
    </>
  )
}
