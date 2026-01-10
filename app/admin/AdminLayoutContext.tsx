'use client'

import { useState, useRef, useCallback, useEffect, createContext, useContext, ReactNode } from 'react'

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

// Swipe detection configuration
const EDGE_THRESHOLD = 50 // px from right edge to start gesture
const SWIPE_THRESHOLD = 100 // px to trigger panel open
const VELOCITY_THRESHOLD = 0.3 // px/ms to trigger even with smaller swipe

export function AdminLayoutProvider({ children }: Props) {
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false)
  const [aiPanelContext, setAIPanelContext] = useState<{ type: string; id: string; summary: string } | null>(null)
  const [swipeProgress, setSwipeProgress] = useState(0)
  const [isSwipeActive, setIsSwipeActive] = useState(false)

  // Touch tracking refs
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const touchCurrentRef = useRef<number>(0)

  const openAIPanel = useCallback((context?: { type: string; id: string; summary: string } | null) => {
    setAIPanelContext(context || null)
    setIsAIPanelOpen(true)
    setSwipeProgress(0)
    setIsSwipeActive(false)
  }, [])

  const closeAIPanel = useCallback(() => {
    setIsAIPanelOpen(false)
    setAIPanelContext(null)
  }, [])

  // Handle touch start - detect if near right edge
  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Don't interfere if panel is already open
    if (isAIPanelOpen) return

    const touch = e.touches[0]
    const windowWidth = window.innerWidth
    const touchX = touch.clientX

    // Check if touch is within edge threshold from right side
    if (windowWidth - touchX <= EDGE_THRESHOLD) {
      touchStartRef.current = {
        x: touchX,
        y: touch.clientY,
        time: Date.now(),
      }
      touchCurrentRef.current = touchX
      setIsSwipeActive(true)
    }
  }, [isAIPanelOpen])

  // Handle touch move - track swipe progress
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current || !isSwipeActive) return

    const touch = e.touches[0]
    const deltaX = touchStartRef.current.x - touch.clientX
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y)

    // If vertical movement is greater, cancel the swipe
    if (deltaY > 50 && Math.abs(deltaX) < deltaY) {
      setIsSwipeActive(false)
      setSwipeProgress(0)
      return
    }

    // Only track left swipes (positive deltaX)
    if (deltaX > 0) {
      touchCurrentRef.current = touch.clientX
      // Progress from 0 to 1
      const progress = Math.min(deltaX / (SWIPE_THRESHOLD * 2), 1)
      setSwipeProgress(progress)

      // Prevent scrolling during swipe
      e.preventDefault()
    }
  }, [isSwipeActive])

  // Handle touch end - determine if swipe was successful
  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current || !isSwipeActive) {
      setIsSwipeActive(false)
      setSwipeProgress(0)
      return
    }

    const deltaX = touchStartRef.current.x - touchCurrentRef.current
    const deltaTime = Date.now() - touchStartRef.current.time
    const velocity = deltaX / deltaTime

    // Open panel if swipe distance or velocity threshold met
    if (deltaX >= SWIPE_THRESHOLD || velocity >= VELOCITY_THRESHOLD) {
      openAIPanel()
    }

    // Reset
    touchStartRef.current = null
    setIsSwipeActive(false)
    setSwipeProgress(0)
  }, [isSwipeActive, openAIPanel])

  // Add global touch listeners
  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  const contextValue = {
    isAIPanelOpen,
    openAIPanel,
    closeAIPanel,
    aiPanelContext,
  }

  return (
    <AdminLayoutContext.Provider value={contextValue}>
      {/* Main content */}
      <div className="relative">
        {children}
      </div>

      {/* Swipe indicator - shows progress when swiping from edge */}
      {isSwipeActive && swipeProgress > 0 && (
        <div
          className="fixed top-0 right-0 bottom-0 w-1 bg-gradient-to-l from-[#C4785A] to-transparent z-50 transition-opacity"
          style={{
            opacity: swipeProgress,
            width: `${Math.min(swipeProgress * 80, 80)}px`,
          }}
        />
      )}

      {/* Visual hint for swipe gesture - subtle right edge indicator */}
      {!isAIPanelOpen && (
        <div className="fixed top-1/2 right-0 -translate-y-1/2 z-30 pointer-events-none">
          <div className="w-1 h-16 bg-gradient-to-l from-[#C4785A]/30 to-transparent rounded-l-full" />
        </div>
      )}
    </AdminLayoutContext.Provider>
  )
}
