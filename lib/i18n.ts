export type Language = 'en' | 'es' | 'de' | 'fr' | 'nl' | 'it' | 'pt'

export const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
]

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'nav.ourStory': 'Our story',
    'nav.joinAsCleaner': 'Join as cleaner',
    'nav.bookClean': 'Book a clean',
    'nav.login': 'Log in',

    // Hero
    'hero.title': 'Trusted villa cleaning',
    'hero.titleLine2': 'in Alicante',
    'hero.subtitle': 'Book vetted, reliable cleaners for your holiday home. Photo proof included.',

    // Filters
    'filter.all': 'All areas',

    // Cleaner cards
    'cleaner.reviews': 'reviews',
    'cleaner.from': 'From',
    'cleaner.viewProfile': 'View profile',
    'cleaner.featured': 'Featured',

    // CTA
    'cta.cleanerTitle': 'Are you a cleaner in Alicante?',
    'cta.cleanerSubtitle': 'Join our network of trusted professionals and grow your business',
    'cta.applyJoin': 'Apply to join',

    // Footer
    'footer.location': 'Alicante, Spain',

    // Booking
    'booking.chooseDate': 'Choose a date',
    'booking.chooseTime': 'Choose a time',
    'booking.continue': 'Continue',
    'booking.yourAppointment': 'Your appointment',
    'booking.popular': 'Popular',
    'booking.localTime': 'All times are in local Spain time (CET)',

    // Services
    'service.regular': 'Regular Clean',
    'service.deep': 'Deep Clean',
    'service.arrival': 'Arrival Prep',
    'service.hours': 'hours',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.tryAgain': 'Try again',
  },

  es: {
    'nav.ourStory': 'Nuestra historia',
    'nav.joinAsCleaner': 'Únete como limpiador',
    'nav.bookClean': 'Reservar limpieza',
    'nav.login': 'Iniciar sesión',

    'hero.title': 'Limpieza de villas de confianza',
    'hero.titleLine2': 'en Alicante',
    'hero.subtitle': 'Reserva limpiadores verificados y fiables para tu casa de vacaciones. Fotos incluidas.',

    'filter.all': 'Todas las zonas',

    'cleaner.reviews': 'reseñas',
    'cleaner.from': 'Desde',
    'cleaner.viewProfile': 'Ver perfil',
    'cleaner.featured': 'Destacado',

    'cta.cleanerTitle': '¿Eres limpiador en Alicante?',
    'cta.cleanerSubtitle': 'Únete a nuestra red de profesionales de confianza y haz crecer tu negocio',
    'cta.applyJoin': 'Solicitar unirse',

    'footer.location': 'Alicante, España',

    'booking.chooseDate': 'Elige una fecha',
    'booking.chooseTime': 'Elige una hora',
    'booking.continue': 'Continuar',
    'booking.yourAppointment': 'Tu cita',
    'booking.popular': 'Popular',
    'booking.localTime': 'Todas las horas son en horario local de España (CET)',

    'service.regular': 'Limpieza Regular',
    'service.deep': 'Limpieza Profunda',
    'service.arrival': 'Preparación Llegada',
    'service.hours': 'horas',

    'common.loading': 'Cargando...',
    'common.error': 'Algo salió mal',
    'common.tryAgain': 'Intentar de nuevo',
  },

  de: {
    'nav.ourStory': 'Unsere Geschichte',
    'nav.joinAsCleaner': 'Als Reiniger beitreten',
    'nav.bookClean': 'Reinigung buchen',
    'nav.login': 'Anmelden',

    'hero.title': 'Vertrauenswürdige Villa-Reinigung',
    'hero.titleLine2': 'in Alicante',
    'hero.subtitle': 'Buchen Sie geprüfte, zuverlässige Reiniger für Ihr Ferienhaus. Fotonachweis inklusive.',

    'filter.all': 'Alle Gebiete',

    'cleaner.reviews': 'Bewertungen',
    'cleaner.from': 'Ab',
    'cleaner.viewProfile': 'Profil ansehen',
    'cleaner.featured': 'Empfohlen',

    'cta.cleanerTitle': 'Sind Sie Reiniger in Alicante?',
    'cta.cleanerSubtitle': 'Treten Sie unserem Netzwerk vertrauenswürdiger Profis bei und erweitern Sie Ihr Geschäft',
    'cta.applyJoin': 'Jetzt bewerben',

    'footer.location': 'Alicante, Spanien',

    'booking.chooseDate': 'Datum wählen',
    'booking.chooseTime': 'Uhrzeit wählen',
    'booking.continue': 'Weiter',
    'booking.yourAppointment': 'Ihr Termin',
    'booking.popular': 'Beliebt',
    'booking.localTime': 'Alle Zeiten in spanischer Ortszeit (CET)',

    'service.regular': 'Standardreinigung',
    'service.deep': 'Grundreinigung',
    'service.arrival': 'Ankunftsvorbereitung',
    'service.hours': 'Stunden',

    'common.loading': 'Laden...',
    'common.error': 'Etwas ist schief gelaufen',
    'common.tryAgain': 'Erneut versuchen',
  },

  fr: {
    'nav.ourStory': 'Notre histoire',
    'nav.joinAsCleaner': 'Rejoindre comme nettoyeur',
    'nav.bookClean': 'Réserver un nettoyage',
    'nav.login': 'Connexion',

    'hero.title': 'Nettoyage de villa de confiance',
    'hero.titleLine2': 'à Alicante',
    'hero.subtitle': 'Réservez des nettoyeurs vérifiés et fiables pour votre maison de vacances. Preuves photo incluses.',

    'filter.all': 'Toutes les zones',

    'cleaner.reviews': 'avis',
    'cleaner.from': 'À partir de',
    'cleaner.viewProfile': 'Voir le profil',
    'cleaner.featured': 'En vedette',

    'cta.cleanerTitle': 'Êtes-vous nettoyeur à Alicante?',
    'cta.cleanerSubtitle': 'Rejoignez notre réseau de professionnels de confiance et développez votre activité',
    'cta.applyJoin': 'Postuler',

    'footer.location': 'Alicante, Espagne',

    'booking.chooseDate': 'Choisir une date',
    'booking.chooseTime': 'Choisir une heure',
    'booking.continue': 'Continuer',
    'booking.yourAppointment': 'Votre rendez-vous',
    'booking.popular': 'Populaire',
    'booking.localTime': 'Toutes les heures sont en heure locale espagnole (CET)',

    'service.regular': 'Nettoyage Standard',
    'service.deep': 'Nettoyage en Profondeur',
    'service.arrival': 'Préparation Arrivée',
    'service.hours': 'heures',

    'common.loading': 'Chargement...',
    'common.error': 'Une erreur est survenue',
    'common.tryAgain': 'Réessayer',
  },

  nl: {
    'nav.ourStory': 'Ons verhaal',
    'nav.joinAsCleaner': 'Word schoonmaker',
    'nav.bookClean': 'Boek een schoonmaak',
    'nav.login': 'Inloggen',

    'hero.title': 'Betrouwbare villa schoonmaak',
    'hero.titleLine2': 'in Alicante',
    'hero.subtitle': 'Boek geverifieerde, betrouwbare schoonmakers voor uw vakantiehuis. Fotobewijs inbegrepen.',

    'filter.all': 'Alle gebieden',

    'cleaner.reviews': 'beoordelingen',
    'cleaner.from': 'Vanaf',
    'cleaner.viewProfile': 'Bekijk profiel',
    'cleaner.featured': 'Uitgelicht',

    'cta.cleanerTitle': 'Bent u schoonmaker in Alicante?',
    'cta.cleanerSubtitle': 'Word lid van ons netwerk van betrouwbare professionals en laat uw bedrijf groeien',
    'cta.applyJoin': 'Nu aanmelden',

    'footer.location': 'Alicante, Spanje',

    'booking.chooseDate': 'Kies een datum',
    'booking.chooseTime': 'Kies een tijd',
    'booking.continue': 'Doorgaan',
    'booking.yourAppointment': 'Uw afspraak',
    'booking.popular': 'Populair',
    'booking.localTime': 'Alle tijden zijn in lokale Spaanse tijd (CET)',

    'service.regular': 'Standaard Schoonmaak',
    'service.deep': 'Dieptereiniging',
    'service.arrival': 'Aankomst Voorbereiding',
    'service.hours': 'uur',

    'common.loading': 'Laden...',
    'common.error': 'Er is iets misgegaan',
    'common.tryAgain': 'Opnieuw proberen',
  },

  it: {
    'nav.ourStory': 'La nostra storia',
    'nav.joinAsCleaner': 'Unisciti come pulitore',
    'nav.bookClean': 'Prenota pulizia',
    'nav.login': 'Accedi',

    'hero.title': 'Pulizia ville di fiducia',
    'hero.titleLine2': 'ad Alicante',
    'hero.subtitle': 'Prenota addetti alle pulizie verificati e affidabili per la tua casa vacanze. Prove fotografiche incluse.',

    'filter.all': 'Tutte le zone',

    'cleaner.reviews': 'recensioni',
    'cleaner.from': 'Da',
    'cleaner.viewProfile': 'Vedi profilo',
    'cleaner.featured': 'In evidenza',

    'cta.cleanerTitle': 'Sei un addetto alle pulizie ad Alicante?',
    'cta.cleanerSubtitle': 'Unisciti alla nostra rete di professionisti di fiducia e fai crescere la tua attività',
    'cta.applyJoin': 'Candidati',

    'footer.location': 'Alicante, Spagna',

    'booking.chooseDate': 'Scegli una data',
    'booking.chooseTime': 'Scegli un orario',
    'booking.continue': 'Continua',
    'booking.yourAppointment': 'Il tuo appuntamento',
    'booking.popular': 'Popolare',
    'booking.localTime': 'Tutti gli orari sono in ora locale spagnola (CET)',

    'service.regular': 'Pulizia Standard',
    'service.deep': 'Pulizia Profonda',
    'service.arrival': 'Preparazione Arrivo',
    'service.hours': 'ore',

    'common.loading': 'Caricamento...',
    'common.error': 'Qualcosa è andato storto',
    'common.tryAgain': 'Riprova',
  },

  pt: {
    'nav.ourStory': 'Nossa história',
    'nav.joinAsCleaner': 'Junte-se como limpador',
    'nav.bookClean': 'Reservar limpeza',
    'nav.login': 'Entrar',

    'hero.title': 'Limpeza de vilas de confiança',
    'hero.titleLine2': 'em Alicante',
    'hero.subtitle': 'Reserve profissionais de limpeza verificados e confiáveis para sua casa de férias. Prova fotográfica incluída.',

    'filter.all': 'Todas as áreas',

    'cleaner.reviews': 'avaliações',
    'cleaner.from': 'A partir de',
    'cleaner.viewProfile': 'Ver perfil',
    'cleaner.featured': 'Destaque',

    'cta.cleanerTitle': 'Você é um profissional de limpeza em Alicante?',
    'cta.cleanerSubtitle': 'Junte-se à nossa rede de profissionais de confiança e expanda seu negócio',
    'cta.applyJoin': 'Candidatar-se',

    'footer.location': 'Alicante, Espanha',

    'booking.chooseDate': 'Escolha uma data',
    'booking.chooseTime': 'Escolha um horário',
    'booking.continue': 'Continuar',
    'booking.yourAppointment': 'Seu agendamento',
    'booking.popular': 'Popular',
    'booking.localTime': 'Todos os horários estão no fuso horário local da Espanha (CET)',

    'service.regular': 'Limpeza Regular',
    'service.deep': 'Limpeza Profunda',
    'service.arrival': 'Preparação Chegada',
    'service.hours': 'horas',

    'common.loading': 'Carregando...',
    'common.error': 'Algo deu errado',
    'common.tryAgain': 'Tentar novamente',
  },
}

export function t(key: string, lang: Language): string {
  return translations[lang][key] || translations.en[key] || key
}
