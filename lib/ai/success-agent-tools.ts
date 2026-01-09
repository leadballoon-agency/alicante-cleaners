/**
 * Success Agent Tools
 *
 * Tools for the Cleaner Success Coach AI agent.
 * Helps cleaners maximize their opportunity on the platform.
 */

import { db } from '@/lib/db'

// High-demand areas in Alicante
const HIGH_DEMAND_AREAS = ['San Juan', 'Playa de San Juan', 'El Campello', 'Alicante City']

export interface ProfileHealth {
  score: number // 0-100
  photo: { has: boolean; suggestion?: string }
  bio: { length: number; quality: 'poor' | 'ok' | 'good'; suggestion?: string }
  areas: { count: number; list: string[]; hasHighDemand: boolean; suggestion?: string }
  rate: { value: number; competitive: boolean; suggestion?: string }
  reviews: { count: number; rating: number; suggestion?: string }
  languages: { list: string[]; suggestion?: string }
  calendar: { synced: boolean; suggestion?: string }
  verified: boolean
  checklist: { item: string; done: boolean; priority: 'high' | 'medium' | 'low' }[]
}

export interface ProfileViews {
  thisWeek: number
  lastWeek: number
  trend: 'up' | 'down' | 'same'
  percentChange: number
}

export interface RevenueStats {
  thisWeek: { bookings: number; earnings: number }
  lastWeek: { bookings: number; earnings: number }
  thisMonth: { bookings: number; earnings: number }
  allTime: { bookings: number; earnings: number }
  averagePerBooking: number
}

export interface BookingInsights {
  totalBookings: number
  completedBookings: number
  pendingBookings: number
  acceptanceRate: number
  completionRate: number
  mostPopularService: string | null
  busiestDay: string | null
}

export interface TeamOpportunity {
  isTeamLeader: boolean
  isTeamMember: boolean
  teamName: string | null
  teamSize: number
  benefits: string[]
  suggestion: string
}

export interface TeamProgression {
  currentLevel: 'solo' | 'team_member' | 'team_leader' | 'services_active'
  levelNumber: number
  levelName: string
  nextLevel: string | null
  nextAction: string | null
  hasCustomServices: boolean
  approvedServicesCount: number
  pendingServicesCount: number
  progress: number // 0-100 percentage through the journey
}

/**
 * Calculate profile health score and recommendations
 */
