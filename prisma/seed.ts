import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create Admin users (can use email magic link to sign in)
  const admins = [
    { email: 'admin@villacare.com', name: 'Admin' },
    { email: 'mark@leadballoon.co.uk', name: 'Mark' },
    { email: 'kerry@leadballoon.co.uk', name: 'Kerry' },
  ]

  for (const adminData of admins) {
    const admin = await prisma.user.upsert({
      where: { email: adminData.email },
      update: { role: 'ADMIN' },
      create: {
        email: adminData.email,
        name: adminData.name,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    })
    console.log('Created admin:', admin.email)
  }

  // Create test Owners (use magic link to sign in)
  const owners = [
    { email: 'mark@example.com', name: 'Mark T.', code: 'MARK2024' },
    { email: 'sarah@example.com', name: 'Sarah W.', code: 'SARA2024' },
    { email: 'james@example.com', name: 'James M.', code: 'JAME2024' },
    { email: 'emma@example.com', name: 'Emma B.', code: 'EMMA2024' },
    { email: 'david@example.com', name: 'David K.', code: 'DAVI2024' },
  ]

  const ownerRecords = []
  for (const ownerData of owners) {
    const ownerUser = await prisma.user.upsert({
      where: { email: ownerData.email },
      update: { name: ownerData.name },
      create: {
        email: ownerData.email,
        name: ownerData.name,
        role: 'OWNER',
        emailVerified: new Date(),
      },
    })

    const owner = await prisma.owner.upsert({
      where: { userId: ownerUser.id },
      update: {},
      create: {
        userId: ownerUser.id,
        referralCode: ownerData.code,
        trusted: true,
      },
    })
    ownerRecords.push({ user: ownerUser, owner })
  }
  console.log('Created owners:', owners.map(o => o.email).join(', '))

  // Create test Cleaner
  const cleanerUser = await prisma.user.upsert({
    where: { phone: '+34612345678' },
    update: {
      name: 'Clara Rodrigues',
      image: '/cleaners/Clara-Rodrigues.jpeg',
    },
    create: {
      phone: '+34612345678',
      name: 'Clara Rodrigues',
      role: 'CLEANER',
      phoneVerified: new Date(),
      image: '/cleaners/Clara-Rodrigues.jpeg',
    },
  })

  // Create Cleaner profile
  await prisma.cleaner.upsert({
    where: { userId: cleanerUser.id },
    update: {
      slug: 'clara',
      bio: 'Team leader with 5 years of experience in villa cleaning. I manage a network of trusted cleaners and take pride in leaving every home spotless!',
      languages: ['es', 'en', 'pt'],
      teamLeader: true,
    },
    create: {
      userId: cleanerUser.id,
      slug: 'clara',
      bio: 'Team leader with 5 years of experience in villa cleaning. I manage a network of trusted cleaners and take pride in leaving every home spotless!',
      serviceAreas: ['Alicante City', 'San Juan', 'Playa de San Juan'],
      languages: ['es', 'en', 'pt'],
      hourlyRate: 18,
      status: 'ACTIVE',
      rating: 5.0,
      reviewCount: 25,
      totalBookings: 45,
      featured: true,
      teamLeader: true,
    },
  })
  console.log('Created cleaner:', cleanerUser.phone)

  // Create second test Cleaner
  const cleaner2User = await prisma.user.upsert({
    where: { phone: '+34623456789' },
    update: {
      image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop&crop=face',
    },
    create: {
      phone: '+34623456789',
      name: 'Maria Lopez',
      role: 'CLEANER',
      phoneVerified: new Date(),
      image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop&crop=face',
    },
  })

  await prisma.cleaner.upsert({
    where: { userId: cleaner2User.id },
    update: { languages: ['es', 'de'] },
    create: {
      userId: cleaner2User.id,
      slug: 'maria',
      bio: 'Dedicated and detail-oriented cleaner. Specialized in deep cleaning and move-in/move-out services.',
      serviceAreas: ['El Campello', 'Mutxamel', 'San Vicente'],
      languages: ['es', 'de'],
      hourlyRate: 16,
      status: 'ACTIVE',
      rating: 4.9,
      reviewCount: 18,
      totalBookings: 32,
    },
  })
  console.log('Created cleaner:', cleaner2User.phone)

  // Create third test Cleaner
  const cleaner3User = await prisma.user.upsert({
    where: { phone: '+34634567890' },
    update: {
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
    },
    create: {
      phone: '+34634567890',
      name: 'Ana Martinez',
      role: 'CLEANER',
      phoneVerified: new Date(),
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
    },
  })

  await prisma.cleaner.upsert({
    where: { userId: cleaner3User.id },
    update: { languages: ['es', 'en', 'fr'] },
    create: {
      userId: cleaner3User.id,
      slug: 'ana',
      bio: 'Flexible scheduling and always reliable. I specialize in turnover cleans for vacation rentals.',
      serviceAreas: ['San Juan', 'El Campello', 'Alicante City'],
      languages: ['es', 'en', 'fr'],
      hourlyRate: 17,
      status: 'ACTIVE',
      rating: 4.8,
      reviewCount: 12,
      totalBookings: 28,
    },
  })
  console.log('Created cleaner:', cleaner3User.phone)

  // Create fourth test Cleaner
  const cleaner4User = await prisma.user.upsert({
    where: { phone: '+34645678901' },
    update: {
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    },
    create: {
      phone: '+34645678901',
      name: 'Sofia Ruiz',
      role: 'CLEANER',
      phoneVerified: new Date(),
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    },
  })

  await prisma.cleaner.upsert({
    where: { userId: cleaner4User.id },
    update: { languages: ['es', 'nl'] },
    create: {
      userId: cleaner4User.id,
      slug: 'sofia',
      bio: 'Eco-friendly cleaning products and meticulous attention to detail. Your villa will shine!',
      serviceAreas: ['Mutxamel', 'San Vicente', 'Jijona'],
      languages: ['es', 'nl'],
      hourlyRate: 15,
      status: 'ACTIVE',
      rating: 4.7,
      reviewCount: 8,
      totalBookings: 15,
    },
  })
  console.log('Created cleaner:', cleaner4User.phone)

  // Create fifth test Cleaner
  const cleaner5User = await prisma.user.upsert({
    where: { phone: '+34656789012' },
    update: {
      image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&h=200&fit=crop&crop=face',
    },
    create: {
      phone: '+34656789012',
      name: 'Carmen Fernandez',
      role: 'CLEANER',
      phoneVerified: new Date(),
      image: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&h=200&fit=crop&crop=face',
    },
  })

  await prisma.cleaner.upsert({
    where: { userId: cleaner5User.id },
    update: { languages: ['es', 'en', 'it'] },
    create: {
      userId: cleaner5User.id,
      slug: 'carmen',
      bio: '10+ years experience. I treat every villa like my own home. References available.',
      serviceAreas: ['Alicante City', 'Playa de San Juan', 'San Juan', 'El Campello'],
      languages: ['es', 'en', 'it'],
      hourlyRate: 20,
      status: 'ACTIVE',
      rating: 4.9,
      reviewCount: 42,
      totalBookings: 78,
      featured: true,
    },
  })
  console.log('Created cleaner:', cleaner5User.phone)

  // Create a Property for the first owner
  const primaryOwner = ownerRecords[0]

  const property = await prisma.property.upsert({
    where: { id: 'prop_sanjuan' },
    update: {},
    create: {
      id: 'prop_sanjuan',
      ownerId: primaryOwner.owner.id,
      name: 'San Juan Villa',
      address: 'Calle del Mar 42, San Juan, Alicante',
      bedrooms: 3,
      bathrooms: 2,
      notes: 'Key under the blue pot by the front door. Alarm code is 1234.',
    },
  })
  console.log('Created property: San Juan Villa')

  // Get cleaners for creating bookings and reviews
  const carmen = await prisma.cleaner.findUnique({ where: { slug: 'carmen' } })
  const clara = await prisma.cleaner.findUnique({ where: { slug: 'clara' } })
  const maria = await prisma.cleaner.findUnique({ where: { slug: 'maria' } })

  // Create Clara's team "Limpieza Alicante Express" with Maria as a member
  if (clara && maria) {
    const team = await prisma.team.upsert({
      where: { id: 'team_clara' },
      update: {
        name: 'Limpieza Alicante Express',
      },
      create: {
        id: 'team_clara',
        name: 'Limpieza Alicante Express',
        leaderId: clara.id,
        referralCode: 'TEAM-CLARA-LAX',
      },
    })

    // Add Maria as a team member
    await prisma.cleaner.update({
      where: { id: maria.id },
      data: { teamId: team.id },
    })

    // Create upcoming bookings for Maria (so Clara can see team jobs)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 3) // 3 days from now

    await prisma.booking.upsert({
      where: { id: 'booking_maria_upcoming' },
      update: {},
      create: {
        id: 'booking_maria_upcoming',
        cleanerId: maria.id,
        ownerId: ownerRecords[1].owner.id,
        propertyId: property.id,
        status: 'CONFIRMED',
        service: 'Deep Clean',
        price: 90,
        hours: 5,
        date: futureDate,
        time: '09:00',
      },
    })

    console.log('Created team: Limpieza Alicante Express with Maria as member')
  }

  // Sample reviews data with different owners
  const reviewsData = [
    // Carmen's reviews (from different owners)
    { cleanerId: carmen?.id, ownerIdx: 0, rating: 5, text: 'Carmen is absolutely fantastic! She left our villa spotless before our guests arrived. Highly recommend!', featured: true },
    { cleanerId: carmen?.id, ownerIdx: 1, rating: 5, text: 'Very thorough and professional. Carmen even noticed some things that needed attention that we had missed.' },
    { cleanerId: carmen?.id, ownerIdx: 2, rating: 5, text: 'Third time using Carmen and she never disappoints. The villa always looks perfect.' },
    { cleanerId: carmen?.id, ownerIdx: 3, rating: 4, text: 'Great service, very reliable. Will definitely book again.' },
    // Clara's reviews (from different owners)
    { cleanerId: clara?.id, ownerIdx: 1, rating: 5, text: 'Clara did an amazing deep clean of our property. It has never looked better!', featured: true },
    { cleanerId: clara?.id, ownerIdx: 2, rating: 5, text: 'So happy with Clara. She is punctual, thorough and very friendly.' },
    { cleanerId: clara?.id, ownerIdx: 4, rating: 5, text: 'Excellent attention to detail. Clara left everything sparkling clean.' },
    // Maria's reviews (from different owners)
    { cleanerId: maria?.id, ownerIdx: 0, rating: 5, text: 'Maria specializes in move-out cleans and she is the best! Got our full deposit back.', featured: true },
    { cleanerId: maria?.id, ownerIdx: 3, rating: 4, text: 'Very good service. Maria is reliable and does quality work.' },
    { cleanerId: maria?.id, ownerIdx: 4, rating: 5, text: 'Highly professional. Maria went above and beyond our expectations.' },
  ]

  // Create bookings and reviews
  for (let i = 0; i < reviewsData.length; i++) {
    const reviewData = reviewsData[i]
    if (!reviewData.cleanerId) continue

    const reviewOwner = ownerRecords[reviewData.ownerIdx]
    const bookingId = `booking_seed_${i}`
    const reviewId = `review_seed_${i}`

    // Create a completed booking
    await prisma.booking.upsert({
      where: { id: bookingId },
      update: {},
      create: {
        id: bookingId,
        cleanerId: reviewData.cleanerId,
        ownerId: reviewOwner.owner.id,
        propertyId: property.id,
        status: 'COMPLETED',
        service: 'Regular Clean',
        price: 60,
        hours: 3,
        date: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000), // Staggered dates
        time: '10:00',
      },
    })

    // Create the review
    await prisma.review.upsert({
      where: { id: reviewId },
      update: {
        text: reviewData.text,
        rating: reviewData.rating,
        ownerId: reviewOwner.owner.id,
        featured: reviewData.featured || false,
      },
      create: {
        id: reviewId,
        bookingId,
        cleanerId: reviewData.cleanerId,
        ownerId: reviewOwner.owner.id,
        rating: reviewData.rating,
        text: reviewData.text,
        featured: reviewData.featured || false,
        approved: true,
      },
    })
  }
  console.log('Created sample reviews from different owners')

  console.log('')
  console.log('Seed completed!')
  console.log('')
  console.log('Test accounts:')
  console.log('-'.repeat(50))
  console.log('Admin:   admin@villacare.com (magic link)')
  console.log('Owners:  mark@example.com, sarah@example.com, etc. (magic link)')
  console.log('Cleaner: +34612345678 (use code 123456)')
  console.log('Cleaner: +34623456789 (use code 123456)')
  console.log('-'.repeat(50))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
