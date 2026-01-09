import { Metadata } from 'next'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateBreadcrumbSchema } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'VillaCare privacy policy. How we collect, use, and protect your personal data. GDPR compliant.',
}

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Privacy Policy', url: '/privacy' },
])

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SchemaScript schema={[breadcrumbSchema]} />
      {children}
    </>
  )
}
