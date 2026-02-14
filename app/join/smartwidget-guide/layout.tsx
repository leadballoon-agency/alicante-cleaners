import { Metadata } from 'next'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateHowToSchema, generateBreadcrumbSchema } from '@/lib/seo/schema'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.alicantecleaners.com'

export const metadata: Metadata = {
  title: 'SmartWidget Navigation Guide for Cleaners',
  description: 'Learn how to use the SmartWidget floating button to navigate your VillaCare dashboard. Quick actions, full menu, tab navigation, and notification badges.',
  openGraph: {
    title: 'How to Use the SmartWidget',
    description: 'Navigate your VillaCare dashboard with quick taps and long presses.',
    url: `${SITE_URL}/join/smartwidget-guide`,
  },
  twitter: {
    card: 'summary',
    title: 'How to Use the SmartWidget',
  },
}

const howToSchema = generateHowToSchema({
  name: 'How to Use the SmartWidget on VillaCare',
  description: 'Complete guide to navigating your cleaner dashboard using the SmartWidget floating button.',
  totalTime: 'PT3M',
  steps: [
    { name: 'Find the floating button', text: 'Look for the terracotta circle in the bottom-right corner of your dashboard.' },
    { name: 'Tap for quick actions', text: 'A quick tap shows context-aware shortcuts for the screen you are on.' },
    { name: 'Long press for full menu', text: 'Hold the button for half a second to open the full navigation menu with all tabs.' },
    { name: 'Navigate between tabs', text: 'Use the full menu to switch between Home, Bookings, Success, Promote, Messages, Team, and Profile.' },
    { name: 'Check notification badges', text: 'Red badges on the widget indicate unread messages or pending items that need attention.' },
  ],
})

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Join', url: '/join' },
  { name: 'SmartWidget Guide', url: '/join/smartwidget-guide' },
])

export default function SmartWidgetGuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SchemaScript schema={[howToSchema, breadcrumbSchema]} />
      {children}
    </>
  )
}
