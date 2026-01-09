import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cleaner Dashboard',
  description: 'Manage your VillaCare cleaning business. View bookings, messages, team, and calendar.',
  robots: {
    index: false, // Don't index dashboard pages
    follow: false,
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
