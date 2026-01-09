'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useToast } from '@/components/ui/toast'
import { useLanguage } from '@/components/language-context'

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

type TeamLeaderProgress = {
  totalHoursWorked: number
  requiredHours: number
  hoursRemaining: number
  currentRating: number
  requiredRating: number
  hasMinHours: boolean
  hasMinRating: boolean
}

type ApplicantConversation = {
  id: string
  applicantId: string
  applicantName: string
  applicantPhoto: string | null
  applicantPhone: string | null
  applicantServiceAreas: string[]
  applicantHourlyRate: number | null
  applicantBio: string | null
  applicantStatus: string
  status: 'ACTIVE' | 'ACCEPTED' | 'REJECTED'
  summary: string | null
  messageCount: number
  createdAt: Date
  updatedAt: Date
}

type TeamData = {
  role: TeamRole
  team: Team | null
  canCreateTeam?: boolean
  teamLeaderProgress?: TeamLeaderProgress
}

export default function TeamTab() {
  const { showToast } = useToast()
  const { t } = useLanguage()
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
  const [showEditTeamName, setShowEditTeamName] = useState(false)
  const [editedTeamName, setEditedTeamName] = useState('')
  const [applicantConversations, setApplicantConversations] = useState<ApplicantConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [conversationMessages, setConversationMessages] = useState<{role: string, content: string, createdAt: Date}[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  useEffect(() => {
    fetchTeamData()
  }, [])

  useEffect(() => {
    if (teamData?.role === 'leader') {
      fetchApplicantConversations()
    }
  }, [teamData?.role])

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

  const fetchApplicantConversations = async () => {
    try {
      const response = await fetch('/api/dashboard/cleaner/team/applicants')
      if (response.ok) {
        const data = await response.json()
        setApplicantConversations(data.conversations || [])
      }
    } catch (err) {
      console.error('Error fetching applicant conversations:', err)
    }
  }

  const fetchConversationMessages = async (conversationId: string) => {
    setLoadingMessages(true)
    try {
      const response = await fetch(`/api/dashboard/cleaner/team/applicants/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setConversationMessages(data.messages || [])
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleAcceptApplicant = async (conversationId: string) => {
    setActionLoading(conversationId)
    try {
      const response = await fetch(`/api/dashboard/cleaner/team/applicants/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      })
      if (!response.ok) throw new Error('Failed to accept applicant')

      showToast(t('team.applicantAccepted'), 'success')
      await fetchApplicantConversations()
      await fetchTeamData()
      setSelectedConversation(null)
    } catch {
      showToast(t('team.failedAcceptApplicant'), 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectApplicant = async (conversationId: string) => {
    setActionLoading(conversationId)
    try {
      const response = await fetch(`/api/dashboard/cleaner/team/applicants/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })
      if (!response.ok) throw new Error('Failed to reject applicant')
      showToast(t('team.applicantRejected'), 'info')
      await fetchApplicantConversations()
      setSelectedConversation(null)
    } catch {
      showToast(t('team.failedRejectApplicant'), 'error')
    } finally {
      setActionLoading(null)
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
      showToast(t('team.referralCopied'), 'info')
    }
  }

  const handleReferCleaner = async () => {
    if (!referralName.trim() || !referralPhone.trim() || !referralNote.trim()) {
      showToast(t('team.fillAllFields'), 'error')
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
      showToast(t('team.referralSuccess'), 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to submit referral', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateTeamName = async () => {
    if (!editedTeamName.trim() || editedTeamName.trim().length < 2) {
      showToast(t('team.teamNameTooShort'), 'error')
      return
    }
    setActionLoading('editName')
    try {
      const response = await fetch('/api/dashboard/cleaner/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedTeamName.trim() }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update team name')
      }
      setShowEditTeamName(false)
      await fetchTeamData()
      showToast(t('team.teamNameUpdated'), 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update team name', 'error')
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
          {t('team.tryAgain')}
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
            <div className="flex-1">
              <p className="text-xs text-[#C4785A] font-medium mb-1">{t('team.leader')}</p>
              {showEditTeamName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedTeamName}
                    onChange={(e) => setEditedTeamName(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-[#DEDEDE] rounded-lg text-lg font-semibold text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
                    placeholder="Team name"
                    autoFocus
                  />
                  <button
                    onClick={handleUpdateTeamName}
                    disabled={actionLoading === 'editName'}
                    className="px-3 py-1.5 bg-[#1A1A1A] text-white text-sm font-medium rounded-lg disabled:opacity-50"
                  >
                    {actionLoading === 'editName' ? '...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setShowEditTeamName(false)}
                    className="px-3 py-1.5 text-[#6B6B6B] text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-[#1A1A1A]">{teamData.team.name}</h2>
                  <button
                    onClick={() => {
                      setEditedTeamName(teamData.team?.name || '')
                      setShowEditTeamName(true)
                    }}
                    className="text-[#9B9B9B] hover:text-[#6B6B6B] text-sm"
                    title="Edit team name"
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>
            <span className="text-3xl">👑</span>
          </div>

          <button
            onClick={copyReferralCode}
            className="w-full bg-[#F5F5F3] hover:bg-[#EBEBEB] rounded-xl py-3 px-4 flex items-center justify-between gap-3 transition-all active:scale-[0.98] border border-[#DEDEDE]"
          >
            <code className="font-mono font-bold text-[#1A1A1A] tracking-wide">{teamData.team.referralCode}</code>
            <span className="text-[#C4785A] text-sm font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {t('team.copy')}
            </span>
          </button>
        </div>

        {/* Refer a Cleaner */}
        <div className="bg-gradient-to-br from-[#FFF8F5] to-[#FAFAF8] rounded-2xl p-5 border border-[#EBEBEB]">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">✨</span>
            <h3 className="font-semibold text-[#1A1A1A]">{t('team.referCleaner')}</h3>
          </div>
          <p className="text-sm text-[#6B6B6B] mb-4">
            {t('team.referDescription')}
          </p>
          {showReferCleaner ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder={t('team.cleanerName')}
                value={referralName}
                onChange={(e) => setReferralName(e.target.value)}
                className="w-full px-4 py-3 border border-[#EBEBEB] rounded-lg text-[#1A1A1A] placeholder:text-[#9B9B9B] bg-white"
              />
              <input
                type="tel"
                placeholder={t('team.phoneNumber')}
                value={referralPhone}
                onChange={(e) => setReferralPhone(e.target.value)}
                className="w-full px-4 py-3 border border-[#EBEBEB] rounded-lg text-[#1A1A1A] placeholder:text-[#9B9B9B] bg-white"
              />
              <textarea
                placeholder={t('team.whyRecommend')}
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
                  {actionLoading === 'refer' ? t('team.sending') : t('team.sendReferral')}
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
                  {t('team.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowReferCleaner(true)}
              className="w-full bg-[#C4785A] text-white py-2.5 rounded-lg font-medium"
            >
              {t('team.referSomeone')}
            </button>
          )}
        </div>

        {/* Applicant Conversations */}
        {applicantConversations.filter(c => c.status === 'ACTIVE').length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-[#1A1A1A] mb-3 flex items-center gap-2">
              <span>{t('team.newApplicants')}</span>
              <span className="bg-[#C4785A] text-white text-xs px-2 py-0.5 rounded-full">
                {applicantConversations.filter(c => c.status === 'ACTIVE').length}
              </span>
            </h3>
            <div className="space-y-3">
              {applicantConversations
                .filter(c => c.status === 'ACTIVE')
                .map((conv) => (
                  <div key={conv.id} className="bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#F5F5F3] flex items-center justify-center overflow-hidden relative flex-shrink-0">
                          {conv.applicantPhoto ? (
                            <Image src={conv.applicantPhoto} alt={conv.applicantName} fill className="object-cover" unoptimized />
                          ) : (
                            <span className="text-xl">👤</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-[#1A1A1A]">{conv.applicantName}</h4>
                          <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                            {conv.applicantHourlyRate && (
                              <span>&euro;{conv.applicantHourlyRate}/hr</span>
                            )}
                            <span>•</span>
                            <span>{conv.messageCount} {t('team.messages')}</span>
                          </div>
                          {conv.applicantServiceAreas.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {conv.applicantServiceAreas.slice(0, 2).map(area => (
                                <span key={area} className="text-xs px-1.5 py-0.5 bg-[#F5F5F3] text-[#6B6B6B] rounded">
                                  {area}
                                </span>
                              ))}
                              {conv.applicantServiceAreas.length > 2 && (
                                <span className="text-xs text-[#9B9B9B]">+{conv.applicantServiceAreas.length - 2}</span>
                              )}
                            </div>
                          )}
                          {/* Contact applicant via WhatsApp */}
                          {conv.applicantPhone && (
                            <a
                              href={`https://wa.me/${conv.applicantPhone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-2 text-sm text-[#25D366] hover:underline"
                            >
                              <span>💬</span>
                              <span>{t('team.messageWhatsApp')}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Summary */}
                      {conv.summary && (
                        <div className="mt-3 p-3 bg-[#F5F5F3] rounded-lg">
                          <p className="text-xs text-[#6B6B6B] font-medium mb-1">🤖 {t('team.aiSummary')}</p>
                          <p className="text-sm text-[#1A1A1A]">{conv.summary}</p>
                        </div>
                      )}

                      {/* View Messages Toggle */}
                      <button
                        onClick={() => {
                          if (selectedConversation === conv.id) {
                            setSelectedConversation(null)
                            setConversationMessages([])
                          } else {
                            setSelectedConversation(conv.id)
                            fetchConversationMessages(conv.id)
                          }
                        }}
                        className="mt-3 text-sm text-[#C4785A] font-medium"
                      >
                        {selectedConversation === conv.id ? t('team.hideConversation') : t('team.viewConversation')}
                      </button>
                    </div>

                    {/* Expanded Messages */}
                    {selectedConversation === conv.id && (
                      <div className="border-t border-[#EBEBEB] bg-[#FAFAF8] p-4">
                        {loadingMessages ? (
                          <div className="flex justify-center py-4">
                            <div className="w-6 h-6 border-2 border-[#1A1A1A]/20 border-t-[#1A1A1A] rounded-full animate-spin" />
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {conversationMessages.map((msg, idx) => (
                              <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                                    msg.role === 'user'
                                      ? 'bg-white border border-[#EBEBEB] text-[#1A1A1A]'
                                      : 'bg-[#E3F2FD] text-[#1A1A1A]'
                                  }`}
                                >
                                  <p className="text-xs text-[#9B9B9B] mb-1">
                                    {msg.role === 'user' ? conv.applicantName : 'AI (Clara)'}
                                  </p>
                                  <p>{msg.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="border-t border-[#EBEBEB] p-3 flex gap-2">
                      <button
                        onClick={() => handleAcceptApplicant(conv.id)}
                        disabled={actionLoading === conv.id}
                        className="flex-1 bg-[#1A1A1A] text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        {actionLoading === conv.id ? '...' : `✓ ${t('team.acceptActivate')}`}
                      </button>
                      <button
                        onClick={() => handleRejectApplicant(conv.id)}
                        disabled={actionLoading === conv.id}
                        className="flex-1 border border-[#EBEBEB] text-[#6B6B6B] py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        {t('team.decline')}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Pending Requests */}
        {teamData.team.pendingRequests && teamData.team.pendingRequests.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-[#1A1A1A] mb-3">
              {t('team.pendingRequests')} ({teamData.team.pendingRequests.length})
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
                      {actionLoading === request.id ? '...' : t('team.approve')}
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      disabled={actionLoading === request.id}
                      className="flex-1 border border-[#EBEBEB] text-[#6B6B6B] py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {t('team.decline')}
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
            {t('team.teamMembers')} ({teamData.team.members.length})
          </h3>
          {teamData.team.members.length === 0 ? (
            <div className="bg-[#F5F5F3] rounded-2xl p-6 text-center">
              <p className="text-3xl mb-2">👥</p>
              <p className="text-[#6B6B6B]">{t('team.noMembers')}</p>
              <p className="text-sm text-[#9B9B9B] mt-1">{t('team.shareReferralCode')}</p>
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
                      {t('team.remove')}
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
              <p className="text-xs text-[#6B6B6B] mb-1">{t('team.yourTeam')}</p>
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
                <p className="text-xs text-[#6B6B6B]">{t('team.leader')}</p>
                <p className="font-medium text-[#1A1A1A]">{teamData.team.leader.name}</p>
              </div>
              {teamData.team.leader.phone && (
                <a
                  href={`tel:${teamData.team.leader.phone}`}
                  className="text-[#C4785A] text-sm font-medium"
                >
                  {t('team.call')}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Team Members */}
        <div>
          <h3 className="text-sm font-medium text-[#1A1A1A] mb-3">
            {t('team.teamMembers')} ({teamData.team.members.length})
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
          {actionLoading === 'leave' ? t('team.leaving') : t('team.leaveTeam')}
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
            <p className="text-xs text-[#6B6B6B] mb-1">{t('team.status')}</p>
            <h2 className="text-xl font-semibold text-[#1A1A1A]">{t('team.independent')}</h2>
          </div>
          <span className="text-3xl">🦸</span>
        </div>
        <p className="text-sm text-[#6B6B6B]">
          {t('team.independentDescription')}
        </p>
      </div>

      {/* Progress to Team Leader */}
      {!teamData?.canCreateTeam && teamData?.teamLeaderProgress && (
        <div className="bg-white rounded-2xl p-5 border border-[#EBEBEB]">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🎯</span>
            <div>
              <h3 className="font-semibold text-[#1A1A1A]">{t('team.becomeLeader')}</h3>
              <p className="text-xs text-[#6B6B6B]">{t('team.leaderRequirements')}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Hours Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#6B6B6B]">{t('team.hoursWorked')}</span>
                <span className="text-sm font-medium text-[#1A1A1A]">
                  {teamData.teamLeaderProgress.totalHoursWorked} / {teamData.teamLeaderProgress.requiredHours}h
                </span>
              </div>
              <div className="h-2 bg-[#F5F5F3] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    teamData.teamLeaderProgress.hasMinHours ? 'bg-[#2E7D32]' : 'bg-[#C4785A]'
                  }`}
                  style={{
                    width: `${Math.min(100, (teamData.teamLeaderProgress.totalHoursWorked / teamData.teamLeaderProgress.requiredHours) * 100)}%`
                  }}
                />
              </div>
              {teamData.teamLeaderProgress.hasMinHours ? (
                <p className="text-xs text-[#2E7D32] mt-1 flex items-center gap-1">
                  <span>✓</span> {t('team.requirementMet')}
                </p>
              ) : (
                <p className="text-xs text-[#6B6B6B] mt-1">
                  {teamData.teamLeaderProgress.hoursRemaining} {t('team.moreHoursNeeded')}
                </p>
              )}
            </div>

            {/* Rating Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#6B6B6B]">{t('team.averageRating')}</span>
                <span className="text-sm font-medium text-[#1A1A1A] flex items-center gap-1">
                  <span className="text-[#C4785A]">★</span>
                  {teamData.teamLeaderProgress.currentRating.toFixed(1)} / {teamData.teamLeaderProgress.requiredRating.toFixed(1)}
                </span>
              </div>
              <div className="h-2 bg-[#F5F5F3] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    teamData.teamLeaderProgress.hasMinRating ? 'bg-[#2E7D32]' : 'bg-[#C4785A]'
                  }`}
                  style={{
                    width: `${Math.min(100, (teamData.teamLeaderProgress.currentRating / teamData.teamLeaderProgress.requiredRating) * 100)}%`
                  }}
                />
              </div>
              {teamData.teamLeaderProgress.hasMinRating ? (
                <p className="text-xs text-[#2E7D32] mt-1 flex items-center gap-1">
                  <span>✓</span> {t('team.requirementMet')}
                </p>
              ) : teamData.teamLeaderProgress.currentRating === 0 ? (
                <p className="text-xs text-[#6B6B6B] mt-1">
                  {t('team.buildRating')}
                </p>
              ) : (
                <p className="text-xs text-[#6B6B6B] mt-1">
                  {t('team.needRating').replace('{rating}', teamData.teamLeaderProgress.requiredRating.toString())}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#EBEBEB]">
            <p className="text-xs text-[#9B9B9B] text-center">
              {t('team.keepProviding')}
            </p>
          </div>
        </div>
      )}

      {/* Create Team (if eligible) */}
      {teamData?.canCreateTeam && (
        <div className="bg-gradient-to-br from-[#FFF8F5] to-[#FAFAF8] rounded-2xl p-5 border border-[#EBEBEB]">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">👑</span>
            <h3 className="font-semibold text-[#1A1A1A]">{t('team.createYourTeam')}</h3>
          </div>
          <p className="text-sm text-[#6B6B6B] mb-4">
            {t('team.earnedLeaderStatus')}
          </p>
          {showCreateTeam ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder={t('team.teamName')}
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
                  {actionLoading === 'create' ? t('team.creating') : t('team.createTeam')}
                </button>
                <button
                  onClick={() => setShowCreateTeam(false)}
                  className="px-4 py-2.5 border border-[#EBEBEB] rounded-lg text-[#6B6B6B]"
                >
                  {t('team.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateTeam(true)}
              className="w-full bg-[#C4785A] text-white py-2.5 rounded-lg font-medium"
            >
              {t('team.createTeam')}
            </button>
          )}
        </div>
      )}

      {/* Browse Teams */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[#1A1A1A]">{t('team.joinTeam')}</h3>
          {!showBrowseTeams && (
            <button
              onClick={() => {
                setShowBrowseTeams(true)
                fetchBrowseTeams()
              }}
              className="text-[#C4785A] text-sm font-medium"
            >
              {t('team.browseTeams')}
            </button>
          )}
        </div>

        {showBrowseTeams ? (
          browseTeams.length === 0 ? (
            <div className="bg-[#F5F5F3] rounded-2xl p-6 text-center">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-[#6B6B6B]">{t('team.noTeamsAvailable')}</p>
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
                        {t('team.ledBy')} {team.leader.name} · {team.memberCount} {t('team.membersCount')}
                      </p>
                    </div>
                  </div>

                  {team.hasPendingRequest ? (
                    <button
                      onClick={() => handleCancelRequest(team.id)}
                      disabled={actionLoading === team.id}
                      className="w-full py-2.5 border border-[#EBEBEB] text-[#6B6B6B] rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {actionLoading === team.id ? '...' : t('team.cancelRequest')}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinTeam(team.id)}
                      disabled={actionLoading === team.id}
                      className="w-full py-2.5 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {actionLoading === team.id ? t('team.sending') : t('team.requestToJoin')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="bg-[#F5F5F3] rounded-2xl p-6 text-center">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-[#6B6B6B]">{t('team.findTeam')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
