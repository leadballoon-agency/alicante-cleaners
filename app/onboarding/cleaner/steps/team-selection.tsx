'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

type TeamLeader = {
  id: string
  slug: string
  name: string
  photo: string | null
  rating: number
  reviewCount: number
  serviceAreas: string[]
  teamName: string | null
  memberCount: number
}

type Props = {
  cleanerId: string
  serviceAreas: string[]
  onBack: () => void
  onNext: () => void
}

export default function TeamSelection({ cleanerId, serviceAreas, onBack, onNext }: Props) {
  const [teamLeaders, setTeamLeaders] = useState<TeamLeader[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdminRequest, setShowAdminRequest] = useState(false)

  useEffect(() => {
    fetchTeamLeaders()
  }, [])

  const fetchTeamLeaders = async () => {
    try {
      const res = await fetch('/api/teams/leaders')
      if (res.ok) {
        const data = await res.json()
        // Filter team leaders by matching service areas
        const matchingLeaders = data.leaders.filter((leader: TeamLeader) =>
          leader.serviceAreas.some(area => serviceAreas.includes(area))
        )
        setTeamLeaders(matchingLeaders)
      }
    } catch (err) {
      console.error('Failed to fetch team leaders:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChatWithLeader = (slug: string) => {
    // Open the team leader's profile page with applicant flag
    // The chat widget will detect this and handle it appropriately
    window.open(`/${slug}?applicant=${cleanerId}`, '_blank')
  }

  const handleAdminRequest = () => {
    setShowAdminRequest(true)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#6B6B6B] mt-4">Finding team leaders in your area...</p>
      </div>
    )
  }

  // Show admin request success
  if (showAdminRequest) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#E3F2FD] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">&#128203;</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Request Submitted</h1>
          <p className="text-[#6B6B6B] mt-2">
            We&apos;ve received your request for admin review. Our team will contact you shortly.
          </p>
        </div>

        <div className="bg-[#F5F5F3] rounded-2xl p-4">
          <p className="text-sm text-[#6B6B6B]">
            As we&apos;re a referral-based platform, we need to verify new cleaners. An admin will
            reach out to discuss your experience and potentially connect you with a team leader.
          </p>
        </div>

        <button
          onClick={onNext}
          className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium active:scale-[0.98] transition-transform"
        >
          Continue
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="text-[#6B6B6B] text-sm mb-4 flex items-center gap-1"
        >
          &larr; Back
        </button>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Connect with a Team Leader</h1>
        <p className="text-[#6B6B6B] mt-1">
          Chat with a team leader in your area. They&apos;ll get to know you and verify your experience before you can start working.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-[#FFF8F5] rounded-2xl p-4 border border-[#F5E6E0]">
        <div className="flex items-start gap-3">
          <span className="text-2xl">&#128172;</span>
          <div>
            <h3 className="font-medium text-[#1A1A1A]">How verification works</h3>
            <ul className="text-sm text-[#6B6B6B] mt-2 space-y-1">
              <li>&#8226; Chat with a team leader about your experience</li>
              <li>&#8226; They may arrange to meet or work together</li>
              <li>&#8226; Once verified, you can start accepting bookings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Team Leaders List */}
      {teamLeaders.length > 0 ? (
        <div className="space-y-3">
          {teamLeaders.map(leader => (
            <div
              key={leader.id}
              className="bg-white rounded-2xl p-4 border border-[#EBEBEB]"
            >
              <div className="flex items-start gap-3">
                {/* Leader Photo */}
                <div className="w-14 h-14 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden relative flex-shrink-0">
                  {leader.photo ? (
                    <Image
                      src={leader.photo}
                      alt={leader.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-2xl">&#128100;</span>
                  )}
                </div>

                {/* Leader Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#1A1A1A]">{leader.name}</h3>
                    <span className="px-2 py-0.5 bg-[#C4785A] text-white text-xs font-medium rounded-full">
                      Team Leader
                    </span>
                  </div>
                  {leader.teamName && (
                    <p className="text-sm text-[#6B6B6B]">{leader.teamName}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    <span className="flex items-center gap-1">
                      <span className="text-[#C4785A]">&#9733;</span>
                      {leader.rating?.toFixed(1) || '5.0'}
                    </span>
                    <span className="text-[#9B9B9B]">
                      {leader.reviewCount} reviews
                    </span>
                    {leader.memberCount > 0 && (
                      <span className="text-[#9B9B9B]">
                        {leader.memberCount} team member{leader.memberCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Areas */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {leader.serviceAreas.slice(0, 3).map(area => (
                  <span
                    key={area}
                    className={`text-xs px-2 py-1 rounded-full ${
                      serviceAreas.includes(area)
                        ? 'bg-[#E8F5E9] text-[#2E7D32]'
                        : 'bg-[#F5F5F3] text-[#6B6B6B]'
                    }`}
                  >
                    {area}
                  </span>
                ))}
                {leader.serviceAreas.length > 3 && (
                  <span className="text-xs text-[#9B9B9B]">
                    +{leader.serviceAreas.length - 3} more
                  </span>
                )}
              </div>

              {/* Chat Button */}
              <button
                onClick={() => handleChatWithLeader(leader.slug)}
                className="w-full mt-4 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <span>&#128172;</span>
                Chat with {leader.name.split(' ')[0]}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#F5F5F3] rounded-2xl p-6 text-center">
          <span className="text-4xl mb-3 block">&#128269;</span>
          <h3 className="font-medium text-[#1A1A1A]">No team leaders in your area yet</h3>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Request admin review to get started
          </p>
        </div>
      )}

      {/* Continue / Admin Review Option */}
      <div className="space-y-3 pt-4 border-t border-[#EBEBEB]">
        <button
          onClick={onNext}
          className="w-full py-3.5 bg-[#F5F5F3] text-[#1A1A1A] rounded-xl font-medium"
        >
          Continue to Dashboard
        </button>

        {teamLeaders.length > 0 && (
          <button
            onClick={handleAdminRequest}
            className="w-full py-3 text-[#6B6B6B] text-sm"
          >
            No suitable team? <span className="text-[#1A1A1A] font-medium">Request admin review</span>
          </button>
        )}
      </div>
    </div>
  )
}
