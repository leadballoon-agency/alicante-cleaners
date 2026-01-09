import { Metadata } from 'next'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateHowToSchema, generateBreadcrumbSchema } from '@/lib/seo/schema'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.alicantecleaners.com'

export const metadata: Metadata = {
  title: 'Profile Guide - Create a Standout Cleaner Profile',
  description: 'Tips for creating a professional cleaner profile on VillaCare. Write a compelling bio, choose the right photo, and set competitive rates.',
  openGraph: {
    title: 'How to Create a Great Cleaner Profile',
    description: 'Stand out to property owners with a professional profile.',
    url: `${SITE_URL}/join/profile-guide`,
    images: [{ url: `${SITE_URL}/screenshots/cleaner-profile.png`, width: 1200, height: 630, alt: 'VillaCare Cleaner Profile' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Create a Great Cleaner Profile',
    images: [`${SITE_URL}/screenshots/cleaner-profile.png`],
  },
}

const howToSchema = generateHowToSchema({
  name: 'How to Create a Standout Cleaner Profile',
  description: 'Tips for building a professional profile that attracts property owners.',
  totalTime: 'PT10M',
  steps: [
    { name: 'Choose a professional photo', text: 'Use a clear, friendly headshot. Avoid sunglasses or group photos.' },
    { name: 'Write a compelling bio', text: 'Share your experience, what you love about cleaning, and what makes you reliable.' },
    { name: 'List your service areas', text: 'Select all areas you can realistically cover. Be specific.' },
    { name: 'Set competitive rates', text: 'Research local rates. Most cleaners charge €15-25/hour depending on experience.' },
    { name: 'Connect your calendar', text: 'Sync with Google Calendar so clients see your real availability.' },
  ],
})

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Join', url: '/join' },
  { name: 'Profile Guide', url: '/join/profile-guide' },
])

export default function ProfileGuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SchemaScript schema={[howToSchema, breadcrumbSchema]} />
      {children}
    </>
  )
}
