'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import NavigationMenu from './NavigationMenu'
import QuickActionMenu from './QuickActionMenu'

export type Screen = 'home' | 'bookings' | 'promote' | 'messages' | 'team' | 'profile' | 'success'

interface SmartWidgetProps {
  currentScreen: Screen
  onNavigate: (screen: Screen) => void
  onQuickAction?: (action: string) => void
  badges?: {
    messages?: number
    team?: number
    bookings?: number
  }
  language?: string
}

const LONG_PRESS_MS = 500

// Hold-progress ring geometry (sits ~4px outside the button's edge)
const RING_SIZE = 64
const RING_STROKE = 3
const RING_RADIUS = (RING_SIZE - RING_STROKE * 2) / 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

// Get the icon for current screen context (returns string for emoji, null for custom render)
const getScreenIcon = (screen: Screen): string | null => {
  const icons: Record<Screen, string | null> = {
    home: null, // Custom calendar with date (home is now the calendar)
    bookings: '📋',
    promote: '📈',
    messages: '💬',
    team: '👥',
    profile: '👤',
    success: '🎯',
  }
  return icons[screen]
}

// Calendar icon component with current date
function CalendarDateIcon() {
  const today = new Date().getDate()
  return (
    <div className="relative w-7 h-7 flex items-center justify-center">
      {/* Calendar base */}
      <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
        {/* Calendar body */}
        <rect x="3" y="4" width="18" height="18" rx="2" fill="currentColor" opacity="0.9" />
        {/* Top bar */}
        <rect x="3" y="4" width="18" height="5" rx="2" fill="currentColor" />
        {/* Binding rings */}
        <rect x="7" y="2" width="2" height="4" rx="1" fill="currentColor" />
        <rect x="15" y="2" width="2" height="4" rx="1" fill="currentColor" />
      </svg>
      {/* Date number */}
      <span className="absolute bottom-0.5 text-[10px] font-bold text-[#A66347]">
        {today}
      </span>
    </div>
  )
}

// Get badge color priority: red > orange > blue
const getBadgeColor = (badges?: SmartWidgetProps['badges']): string | null => {
  if (!badges) return null
  if (badges.messages && badges.messages > 0) return 'bg-red-500'
  if (badges.team && badges.team > 0) return 'bg-orange-500'
  if (badges.bookings && badges.bookings > 0) return 'bg-blue-500'
  return null
}

const getTotalBadgeCount = (badges?: SmartWidgetProps['badges']): number => {
  if (!badges) return 0
  return (badges.messages || 0) + (badges.team || 0) + (badges.bookings || 0)
}