export async function getProfileHealth(cleanerId: string): Promise<ProfileHealth> {
  const cleaner = await db.cleaner.findUnique({
    where: { id: cleanerId },
    include: {
      user: { select: { name: true, image: true } },
      reviews: { where: { approved: true } },
      ledTeam: true,
      memberOfTeam: true,
    },
  })

  if (!cleaner) {
    throw new Error('Cleaner not found')
  }

  const checklist: ProfileHealth['checklist'] = []
  let score = 0

  // Photo (20 points)
  const hasPhoto = !!cleaner.user.image
  const photo = {
    has: hasPhoto,
    suggestion: hasPhoto ? undefined : 'Add a professional headshot - profiles with photos get 3x more bookings!',
  }
  if (hasPhoto) score += 20
  checklist.push({ item: 'Profile photo', done: hasPhoto, priority: 'high' })

  // Bio (20 points)
  const bioLength = cleaner.bio?.length || 0
  const bioQuality: 'poor' | 'ok' | 'good' = bioLength >= 100 ? 'good' : bioLength >= 50 ? 'ok' : 'poor'
  const bio = {
    length: bioLength,
    quality: bioQuality,
    suggestion: bioQuality === 'poor'
      ? 'Your bio is too short! Aim for 100+ characters to tell your story and stand out.'
      : bioQuality === 'ok'
      ? 'Good start! Add more detail about your experience to reach 100+ characters.'
      : undefined,
  }
  if (bioQuality === 'good') score += 20
  else if (bioQuality === 'ok') score += 10
  checklist.push({ item: 'Bio (100+ chars)', done: bioQuality === 'good', priority: 'high' })

  // Service Areas (15 points)
  const areas = cleaner.serviceAreas || []
  const hasHighDemand = areas.some(a => HIGH_DEMAND_AREAS.includes(a))
  const areasData = {
    count: areas.length,
    list: areas,
    hasHighDemand,
    suggestion: areas.length === 0
      ? 'Add your service areas so owners can find you!'
      : !hasHighDemand
      ? `Consider adding high-demand areas like ${HIGH_DEMAND_AREAS.slice(0, 2).join(' or ')} for more bookings.`
      : areas.length < 3
      ? 'Adding more areas increases your visibility and booking opportunities.'
      : undefined,
  }
  if (areas.length >= 3 && hasHighDemand) score += 15
  else if (areas.length >= 2) score += 10
  else if (areas.length >= 1) score += 5
  checklist.push({ item: 'Service areas (3+)', done: areas.length >= 3, priority: 'medium' })

  // Hourly Rate (10 points)
  const rate = Number(cleaner.hourlyRate) || 0
  const competitive = rate >= 15 && rate <= 22
  const rateData = {
    value: rate,
    competitive,
    suggestion: rate === 0
      ? 'Set your hourly rate to start receiving bookings!'
      : rate < 15
      ? 'Your rate is below average (€15-20). Consider raising it to reflect your value.'
      : rate > 25
      ? 'Your rate is above average. This is fine if you have great reviews, otherwise consider adjusting.'
      : undefined,
  }
  if (rate > 0) score += 10
  checklist.push({ item: 'Hourly rate set', done: rate > 0, priority: 'high' })

  // Reviews (15 points)
  const reviewCount = cleaner.reviews.length
  const avgRating = reviewCount > 0
    ? cleaner.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0
  const reviews = {
    count: reviewCount,
    rating: Math.round(avgRating * 10) / 10,
    suggestion: reviewCount === 0
      ? 'No reviews yet! After your first job, ask happy clients to leave a review.'
      : reviewCount < 5
      ? `You have ${reviewCount} review${reviewCount > 1 ? 's' : ''}. Keep asking for reviews - aim for 5+ for better visibility!`
      : undefined,
  }
  if (reviewCount >= 5) score += 15
  else if (reviewCount >= 1) score += 10
  checklist.push({ item: 'First review', done: reviewCount >= 1, priority: 'medium' })

  // Languages (10 points)
  const languages = cleaner.languages || ['es']
  const languagesData = {
    list: languages,
    suggestion: languages.length === 1
      ? 'Adding more languages (English, German, Dutch) helps you reach more international villa owners!'
      : undefined,
  }
  if (languages.length >= 2) score += 10
  else if (languages.length === 1) score += 5
  checklist.push({ item: 'Multiple languages', done: languages.length >= 2, priority: 'low' })

  // Calendar Sync (10 points)
  const calendarSynced = !!cleaner.calendarToken
  const calendar = {
    synced: calendarSynced,
    suggestion: calendarSynced ? undefined : 'Connect your calendar to prevent double-bookings and look more professional!',
  }
  if (calendarSynced) score += 10
  checklist.push({ item: 'Calendar synced', done: calendarSynced, priority: 'low' })

  // Verified status (bonus indicator)
  const verified = cleaner.status === 'ACTIVE'

  // Sort checklist by priority and completion
  checklist.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  return {
    score: Math.round(score),
    photo,
    bio,
    areas: areasData,
    rate: rateData,
    reviews,
    languages: languagesData,
    calendar,
    verified,
    checklist,
  }
}

/**
 * Get profile view statistics
 */
export async function getProfileViews(cleanerSlug: string): Promise<ProfileViews> {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const [thisWeek, lastWeek] = await Promise.all([
    db.pageView.count({
      where: {
        cleanerSlug,
        createdAt: { gte: weekAgo },
      },
    }),
    db.pageView.count({
      where: {
        cleanerSlug,
        createdAt: { gte: twoWeeksAgo, lt: weekAgo },
      },
    }),
  ])

  const percentChange = lastWeek > 0
    ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
    : thisWeek > 0 ? 100 : 0

  return {
    thisWeek,
    lastWeek,
    trend: thisWeek > lastWeek ? 'up' : thisWeek < lastWeek ? 'down' : 'same',
    percentChange,
  }
}

/**
 * Get revenue and booking statistics
 */
