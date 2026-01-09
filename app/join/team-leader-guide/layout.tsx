import { Metadata } from 'next'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateHowToSchema, generateFAQSchema, generateBreadcrumbSchema } from '@/lib/seo/schema'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.alicantecleaners.com'

export const metadata: Metadata = {
  title: 'Team Leader Guide - Build Your Cleaning Team',
  description: 'Learn how to become a team leader on VillaCare. Invite cleaners, manage applications, and build a trusted team for coverage and growth.',
  openGraph: {
    title: 'How to Lead a Team on VillaCare',
    description: 'Become a team leader after 200 hours and 4.5+ stars. Invite and manage your cleaning team.',
    url: `${SITE_URL}/join/team-leader-guide`,
    images: [{ url: `${SITE_URL}/screenshots/cleaner-team-tab.png`, width: 1200, height: 630, alt: 'VillaCare Team Management' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Lead a Team on VillaCare',
    images: [`${SITE_URL}/screenshots/cleaner-team-tab.png`],
  },
}

const howToSchema = generateHowToSchema({
  name: 'How to Lead a Team on VillaCare',
  description: 'Complete guide to team leadership - inviting members, reviewing applicants, and managing your team.',
  totalTime: 'PT10M',
  steps: [
    { name: 'Become eligible', text: 'Complete 200 hours of work and maintain a 4.5+ star rating.' },
    { name: 'Create your team', text: 'Go to the Team tab and create your team with a name.' },
    { name: 'Get your referral code', text: 'Share your unique code with cleaners you want to invite.' },
    { name: 'Review applicants', text: 'See applications from cleaners who want to join your team.' },
    { name: 'Accept team members', text: 'Approve trusted cleaners to join your team.' },
    { name: 'Manage your team', text: 'View team calendar, remove members if needed, and coordinate coverage.' },
  ],
})

const teamLeaderFAQs = [
  { question: 'What are the requirements to become a team leader?', answer: '200 completed hours on the platform and maintaining a 4.5+ star rating.' },
  { question: 'How many team members can I have?', answer: 'Currently there is no limit. Build a team that works for your coverage needs.' },
  { question: 'Can I remove team members?', answer: 'Yes, you can remove members from your team at any time from the Team tab.' },
  { question: 'Do team members share my bookings?', answer: 'You can assign bookings to team members when you need coverage. Each member maintains their own profile and bookings.' },
]

const faqSchema = generateFAQSchema(teamLeaderFAQs)

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Join', url: '/join' },
  { name: 'Team Leader Guide', url: '/join/team-leader-guide' },
])

export default function TeamLeaderGuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SchemaScript schema={[howToSchema, faqSchema, breadcrumbSchema]} />
      {children}
    </>
  )
}
