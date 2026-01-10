'use client'

import { useState, useRef, useCallback, ReactNode } from 'react'

interface Props {
  onRefresh: () => Promise<void>
  children: ReactNode
}

const PULL_THRESHOLD = 80 // pixels to pull before triggering refresh
const MAX_PULL = 120 // max pull distance

export default function PullToRefresh({ onRefresh, children }: Props) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const touchStartY = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only enable pull-to-refresh when at top of scroll
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null || isRefreshing) return

    const currentY = e.touches[0].clientY
    const diff = currentY - touchStartY.current

    // Only allow pulling down (positive diff) when at top
    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      // Apply resistance - pull gets harder as you go
      const resistance = 0.5
      const adjustedDiff = Math.min(diff * resistance, MAX_PULL)
      setPullDistance(adjustedDiff)

      // Prevent default scroll behavior when pulling
      if (adjustedDiff > 10) {
        e.preventDefault()
      }
    }
  }, [isRefreshing])

  const handleTouchEnd = useCallback(async () => {
    if (touchStartY.current === null) return

    touchStartY.current = null

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(PULL_THRESHOLD) // Keep at threshold during refresh

      try {
        await onRefresh()
      } catch (err) {
        console.error('Refresh failed:', err)
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      // Animate back to 0
      setPullDistance(0)
    }
  }, [pullDistance, isRefreshing, onRefresh])

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1)
  const isPastThreshold = pullDistance >= PULL_THRESHOLD

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto"
      style={{ touchAction: pullDistance > 0 ? 'none' : 'auto' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden"
        style={{
          height: pullDistance,
          top: 0,
          transition: pullDistance === 0 ? 'height 0.2s ease-out' : 'none'
        }}
      >
        <div className="flex flex-col items-center gap-1">
          {isRefreshing ? (
            <div className="w-6 h-6 border-2 border-[#C4785A] border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isPastThreshold ? 'border-[#C4785A] bg-[#C4785A]' : 'border-[#DEDEDE]'
                }`}
                style={{
                  transform: `rotate(${progress * 180}deg)`,
                  transition: 'transform 0.1s ease-out'
                }}
              >
                <span className={`text-xs ${isPastThreshold ? 'text-white' : 'text-[#9B9B9B]'}`}>
                  ↓
                </span>
              </div>
              {pullDistance > 20 && (
                <span className={`text-xs ${isPastThreshold ? 'text-[#C4785A]' : 'text-[#9B9B9B]'}`}>
                  {isPastThreshold ? 'Release to refresh' : 'Pull to refresh'}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content with transform */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.2s ease-out' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  )
}
