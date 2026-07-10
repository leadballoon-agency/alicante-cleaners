'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageTracker } from '@/components/analytics/page-tracker'
import { CleanerSlider, type SliderCleaner } from '@/components/CleanerSlider'
import { formatAreasSentence as formatAreasSentenceBase } from '@/lib/format-areas'

export type CleanerCard = {
  id: string
  slug: string
  name: string
  photo: string | null
  rating: number
  reviewCount: number
  serviceAreas: string[]
  teamLeader: boolean
}

export type TrustStats = {
  vettedCleaners: number
  areasCovered: number
  avgRating: number | null
  totalReviews: number
}

// Real, admin-approved reviews only (see app/owners/page.tsx). Never a
// fabricated fallback — if this is empty, the reviews section is hidden.
export type OwnerReview = {
  id: string
  rating: number
  text: string
  authorName: string
  location: string
}

type Lang = 'en' | 'es'

type Props = {
  cleaners: CleanerCard[]
  stats: TrustStats
  areas: string[]
  reviews: OwnerReview[]
}

const translations = {
  en: {
    findCleaner: 'Find a cleaner',
    hero: {
      eyebrow: 'Trusted villa care · Costa Blanca',
      titlePre: "Come home to a villa that's been",
      titleEm: 'loved while you were away.',
      sub: 'Vetted, reviewed local cleaners who treat your home like their own — booked in minutes, in any language.',
      videoQuote: 'The story of coming home to a cared-for villa.',
      videoName: 'A real VillaCare story',
      ctaFind: 'Find your cleaner →',
      ctaHow: 'See how it works',
      trustMicro: 'Real reviews from real owners · No platform fees',
    },
    trustbar: {
      vetted: 'Vetted cleaners',
      areas: 'Areas covered',
      anyLanguage: 'Any language',
      autoTranslated: 'auto-translated',
      ratingLabel: 'Avg rating',
      newValue: 'New',
      newLabel: 'Just launched',
    },
    empathy: {
      eyebrow: 'Sound familiar?',
      heading: 'Trusting someone with your villa is a leap of faith — near or far.',
      pains: [
        {
          icon: '🔑',
          title: 'Handing keys to a stranger',
          desc: "Who's actually in your home — and can you trust them with it?",
        },
        {
          icon: '📵',
          title: 'Cleaners who ghost',
          desc: "No-shows and silence right when your family's about to arrive. Again.",
        },
        {
          icon: '🗣️',
          title: 'Lost in translation',
          desc: 'Arranging anything in Spanish from another country is exhausting.',
        },
        {
          icon: '😰',
          title: 'The pre-arrival panic',
          desc: 'Will the villa be ready, or will you spend day one cleaning?',
        },
        {
          icon: '🤷',
          title: 'Live here? Still impossible.',
          desc: "Finding someone reliable is hard even when you're just down the road.",
        },
      ],
    },
    how: {
      eyebrow: 'Simple',
      heading: 'Sorted in three steps.',
      steps: [
        {
          title: 'Find a cleaner near you',
          desc: 'Browse vetted, reviewed cleaners in your area — with real ratings and the languages they speak.',
        },
        {
          title: 'Book in minutes',
          desc: 'Pick a date and service. They confirm on WhatsApp. No accounts, no faff.',
        },
        {
          title: "Relax — it's handled",
          desc: 'Get updates as they arrive and finish. You pay them directly. No platform fees, ever.',
        },
      ],
      cta: 'Find your cleaner →',
    },
    stories: {
      eyebrow: 'Real people, real stories',
      heading: 'The trust is the product.',
      sub: 'Not stock photos. Not actors. The owners and cleaners who make VillaCare.',
      cards: [
        {
          name: 'Mara · Cleaner',
          quote:
            "I came for a bit of extra income. VillaCare brought me steady bookings — and owners who trust me completely.",
        },
        {
          name: 'Mark & Kerry · Founders',
          quote: "We live here, and we still couldn't find someone we trusted. So we built the network we needed.",
        },
        {
          name: 'Jessica & Ernesto · Team leaders',
          quote: "We're building our own cleaning business here — VillaCare gives us the bookings and the trust.",
        },
      ],
    },
    moat: {
      eyebrow: 'Why owners trust us',
      heading: 'Built around your peace of mind.',
      features: [
        {
          icon: '✅',
          title: 'Every cleaner is vetted',
          desc: 'We meet and verify them. You see real reviews from real owners before you book.',
        },
        {
          icon: '🔐',
          title: 'Your keys & access, protected',
          desc: 'Access notes are encrypted and only revealed to your cleaner in the 24 hours around a booking.',
        },
        {
          icon: '🌍',
          title: 'In your language',
          desc: 'Any language — messages auto-translate both ways, instantly.',
        },
        {
          icon: '💬',
          title: 'Always in the loop',
          desc: "WhatsApp updates when your cleaner's on the way, arrived, and done.",
        },
        {
          icon: '💷',
          title: 'No platform fees',
          desc: "You pay your cleaner directly. We don't take a cut of your booking.",
        },
      ],
    },
    cleaners: {
      eyebrow: 'Available near you',
      heading: 'Meet a few of your cleaners.',
      areasFallback: 'Costa Blanca villages',
      teamLeaderChip: '✓ Team leader',
      vettedChip: '✓ Vetted',
      reviews: 'reviews',
      review: 'review',
      newCleaner: 'New on VillaCare',
      cta: 'See all cleaners in my area →',
    },
    reviews: {
      eyebrow: 'From owners like you',
      heading: 'Worth every star.',
    },
    faq: {
      heading: 'Questions, answered.',
      items: [
        {
          q: 'Do I need to be in Spain?',
          a: "No — most of our owners live abroad. Everything's arranged remotely, in your language.",
        },
        {
          q: 'How do I pay?',
          a: 'You pay your cleaner directly. VillaCare charges you no platform fees on bookings.',
        },
        {
          q: 'Are the cleaners really vetted?',
          a: 'Yes. We meet and verify every cleaner, and you see genuine reviews before booking.',
        },
        {
          q: 'What about my keys?',
          a: 'Access details are encrypted and only shown to your cleaner around the time of the booking.',
        },
      ],
      areasQuestion: 'Which areas do you cover?',
      areasFallback:
        'Alicante City, San Juan, Playa de San Juan, El Campello, Mutxamel, San Vicente and Jijona.',
    },
    final: {
      heading: 'Your villa deserves people who care.',
      sub: 'Find a trusted cleaner near you in under two minutes.',
      cta: 'Find your cleaner →',
      sub2: 'No account needed · No platform fees · Real reviews',
    },
    footer: {
      how: 'How it works',
      forCleaners: 'For cleaners',
      about: 'About',
      tagline: 'VillaCare · Trusted villa services on the Costa Blanca',
    },
  },
  es: {
    findCleaner: 'Buscar limpiador',
    hero: {
      eyebrow: 'Cuidado de villas de confianza · Costa Blanca',
      titlePre: 'Vuelve a una villa que ha sido',
      titleEm: 'cuidada mientras no estabas.',
      sub: 'Limpiadores locales verificados y valorados que cuidan tu casa como si fuera suya — reserva en minutos, en cualquier idioma.',
      videoQuote: 'La historia de volver a una villa cuidada.',
      videoName: 'Una historia real de VillaCare',
      ctaFind: 'Encuentra tu limpiador →',
      ctaHow: 'Ver cómo funciona',
      trustMicro: 'Reseñas reales de propietarios reales · Sin comisiones de plataforma',
    },
    trustbar: {
      vetted: 'Limpiadores verificados',
      areas: 'Zonas cubiertas',
      anyLanguage: 'Cualquier idioma',
      autoTranslated: 'traducción automática',
      ratingLabel: 'Valoración media',
      newValue: 'Nueva',
      newLabel: 'Recién lanzada',
    },
    empathy: {
      eyebrow: '¿Te suena familiar?',
      heading: 'Confiar tu villa a alguien es un acto de fe — vivas cerca o lejos.',
      pains: [
        {
          icon: '🔑',
          title: 'Dar las llaves a un desconocido',
          desc: '¿Quién entra realmente en tu casa? ¿Y puedes confiar en esa persona?',
        },
        {
          icon: '📵',
          title: 'Limpiadores que desaparecen',
          desc: 'Ausencias y silencio justo cuando tu familia está a punto de llegar. Otra vez.',
        },
        {
          icon: '🗣️',
          title: 'Todo se pierde en la traducción',
          desc: 'Organizar cualquier cosa en español desde otro país agota.',
        },
        {
          icon: '😰',
          title: 'El pánico antes de llegar',
          desc: '¿Estará la villa lista, o pasarás tu primer día limpiando?',
        },
        {
          icon: '🤷',
          title: '¿Vives aquí? Sigue siendo imposible.',
          desc: 'Encontrar a alguien de confianza cuesta igual, incluso viviendo a la vuelta de la esquina.',
        },
      ],
    },
    how: {
      eyebrow: 'Sencillo',
      heading: 'Resuelto en tres pasos.',
      steps: [
        {
          title: 'Encuentra un limpiador cerca de ti',
          desc: 'Explora limpiadores verificados y valorados en tu zona — con valoraciones reales y los idiomas que hablan.',
        },
        {
          title: 'Reserva en minutos',
          desc: 'Elige una fecha y un servicio. Confirman por WhatsApp. Sin cuentas, sin complicaciones.',
        },
        {
          title: 'Relájate, está solucionado',
          desc: 'Recibe actualizaciones cuando lleguen y terminen. Les pagas directamente. Sin comisiones de plataforma, nunca.',
        },
      ],
      cta: 'Encuentra tu limpiador →',
    },
    stories: {
      eyebrow: 'Personas reales, historias reales',
      heading: 'La confianza es el producto.',
      sub: 'No son fotos de stock. No son actores. Los propietarios y limpiadores que hacen VillaCare.',
      cards: [
        {
          name: 'Mara · Limpiadora',
          quote:
            'Empecé buscando un ingreso extra. VillaCare me trajo reservas constantes — y propietarios que confían en mí por completo.',
        },
        {
          name: 'Mark y Kerry · Fundadores',
          quote:
            'Vivimos aquí, y aun así no encontrábamos a alguien de confianza. Así que construimos la red que necesitábamos.',
        },
        {
          name: 'Jessica y Ernesto · Líderes de equipo',
          quote:
            'Estamos construyendo nuestro propio negocio de limpieza aquí — VillaCare nos da las reservas y la confianza.',
        },
      ],
    },
    moat: {
      eyebrow: 'Por qué confían en nosotros',
      heading: 'Pensado para tu tranquilidad.',
      features: [
        {
          icon: '✅',
          title: 'Todos los limpiadores están verificados',
          desc: 'Los conocemos y verificamos en persona. Ves reseñas reales de propietarios reales antes de reservar.',
        },
        {
          icon: '🔐',
          title: 'Tus llaves y accesos, protegidos',
          desc: 'Las notas de acceso están cifradas y solo se muestran a tu limpiador en las 24 horas alrededor de la reserva.',
        },
        {
          icon: '🌍',
          title: 'En tu idioma',
          desc: 'Cualquier idioma — los mensajes se traducen automáticamente en ambos sentidos, al instante.',
        },
        {
          icon: '💬',
          title: 'Siempre informado',
          desc: 'Actualizaciones por WhatsApp cuando tu limpiador está en camino, llega y termina.',
        },
        {
          icon: '💷',
          title: 'Sin comisiones de plataforma',
          desc: 'Pagas directamente a tu limpiador. No nos quedamos con nada de tu reserva.',
        },
      ],
    },
    cleaners: {
      eyebrow: 'Disponibles cerca de ti',
      heading: 'Conoce a algunos de tus limpiadores.',
      areasFallback: 'Pueblos de la Costa Blanca',
      teamLeaderChip: '✓ Líder de equipo',
      vettedChip: '✓ Verificado',
      reviews: 'reseñas',
      review: 'reseña',
      newCleaner: 'Nuevo en VillaCare',
      cta: 'Ver todos los limpiadores en mi zona →',
    },
    reviews: {
      eyebrow: 'De propietarios como tú',
      heading: 'Vale cada estrella.',
    },
    faq: {
      heading: 'Preguntas resueltas.',
      items: [
        {
          q: '¿Necesito estar en España?',
          a: 'No — la mayoría de nuestros propietarios viven en el extranjero. Todo se organiza a distancia, en tu idioma.',
        },
        {
          q: '¿Cómo pago?',
          a: 'Pagas directamente a tu limpiador. VillaCare no te cobra comisiones de plataforma en las reservas.',
        },
        {
          q: '¿Los limpiadores están realmente verificados?',
          a: 'Sí. Conocemos y verificamos a cada limpiador, y ves reseñas genuinas antes de reservar.',
        },
        {
          q: '¿Qué pasa con mis llaves?',
          a: 'Los detalles de acceso están cifrados y solo se muestran a tu limpiador en torno a la fecha de la reserva.',
        },
      ],
      areasQuestion: '¿Qué zonas cubrís?',
      areasFallback:
        'Alicante ciudad, San Juan, Playa de San Juan, El Campello, Mutxamel, San Vicente y Jijona.',
    },
    final: {
      heading: 'Tu villa merece personas que la cuiden.',
      sub: 'Encuentra un limpiador de confianza cerca de ti en menos de dos minutos.',
      cta: 'Encuentra tu limpiador →',
      sub2: 'Sin cuenta necesaria · Sin comisiones · Reseñas reales',
    },
    footer: {
      how: 'Cómo funciona',
      forCleaners: 'Para limpiadores',
      about: 'Sobre nosotros',
      tagline: 'VillaCare · Servicios de villa de confianza en la Costa Blanca',
    },
  },
} as const

