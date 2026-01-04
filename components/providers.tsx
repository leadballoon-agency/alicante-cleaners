'use client'

import { SessionProvider } from 'next-auth/react'
import { LanguageProvider } from './language-context'

type Props = {
  children: React.ReactNode
}

export default function Providers({ children }: Props) {
  return (
    <SessionProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </SessionProvider>
  )
}
