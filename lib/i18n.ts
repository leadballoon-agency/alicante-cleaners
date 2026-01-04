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
    'common.goHome': 'Go to homepage',

    // Profile page
    'profile.services': 'Services',
    'profile.book': 'Book',
    'profile.notFound': 'Cleaner not found',
    'profile.notFoundDesc': "This profile doesn't exist or has been removed.",
    'profile.verified': 'Verified',
    'profile.securePayment': 'Secure payment',
    'profile.photoProof': 'Photo proof',

    // How it works
    'howItWorks.title': 'How it works',
    'howItWorks.step1Title': 'Choose your cleaner',
    'howItWorks.step1Desc': 'Browse profiles, read reviews, and pick someone you trust',
    'howItWorks.step2Title': 'Book your clean',
    'howItWorks.step2Desc': 'Select a date and time that works for you. Pay securely online.',
    'howItWorks.step3Title': 'Relax with photo proof',
    'howItWorks.step3Desc': 'Get photos via WhatsApp showing your villa is spotless',

    // Why VillaCare
    'why.title': 'Why villa owners choose VillaCare',
    'why.vettedTitle': 'Vetted cleaners',
    'why.vettedDesc': 'Every cleaner is referred and verified by our team',
    'why.photoTitle': 'Photo proof',
    'why.photoDesc': 'See your villa is ready before you arrive',
    'why.whatsappTitle': 'WhatsApp updates',
    'why.whatsappDesc': 'Real-time notifications, no app to download',
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
    'common.goHome': 'Ir a inicio',

    'profile.services': 'Servicios',
    'profile.book': 'Reservar',
    'profile.notFound': 'Limpiador no encontrado',
    'profile.notFoundDesc': 'Este perfil no existe o ha sido eliminado.',
    'profile.verified': 'Verificado',
    'profile.securePayment': 'Pago seguro',
    'profile.photoProof': 'Fotos de prueba',

    'howItWorks.title': 'Cómo funciona',
    'howItWorks.step1Title': 'Elige tu limpiador',
    'howItWorks.step1Desc': 'Navega perfiles, lee reseñas y elige alguien de confianza',
    'howItWorks.step2Title': 'Reserva tu limpieza',
    'howItWorks.step2Desc': 'Selecciona fecha y hora que te convengan. Paga de forma segura.',
    'howItWorks.step3Title': 'Relájate con fotos',
    'howItWorks.step3Desc': 'Recibe fotos por WhatsApp mostrando tu villa impecable',

    'why.title': 'Por qué los propietarios eligen VillaCare',
    'why.vettedTitle': 'Limpiadores verificados',
    'why.vettedDesc': 'Cada limpiador es referido y verificado por nuestro equipo',
    'why.photoTitle': 'Fotos de prueba',
    'why.photoDesc': 'Comprueba que tu villa está lista antes de llegar',
    'why.whatsappTitle': 'Avisos por WhatsApp',
    'why.whatsappDesc': 'Notificaciones en tiempo real, sin descargar apps',
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
    'common.goHome': 'Zur Startseite',

    'profile.services': 'Dienstleistungen',
    'profile.book': 'Buchen',
    'profile.notFound': 'Reiniger nicht gefunden',
    'profile.notFoundDesc': 'Dieses Profil existiert nicht oder wurde entfernt.',
    'profile.verified': 'Verifiziert',
    'profile.securePayment': 'Sichere Zahlung',
    'profile.photoProof': 'Fotonachweis',

    'howItWorks.title': 'So funktioniert es',
    'howItWorks.step1Title': 'Wählen Sie Ihren Reiniger',
    'howItWorks.step1Desc': 'Durchsuchen Sie Profile, lesen Sie Bewertungen und wählen Sie jemanden, dem Sie vertrauen',
    'howItWorks.step2Title': 'Buchen Sie Ihre Reinigung',
    'howItWorks.step2Desc': 'Wählen Sie ein passendes Datum und Uhrzeit. Bezahlen Sie sicher online.',
    'howItWorks.step3Title': 'Entspannen Sie mit Fotonachweis',
    'howItWorks.step3Desc': 'Erhalten Sie Fotos per WhatsApp, die Ihre makellose Villa zeigen',

    'why.title': 'Warum Villenbesitzer VillaCare wählen',
    'why.vettedTitle': 'Geprüfte Reiniger',
    'why.vettedDesc': 'Jeder Reiniger wird von unserem Team empfohlen und verifiziert',
    'why.photoTitle': 'Fotonachweis',
    'why.photoDesc': 'Sehen Sie, dass Ihre Villa bereit ist, bevor Sie ankommen',
    'why.whatsappTitle': 'WhatsApp-Updates',
    'why.whatsappDesc': 'Echtzeit-Benachrichtigungen, keine App erforderlich',
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
    'common.goHome': "Retour à l'accueil",

    'profile.services': 'Services',
    'profile.book': 'Réserver',
    'profile.notFound': 'Nettoyeur non trouvé',
    'profile.notFoundDesc': "Ce profil n'existe pas ou a été supprimé.",
    'profile.verified': 'Vérifié',
    'profile.securePayment': 'Paiement sécurisé',
    'profile.photoProof': 'Preuves photo',

    'howItWorks.title': 'Comment ça marche',
    'howItWorks.step1Title': 'Choisissez votre nettoyeur',
    'howItWorks.step1Desc': 'Parcourez les profils, lisez les avis et choisissez quelqu\'un de confiance',
    'howItWorks.step2Title': 'Réservez votre nettoyage',
    'howItWorks.step2Desc': 'Sélectionnez une date et heure qui vous conviennent. Payez en toute sécurité.',
    'howItWorks.step3Title': 'Détendez-vous avec preuves photo',
    'howItWorks.step3Desc': 'Recevez des photos via WhatsApp montrant votre villa impeccable',

    'why.title': 'Pourquoi les propriétaires choisissent VillaCare',
    'why.vettedTitle': 'Nettoyeurs vérifiés',
    'why.vettedDesc': 'Chaque nettoyeur est recommandé et vérifié par notre équipe',
    'why.photoTitle': 'Preuves photo',
    'why.photoDesc': 'Voyez que votre villa est prête avant votre arrivée',
    'why.whatsappTitle': 'Mises à jour WhatsApp',
    'why.whatsappDesc': 'Notifications en temps réel, aucune application à télécharger',
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
    'common.goHome': 'Naar startpagina',

    'profile.services': 'Diensten',
    'profile.book': 'Boeken',
    'profile.notFound': 'Schoonmaker niet gevonden',
    'profile.notFoundDesc': 'Dit profiel bestaat niet of is verwijderd.',
    'profile.verified': 'Geverifieerd',
    'profile.securePayment': 'Veilig betalen',
    'profile.photoProof': 'Fotobewijs',

    'howItWorks.title': 'Hoe het werkt',
    'howItWorks.step1Title': 'Kies uw schoonmaker',
    'howItWorks.step1Desc': 'Bekijk profielen, lees beoordelingen en kies iemand die u vertrouwt',
    'howItWorks.step2Title': 'Boek uw schoonmaak',
    'howItWorks.step2Desc': 'Selecteer een datum en tijd die u past. Betaal veilig online.',
    'howItWorks.step3Title': 'Ontspan met fotobewijs',
    'howItWorks.step3Desc': 'Ontvang foto\'s via WhatsApp die uw smetteloze villa tonen',

    'why.title': 'Waarom villa-eigenaren kiezen voor VillaCare',
    'why.vettedTitle': 'Geverifieerde schoonmakers',
    'why.vettedDesc': 'Elke schoonmaker wordt aanbevolen en geverifieerd door ons team',
    'why.photoTitle': 'Fotobewijs',
    'why.photoDesc': 'Zie dat uw villa klaar is voordat u aankomt',
    'why.whatsappTitle': 'WhatsApp-updates',
    'why.whatsappDesc': 'Realtime meldingen, geen app te downloaden',
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
    'common.goHome': 'Vai alla home',

    'profile.services': 'Servizi',
    'profile.book': 'Prenota',
    'profile.notFound': 'Addetto non trovato',
    'profile.notFoundDesc': 'Questo profilo non esiste o è stato rimosso.',
    'profile.verified': 'Verificato',
    'profile.securePayment': 'Pagamento sicuro',
    'profile.photoProof': 'Prova fotografica',

    'howItWorks.title': 'Come funziona',
    'howItWorks.step1Title': 'Scegli il tuo addetto',
    'howItWorks.step1Desc': 'Sfoglia i profili, leggi le recensioni e scegli qualcuno di cui ti fidi',
    'howItWorks.step2Title': 'Prenota la pulizia',
    'howItWorks.step2Desc': 'Seleziona data e ora che ti convengono. Paga in modo sicuro online.',
    'howItWorks.step3Title': 'Rilassati con prove foto',
    'howItWorks.step3Desc': 'Ricevi foto via WhatsApp che mostrano la tua villa impeccabile',

    'why.title': 'Perché i proprietari scelgono VillaCare',
    'why.vettedTitle': 'Addetti verificati',
    'why.vettedDesc': 'Ogni addetto è raccomandato e verificato dal nostro team',
    'why.photoTitle': 'Prova fotografica',
    'why.photoDesc': 'Vedi che la tua villa è pronta prima del tuo arrivo',
    'why.whatsappTitle': 'Aggiornamenti WhatsApp',
    'why.whatsappDesc': 'Notifiche in tempo reale, nessuna app da scaricare',
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
    'common.goHome': 'Ir para início',

    'profile.services': 'Serviços',
    'profile.book': 'Reservar',
    'profile.notFound': 'Profissional não encontrado',
    'profile.notFoundDesc': 'Este perfil não existe ou foi removido.',
    'profile.verified': 'Verificado',
    'profile.securePayment': 'Pagamento seguro',
    'profile.photoProof': 'Prova fotográfica',

    'howItWorks.title': 'Como funciona',
    'howItWorks.step1Title': 'Escolha seu profissional',
    'howItWorks.step1Desc': 'Navegue pelos perfis, leia avaliações e escolha alguém de confiança',
    'howItWorks.step2Title': 'Reserve sua limpeza',
    'howItWorks.step2Desc': 'Selecione data e hora que funcionem para você. Pague com segurança.',
    'howItWorks.step3Title': 'Relaxe com prova fotográfica',
    'howItWorks.step3Desc': 'Receba fotos via WhatsApp mostrando sua villa impecável',

    'why.title': 'Por que proprietários escolhem VillaCare',
    'why.vettedTitle': 'Profissionais verificados',
    'why.vettedDesc': 'Cada profissional é recomendado e verificado pela nossa equipe',
    'why.photoTitle': 'Prova fotográfica',
    'why.photoDesc': 'Veja que sua villa está pronta antes de chegar',
    'why.whatsappTitle': 'Atualizações WhatsApp',
    'why.whatsappDesc': 'Notificações em tempo real, sem app para baixar',
  },
}

export function t(key: string, lang: Language): string {
  return translations[lang][key] || translations.en[key] || key
}
