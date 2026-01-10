'use client'

import { useState, useRef, useEffect } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'

// Only render in development
const isDev = process.env.NODE_ENV === 'development'

interface TestUser {
  id: string
  label: string
  shortLabel: string
  role: 'owner' | 'cleaner' | 'admin'
  credential: string
  dashboard: string
  emoji: string
}

const testUsers: TestUser[] = [
  {
    id: 'owner',
    label: 'Test Owner',
    shortLabel: 'Owner',
    role: 'owner',
    credential: 'mark@example.com',
    dashboard: '/owner/dashboard',
    emoji: '🏠'
  },
  {
    id: 'cleaner-clara',
    label: 'Clara',
    shortLabel: 'Clara',
    role: 'cleaner',
    credential: '+34612345678',
    dashboard: '/dashboard',
    emoji: '✨'
  },
  {
    id: 'cleaner-maria',
    label: 'Maria',
    shortLabel: 'Maria',
    role: 'cleaner',
    credential: '+34623456789',
    dashboard: '/dashboard',
    emoji: '🧹'
  },
  {
    id: 'admin',
    label: 'Admin',
    shortLabel: 'Admin',
    role: 'admin',
    credential: 'mark@leadballoon.co.uk',
    dashboard: '/admin',
    emoji: '👑'
  }
]

export default function DevUserSwitcher() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isDev) return // Skip effect in production
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Don't render in production
  if (!isDev) return null

  const currentUser = session?.user
  const currentRole = currentUser?.role?.toLowerCase() || 'guest'

  const handleSwitchUser = async (user: TestUser) => {
    setSwitching(user.id)
    setIsOpen(false)

    try {
      // Sign out first
      await signOut({ redirect: false })

      // Use the dev-login provider for all users (bypasses OTP/magic link)
      const result = await signIn('dev-login', {
        identifier: user.credential,
        redirect: false
      })

      if (result?.ok) {
        window.location.href = user.dashboard
      } else {
        console.error('Dev login failed:', result?.error)
        window.location.href = `/login?callbackUrl=${encodeURIComponent(user.dashboard)}`
      }
    } catch (error) {
      console.error('Failed to switch user:', error)
    } finally {
      setSwitching(null)
    }
  }

  const getRoleEmoji = () => {
    if (currentRole === 'admin') return '👑'
    if (currentRole === 'owner') return '🏠'
    if (currentRole === 'cleaner') return '✨'
    return '👤'
  }

  const getRoleBadgeColor = () => {
    if (currentRole === 'admin') return 'bg-purple-500'
    if (currentRole === 'owner') return 'bg-blue-500'
    if (currentRole === 'cleaner') return 'bg-green-500'
    return 'bg-gray-500'
  }

  return (
    <>
      {/* Spacer to push content down */}
      <div className="h-8" />
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-[#1A1A1A] text-white text-xs">
      <div className="max-w-screen-xl mx-auto px-4 py-1.5 flex items-center justify-between gap-4">
        {/* Left: Dev Mode indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono bg-yellow-500 text-black px-1.5 py-0.5 rounded">DEV</span>
          <span className="text-white/60 hidden sm:inline">Development Mode</span>
        </div>

        {/* Center: Current user with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={switching !== null}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            {switching ? (
              <>
                <span className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
                <span className="text-white/80">Switching...</span>
              </>
            ) : status === 'loading' ? (
              <span className="text-white/60">Loading...</span>
            ) : currentUser ? (
              <>
                <span>{getRoleEmoji()}</span>
                <span className="font-medium">
                  {currentUser.name?.split(' ')[0] || currentUser.email?.split('@')[0] || 'User'}
                </span>
                <span className={`${getRoleBadgeColor()} text-white text-[10px] px-1.5 py-0.5 rounded capitalize`}>
                  {currentRole}
                </span>
                <span className="text-white/40">▼</span>
              </>
            ) : (
              <>
                <span>👤</span>
                <span className="text-white/60">Not logged in</span>
                <span className="text-white/40">▼</span>
              </>
            )}
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#EBEBEB] overflow-hidden text-[#1A1A1A]">
              <div className="px-3 py-2 bg-[#F5F5F3] border-b border-[#EBEBEB]">
                <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wide font-medium">Switch User</p>
              </div>
              {testUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSwitchUser(user)}
                  className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-[#F5F5F3] transition-colors border-b border-[#EBEBEB] last:border-b-0"
                >
                  <span>{user.emoji}</span>
                  <span className="flex-1 text-left font-medium text-sm">{user.label}</span>
                  <span className="text-[10px] text-[#9B9B9B] capitalize">{user.role}</span>
                </button>
              ))}
              {currentUser && (
                <>
                  <div className="border-t border-[#EBEBEB]" />
                  <button
                    onClick={() => { signOut({ callbackUrl: '/' }); setIsOpen(false) }}
                    className="w-full px-3 py-2.5 text-sm text-[#C75050] hover:bg-[#FFEBEE] transition-colors text-left"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Quick nav links */}
        <div className="flex items-center gap-1">
          <a href="/" className="px-2 py-1 rounded hover:bg-white/10 transition-colors hidden sm:block">🌐</a>
          <a href="/dashboard" className="px-2 py-1 rounded hover:bg-white/10 transition-colors">✨</a>
          <a href="/owner/dashboard" className="px-2 py-1 rounded hover:bg-white/10 transition-colors">🏠</a>
          <a href="/admin" className="px-2 py-1 rounded hover:bg-white/10 transition-colors">👑</a>
        </div>
      </div>
    </div>
    </>
  )
}
