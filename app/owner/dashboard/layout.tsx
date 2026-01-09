import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Owner Dashboard',
  description: 'Manage your VillaCare properties and bookings. View cleaning history, messages, and reviews.',
  robots: {
    index: false, // Don't index dashboard pages
    follow: false,
  },
}

export default function OwnerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
