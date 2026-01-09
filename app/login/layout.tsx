import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In - Access Your Dashboard',
  description: 'Sign in to VillaCare with your email or phone number. No password required - we use secure magic links.',
  robots: {
    index: false, // Don't index login pages
    follow: true,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
