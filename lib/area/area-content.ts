import type { AreaLocale } from './areas'

/**
 * Hand-written per-area, per-locale intro copy for the area landing pages.
 * Deliberately NOT a template with the area name swapped in — each of the
 * 14 entries below carries real local texture (coastal vs. inland, who
 * lives there, why owners pick it) so the pages read as useful content
 * rather than thin doorway pages. If you add an area to lib/area/areas.ts
 * you must add a matching entry here for both locales.
 */
export const AREA_INTROS: Record<string, Record<AreaLocale, string>> = {
  alicante: {
    es: 'Alicante capital es mucho más que la Explanada y el casco antiguo: en urbanizaciones como Vistahermosa, Cabo de las Huertas o el Monte Tossal encontrarás villas con piscina a un paseo del aeropuerto y del centro. Muchos propietarios viven aquí la mayor parte del año y solo necesitan una mano de confianza para el día a día.',
    en: "Alicante City is more than the Explanada promenade — in neighbourhoods like Vistahermosa, Cabo de las Huertas and Monte Tossal you'll find villas with private pools minutes from both the airport and the old town. Many owners here live in Spain most of the year and just need a reliable pair of hands for weekly upkeep.",
  },
  'san-juan': {
    es: 'San Juan es probablemente la zona con más propietarios extranjeros de toda la costa: su playa de bandera azul y el paseo arbolado han hecho que muchos británicos, alemanes y holandeses se queden a vivir en villas cerca de la playa. Aquí la demanda de limpiadoras que hablen inglés es constante.',
    en: 'San Juan probably has the highest concentration of foreign villa owners on this stretch of coast: its blue-flag beach and palm-lined promenade have persuaded plenty of British, German and Dutch owners to settle into villas just back from the sand. English-speaking cleaners are in steady demand here.',
  },
  'playa-san-juan': {
    es: 'Playa de San Juan mezcla torres de apartamentos vacacionales con villas de una planta a pocas calles del mar. Muchas se alquilan como vivienda turística parte del año, así que las limpiezas suelen encajarse entre check-outs y check-ins con poco margen.',
    en: "Playa de San Juan mixes holiday-apartment towers with single-storey villas a few streets back from the sand. Plenty of these properties do double duty as short-term rentals for part of the year, so cleans here often need to slot in tightly between one guest's check-out and the next one's check-in.",
  },
  'el-campello': {
    es: 'El Campello sigue teniendo alma de pueblo pesquero, con su lonja y su puerto deportivo, pero también villas frente al mar en Muchavista y El Charco. El tranvía lo conecta con Alicante en minutos, lo que lo hace atractivo para propietarios que van y vienen.',
    en: "El Campello still feels like the fishing village it started out as — fish auction, marina and all — but it's also home to beachfront villas around Muchavista and El Charco. The tram line into Alicante makes it an easy hop, which is part of why it draws owners who split their time between here and somewhere else.",
  },
  mutxamel: {
    es: 'Mutxamel es tierra de huerta: parcelas grandes, chalets con jardines amplios — incluida la urbanización Bonalba Golf, muy popular entre propietarios extranjeros — y menos presión turística que en la costa. Muchos propietarios lo eligen precisamente por eso, para tener espacio de verdad, aunque eso también significa más metros que mantener limpios.',
    en: "Mutxamel is market-garden country — big plots, villas with proper-sized gardens, including the Bonalba Golf resort community that's a favourite with international owners, and none of the holiday-let churn you get on the coast. Owners tend to choose it for the extra space, which is great for living but means more square metres for a cleaner to cover on each visit.",
  },
  'san-vicente': {
    es: 'San Vicente del Raspeig crece rápido gracias a la Universidad de Alicante, con urbanizaciones nuevas junto a fincas más antiguas. Tiene vida todo el año, no solo en verano, así que las limpiezas suelen reservarse con una cadencia más regular.',
    en: 'San Vicente del Raspeig has grown fast thanks to the University of Alicante campus, with new-build urbanisations sitting alongside older country properties. It has year-round life rather than a summer-only rhythm, so cleaning bookings here tend to be steadier across the calendar.',
  },
  jijona: {
    es: 'Jijona queda en las estribaciones de la sierra, lejos del bullicio costero y conocida sobre todo por su turrón. Las villas aquí suelen ser propiedades más tranquilas y permanentes, no alquileres vacacionales, así que el trato con la limpiadora se basa en la confianza a largo plazo, no en la rotación.',
    en: "Jijona sits up in the foothills, well away from the coastal bustle and best known for its turrón (nougat) tradition. Villas here tend to be quieter, longer-term homes rather than holiday rentals, so the relationship with a cleaner is usually built on long-term trust rather than turnover.",
  },
}