export default function SmartWidget({
  currentScreen,
  onNavigate,
  onQuickAction,
  badges,
  language = 'en',
}: SmartWidgetProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [holding, setHolding] = useState(false)
  const [noRingTransition, setNoRingTransition] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const pressTimer = useRef<NodeJS.Timeout | null>(null)
  const didLongPress = useRef(false)

  // Respect prefers-reduced-motion for the hold-progress ring
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  // Once we force an instant (transition-less) reset, re-arm the transition
  // on the next frame so the next hold animates normally again.
  useEffect(() => {
    if (!noRingTransition) return
    const id = requestAnimationFrame(() => setNoRingTransition(false))
    return () => cancelAnimationFrame(id)
  }, [noRingTransition])

  // Instantly snap the ring back to empty (no reverse animation) whenever a
  // press interaction ends, regardless of how it ended.
  const resetRing = useCallback(() => {
    setNoRingTransition(true)
    setHolding(false)
  }, [])

  const handlePressStart = useCallback(() => {
    setIsPressed(true)
    setNoRingTransition(false)
    setHolding(true)
    didLongPress.current = false

    pressTimer.current = setTimeout(() => {
      didLongPress.current = true
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(10)
      }
      setIsMenuOpen(true)
      setIsPressed(false)
      resetRing()
    }, LONG_PRESS_MS)
  }, [resetRing])

  const handlePressEnd = useCallback(() => {
    setIsPressed(false)

    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }

    // If it wasn't a long press, it's a tap - show quick actions
    if (!didLongPress.current && !isMenuOpen) {
      setIsQuickActionOpen(true)
    }
    resetRing()
  }, [isMenuOpen, resetRing])

  const handlePressCancel = useCallback(() => {
    setIsPressed(false)
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
    resetRing()
  }, [resetRing])

  const handleNavigate = (screen: Screen) => {
    setIsMenuOpen(false)
    onNavigate(screen)
  }

  // Tapping the "hold for full menu" hint in QuickActionMenu opens the
  // NavigationMenu directly - the same transition the long-press success
  // path triggers.
  const handleOpenFullMenuFromHint = () => {
    setIsQuickActionOpen(false)
    setIsMenuOpen(true)
  }

  const handleQuickActionSelect = (action: string) => {
    setIsQuickActionOpen(false)
    if (action.startsWith('navigate:')) {
      onNavigate(action.replace('navigate:', '') as Screen)
    } else {
      onQuickAction?.(action)
    }
  }

  const handleMenuAction = (action: string) => {
    setIsMenuOpen(false)
    if (action === 'support') {
      // Open support chat
      onQuickAction?.('support')
    } else if (action === 'guide') {
      // Open SmartWidget guide
      window.open('/join/smartwidget-guide', '_blank')
    } else if (action === 'feedback') {
      // Open feedback form
      onQuickAction?.('feedback')
    } else if (action === 'settings') {
      // Navigate to settings (part of profile)
      onNavigate('profile')
      onQuickAction?.('settings')
    }
  }

  const badgeColor = getBadgeColor(badges)
  const badgeCount = getTotalBadgeCount(badges)

  return (
    <>
      {/* Hold-progress ring - fills over LONG_PRESS_MS while the button is held */}
      {!prefersReducedMotion && (
        <svg
          className={`fixed bottom-5 right-5 z-40 w-16 h-16 pointer-events-none ${
            holding ? 'opacity-100' : 'opacity-0'
          }`}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          aria-hidden="true"
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke="#C4785A"
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={holding ? 0 : RING_CIRCUMFERENCE}
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            style={{
              transition: noRingTransition
                ? 'none'
                : `stroke-dashoffset ${LONG_PRESS_MS}ms linear`,
            }}
          />
        </svg>
      )}

      {/* Smart Widget Button */}
      <button
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressCancel}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressCancel}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#C4785A] to-[#A66347] text-white shadow-xl flex items-center justify-center transition-all duration-200 select-none ${
          isPressed ? 'scale-95' : 'scale-100'
        } ${isMenuOpen || isQuickActionOpen ? 'opacity-0 scale-0' : 'opacity-100'}`}
        aria-label="Navigation menu"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
      >
        {/* Pulse ring - subtle glow */}
        <span className="absolute inset-0 rounded-full bg-[#C4785A] animate-ping opacity-20" />

        {/* Inner glow ring */}
        <span className="absolute inset-1 rounded-full bg-gradient-to-br from-[#C4785A]/50 to-transparent opacity-50" />

        {/* Badge indicator */}
        {badgeColor && badgeCount > 0 && (
          <span className={`absolute -top-1 -right-1 min-w-5 h-5 px-1 ${badgeColor} text-white rounded-full flex items-center justify-center shadow-lg animate-bounce`}>
            <span className="text-xs font-bold">{badgeCount > 9 ? '9+' : badgeCount}</span>
          </span>
        )}

        {/* Context-aware icon */}
        <span className="text-2xl relative z-10">
          {currentScreen === 'home' ? <CalendarDateIcon /> : getScreenIcon(currentScreen)}
        </span>
      </button>

      {/* Navigation Menu (Long Press) */}
      <NavigationMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onAction={handleMenuAction}
        badges={badges}
        language={language}
      />

      {/* Quick Action Menu (Tap) */}
      <QuickActionMenu
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        currentScreen={currentScreen}
        onSelect={handleQuickActionSelect}
        onOpenFullMenu={handleOpenFullMenuFromHint}
        language={language}
      />
    </>
  )
}