export async function getRevenueStats(cleanerId: string): Promise<RevenueStats> {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [thisWeekBookings, lastWeekBookings, thisMonthBookings, allTimeBookings] = await Promise.all([
    db.booking.findMany({
      where: {
        cleanerId,
        status: 'COMPLETED',
        date: { gte: weekAgo },
      },
      select: { price: true },
    }),
    db.booking.findMany({
      where: {
        cleanerId,
        status: 'COMPLETED',
        date: { gte: twoWeeksAgo, lt: weekAgo },
      },
      select: { price: true },
    }),
    db.booking.findMany({
      where: {
        cleanerId,
        status: 'COMPLETED',
        date: { gte: monthStart },
      },
      select: { price: true },
    }),
    db.booking.findMany({
      where: {
        cleanerId,
        status: 'COMPLETED',
      },
      select: { price: true },
    }),
  ])

  const sumPrices = (bookings: { price: unknown }[]) =>
    bookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0)

  const allTimeEarnings = sumPrices(allTimeBookings)
  const averagePerBooking = allTimeBookings.length > 0
    ? Math.round(allTimeEarnings / allTimeBookings.length)
    : 0

  return {
    thisWeek: {
      bookings: thisWeekBookings.length,
      earnings: sumPrices(thisWeekBookings),
    },
    lastWeek: {
      bookings: lastWeekBookings.length,
      earnings: sumPrices(lastWeekBookings),
    },
    thisMonth: {
      bookings: thisMonthBookings.length,
      earnings: sumPrices(thisMonthBookings),
    },
    allTime: {
      bookings: allTimeBookings.length,
      earnings: allTimeEarnings,
    },
    averagePerBooking,
  }
}

/**
 * Get booking insights and patterns
 */
