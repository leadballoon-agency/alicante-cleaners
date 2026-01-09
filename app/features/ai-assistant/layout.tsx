import { Metadata } from 'next'
import { SchemaScript } from '@/components/seo/schema-script'
import {
  generateSoftwareApplicationSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
} from '@/lib/seo/schema'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.alicantecleaners.com'

export const metadata: Metadata = {
  title: 'AI Sales Assistant - Never Miss a Booking',
  description: 'Your AI assistant handles inquiries 24/7, checks your calendar, answers questions in any language, and books jobs while you clean. Free for all VillaCare cleaners.',
  keywords: ['AI booking assistant', 'cleaner AI', 'automated booking', 'multilingual assistant'],
  openGraph: {
    title: 'AI Sales Assistant for Cleaners',
    description: 'Handle inquiries 24/7 with your personal AI assistant. It speaks every language your clients do.',
    url: `${SITE_URL}/features/ai-assistant`,
    type: 'website',
    images: [{ url: `${SITE_URL}/screenshots/ai-sales-assistant.png`, width: 1200, height: 630, alt: 'VillaCare AI Sales Assistant' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Sales Assistant for Cleaners',
    description: 'Handle inquiries 24/7 with your personal AI assistant.',
    images: [`${SITE_URL}/screenshots/ai-sales-assistant.png`],
  },
}

// AI Assistant FAQs
const aiFAQs = [
  {
    question: 'What can the AI assistant do?',
    answer: 'Your AI assistant answers inquiries about your services, checks your calendar availability, quotes prices based on your rates, and can guide clients through the booking process.',
  },
  {
    question: 'What languages does it speak?',
    answer: 'The AI speaks English, Spanish, German, French, Dutch, Italian, and Portuguese fluently. It automatically responds in whatever language the client uses.',
  },
  {
    question: 'Will it promise things I cannot deliver?',
    answer: 'No. The AI only knows your actual services, rates, and availability. It will never overcommit or make promises you have not approved.',
  },
  {
    question: 'Can clients still contact me directly?',
    answer: 'Absolutely. The AI makes it easy to connect via WhatsApp when clients prefer to speak with you directly. It handles the initial inquiry, you handle the relationship.',
  },
  {
    question: 'Is there an extra cost for the AI assistant?',
    answer: 'No. The AI assistant is included free for all VillaCare cleaners. It is part of your profile.',
  },
]

const softwareSchema = generateSoftwareApplicationSchema({
  name: 'VillaCare AI Sales Assistant',
  description: 'AI-powered booking assistant for professional cleaners. Handles inquiries, checks availability, and books jobs automatically in 7 languages.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  featureList: [
    'Multilingual support (7 languages)',
    'Real-time calendar availability checking',
    'Automatic price quoting',
    'WhatsApp handoff for direct contact',
    '24/7 availability',
    'Service area awareness',
  ],
})

const faqSchema = generateFAQSchema(aiFAQs)

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Features', url: '/features' },
  { name: 'AI Assistant', url: '/features/ai-assistant' },
])

export default function AIAssistantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SchemaScript schema={[softwareSchema, faqSchema, breadcrumbSchema]} />
      {children}
    </>
  )
}
