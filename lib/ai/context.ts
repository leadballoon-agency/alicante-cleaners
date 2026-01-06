import { db } from '@/lib/db'

export interface OwnerContext {
  name: string
  email: string
  memberSince: string
  trusted: boolean
  totalBookings: number
  referralCode: string
  referralCredits: number
  preferredExtras: string[]
  properties: Array<{
    id: string
    name: string
    address: string
    bedrooms: number
  }>
  upcomingBookings: Array<{
    date: string
    time: string
    property: string
    cleaner: string
    status: string
  }>
  recentArrivalPreps: Array<{
    date: string
    property: string
    extras: string[]
    status: string
  }>
}

export interface CleanerContext {
  name: string
  phone: string
  totalBookings: number
  rating: number | null
  reviewCount: number
  hourlyRate: number
  serviceAreas: string[]
  isTeamLeader: boolean
  teamName: string | null
  teamMemberCount: number
  upcomingBookings: Array<{
    date: string
    time: string
    property: string
    owner: string
    status: string
    service: string
  }>
  pendingRequests: number
  weeklyEarnings: number
}

export async function buildOwnerContext(userId: string): Promise<string> {
  try {
    const owner = await db.owner.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true, email: true, createdAt: true } },
        properties: {
          select: { id: true, name: true, address: true, bedrooms: true },
          take: 10,
        },
        bookings: {
          where: {
            date: { gte: new Date() },
          },
          include: {
            property: { select: { name: true } },
            cleaner: {
              include: { user: { select: { name: true } } },
            },
          },
          orderBy: { date: 'asc' },
          take: 5,
        },
        arrivalPreps: {
          orderBy: { createdAt: 'desc' },
          include: { property: { select: { name: true } } },
          take: 3,
        },
      },
    })

    if (!owner) {
      return 'User is not registered as an owner.'
    }

    // Calculate how long they've been a member
    const memberSince = owner.user.createdAt
    const monthsAsMember = Math.floor(
      (new Date().getTime() - memberSince.getTime()) / (1000 * 60 * 60 * 24 * 30)
    )

    const context: OwnerContext = {
      name: owner.user.name || 'Owner',
      email: owner.user.email || '',
      memberSince: memberSince.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      trusted: owner.trusted,
      totalBookings: owner.totalBookings,
      referralCode: owner.referralCode,
      referralCredits: Number(owner.referralCredits),
      preferredExtras: owner.preferredExtras,
      properties: owner.properties.map(p => ({
        id: p.id,
        name: p.name,
        address: p.address,
        bedrooms: p.bedrooms,
      })),
      upcomingBookings: owner.bookings.map(b => ({
        date: b.date.toLocaleDateString(),
        time: b.time,
        property: b.property.name,
        cleaner: b.cleaner.user.name || 'Cleaner',
        status: b.status,
      })),
      recentArrivalPreps: owner.arrivalPreps.map(a => ({
        date: a.arrivalDate.toLocaleDateString(),
        property: a.property.name,
        extras: a.extras,
        status: a.status,
      })),
    }

    return `
Owner Name: ${context.name}
Email: ${context.email}
Member Since: ${context.memberSince}${monthsAsMember > 6 ? ' (loyal customer)' : ''}
Status: ${context.trusted ? 'Trusted Owner' : 'Standard'}
Total Bookings: ${context.totalBookings}
Referral Code: ${context.referralCode}
Referral Credits: €${context.referralCredits.toFixed(2)}
Preferred Extras: ${context.preferredExtras.length > 0 ? context.preferredExtras.join(', ') : 'None saved yet'}

Properties (${context.properties.length}):
${context.properties.map(p => `- ${p.name} (${p.bedrooms} bedrooms) - ${p.address}`).join('\n')}

Upcoming Bookings (${context.upcomingBookings.length}):
${context.upcomingBookings.length > 0
  ? context.upcomingBookings.map(b => `- ${b.date} at ${b.time}: ${b.property} with ${b.cleaner} (${b.status})`).join('\n')
  : 'No upcoming bookings'}

Recent Arrival Preps:
${context.recentArrivalPreps.length > 0
  ? context.recentArrivalPreps.map(a => `- ${a.date}: ${a.property} - ${a.extras.join(', ')} (${a.status})`).join('\n')
  : 'No recent arrival preps'}
`.trim()
  } catch (error) {
    console.error('Error building owner context:', error)
    return 'Unable to load user context. Please try again.'
  }
}

