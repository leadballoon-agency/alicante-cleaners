import { notFound } from 'next/navigation'
import { getPublicCleanerProfile } from '@/lib/cleaners/get-public-profile'
import ProfileClient, { type Cleaner } from './ProfileClient'

// Cleaner profiles change infrequently (bio edits, new reviews, rate
// changes) — ISR keeps them fast for crawlers/visitors without refetching
// on every request.
export const revalidate = 3600

export default async function CleanerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const profile = await getPublicCleanerProfile(slug)

  if (!profile) {
    notFound()
  }

  // Server data can have nullable fields (e.g. user.name) that the client
  // component's props don't model as nullable — fall back with ?? like the
  // rest of the app does when consuming API data.
  const cleaner: Cleaner = {
    id: profile.id,
    slug: profile.slug,
    name: profile.name ?? '',
    photo: profile.photo,
    rating: profile.rating,
    reviewCount: profile.reviewCount,
    areas: profile.areas,
    hourlyRate: profile.hourlyRate,
    bio: profile.bio ?? '',
    reviewsLink: profile.reviewsLink,
    vettedNote: profile.vettedNote,
    vettedNoteLang: profile.vettedNoteLang,
    vettedNoteTranslated: profile.vettedNoteTranslated,
    vettedByName: profile.vettedByName,
    languages: profile.languages,
    teamLeader: profile.teamLeader,
    teamName: profile.teamName,
    teamMembers: profile.teamMembers,
    services: profile.services.map((service) => ({
      type: service.type,
      name: service.name,
      price: service.price,
      hours: service.hours ?? 0,
      description: service.description,
    })),
    testimonial: profile.testimonial,
    reviews: profile.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      text: review.text,
      author: review.author,
      createdAt: review.createdAt.toISOString(),
    })),
  }

  return <ProfileClient cleaner={cleaner} slug={slug} />
}
