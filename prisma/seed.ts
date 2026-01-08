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
    { email: 'mark@example.com', name: 'Mark T.', code: 'MARK2024', phone: '+44 7700 900123' },
    { email: 'sarah@example.com', name: 'Sarah W.', code: 'SARA2024', phone: '+44 7700 900456' },
    { email: 'james@example.com', name: 'James M.', code: 'JAME2024', phone: '+44 7700 900789' },
    { email: 'emma@example.com', name: 'Emma B.', code: 'EMMA2024', phone: '+34 612 987 654' },
    { email: 'david@example.com', name: 'David K.', code: 'DAVI2024', phone: '+34 623 456 789' },
  ]

  const ownerRecords = []
  for (const ownerData of owners) {
    const ownerUser = await prisma.user.upsert({
      where: { email: ownerData.email },
      update: { name: ownerData.name, phone: ownerData.phone },
      create: {
        email: ownerData.email,
        name: ownerData.name,
        phone: ownerData.phone,
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
    update: {
      keyHolderName: 'John (Neighbour)',
      keyHolderPhone: '+34 612 111 222',
    },
    create: {
      id: 'prop_sanjuan',
      ownerId: primaryOwner.owner.id,
      name: 'San Juan Villa',
      address: 'Calle del Mar 42, San Juan, Alicante',
      bedrooms: 3,
      bathrooms: 2,
      notes: 'Call neighbor John (10 mins before) - he is elderly and needs time to let you in. Key code 4521. WiFi VillaGuest password sunshine2024. Please water the orchids on the terrace!',
      keyHolderName: 'John (Neighbour)',
      keyHolderPhone: '+34 612 111 222',
    },
  })
  console.log('Created property: San Juan Villa')

  // Create additional properties for different owners
  const property2 = await prisma.property.upsert({
    where: { id: 'prop_campello' },
    update: {},
    create: {
      id: 'prop_campello',
      ownerId: ownerRecords[1].owner.id,
      name: 'El Campello Apartment',
      address: 'Av. de la Marina 15, El Campello',
      bedrooms: 2,
      bathrooms: 1,
      notes: 'Keypad entry 5678#. Parking in basement level -1, space 42. Guest arriving at 4pm - please finish by 3.30pm. Extra towels in hallway cupboard.',
    },
  })
  console.log('Created property: El Campello Apartment')

  const property3 = await prisma.property.upsert({
    where: { id: 'prop_playa' },
    update: {
      keyHolderName: 'Rosa (Neighbour #6)',
      keyHolderPhone: '+34 612 333 444',
    },
    create: {
      id: 'prop_playa',
      ownerId: ownerRecords[2].owner.id,
      name: 'Playa San Juan Villa',
      address: 'Calle Neptuno 8, Playa de San Juan',
      bedrooms: 4,
      bathrooms: 3,
      notes: 'Keys with neighbor Rosa at #6 (ring twice - she is hard of hearing). Pool cover must be removed and stored in shed. Alarm code 1234 ENTER. Check hot tub chemicals and report any issues. WiFi PlayaVilla password beachlife99',
      keyHolderName: 'Rosa (Neighbour #6)',
      keyHolderPhone: '+34 612 333 444',
    },
  })
  console.log('Created property: Playa San Juan Villa')

  const property4 = await prisma.property.upsert({
    where: { id: 'prop_alicante' },
    update: {
      keyHolderName: 'Miguel (Concierge)',
      keyHolderPhone: '+34 612 555 666',
    },
    create: {
      id: 'prop_alicante',
      ownerId: ownerRecords[3].owner.id,
      name: 'Alicante City Flat',
      address: 'Calle Mayor 22, Alicante City',
      bedrooms: 2,
      bathrooms: 1,
      notes: 'Concierge Miguel has spare key (ground floor office, closes 2pm on Saturday). Aircon remotes in kitchen drawer. Please strip beds and start washing machine before leaving. No smoking on balcony as neighbors complain!',
      keyHolderName: 'Miguel (Concierge)',
      keyHolderPhone: '+34 612 555 666',
    },
  })
  console.log('Created property: Alicante City Flat')

  // All properties for use in bookings
  const properties = [property, property2, property3, property4]

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

    console.log('Created team: Limpieza Alicante Express with Maria as member')

    // Helper function to create a date relative to today
    const getRelativeDate = (daysFromNow: number): Date => {
      const date = new Date()
      date.setDate(date.getDate() + daysFromNow)
      date.setHours(0, 0, 0, 0) // Reset time to start of day
      return date
    }

    // Service configurations
    const services = {
      regular: { name: 'Regular Clean', hours: 3, claraPrice: 54, mariaPrice: 48 },
      deep: { name: 'Deep Clean', hours: 5, claraPrice: 90, mariaPrice: 80 },
      arrival: { name: 'Arrival Prep', hours: 4, claraPrice: 72, mariaPrice: 64 },
    }

    // Create many bookings for calendar display
    const bookingsData = [
      // TODAY - 2 jobs (good for "today's schedule" view)
      { id: 'cal_today_1', cleaner: clara, day: 0, time: '18:00', service: services.regular, owner: 0, prop: 0, status: 'CONFIRMED' },
      { id: 'cal_today_2', cleaner: maria, day: 0, time: '19:00', service: services.deep, owner: 1, prop: 1, status: 'CONFIRMED' },

      // TOMORROW - 1 job
      { id: 'cal_tom_1', cleaner: clara, day: 1, time: '08:00', service: services.arrival, owner: 2, prop: 2, status: 'PENDING' },

      // DAY 2 - 2 jobs
      { id: 'cal_d2_1', cleaner: maria, day: 2, time: '10:00', service: services.regular, owner: 3, prop: 3, status: 'CONFIRMED' },
      { id: 'cal_d2_2', cleaner: clara, day: 2, time: '14:00', service: services.regular, owner: 0, prop: 0, status: 'CONFIRMED' },

      // DAY 3 - BUSY DAY (3 jobs!)
      { id: 'cal_d3_1', cleaner: clara, day: 3, time: '08:00', service: services.deep, owner: 1, prop: 1, status: 'CONFIRMED' },
      { id: 'cal_d3_2', cleaner: maria, day: 3, time: '09:00', service: services.regular, owner: 2, prop: 2, status: 'CONFIRMED' },
      { id: 'cal_d3_3', cleaner: clara, day: 3, time: '15:00', service: services.regular, owner: 3, prop: 3, status: 'PENDING' },

      // DAY 5 - 1 job
      { id: 'cal_d5_1', cleaner: maria, day: 5, time: '11:00', service: services.arrival, owner: 0, prop: 0, status: 'PENDING' },

      // DAY 7 - BUSY DAY (3 jobs!)
      { id: 'cal_d7_1', cleaner: clara, day: 7, time: '08:00', service: services.deep, owner: 1, prop: 1, status: 'CONFIRMED' },
      { id: 'cal_d7_2', cleaner: maria, day: 7, time: '10:00', service: services.regular, owner: 2, prop: 2, status: 'CONFIRMED' },
      { id: 'cal_d7_3', cleaner: clara, day: 7, time: '16:00', service: services.arrival, owner: 3, prop: 3, status: 'CONFIRMED' },

      // DAY 10 - 1 job
      { id: 'cal_d10_1', cleaner: maria, day: 10, time: '10:00', service: services.regular, owner: 0, prop: 0, status: 'CONFIRMED' },

      // DAY 12 - 2 jobs
      { id: 'cal_d12_1', cleaner: clara, day: 12, time: '09:00', service: services.arrival, owner: 1, prop: 1, status: 'CONFIRMED' },
      { id: 'cal_d12_2', cleaner: maria, day: 12, time: '14:00', service: services.deep, owner: 2, prop: 2, status: 'PENDING' },

      // RECENT COMPLETED (for history)
      { id: 'cal_past_1', cleaner: clara, day: -1, time: '10:00', service: services.deep, owner: 3, prop: 3, status: 'COMPLETED' },
      { id: 'cal_past_2', cleaner: maria, day: -2, time: '09:00', service: services.regular, owner: 0, prop: 0, status: 'COMPLETED' },
      { id: 'cal_past_3', cleaner: clara, day: -3, time: '08:00', service: services.arrival, owner: 1, prop: 1, status: 'COMPLETED' },
    ]

    // Create all the bookings
    for (const booking of bookingsData) {
      const isClara = booking.cleaner.id === clara.id
      const price = isClara
        ? (booking.service as typeof services.regular).claraPrice
        : (booking.service as typeof services.regular).mariaPrice

      await prisma.booking.upsert({
        where: { id: booking.id },
        update: {},
        create: {
          id: booking.id,
          cleanerId: booking.cleaner.id,
          ownerId: ownerRecords[booking.owner].owner.id,
          propertyId: properties[booking.prop].id,
          status: booking.status as 'PENDING' | 'CONFIRMED' | 'COMPLETED',
          service: booking.service.name,
          price,
          hours: booking.service.hours,
          date: getRelativeDate(booking.day),
          time: booking.time,
        },
      })
    }

    console.log(`Created ${bookingsData.length} calendar bookings for Clara and Maria`)
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
