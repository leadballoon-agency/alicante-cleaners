import { Metadata } from 'next'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateHowToSchema, generateBreadcrumbSchema } from '@/lib/seo/schema'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.alicantecleaners.com'

export const metadata: Metadata = {
  title: 'Booking Management Guide for Cleaners',
  description: 'Learn how to accept, manage, and complete bookings on VillaCare. WhatsApp notifications, quick actions, and job completion checklist.',
  openGraph: {
    title: 'How to Manage Your Bookings',
    description: 'Accept bookings via WhatsApp, communicate with clients, and mark jobs complete.',
    url: `${SITE_URL}/join/booking-guide`,
    images: [{ url: `${SITE_URL}/screenshots/cleaner-peek-modal-with-call.png`, width: 1200, height: 630, alt: 'VillaCare Booking Details' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Manage Your Bookings',
    images: [`${SITE_URL}/screenshots/cleaner-peek-modal-with-call.png`],
  },
}

const howToSchema = generateHowToSchema({
  name: 'How to Manage Bookings on VillaCare',
  description: 'Complete guide to accepting, managing, and completing cleaning bookings.',
  totalTime: 'PT5M',
  steps: [
    { name: 'Receive booking notification', text: 'Get a WhatsApp message when a new booking comes in.' },
    { name: 'Review the details', text: 'See the service type, date, time, and property location.' },
    { name: 'Accept or decline', text: 'Reply ACCEPT or DECLINE directly via WhatsApp.' },
    { name: 'Access property details', text: 'View secure access instructions 24 hours before the job.' },
    { name: 'Use quick actions', text: 'Send "On my way" or "Running late" messages with one tap.' },
    { name: 'Complete the job', text: 'Mark the booking as complete and optionally upload photos.' },
  ],
})

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Join', url: '/join' },
  { name: 'Booking Guide', url: '/join/booking-guide' },
])

export default function BookingGuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SchemaScript schema={[howToSchema, breadcrumbSchema]} />
      {children}
    </>
  )
}