export const STANDARD_SERVICES = [
  { type: 'regular', hours: 3, es: 'Limpieza Regular', en: 'Regular Clean' },
  { type: 'deep', hours: 5, es: 'Limpieza a Fondo', en: 'Deep Clean' },
  { type: 'arrival', hours: 4, es: 'Preparación de Llegada', en: 'Arrival Prep' },
] as const

export interface AreaFaq {
  question: string
  answer: string
}

/**
 * Shared FAQ template (written once per locale) with the area name and a
 * live-computed price range interpolated in. The pricing answer honestly
 * says so when an area has no active cleaners yet, rather than fabricating
 * a number.
 */
export function getAreaFaqs(locale: AreaLocale, name: string, priceRangeText: string | null): AreaFaq[] {
  if (locale === 'es') {
    return [
      {
        question: `¿Cuánto cuesta la limpieza de una villa en ${name}?`,
        answer: priceRangeText
          ? `Una limpieza regular en ${name} suele costar entre ${priceRangeText}, según la limpiadora y el tamaño de la villa.`
          : `Todavía no tenemos limpiadoras activas en ${name} — contáctanos y te ayudamos a encontrar a alguien en la zona.`,
      },
      {
        question: `¿Cómo reservo una limpiadora en ${name}?`,
        answer: 'Elige un perfil, revisa sus reseñas y reserva directamente desde su página — sin llamadas ni formularios eternos. Recibirás confirmación por WhatsApp.',
      },
      {
        question: '¿Están verificadas las limpiadoras?',
        answer: 'Sí. Verificamos a cada limpiadora antes de activarla en la plataforma, y puedes leer reseñas reales de otros propietarios antes de reservar.',
      },
      {
        question: `¿Hablan inglés las limpiadoras en ${name}?`,
        answer: 'Muchas sí, y el chat de cada perfil traduce automáticamente a 7 idiomas, así que puedes escribir en el tuyo aunque tu limpiadora no lo hable.',
      },
      {
        question: '¿Puedo reservar si no vivo en España?',
        answer: 'Sí — la mayoría de nuestros propietarios pasan gran parte del año fuera. Todo se gestiona en remoto, incluida la preparación antes de que aterrices.',
      },
    ]
  }

  return [
    {
      question: `How much does villa cleaning cost in ${name}?`,
      answer: priceRangeText
        ? `A regular clean in ${name} typically runs ${priceRangeText}, depending on the cleaner and the size of your villa.`
        : `We don't have active cleaners in ${name} yet — get in touch and we'll help you find someone in the area.`,
    },
    {
      question: `How do I book a cleaner in ${name}?`,
      answer: "Pick a profile, check their reviews, and book directly from their page — no calls, no long forms. You'll get a WhatsApp confirmation.",
    },
    {
      question: 'Are the cleaners vetted?',
      answer: 'Yes. Every cleaner is verified before they go live on the platform, and you can read genuine reviews from other owners before you book.',
    },
    {
      question: `Do cleaners in ${name} speak English?`,
      answer: "Many do, and every profile's chat auto-translates into 7 languages, so you can write in your own language even if your cleaner doesn't speak it.",
    },
    {
      question: "Can I book if I'm not in Spain?",
      answer: 'Yes — most of our owners spend much of the year away. Everything is arranged remotely, including arrival prep before you land.',
    },
  ]
}
