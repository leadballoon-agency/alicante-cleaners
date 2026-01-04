'use client'

import { useState, useEffect } from 'react'

type Activity = {
  id: string
  type: 'completed' | 'review' | 'booked'
  message: string
  area: string
  timestamp: string
}

const typeIcons = {
  completed: '✨',
  review: '⭐',
  booked: '📅',
}

const typeColors = {
  completed: 'bg-[#E8F5E9] text-[#2E7D32]',
  review: 'bg-[#FFF8E1] text-[#F57C00]',
  booked: 'bg-[#E3F2FD] text-[#1565C0]',
}

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [])

  useEffect(() => {
    if (activities.length <= 1) return

    const interval = setInterval(() => {
      setIsVisible(false)

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % activities.length)
        setIsVisible(true)
      }, 300)
    }, 4000)

    return () => clearInterval(interval)
  }, [activities.length])

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activity')
      const data = await res.json()
      setActivities(data.activities || [])
    } catch (error) {
      console.error('Error fetching activity:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || activities.length === 0) {
    return null
  }

  const current = activities[currentIndex]

  return (
    <div className="bg-white border border-[#EBEBEB] rounded-full px-4 py-2 inline-flex items-center gap-3 shadow-sm">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${typeColors[current.type]}`}>
        <span className="text-sm">{typeIcons[current.type]}</span>
      </div>

      <div
        className={`transition-all duration-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        <p className="text-sm text-[#1A1A1A] font-medium">
          {current.message}
          {current.area && (
            <span className="text-[#6B6B6B] font-normal"> in {current.area}</span>
          )}
        </p>
        <p className="text-xs text-[#9B9B9B]">{timeAgo(current.timestamp)}</p>
      </div>

      {activities.length > 1 && (
        <div className="flex gap-1 ml-2">
          {activities.slice(0, 5).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === currentIndex % 5 ? 'bg-[#C4785A]' : 'bg-[#DEDEDE]'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
