import { Metadata } from 'next'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateHowToSchema, generateFAQSchema, generateBreadcrumbSchema } from '@/lib/seo/schema'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.alicantecleaners.com'

export const metadata: Metadata = {
  title: 'Calendar Sync Guide - Google Calendar Integration',
  description: 'Connect your Google Calendar to VillaCare. We only see when you are busy, not your event details. Keep your schedule private while showing availability.',
  openGraph: {
    title: 'How to Sync Your Calendar with VillaCare',
    description: 'Privacy-first calendar integration. We see busy/free, never your event details.',
    url: `${SITE_URL}/join/calendar-guide`,
    images: [{ url: `${SITE_URL}/screenshots/calendar-schedule.png`, width: 1200, height: 630, alt: 'VillaCare Calendar Sync' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Sync Your Calendar with VillaCare',
    images: [`${SITE_URL}/screenshots/calendar-schedule.png`],
  },
}

const howToSchema = generateHowToSchema({
  name: 'How to Connect Google Calendar to VillaCare',
  description: 'Step-by-step guide to syncing your calendar for automatic availability updates.',
  totalTime: 'PT3M',
  steps: [
    { name: 'Open calendar settings', text: 'Go to your Account tab and find the Calendar section.' },
    { name: 'Click Connect Google Calendar', text: 'You will be redirected to Google to authorize access.' },
    { name: 'Grant read-only access', text: 'We only request permission to see when you are busy.' },
    { name: 'Automatic sync enabled', text: 'Your availability updates automatically each night.' },
  ],
})

const calendarFAQs = [
  { question: 'What calendar data can VillaCare see?', answer: 'Only free/busy status. We cannot see event titles, descriptions, attendees, or any other details.' },
  { question: 'How often does my calendar sync?', answer: 'Automatically each night, usually within 24 hours of changes.' },
  { question: 'Can I disconnect my calendar?', answer: 'Yes, you can disconnect anytime from your Account settings. Your previous availability data is removed.' },
]

const faqSchema = generateFAQSchema(calendarFAQs)

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Join', url: '/join' },
  { name: 'Calendar Guide', url: '/join/calendar-guide' },
])

export default function CalendarGuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SchemaScript schema={[howToSchema, faqSchema, breadcrumbSchema]} />
      {children}
    </>
  )
}
