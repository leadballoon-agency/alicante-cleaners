'use client'

import { useState, useEffect } from 'react'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

export default function ImpersonationBanner() {
  const [impersonating, setImpersonating] = useState<string | null>(null)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const impersonatedName = getCookie('impersonating_user_name')
    if (impersonatedName) {
      setImpersonating(decodeURIComponent(impersonatedName))
    }
  }, [])

  const handleExit = async () => {
    setExiting(true)
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'DELETE',
      })

      if (response.ok) {
        const data = await response.json()
        window.location.href = data.redirectTo || '/admin'
      }
    } catch (err) {
      console.error('Error exiting impersonation:', err)
      setExiting(false)
    }
  }

  if (!impersonating) return null

  return (
    <>
      {/* Spacer to push content down (same height as fixed banner) */}
      <div className="h-10" />
      {/* Fixed banner */}
      <div className="fixed top-0 left-0 right-0 bg-[#1A1A1A] text-white px-4 py-2 flex items-center justify-between z-[9999] h-10">
        <div className="flex items-center gap-2">
          <span className="text-sm">👁</span>
          <span className="text-sm">
            Viewing as <span className="font-medium">{impersonating}</span>
          </span>
        </div>
        <button
          onClick={handleExit}
          disabled={exiting}
          className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full font-medium transition-colors disabled:opacity-50"
        >
          {exiting ? 'Exiting...' : 'Exit to Admin'}
        </button>
      </div>
    </>
  )
}
