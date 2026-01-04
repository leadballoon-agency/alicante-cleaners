import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create Admin user (can still use email magic link to sign in)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@villacare.com' },
    update: {},
    create: {
      email: 'admin@villacare.com',
      name: 'Admin',
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  })
  console.log('Created admin:', admin.email)

  // Create test Owner (uses magic link to sign in)
  const ownerUser = await prisma.user.upsert({
    where: { email: 'mark@example.com' },
    update: {},
    create: {
      email: 'mark@example.com',
      name: 'Mark Taylor',
      role: 'OWNER',
      emailVerified: new Date(),
    },
  })

  // Create Owner profile
  await prisma.owner.upsert({
    where: { userId: ownerUser.id },
    update: {},
    create: {
      userId: ownerUser.id,
      referralCode: 'MARK2024',
      trusted: true,
    },
  })
  console.log('Created owner:', ownerUser.email)

  // Create test Cleaner
  const cleanerUser = await prisma.user.upsert({
    where: { phone: '+34612345678' },
    update: {},
    create: {
      phone: '+34612345678',
      name: 'Clara Garcia',
      role: 'CLEANER',
      phoneVerified: new Date(),
    },
  })

  // Create Cleaner profile
  await prisma.cleaner.upsert({
    where: { userId: cleanerUser.id },
    update: {},
    create: {
      userId: cleanerUser.id,
      slug: 'clara',
      bio: 'Professional cleaner with 5 years of experience in villa cleaning. I take pride in leaving every home spotless!',
      serviceAreas: ['Alicante City', 'San Juan', 'Playa de San Juan'],
      hourlyRate: 18,
      status: 'ACTIVE',
      rating: 5.0,
      reviewCount: 25,
      totalBookings: 45,
    },
  })
  console.log('Created cleaner:', cleanerUser.phone)

  // Create second test Cleaner
  const cleaner2User = await prisma.user.upsert({
    where: { phone: '+34623456789' },
    update: {},
    create: {
      phone: '+34623456789',
      name: 'Maria Lopez',
      role: 'CLEANER',
      phoneVerified: new Date(),
    },
  })

  await prisma.cleaner.upsert({
    where: { userId: cleaner2User.id },
    update: {},
    create: {
      userId: cleaner2User.id,
      slug: 'maria',
      bio: 'Dedicated and detail-oriented cleaner. Specialized in deep cleaning and move-in/move-out services.',
      serviceAreas: ['El Campello', 'Mutxamel', 'San Vicente'],
      hourlyRate: 16,
      status: 'ACTIVE',
      rating: 4.9,
      reviewCount: 18,
      totalBookings: 32,
    },
  })
  console.log('Created cleaner:', cleaner2User.phone)

  // Create a Property for the owner
  const owner = await prisma.owner.findUnique({
    where: { userId: ownerUser.id },
  })

  if (owner) {
    await prisma.property.upsert({
      where: { id: 'prop_sanjuan' },
      update: {},
      create: {
        id: 'prop_sanjuan',
        ownerId: owner.id,
        name: 'San Juan Villa',
        address: 'Calle del Mar 42, San Juan, Alicante',
        bedrooms: 3,
        bathrooms: 2,
        notes: 'Key under the blue pot by the front door. Alarm code is 1234.',
      },
    })
    console.log('Created property: San Juan Villa')
  }

  console.log('')
  console.log('Seed completed!')
  console.log('')
  console.log('Test accounts:')
  console.log('-'.repeat(50))
  console.log('Admin:   admin@villacare.com (magic link)')
  console.log('Owner:   mark@example.com (magic link)')
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