export async function getBookingInsights(cleanerId: string): Promise<BookingInsights> {
  const bookings = await db.booking.findMany({
    where: { cleanerId },
    select: {
      status: true,
      service: true,
      date: true,
    },
  })

  const total = bookings.length
  const completed = bookings.filter(b => b.status === 'COMPLETED').length
  const pending = bookings.filter(b => b.status === 'PENDING').length
  const cancelled = bookings.filter(b => b.status === 'CANCELLED').length
  const confirmed = bookings.filter(b => b.status === 'CONFIRMED').length

  // Acceptance rate: (completed + confirmed) / (total - pending)
  const decidedBookings = total - pending
  const acceptedBookings = completed + confirmed
  const acceptanceRate = decidedBookings > 0
    ? Math.round((acceptedBookings / decidedBookings) * 100)
    : 100

  // Completion rate: completed / (completed + cancelled)
  const finishedBookings = completed + cancelled
  const completionRate = finishedBookings > 0
    ? Math.round((completed / finishedBookings) * 100)
    : 100

  // Most popular service
  const serviceCounts: Record<string, number> = {}
  bookings.forEach(b => {
    if (b.service) {
      serviceCounts[b.service] = (serviceCounts[b.service] || 0) + 1
    }
  })
  const mostPopularService = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null

  // Busiest day
  const dayCounts: Record<string, number> = {}
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  bookings.forEach(b => {
    if (b.date) {
      const day = dayNames[new Date(b.date).getDay()]
      dayCounts[day] = (dayCounts[day] || 0) + 1
    }
  })
  const busiestDay = Object.entries(dayCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null

  return {
    totalBookings: total,
    completedBookings: completed,
    pendingBookings: pending,
    acceptanceRate,
    completionRate,
    mostPopularService,
    busiestDay,
  }
}

/**
 * Get team opportunities and status
 */
export async function getTeamOpportunities(cleanerId: string): Promise<TeamOpportunity> {
  const cleaner = await db.cleaner.findUnique({
    where: { id: cleanerId },
    include: {
      ledTeam: {
        include: {
          members: true,
        },
      },
      memberOfTeam: {
        include: {
          leader: { include: { user: true } },
          members: true,
        },
      },
    },
  })

  if (!cleaner) {
    throw new Error('Cleaner not found')
  }

  const isTeamLeader = !!cleaner.ledTeam
  const isTeamMember = !!cleaner.memberOfTeam

  let teamName: string | null = null
  let teamSize = 0

  if (isTeamLeader && cleaner.ledTeam) {
    teamName = cleaner.ledTeam.name
    teamSize = cleaner.ledTeam.members.length + 1
  } else if (isTeamMember && cleaner.memberOfTeam) {
    teamName = cleaner.memberOfTeam.name
    teamSize = cleaner.memberOfTeam.members.length + 1
  }

  const benefits = isTeamLeader || isTeamMember
    ? [
        'Coverage when you\'re unavailable',
        'Shared client referrals',
        'Support from experienced colleagues',
        'Take on larger properties together',
      ]
    : [
        'Coverage for holidays and illness',
        'Learn from experienced cleaners',
        'Get referrals from team leader',
        'Handle bigger jobs as a team',
      ]

  const suggestion = isTeamLeader
    ? 'Great job leading your team! Consider inviting more members to handle more bookings.'
    : isTeamMember
    ? 'Being part of a team gives you backup and more opportunities. Keep building those relationships!'
    : 'Consider joining or creating a team. Teams get 40% more bookings because they can guarantee coverage!'

  return {
    isTeamLeader,
    isTeamMember,
    teamName,
    teamSize,
    benefits,
    suggestion,
  }
}

/**
 * Get team progression status - tracks journey from solo to team leader
 */
export async function getTeamProgression(cleanerId: string): Promise<TeamProgression> {
  const cleaner = await db.cleaner.findUnique({
    where: { id: cleanerId },
    include: {
      ledTeam: {
        include: {
          services: true,
        },
      },
      memberOfTeam: true,
    },
  })

  if (!cleaner) {
    throw new Error('Cleaner not found')
  }

  const isTeamLeader = !!cleaner.ledTeam
  const isTeamMember = !!cleaner.memberOfTeam

  // Count custom services
  const approvedServices = cleaner.ledTeam?.services.filter(s => s.status === 'APPROVED') || []
  const pendingServices = cleaner.ledTeam?.services.filter(s => s.status === 'PENDING') || []
  const hasCustomServices = approvedServices.length > 0

  // Determine progression level
  let currentLevel: TeamProgression['currentLevel']
  let levelNumber: number
  let levelName: string
  let nextLevel: string | null
  let nextAction: string | null
  let progress: number

  if (isTeamLeader && hasCustomServices) {
    currentLevel = 'services_active'
    levelNumber = 4
    levelName = 'Business Owner'
    nextLevel = null
    nextAction = 'Keep adding services and growing your team!'
    progress = 100
  } else if (isTeamLeader) {
    currentLevel = 'team_leader'
    levelNumber = 3
    levelName = 'Team Leader'
    nextLevel = 'Business Owner'
    nextAction = 'Add custom services to unlock new revenue streams'
    progress = 75
  } else if (isTeamMember) {
    currentLevel = 'team_member'
    levelNumber = 2
    levelName = 'Team Member'
    nextLevel = 'Team Leader'
    nextAction = 'Build your reputation, then create your own team'
    progress = 50
  } else {
    currentLevel = 'solo'
    levelNumber = 1
    levelName = 'Solo Cleaner'
    nextLevel = 'Team Member or Team Leader'
    nextAction = 'Join an existing team or create your own'
    progress = 25
  }

  return {
    currentLevel,
    levelNumber,
    levelName,
    nextLevel,
    nextAction,
    hasCustomServices,
    approvedServicesCount: approvedServices.length,
    pendingServicesCount: pendingServices.length,
    progress,
  }
}

/**
 * Generate personalized improvement tips
 */
export async function getImprovementTips(cleanerId: string): Promise<string[]> {
  const [health, views, revenue, insights] = await Promise.all([
    getProfileHealth(cleanerId),
    db.cleaner.findUnique({ where: { id: cleanerId }, select: { slug: true } })
      .then(c => c?.slug ? getProfileViews(c.slug) : null),
    getRevenueStats(cleanerId),
    getBookingInsights(cleanerId),
  ])

  const tips: string[] = []

  // Priority tips based on profile health
  if (!health.photo.has) {
    tips.push('Add a professional photo - this is your #1 priority for getting more bookings!')
  }

  if (health.bio.quality === 'poor') {
    tips.push('Write a longer bio (100+ characters) to help owners get to know you.')
  }

  if (health.areas.count < 3) {
    tips.push('Add more service areas to increase your visibility.')
  }

  if (health.reviews.count === 0) {
    tips.push('After your first completed job, ask the client for a review!')
  }

  // Views-based tips
  if (views) {
    if (views.thisWeek === 0) {
      tips.push('No profile views this week. Share your profile link on WhatsApp and social media!')
    } else if (views.thisWeek > 10 && revenue.thisWeek.bookings === 0) {
      tips.push(`${views.thisWeek} people viewed your profile but no bookings. Your profile may need work - check your photo and bio!`)
    }
  }

  // Booking-based tips
  if (insights.acceptanceRate < 80 && insights.totalBookings > 3) {
    tips.push('Your acceptance rate is low. Try to accept more bookings to improve your ranking!')
  }

  if (!health.calendar.synced && insights.totalBookings > 5) {
    tips.push('Sync your calendar to prevent scheduling conflicts and look more professional.')
  }

  // Add profile guide link if they have issues
  if (tips.length > 0) {
    tips.push('Check out our Profile Guide at /join/profile-guide for detailed tips!')
  }

  return tips.slice(0, 5) // Max 5 tips
}

/**
 * Check if cleaner has completed their first job (unlocks full Success Coach)
 */
export async function hasCompletedFirstJob(cleanerId: string): Promise<boolean> {
  const completedBooking = await db.booking.findFirst({
    where: {
      cleanerId,
      status: 'COMPLETED',
    },
  })
  return !!completedBooking
}
