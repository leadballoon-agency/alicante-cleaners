import { Metadata } from 'next'
import { SchemaScript } from '@/components/seo/schema-script'
import { generateBreadcrumbSchema } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'VillaCare terms and conditions for property owners and cleaning professionals using our platform in Alicante, Spain.',
}

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Terms & Conditions', url: '/terms' },
])

export default function TermsLayout({
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
