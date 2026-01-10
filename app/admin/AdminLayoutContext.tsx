'use client'

import { useState, useCallback, createContext, useContext, ReactNode } from 'react'

// Context for AI panel control
type AdminLayoutContextType = {
  isAIPanelOpen: boolean
  openAIPanel: (context?: { type: string; id: string; summary: string } | null) => void
  closeAIPanel: () => void
  aiPanelContext: { type: string; id: string; summary: string } | null
}

const AdminLayoutContext = createContext<AdminLayoutContextType>({
  isAIPanelOpen: false,
  openAIPanel: () => {},
  closeAIPanel: () => {},
  aiPanelContext: null,
})

export const useAdminLayout = () => useContext(AdminLayoutContext)

interface Props {
  children: ReactNode
}

export function AdminLayoutProvider({ children }: Props) {
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false)
  const [aiPanelContext, setAIPanelContext] = useState<{ type: string; id: string; summary: string } | null>(null)

  const openAIPanel = useCallback((context?: { type: string; id: string; summary: string } | null) => {
    setAIPanelContext(context || null)
    setIsAIPanelOpen(true)
  }, [])

  const closeAIPanel = useCallback(() => {
    setIsAIPanelOpen(false)
    setAIPanelContext(null)
  }, [])

  const contextValue = {
    isAIPanelOpen,
    openAIPanel,
    closeAIPanel,
    aiPanelContext,
  }

  return (
    <AdminLayoutContext.Provider value={contextValue}>
      {children}
    </AdminLayoutContext.Provider>
  )
}