const storyGradients = [
  'bg-gradient-to-br from-[#7c9885] to-[#566b5b]',
  'bg-gradient-to-br from-[#b08968] to-[#7d5a3c]',
  'bg-gradient-to-br from-[#9a8fb0] to-[#5e5273]',
]

function formatAreasList(areas: string[], max: number): string {
  if (areas.length === 0) return ''
  const shown = areas.slice(0, max)
  const joined = shown.join(' · ')
  return areas.length > max ? `${joined} & more` : joined
}

function formatAreasSentence(areas: string[], lang: Lang): string {
  return formatAreasSentenceBase(areas, lang === 'es' ? 'y' : 'and')
}

function starString(rating: number): string {
  const filled = Math.max(0, Math.min(5, Math.round(rating)))
  return '★'.repeat(filled) + '☆'.repeat(5 - filled)
}

export function OwnersLandingClient({ cleaners, stats, areas, reviews }: Props) {
  const [lang, setLang] = useState<Lang>('en')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const t = translations[lang]

  const ratingDisplay =
    stats.totalReviews > 0 && stats.avgRating !== null
      ? { value: `${stats.avgRating.toFixed(1)}★`, label: t.trustbar.ratingLabel }
      : { value: t.trustbar.newValue, label: t.trustbar.newLabel }

  const cleanerAreasLine = formatAreasList(areas, 4) || t.cleaners.areasFallback
  const faqAreasAnswer = formatAreasSentence(areas, lang)
    ? `${formatAreasSentence(areas, lang)}.`
    : t.faq.areasFallback

  const sliderCleaners: SliderCleaner[] = cleaners.map((cleaner) => ({
    id: cleaner.id,
    slug: cleaner.slug,
    name: cleaner.name,
    photo: cleaner.photo,
    rating: cleaner.rating,
    reviewCount: cleaner.reviewCount,
    serviceAreas: cleaner.serviceAreas,
    chips: [
      {
        label: cleaner.teamLeader ? t.cleaners.teamLeaderChip : t.cleaners.vettedChip,
        className:
          'inline-block text-[10.5px] bg-[#E8F5E9] text-[#2E7D32] px-1.5 py-0.5 rounded-full font-semibold',
      },
    ],
  }))

  return (
    <div className="min-h-screen min-w-[320px] bg-[#FAFAF8] font-sans">
      <PageTracker />

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#FAFAF8]/90 backdrop-blur-md border-b border-[#EBEBEB]">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-lg tracking-tight text-[#1A1A1A]">
            <span className="w-7 h-7 rounded-lg bg-[#C4785A] flex items-center justify-center text-sm">🏡</span>
            VillaCare
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#F5F5F3] rounded-lg p-1">
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  lang === 'en' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B]'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('es')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  lang === 'es' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B6B6B]'
                }`}
              >
                ES
              </button>
            </div>
            <a
              href="#find"
              className="bg-[#1A1A1A] text-white px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap"
            >
              {t.findCleaner}
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="px-6 pt-8 pb-7 text-center max-w-xl mx-auto">
        <span className="text-xs font-bold tracking-[0.08em] uppercase text-[#C4785A]">{t.hero.eyebrow}</span>
        <h1 className="text-[28px] sm:text-4xl font-extrabold tracking-tight leading-[1.15] text-[#1A1A1A] mt-3 mb-3">
          {t.hero.titlePre} <em className="not-italic text-[#C4785A]">{t.hero.titleEm}</em>
        </h1>
        <p className="text-base text-[#6B6B6B] max-w-sm mx-auto mb-6">{t.hero.sub}</p>

        {/* UGC hero video slot (placeholder - structured for a real clip later) */}
        <div className="relative rounded-2xl overflow-hidden aspect-[3/4] max-w-xs mx-auto shadow-[0_8px_30px_rgba(26,26,26,0.10)] mb-6 bg-gradient-to-br from-[#cdb4a4] via-[#a9866f] to-[#8a6852]">
          <div className="absolute inset-x-0 bottom-0 p-4 text-left">
            <p className="text-white text-sm font-semibold italic drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)] mb-1">
              &ldquo;{t.hero.videoQuote}&rdquo;
            </p>
            <p className="text-white/85 text-xs font-medium drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
              {t.hero.videoName}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
          <a
            href="#find"
            className="w-full bg-[#C4785A] text-white py-4 rounded-[14px] font-semibold text-base active:scale-[0.985] transition-transform"
          >
            {t.hero.ctaFind}
          </a>
          <a
            href="#how"
            className="w-full bg-white text-[#1A1A1A] border-[1.5px] border-[#DEDEDE] py-4 rounded-[14px] font-semibold text-base active:scale-[0.985] transition-transform"
          >
            {t.hero.ctaHow}
          </a>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-3.5 text-[13px] text-[#6B6B6B]">
          <span className="text-[#C4785A] tracking-widest">★★★★★</span>
          {t.hero.trustMicro}
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="bg-[#1A1A1A] text-white flex justify-around text-center px-3 py-4">
        <div>
          <div className="text-xl sm:text-2xl font-extrabold tracking-tight">{stats.vettedCleaners}</div>
          <div className="text-[11px] text-[#cfcfcf] mt-0.5">{t.trustbar.vetted}</div>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-extrabold tracking-tight">{stats.areasCovered}</div>
          <div className="text-[11px] text-[#cfcfcf] mt-0.5">{t.trustbar.areas}</div>
        </div>
        <div>
          <div className="text-base sm:text-lg font-extrabold tracking-tight">{t.trustbar.anyLanguage}</div>
          <div className="text-[11px] text-[#cfcfcf] mt-0.5">{t.trustbar.autoTranslated}</div>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-extrabold tracking-tight">{ratingDisplay.value}</div>
          <div className="text-[11px] text-[#cfcfcf] mt-0.5">{ratingDisplay.label}</div>
        </div>
      </div>

      {/* EMPATHY */}
      <section className="px-6 py-9 bg-[#F5F5F3]">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-bold tracking-[0.08em] uppercase text-[#C4785A]">{t.empathy.eyebrow}</span>
          <h2 className="text-[23px] font-extrabold text-[#1A1A1A] mt-2.5 mb-4 max-w-md">{t.empathy.heading}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {t.empathy.pains.map((pain) => (
              <div
                key={pain.title}
                className="flex gap-3 items-start bg-white border border-[#EBEBEB] rounded-2xl p-3.5"
              >
                <div className="flex-none w-[38px] h-[38px] rounded-[10px] bg-[#FFF3E0] flex items-center justify-center text-lg">
                  {pain.icon}
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-[#1A1A1A] mb-0.5">{pain.title}</h4>
                  <p className="text-[13.5px] text-[#6B6B6B]">{pain.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="px-6 py-9 max-w-xl mx-auto">
        <span className="block text-center text-xs font-bold tracking-[0.08em] uppercase text-[#C4785A]">
          {t.how.eyebrow}
        </span>
        <h2 className="text-[23px] font-extrabold text-[#1A1A1A] text-center mt-2 mb-6">{t.how.heading}</h2>
        <div className="space-y-4">
          {t.how.steps.map((step, i) => (
            <div key={step.title} className="flex gap-3.5 items-start">
              <div className="flex-none w-9 h-9 rounded-full bg-[#C4785A] text-white font-extrabold flex items-center justify-center">
                {i + 1}
              </div>
              <div>
                <h4 className="text-base font-bold text-[#1A1A1A] mb-0.5">{step.title}</h4>
                <p className="text-sm text-[#6B6B6B]">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <a
          href="#find"
          className="block w-full text-center mt-5 bg-[#C4785A] text-white py-4 rounded-[14px] font-semibold active:scale-[0.985] transition-transform"
        >
          {t.how.cta}
        </a>
      </section>

      {/* STORIES */}
      <section className="px-6 py-9 bg-[#1A1A1A]">
        <div className="max-w-3xl mx-auto">
          <span className="block text-center text-xs font-bold tracking-[0.08em] uppercase text-[#C4785A]">
            {t.stories.eyebrow}
          </span>
          <h2 className="text-[23px] font-extrabold text-white text-center mt-2 mb-1.5">{t.stories.heading}</h2>
          <p className="text-center text-[#bdbdbd] text-sm mb-6 max-w-sm mx-auto">{t.stories.sub}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {t.stories.cards.map((card, i) => (
              <div
                key={card.name}
                className={`relative rounded-2xl overflow-hidden aspect-square shadow-[0_8px_30px_rgba(26,26,26,0.10)] ${storyGradients[i % storyGradients.length]}`}
              >
                <div className="absolute inset-x-0 bottom-0 p-3.5 text-left">
                  <div className="text-white font-bold text-[15px] mb-0.5">{card.name}</div>
                  <div className="text-white/90 text-[12.5px]">&ldquo;{card.quote}&rdquo;</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MOAT / TRUST FEATURES */}
      <section className="px-6 py-9 max-w-3xl mx-auto">
        <span className="block text-center text-xs font-bold tracking-[0.08em] uppercase text-[#C4785A]">
          {t.moat.eyebrow}
        </span>
        <h2 className="text-[23px] font-extrabold text-[#1A1A1A] text-center mt-2 mb-6">{t.moat.heading}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {t.moat.features.map((feature) => (
            <div key={feature.title} className="flex gap-3.5 items-start">
              <div className="flex-none w-11 h-11 rounded-xl bg-white border border-[#EBEBEB] shadow-[0_2px_14px_rgba(26,26,26,0.06)] flex items-center justify-center text-xl">
                {feature.icon}
              </div>
              <div>
                <h4 className="text-[15.5px] font-bold text-[#1A1A1A] mb-0.5">{feature.title}</h4>
                <p className="text-[13.5px] text-[#6B6B6B]">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CLEANERS */}
      <section id="find" className="px-6 py-9 bg-[#F5F5F3]">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-bold tracking-[0.08em] uppercase text-[#C4785A]">{t.cleaners.eyebrow}</span>
          <h2 className="text-[22px] font-extrabold text-[#1A1A1A] mt-1 mb-1">{t.cleaners.heading}</h2>
          <p className="text-sm text-[#6B6B6B] mb-4">{cleanerAreasLine}</p>

          <CleanerSlider
            cleaners={sliderCleaners}
            reviewsLabel={t.cleaners.reviews}
            reviewLabel={t.cleaners.review}
            newCleanerLabel={t.cleaners.newCleaner}
          />

          <Link
            href="/"
            className="block w-full text-center mt-4 bg-[#C4785A] text-white py-4 rounded-[14px] font-semibold active:scale-[0.985] transition-transform"
          >
            {t.cleaners.cta}
          </Link>
        </div>
      </section>

      {/* REVIEWS — real, admin-approved reviews only. Hidden entirely when none exist. */}
      {reviews.length > 0 && (
        <section className="px-6 py-9 max-w-xl mx-auto">
          <span className="block text-center text-xs font-bold tracking-[0.08em] uppercase text-[#C4785A]">
            {t.reviews.eyebrow}
          </span>
          <h2 className="text-[22px] font-extrabold text-[#1A1A1A] text-center mt-2 mb-4">{t.reviews.heading}</h2>
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white border border-[#EBEBEB] rounded-2xl p-4 shadow-[0_2px_14px_rgba(26,26,26,0.06)]"
              >
                <div className="text-[#C4785A] text-sm mb-2 tracking-widest">{starString(review.rating)}</div>
                <p className="text-[14.5px] italic text-[#1A1A1A] mb-2.5">&ldquo;{review.text}&rdquo;</p>
                <div className="text-[13px] font-bold text-[#1A1A1A]">
                  {review.authorName} <span className="text-[#9B9B9B] font-normal">· {review.location}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="px-6 py-9 bg-[#F5F5F3]">
        <div className="max-w-xl mx-auto">
          <h2 className="text-[22px] font-extrabold text-[#1A1A1A] text-center mb-4">{t.faq.heading}</h2>
          <div className="space-y-2.5">
            {[...t.faq.items, { q: t.faq.areasQuestion, a: faqAreasAnswer }].map((item, index) => {
              const isOpen = openFaq === index
              return (
                <div key={item.q} className="bg-white border border-[#EBEBEB] rounded-xl p-4">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex justify-between items-center text-left text-[14.5px] font-bold text-[#1A1A1A]"
                  >
                    <span>{item.q}</span>
                    <span
                      className={`text-[#C4785A] flex-none ml-2 transition-transform ${isOpen ? 'rotate-45' : ''}`}
                    >
                      +
                    </span>
                  </button>
                  {isOpen && <p className="text-[13.5px] text-[#6B6B6B] mt-2">{item.a}</p>}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-10 bg-[#C4785A] text-white text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl sm:text-[26px] font-extrabold text-white mb-2.5">{t.final.heading}</h2>
          <p className="text-[15px] opacity-95 mb-5">{t.final.sub}</p>
          <a
            href="#find"
            className="inline-block w-full max-w-xs bg-white text-[#1A1A1A] py-4 rounded-[14px] font-semibold active:scale-[0.985] transition-transform"
          >
            {t.final.cta}
          </a>
          <div className="mt-3 text-[12.5px] opacity-85">{t.final.sub2}</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1A1A1A] text-[#9b9b9b] px-6 py-7 text-center text-[12.5px]">
        <div className="flex justify-center gap-4 mb-3 text-[#cfcfcf]">
          <a href="#how" className="hover:text-white transition-colors">
            {t.footer.how}
          </a>
          <Link href="/join" className="hover:text-white transition-colors">
            {t.footer.forCleaners}
          </Link>
          <Link href="/about" className="hover:text-white transition-colors">
            {t.footer.about}
          </Link>
        </div>
        <p>{t.footer.tagline}</p>
        <p className="text-[#6b6b6b] mt-1">alicantecleaners.com</p>
      </footer>
    </div>
  )
}
