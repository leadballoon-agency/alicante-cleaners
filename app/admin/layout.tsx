import { AdminLayoutProvider } from './AdminLayoutContext'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayoutProvider>{children}</AdminLayoutProvider>
}