export async function buildCleanerContext(userId: string): Promise<string> {
  try {
    const cleaner = await db.cleaner.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true, phone: true } },
        ledTeam: {
          include: { members: { select: { id: true } } },
        },
        memberOfTeam: { select: { name: true } },
        bookings: {
          where: {
            date: { gte: new Date() },
          },
          include: {
            property: { select: { name: true, address: true } },
            owner: {
              include: { user: { select: { name: true } } },
            },
          },
          orderBy: { date: 'asc' },
          take: 10,
        },
      },
    })

    if (!cleaner) {
      return 'User is not registered as a cleaner.'
    }

    // Calculate weekly earnings (simplified)
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)

    const recentBookings = await db.booking.findMany({
      where: {
        cleanerId: cleaner.id,
        status: 'COMPLETED',
        updatedAt: { gte: weekStart },
      },
      select: { price: true },
    })

    const weeklyEarnings = recentBookings.reduce((sum, b) => sum + Number(b.price), 0)

    // Count pending booking requests
    const pendingRequests = await db.booking.count({
      where: {
        cleanerId: cleaner.id,
        status: 'PENDING',
      },
    })

    const context: CleanerContext = {
      name: cleaner.user.name || 'Cleaner',
      phone: cleaner.user.phone || '',
      totalBookings: cleaner.totalBookings,
      rating: cleaner.rating ? Number(cleaner.rating) : null,
      reviewCount: cleaner.reviewCount,
      hourlyRate: Number(cleaner.hourlyRate),
      serviceAreas: cleaner.serviceAreas,
      isTeamLeader: cleaner.teamLeader,
      teamName: cleaner.ledTeam?.name || cleaner.memberOfTeam?.name || null,
      teamMemberCount: cleaner.ledTeam?.members.length || 0,
      upcomingBookings: cleaner.bookings.map(b => ({
        date: b.date.toLocaleDateString(),
        time: b.time,
        property: b.property.name,
        owner: b.owner.user.name || 'Owner',
        status: b.status,
        service: b.service,
      })),
      pendingRequests,
      weeklyEarnings,
    }

    return `
Cleaner Name: ${context.name}
Phone: ${context.phone}
Total Bookings Completed: ${context.totalBookings}
Rating: ${context.rating ? `${context.rating.toFixed(1)}/5 (${context.reviewCount} reviews)` : 'No ratings yet'}
Hourly Rate: €${context.hourlyRate.toFixed(2)}
Service Areas: ${context.serviceAreas.join(', ')}

Team Status: ${context.isTeamLeader ? `Team Leader of "${context.teamName}" (${context.teamMemberCount} members)` : context.teamName ? `Member of "${context.teamName}"` : 'Independent (not in a team)'}

Pending Booking Requests: ${context.pendingRequests}
Weekly Earnings: €${context.weeklyEarnings.toFixed(2)}

Upcoming Bookings (${context.upcomingBookings.length}):
${context.upcomingBookings.length > 0
  ? context.upcomingBookings.map(b => `- ${b.date} at ${b.time}: ${b.property} for ${b.owner} - ${b.service} (${b.status})`).join('\n')
  : 'No upcoming bookings'}
`.trim()
  } catch (error) {
    console.error('Error building cleaner context:', error)
    return 'Unable to load user context. Please try again.'
  }
}
