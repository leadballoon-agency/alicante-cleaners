import { Metadata } from 'next'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateHowToSchema, generateBreadcrumbSchema } from '@/lib/seo/schema'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.alicantecleaners.com'

export const metadata: Metadata = {
  title: 'Getting Started Guide for Cleaners',
  description: 'Complete guide for new VillaCare cleaners. Learn how to set up your profile, manage bookings, and grow your cleaning business in Alicante.',
  openGraph: {
    title: 'Getting Started as a VillaCare Cleaner',
    description: 'Everything you need to know to start your cleaning business on VillaCare.',
    url: `${SITE_URL}/join/guide`,
    images: [{ url: `${SITE_URL}/screenshots/onboarding-step1-phone.png`, width: 1200, height: 630, alt: 'VillaCare Cleaner Onboarding' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Getting Started as a VillaCare Cleaner',
    images: [`${SITE_URL}/screenshots/onboarding-step1-phone.png`],
  },
}

const howToSchema = generateHowToSchema({
  name: 'How to Get Started as a VillaCare Cleaner',
  description: 'Step-by-step guide to setting up your cleaner profile and getting your first bookings.',
  totalTime: 'PT10M',
  steps: [
    { name: 'Verify your phone', text: 'Enter your Spanish phone number and verify with a WhatsApp code.' },
    { name: 'Complete your profile', text: 'Add your photo, bio, and highlight your cleaning experience.' },
    { name: 'Set your service areas', text: 'Choose which areas of Alicante you cover.' },
    { name: 'Set your rates', text: 'Configure your hourly rate for different services.' },
    { name: 'Connect your calendar', text: 'Sync with Google Calendar so clients see your real availability.' },
    { name: 'Start accepting bookings', text: 'Your profile is live and your AI assistant handles inquiries.' },
  ],
})

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Join', url: '/join' },
  { name: 'Getting Started', url: '/join/guide' },
])

export default function CleanerGuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SchemaScript schema={[howToSchema, breadcrumbSchema]} />
      {children}
    </>
  )
}
