'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useToast } from '@/components/ui/toast'

type TeamRole = 'leader' | 'member' | 'independent'

type TeamMember = {
  id: string
  name: string
  photo: string | null
  slug: string
  rating?: number | null
  reviewCount?: number
  serviceAreas?: string[]
}

type JoinRequest = {
  id: string
  cleanerId: string
  name: string
  photo: string | null
  slug: string
  rating?: number | null
  reviewCount?: number
  serviceAreas?: string[]
  message: string | null
  createdAt: Date
}

type Team = {
  id: string
  name: string
  referralCode?: string
  leader?: TeamMember & { phone?: string }
  members: TeamMember[]
  pendingRequests?: JoinRequest[]
  createdAt?: Date
}

type BrowseTeam = {
  id: string
  name: string
  leader: TeamMember
  memberCount: number
  createdAt: Date
  hasPendingRequest: boolean
}

type TeamData = {
  role: TeamRole
  team: Team | null
  canCreateTeam?: boolean
}

export default function TeamTab() {
  const { showToast } = useToast()
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [browseTeams, setBrowseTeams] = useState<BrowseTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showBrowseTeams, setShowBrowseTeams] = useState(false)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [joinMessage, setJoinMessage] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showReferCleaner, setShowReferCleaner] = useState(false)
  const [referralName, setReferralName] = useState('')
  const [referralPhone, setReferralPhone] = useState('')
  const [referralNote, setReferralNote] = useState('')

  useEffect(() => {
    fetchTeamData()
  }, [])

  const fetchTeamData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/cleaner/team')
      if (!response.ok) throw new Error('Failed to fetch team data')
      const data = await response.json()
      setTeamData(data)
    } catch (err) {
      console.error('Error fetching team:', err)
      setError('Failed to load team information')
    } finally {
      setLoading(false)
    }
  }

  const fetchBrowseTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      if (!response.ok) throw new Error('Failed to fetch teams')
      const data = await response.json()
      setBrowseTeams(data.teams || [])
    } catch (err) {
      console.error('Error fetching teams:', err)
    }
  }

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return
    setActionLoading('create')
    try {
      const response = await fetch('/api/dashboard/cleaner/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName.trim() }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create team')
      }
      setShowCreateTeam(false)
      setNewTeamName('')
      await fetchTeamData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create team', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleJoinTeam = async (teamId: string) => {
    setActionLoading(teamId)
    try {
      const response = await fetch(`/api/teams/${teamId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: joinMessage }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit request')
      }
      setJoinMessage('')
      await fetchBrowseTeams()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to join team', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelRequest = async (teamId: string) => {
    setActionLoading(teamId)
    try {
      const response = await fetch(`/api/teams/${teamId}/join`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to cancel request')
      await fetchBrowseTeams()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to cancel request', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    setActionLoading(requestId)
    try {
      const response = await fetch(`/api/dashboard/cleaner/team/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (!response.ok) throw new Error('Failed to approve request')
      await fetchTeamData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to approve request', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    setActionLoading(requestId)
    try {
      const response = await fetch(`/api/dashboard/cleaner/team/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })
      if (!response.ok) throw new Error('Failed to reject request')
      await fetchTeamData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to reject request', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from your team?')) return
    setActionLoading(memberId)
    try {
      const response = await fetch(`/api/dashboard/cleaner/team/members/${memberId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to remove member')
      await fetchTeamData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to remove member', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleLeaveTeam = async () => {
    if (!confirm('Are you sure you want to leave this team?')) return
    setActionLoading('leave')
    try {
      const response = await fetch('/api/dashboard/cleaner/team/leave', {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to leave team')
      await fetchTeamData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to leave team', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const copyReferralCode = () => {
    if (teamData?.team?.referralCode) {
      navigator.clipboard.writeText(teamData.team.referralCode)
      showToast('Referral code copied!', 'info')
    }
  }

  const handleReferCleaner = async () => {
    if (!referralName.trim() || !referralPhone.trim() || !referralNote.trim()) {
      showToast('Please fill in all fields', 'error')
      return
    }
    setActionLoading('refer')
    try {
      const response = await fetch('/api/dashboard/cleaner/team/refer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: referralName.trim(),
          phone: referralPhone.trim(),
          recommendation: referralNote.trim(),
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit referral')
      }
      setShowReferCleaner(false)
      setReferralName('')
      setReferralPhone('')
      setReferralNote('')
      showToast('Referral submitted! They will receive an invitation to join.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to submit referral', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#1A1A1A]/20 border-t-[#1A1A1A] rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6B6B6B]">{error}</p>
        <button onClick={fetchTeamData} className="mt-4 text-[#C4785A] font-medium">
          Try again
        </button>
      </div>
    )
  }

  // Team Leader View
  if (teamData?.role === 'leader' && teamData.team) {
    return (
      <div className="space-y-6">
        {/* Team Header */}
        <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-[#C4785A] font-medium mb-1">Team Leader</p>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">{teamData.team.name}</h2>
            </div>
            <span className="text-3xl">👑</span>
          </div>

          <div className="flex items-center gap-2 bg-[#F5F5F3] rounded-lg p-3">
            <span className="text-sm text-[#6B6B6B]">Referral Code:</span>
            <code className="font-mono text-sm text-[#1A1A1A] flex-1">{teamData.team.referralCode}</code>
            <button
              onClick={copyReferralCode}
              className="text-[#C4785A] text-sm font-medium"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Refer a Cleaner */}
        <div className="bg-gradient-to-br from-[#FFF8F5] to-[#FAFAF8] rounded-2xl p-5 border border-[#EBEBEB]">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">✨</span>
            <h3 className="font-semibold text-[#1A1A1A]">Refer a Cleaner</h3>
          </div>
          <p className="text-sm text-[#6B6B6B] mb-4">
            Know someone great? Refer them with a personal recommendation.
          </p>
          {showReferCleaner ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Cleaner's name"
                value={referralName}
                onChange={(e) => setReferralName(e.target.value)}
                className="w-full px-4 py-3 border border-[#EBEBEB] rounded-lg text-[#1A1A1A] placeholder:text-[#9B9B9B] bg-white"
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={referralPhone}
                onChange={(e) => setReferralPhone(e.target.value)}
                className="w-full px-4 py-3 border border-[#EBEBEB] rounded-lg text-[#1A1A1A] placeholder:text-[#9B9B9B] bg-white"
              />
              <textarea
                placeholder="Why do you recommend this person? (required)"
                value={referralNote}
                onChange={(e) => setReferralNote(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-[#EBEBEB] rounded-lg text-[#1A1A1A] placeholder:text-[#9B9B9B] resize-none bg-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReferCleaner}
                  disabled={actionLoading === 'refer' || !referralName.trim() || !referralPhone.trim() || !referralNote.trim()}
                  className="flex-1 bg-[#C4785A] text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
                >
                  {actionLoading === 'refer' ? 'Sending...' : 'Send Referral'}
                </button>
                <button
                  onClick={() => {
                    setShowReferCleaner(false)
                    setReferralName('')
                    setReferralPhone('')
                    setReferralNote('')
                  }}
                  className="px-4 py-2.5 border border-[#EBEBEB] rounded-lg text-[#6B6B6B] bg-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowReferCleaner(true)}
              className="w-full bg-[#C4785A] text-white py-2.5 rounded-lg font-medium"
            >
              Refer Someone
            </button>
          )}
        </div>

        {/* Pending Requests */}
        {teamData.team.pendingRequests && teamData.team.pendingRequests.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-[#1A1A1A] mb-3">
              Pending Requests ({teamData.team.pendingRequests.length})
            </h3>
            <div className="space-y-3">
              {teamData.team.pendingRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-2xl p-4 border border-[#EBEBEB]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden relative">
                      {request.photo ? (
                        <Image src={request.photo} alt={request.name || ''} fill className="object-cover" unoptimized />
                      ) : (
                        <span className="text-xl">👤</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-[#1A1A1A]">{request.name}</h4>
                      {request.rating && (
                        <p className="text-sm text-[#6B6B6B]">
                          ⭐ {request.rating.toFixed(1)} ({request.reviewCount} reviews)
                        </p>
                      )}
                    </div>
                  </div>
                  {request.message && (
                    <p className="text-sm text-[#6B6B6B] mb-3 italic">&ldquo;{request.message}&rdquo;</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveRequest(request.id)}
                      disabled={actionLoading === request.id}
                      className="flex-1 bg-[#1A1A1A] text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {actionLoading === request.id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      disabled={actionLoading === request.id}
                      className="flex-1 border border-[#EBEBEB] text-[#6B6B6B] py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Members */}
        <div>
          <h3 className="text-sm font-medium text-[#1A1A1A] mb-3">
            Team Members ({teamData.team.members.length})
          </h3>
          {teamData.team.members.length === 0 ? (
            <div className="bg-[#F5F5F3] rounded-2xl p-6 text-center">
              <p className="text-3xl mb-2">👥</p>
              <p className="text-[#6B6B6B]">No team members yet</p>
              <p className="text-sm text-[#9B9B9B] mt-1">Share your referral code to grow your team</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teamData.team.members.map((member) => (
                <div key={member.id} className="bg-white rounded-2xl p-4 border border-[#EBEBEB]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden relative">
                      {member.photo ? (
                        <Image src={member.photo} alt={member.name || ''} fill className="object-cover" unoptimized />
                      ) : (
                        <span className="text-xl">👤</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-[#1A1A1A]">{member.name}</h4>
                      {member.rating && (
                        <p className="text-sm text-[#6B6B6B]">
                          ⭐ {member.rating.toFixed(1)} ({member.reviewCount} reviews)
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={actionLoading === member.id}
                      className="text-[#FF4444] text-sm font-medium disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Team Member View
  if (teamData?.role === 'member' && teamData.team) {
    return (
      <div className="space-y-6">
        {/* Team Info */}
        <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-[#6B6B6B] mb-1">Your Team</p>
              <h2 className="text-xl font-semibold text-[#1A1A1A]">{teamData.team.name}</h2>
            </div>
            <span className="text-3xl">👥</span>
          </div>

          {teamData.team.leader && (
            <div className="flex items-center gap-3 bg-[#F5F5F3] rounded-lg p-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden relative">
                {teamData.team.leader.photo ? (
                  <Image src={teamData.team.leader.photo} alt={teamData.team.leader.name || ''} fill className="object-cover" unoptimized />
                ) : (
                  <span>👤</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-[#6B6B6B]">Team Leader</p>
                <p className="font-medium text-[#1A1A1A]">{teamData.team.leader.name}</p>
              </div>
              {teamData.team.leader.phone && (
                <a
                  href={`tel:${teamData.team.leader.phone}`}
                  className="text-[#C4785A] text-sm font-medium"
                >
                  Call
                </a>
              )}
            </div>
          )}
        </div>

        {/* Team Members */}
        <div>
          <h3 className="text-sm font-medium text-[#1A1A1A] mb-3">
            Team Members ({teamData.team.members.length})
          </h3>
          <div className="space-y-3">
            {teamData.team.members.map((member) => (
              <div key={member.id} className="bg-white rounded-2xl p-4 border border-[#EBEBEB]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden relative">
                    {member.photo ? (
                      <Image src={member.photo} alt={member.name || ''} fill className="object-cover" unoptimized />
                    ) : (
                      <span className="text-xl">👤</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">{member.name}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Team */}
        <button
          onClick={handleLeaveTeam}
          disabled={actionLoading === 'leave'}
          className="w-full py-3 text-[#FF4444] text-sm font-medium disabled:opacity-50"
        >
          {actionLoading === 'leave' ? 'Leaving...' : 'Leave Team'}
        </button>
      </div>
    )
  }

  // Independent Cleaner View
  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-[#6B6B6B] mb-1">Status</p>
            <h2 className="text-xl font-semibold text-[#1A1A1A]">Independent</h2>
          </div>
          <span className="text-3xl">🦸</span>
        </div>
        <p className="text-sm text-[#6B6B6B]">
          You&apos;re working independently. Join a team for coverage support and collaboration.
        </p>
      </div>

      {/* Create Team (if team leader) */}
      {teamData?.canCreateTeam && (
        <div className="bg-gradient-to-br from-[#FFF8F5] to-[#FAFAF8] rounded-2xl p-5 border border-[#EBEBEB]">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">👑</span>
            <h3 className="font-semibold text-[#1A1A1A]">Create Your Team</h3>
          </div>
          <p className="text-sm text-[#6B6B6B] mb-4">
            As a team leader, you can create a team and invite other cleaners to join.
          </p>
          {showCreateTeam ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Team name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="w-full px-4 py-3 border border-[#EBEBEB] rounded-lg text-[#1A1A1A] placeholder:text-[#9B9B9B]"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTeam}
                  disabled={actionLoading === 'create' || !newTeamName.trim()}
                  className="flex-1 bg-[#1A1A1A] text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
                >
                  {actionLoading === 'create' ? 'Creating...' : 'Create Team'}
                </button>
                <button
                  onClick={() => setShowCreateTeam(false)}
                  className="px-4 py-2.5 border border-[#EBEBEB] rounded-lg text-[#6B6B6B]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateTeam(true)}
              className="w-full bg-[#C4785A] text-white py-2.5 rounded-lg font-medium"
            >
              Create Team
            </button>
          )}
        </div>
      )}

      {/* Browse Teams */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#1A1A1A]">Join a Team</h3>
          {!showBrowseTeams && (
            <button
              onClick={() => {
                setShowBrowseTeams(true)
                fetchBrowseTeams()
              }}
              className="text-[#C4785A] text-sm font-medium"
            >
              Browse Teams
            </button>
          )}
        </div>

        {showBrowseTeams ? (
          browseTeams.length === 0 ? (
            <div className="bg-[#F5F5F3] rounded-2xl p-6 text-center">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-[#6B6B6B]">No teams available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {browseTeams.map((team) => (
                <div key={team.id} className="bg-white rounded-2xl p-4 border border-[#EBEBEB]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden relative">
                      {team.leader.photo ? (
                        <Image src={team.leader.photo} alt={team.leader.name || ''} fill className="object-cover" unoptimized />
                      ) : (
                        <span className="text-xl">👤</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-[#1A1A1A]">{team.name}</h4>
                      <p className="text-sm text-[#6B6B6B]">
                        Led by {team.leader.name} · {team.memberCount} members
                      </p>
                    </div>
                  </div>

                  {team.hasPendingRequest ? (
                    <button
                      onClick={() => handleCancelRequest(team.id)}
                      disabled={actionLoading === team.id}
                      className="w-full py-2.5 border border-[#EBEBEB] text-[#6B6B6B] rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {actionLoading === team.id ? '...' : 'Cancel Request'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinTeam(team.id)}
                      disabled={actionLoading === team.id}
                      className="w-full py-2.5 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {actionLoading === team.id ? 'Sending...' : 'Request to Join'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="bg-[#F5F5F3] rounded-2xl p-6 text-center">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-[#6B6B6B]">Find a team to join for coverage support</p>
          </div>
        )}
      </div>
    </div>
  )
}
