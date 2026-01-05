'use client'

import { SessionProvider } from 'next-auth/react'
import { LanguageProvider } from './language-context'
import { ToastProvider } from './ui/toast'

type Props = {
  children: React.ReactNode
}

export default function Providers({ children }: Props) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </LanguageProvider>
    </SessionProvider>
  )
}
