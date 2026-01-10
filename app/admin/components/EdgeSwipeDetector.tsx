'use client'

import { useRef, useCallback } from 'react'

interface Props {
  onSwipeLeft: () => void
  edgeWidth?: number // pixels from right edge to detect
  threshold?: number // pixels to swipe before triggering
}

export default function EdgeSwipeDetector({
  onSwipeLeft,
  edgeWidth = 40,
  threshold = 80
}: Props) {
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const isEdgeSwipe = useRef(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    const screenWidth = window.innerWidth

    // Check if touch started within edge zone (right side of screen)
    if (touch.clientX >= screenWidth - edgeWidth) {
      touchStartX.current = touch.clientX
      touchStartY.current = touch.clientY
      isEdgeSwipe.current = true
    } else {
      isEdgeSwipe.current = false
    }
  }, [edgeWidth])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isEdgeSwipe.current || touchStartX.current === null || touchStartY.current === null) return

    const touch = e.touches[0]
    const deltaX = touchStartX.current - touch.clientX // positive = swiping left
    const deltaY = Math.abs(touch.clientY - touchStartY.current)

    // If horizontal swipe is dominant and exceeds threshold, trigger
    if (deltaX > threshold && deltaX > deltaY * 2) {
      onSwipeLeft()
      // Reset to prevent multiple triggers
      isEdgeSwipe.current = false
      touchStartX.current = null
      touchStartY.current = null
    }
  }, [threshold, onSwipeLeft])

  const handleTouchEnd = useCallback(() => {
    touchStartX.current = null
    touchStartY.current = null
    isEdgeSwipe.current = false
  }, [])

  return (
    <div
      className="fixed right-0 bottom-0 z-30 pointer-events-auto"
      style={{
        width: edgeWidth,
        top: 60 // Start below header to not block AI button
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  )
}
