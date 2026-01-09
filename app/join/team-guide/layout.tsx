import { Metadata } from 'next'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateHowToSchema, generateFAQSchema, generateBreadcrumbSchema } from '@/lib/seo/schema'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.alicantecleaners.com'

export const metadata: Metadata = {
  title: 'Team Member Guide - Join a Cleaning Team',
  description: 'Learn how to join a team on VillaCare. Find teams in your area, request to join, and benefit from coverage and support.',
  openGraph: {
    title: 'How to Join a Team on VillaCare',
    description: 'Join an established team for coverage, support, and more booking opportunities.',
    url: `${SITE_URL}/join/team-guide`,
    images: [{ url: `${SITE_URL}/screenshots/cleaner-team-tab.png`, width: 1200, height: 630, alt: 'VillaCare Team Features' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Join a Team on VillaCare',
    images: [`${SITE_URL}/screenshots/cleaner-team-tab.png`],
  },
}

const howToSchema = generateHowToSchema({
  name: 'How to Join a Team on VillaCare',
  description: 'Step-by-step guide to finding and joining a cleaning team.',
  totalTime: 'PT5M',
  steps: [
    { name: 'Check your Team tab', text: 'Open your dashboard and go to the Team tab to see options.' },
    { name: 'Browse available teams', text: 'See teams with openings in your service areas.' },
    { name: 'Request to join', text: 'Send a join request to a team you like with an optional message.' },
    { name: 'Wait for approval', text: 'The team leader reviews your profile and application.' },
    { name: 'Welcome to the team', text: 'Once accepted, you can contact your team and access team features.' },
  ],
})

const teamMemberFAQs = [
  { question: 'What are the benefits of joining a team?', answer: 'Teams provide support, coverage when you are unavailable, and owners feel more confident booking cleaners from established teams.' },
  { question: 'Can I join without a referral code?', answer: 'Yes! You can browse teams and request to join directly. A referral code just speeds up the process.' },
  { question: 'Can I leave a team?', answer: 'Yes, you can leave anytime from your Team tab. You become independent again but keep all your bookings and reviews.' },
]

const faqSchema = generateFAQSchema(teamMemberFAQs)

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Join', url: '/join' },
  { name: 'Team Member Guide', url: '/join/team-guide' },
])

export default function TeamGuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SchemaScript schema={[howToSchema, faqSchema, breadcrumbSchema]} />
      {children}
    </>
  )
}
