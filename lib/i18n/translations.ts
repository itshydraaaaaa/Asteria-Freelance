/**
 * lib/i18n/translations.ts — Multi-Language Support for Tunisian Startup Ecosystem
 *
 * Languages:
 * - English (en): Default international language
 * - Français (fr): Widely spoken in Tunisian business & administration
 * - العربية / تونس (ar): Official language & Tunisian Derja localization
 */

export type SupportedLanguage = 'English' | 'Arabic' | 'French'

export interface TranslationDictionary {
  // Public Navigation
  navHome: string
  navExplore: string
  navFreelancers: string
  navJobs: string
  navHowItWorks: string
  navAbout: string
  navSignIn: string
  navJoinFree: string
  navGetStarted: string
  navDashboard: string
  navPostJob: string

  // Hero Section
  heroBadge: string
  heroHeading1: string
  heroHeading2: string
  heroHeading3: string
  heroSubtitle: string
  heroSearchPlaceholder: string
  heroSearchBtn: string
  heroTrending: string
  heroExploreServices: string
  heroPostProject: string

  // Features
  featEscrowTitle: string
  featEscrowDesc: string
  featKycTitle: string
  featKycDesc: string
  featLocalTitle: string
  featLocalDesc: string
  featTunisiaTitle: string
  featTunisiaDesc: string

  // How It Works Section
  hiwProcess: string
  hiwTitle: string
  hiwSubtitle: string
  step1Title: string
  step1Body: string
  step1Badge: string
  step2Title: string
  step2Body: string
  step2Badge: string
  step3Title: string
  step3Body: string
  step3Badge: string
  stepLabel: string

  // Featured Gigs Section
  featuredServices: string
  featuredTitle: string
  filterAll: string
  startingAt: string
  deliveryDays: string

  // Categories Section
  catBrowseBy: string
  catPopular: string
  catLiveServices: string
  catExploreCat: string

  // Category Names
  catWebDev: string
  catDesign: string
  catDataScience: string
  catMarketing: string
  catMobile: string
  catWriting: string
  catVideoAudio: string
  catBusiness: string

  // Marketplace / Explore Page
  exploreHeaderTag: string
  exploreHeaderTitle: string
  exploreHeaderSubtitle: string
  searchServicesPlaceholder: string
  filterCategories: string
  filterAllCategories: string
  sortBy: string
  sortRelevance: string
  sortPriceLow: string
  sortPriceHigh: string
  sortFastest: string
  noServicesFound: string
  clearFilters: string

  // Freelancers Page
  freelancersHeaderTag: string
  freelancersHeaderTitle: string
  freelancersHeaderSubtitle: string
  searchFreelancersPlaceholder: string

  // Jobs Board Page
  jobsHeaderTag: string
  jobsHeaderTitle: string
  jobsHeaderSubtitle: string
  postJobButton: string

  // Authentication (Login & Register)
  authWelcomeBack: string
  authSignInSubtitle: string
  authEmail: string
  authPassword: string
  authNoAccount: string
  authCreateAccount: string
  authCreateAccountTitle: string
  authCreateAccountSubtitle: string
  authFullName: string
  authRoleClient: string
  authRoleFreelancer: string
  authAgreeTerms: string
  authAlreadyAccount: string

  // Footer
  footerDesc: string
  footerPlatform: string
  footerCompany: string
  footerSupport: string
  footerHelpCenter: string
  footerTerms: string
  footerPrivacy: string
  footerContact: string
  footerRights: string

  // Dashboard Navigation & General
  navOverview: string
  navVerification: string
  navOrders: string
  navMessages: string
  navProfile: string
  navSettings: string
  navBrowseJobs: string
  navMyGigs: string
  navWallet: string
  navAnalytics: string
  navMyJobs: string
  navExploreGigs: string
  navLogout: string
  navAdmin: string

  // Settings Page
  settingsTitle: string
  settingsSubtitle: string
  
  // Section 1: Notifications
  secNotifications: string
  notifNewOrdersTitle: string
  notifNewOrdersDesc: string
  notifMessagesTitle: string
  notifMessagesDesc: string
  notifMarketingTitle: string
  notifMarketingDesc: string
  notifDigestTitle: string
  notifDigestDesc: string
  btnSaveNotifications: string

  // Section 2: Privacy
  secPrivacy: string
  privPublicProfileTitle: string
  privPublicProfileDesc: string
  privShowEarningsTitle: string
  privShowEarningsDesc: string
  btnSavePrivacy: string

  // Section 3: Localization
  secLocalization: string
  langTitle: string
  langDesc: string
  currTitle: string
  currDesc: string
  timezoneTitle: string
  timezoneDesc: string
  btnSavePreferences: string

  // Section 4: Security & Actions
  secAccount: string
  btnSignOut: string
  dangerZone: string
  deleteAccountTitle: string
  deleteAccountDesc: string
  btnDeleteAccount: string

  // Feedback messages
  savedSuccess: string
  saveError: string
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  English: {
    // Public Navigation
    navHome: 'Home',
    navExplore: 'Explore',
    navFreelancers: 'Freelancers',
    navJobs: 'Jobs',
    navHowItWorks: 'How It Works',
    navAbout: 'About',
    navSignIn: 'Sign In',
    navJoinFree: 'Join Free',
    navGetStarted: 'Get Started',
    navDashboard: 'Dashboard',
    navPostJob: 'Post a Job',

    // Hero Section
    heroBadge: '✨ Asteria — Escrow-Protected Freelance Marketplace, Made in Tunisia',
    heroHeading1: 'TALENT',
    heroHeading2: 'ESCROW',
    heroHeading3: 'DELIVERY',
    heroSubtitle: 'Hire vetted Tunisian developers, designers, and specialists — with escrow-protected payments on every project.',
    heroSearchPlaceholder: "Search 'Next.js App', 'Figma Design', 'AI Bot'...",
    heroSearchBtn: 'Search',
    heroTrending: 'Trending:',
    heroExploreServices: 'Explore Microjobs',
    heroPostProject: 'Post Job (Client)',

    // Features
    featEscrowTitle: 'Escrow-Protected',
    featEscrowDesc: 'Funds held securely until work is approved',
    featKycTitle: 'KYC-Verified Talent',
    featKycDesc: 'Every freelancer identity-checked before they can bid',
    featLocalTitle: 'Local & Fast',
    featLocalDesc: 'TND payments, built for how Tunisian freelancers and clients actually work',
    featTunisiaTitle: 'Tunisia First',
    featTunisiaDesc: 'Starting local, expanding across MENA',

    // How It Works Section
    hiwProcess: 'Process',
    hiwTitle: 'How It Works',
    hiwSubtitle: 'Three simple steps to get world-class work done.',
    step1Title: 'Post Your Project',
    step1Body: 'Describe what you need, set your budget, and get matched with skilled freelancers fast.',
    step1Badge: 'Post in minutes',
    step2Title: 'Match with Talent',
    step2Body: 'Our matching system surfaces the best-fit freelancers based on skills, ratings, and availability.',
    step2Badge: 'Smart matching',
    step3Title: 'Deliver & Get Paid',
    step3Body: 'Work is delivered, reviewed, and payment released automatically from escrow. Safe, fast, and guaranteed.',
    step3Badge: 'Escrow protected',
    stepLabel: 'STEP',

    // Featured Gigs Section
    featuredServices: 'Services',
    featuredTitle: 'Featured Gigs',
    filterAll: 'All',
    startingAt: 'Starting at',
    deliveryDays: 'days delivery',

    // Categories Section
    catBrowseBy: 'Browse by',
    catPopular: 'Popular Categories',
    catLiveServices: 'live services',
    catExploreCat: 'Explore category',

    // Category Names
    catWebDev: 'Web Development',
    catDesign: 'Design',
    catDataScience: 'Data Science',
    catMarketing: 'Marketing',
    catMobile: 'Mobile',
    catWriting: 'Writing',
    catVideoAudio: 'Video & Audio',
    catBusiness: 'Business',

    // Marketplace / Explore Page
    exploreHeaderTag: 'Marketplace',
    exploreHeaderTitle: 'Explore Services',
    exploreHeaderSubtitle: 'Browse verified microjobs and services from elite Tunisian and MENA freelancers.',
    searchServicesPlaceholder: 'Search services, skills, or tags…',
    filterCategories: 'Categories',
    filterAllCategories: 'All Categories',
    sortBy: 'Sort By',
    sortRelevance: 'Relevance',
    sortPriceLow: 'Price: Low to High',
    sortPriceHigh: 'Price: High to Low',
    sortFastest: 'Fastest Delivery',
    noServicesFound: 'No services match your search.',
    clearFilters: 'Clear Filters',

    // Freelancers Page
    freelancersHeaderTag: 'Talent Directory',
    freelancersHeaderTitle: 'Elite Freelancers',
    freelancersHeaderSubtitle: 'Identity-verified Tunisian developers, designers, and specialists ready to work.',
    searchFreelancersPlaceholder: 'Search by name, skill, or governorate…',

    // Jobs Board Page
    jobsHeaderTag: 'Job Board',
    jobsHeaderTitle: 'Open Projects',
    jobsHeaderSubtitle: 'Active contracts seeking talent with 100% guaranteed escrow funding.',
    postJobButton: '+ Post a Job',

    // Authentication (Login & Register)
    authWelcomeBack: 'Welcome Back',
    authSignInSubtitle: 'Sign in to your Asteria account to continue',
    authEmail: 'Email Address',
    authPassword: 'Password',
    authNoAccount: "Don't have an account?",
    authCreateAccount: 'Create one now',
    authCreateAccountTitle: 'Join Asteria',
    authCreateAccountSubtitle: 'Create your client or freelancer account in 30 seconds',
    authFullName: 'Full Name',
    authRoleClient: 'I want to hire (Client)',
    authRoleFreelancer: 'I want to work (Freelancer)',
    authAgreeTerms: 'By signing up, you agree to our Terms of Service & Privacy Policy.',
    authAlreadyAccount: 'Already have an account?',

    // Footer
    footerDesc: 'The freelance marketplace connecting Tunisian talent with ambitious clients — expanding across the MENA region.',
    footerPlatform: 'Platform',
    footerCompany: 'Company',
    footerSupport: 'Support',
    footerHelpCenter: 'Help Center',
    footerTerms: 'Terms of Service',
    footerPrivacy: 'Privacy Policy',
    footerContact: 'Contact',
    footerRights: 'All rights reserved.',

    // Dashboard Navigation
    navOverview: 'Overview',
    navVerification: 'Verification (KYC)',
    navOrders: 'Orders',
    navMessages: 'Messages',
    navProfile: 'Profile',
    navSettings: 'Settings',
    navBrowseJobs: 'Browse Jobs',
    navMyGigs: 'My Services',
    navWallet: 'Wallet & Payouts',
    navAnalytics: 'Analytics',
    navMyJobs: 'My Posted Jobs',
    navExploreGigs: 'Explore Services',
    navLogout: 'Sign Out',
    navAdmin: 'Admin Governance',

    // Settings Page
    settingsTitle: 'Platform Settings',
    settingsSubtitle: 'Configure your notification preferences, privacy visibility, and regional language & currency.',
    
    secNotifications: 'Notification Alerts',
    notifNewOrdersTitle: 'New Orders',
    notifNewOrdersDesc: 'Receive alerts when a client purchases your service or funds escrow',
    notifMessagesTitle: 'Direct Messages',
    notifMessagesDesc: 'Real-time alerts for project communication and deliverable chats',
    notifMarketingTitle: 'Platform Updates',
    notifMarketingDesc: 'Weekly Tunisian freelancer tips, fee discounts, and feature releases',
    notifDigestTitle: 'Weekly Summary',
    notifDigestDesc: 'Summary of earnings, views, and completed orders sent to your email',
    btnSaveNotifications: 'Save Notifications',

    secPrivacy: 'Privacy & Visibility',
    privPublicProfileTitle: 'Public Marketplace Profile',
    privPublicProfileDesc: 'Allow Tunisian and regional clients to discover your profile in the directory',
    privShowEarningsTitle: 'Display Total Earnings',
    privShowEarningsDesc: 'Showcase your total completed TND contract value on your public profile',
    btnSavePrivacy: 'Save Privacy Settings',

    secLocalization: 'Language & Currency Preferences',
    langTitle: 'Platform Language',
    langDesc: 'Choose your preferred language for navigation, dashboard, and notifications',
    currTitle: 'Display Currency',
    currDesc: 'Display prices, wallet balance, and contract amounts in your preferred currency',
    timezoneTitle: 'Default Timezone',
    timezoneDesc: 'Africa/Tunis (UTC+01:00) — Tunis Standard Time',
    btnSavePreferences: 'Save Preferences',

    secAccount: 'Account Governance',
    btnSignOut: 'Sign Out of Asteria',
    dangerZone: 'Danger Zone',
    deleteAccountTitle: 'Permanently Delete Account',
    deleteAccountDesc: 'Irrevocably deletes your profile, active gigs, and wallet access after settlement',
    btnDeleteAccount: 'Delete Account',

    savedSuccess: 'Preferences Saved Successfully',
    saveError: 'Failed to save settings. Please try again.',
  },

  French: {
    // Public Navigation
    navHome: 'Accueil',
    navExplore: 'Explorer',
    navFreelancers: 'Freelances',
    navJobs: 'Missions',
    navHowItWorks: 'Fonctionnement',
    navAbout: 'À propos',
    navSignIn: 'Connexion',
    navJoinFree: 'Rejoindre',
    navGetStarted: 'Commencer',
    navDashboard: 'Tableau de bord',
    navPostJob: 'Publier une mission',

    // Hero Section
    heroBadge: '✨ Asteria — Marketplace Freelance Sécurisée avec Escrow, Créée en Tunisie',
    heroHeading1: 'TALENTS',
    heroHeading2: 'ESCROW',
    heroHeading3: 'LIVRAISON',
    heroSubtitle: 'Recrutez les meilleurs développeurs, designers et experts tunisiens — avec paiements sous séquestre sécurisé sur chaque projet.',
    heroSearchPlaceholder: 'Rechercher Next.js, Design Figma, Bot IA...',
    heroSearchBtn: 'Rechercher',
    heroTrending: 'Tendances :',
    heroExploreServices: 'Explorer les services',
    heroPostProject: 'Publier un projet',

    // Features
    featEscrowTitle: 'Séquestre Sécurisé',
    featEscrowDesc: 'Fonds bloqués en toute sécurité jusqu’à validation du travail',
    featKycTitle: 'Talents Vérifiés KYC',
    featKycDesc: 'Identité vérifiée pour chaque freelance avant toute candidature',
    featLocalTitle: 'Local & Rapide',
    featLocalDesc: 'Paiements en TND adaptés au marché tunisien et aux virements locaux',
    featTunisiaTitle: 'La Tunisie d’abord',
    featTunisiaDesc: 'Conçu en Tunisie, rayonnant sur toute la région MENA',

    // How It Works Section
    hiwProcess: 'Processus',
    hiwTitle: 'Comment ça fonctionne',
    hiwSubtitle: 'Trois étapes simples pour réaliser vos projets avec succès.',
    step1Title: 'Publiez votre projet',
    step1Body: 'Décrivez vos besoins, fixez votre budget et recevez rapidement des propositions d’experts qualifiés.',
    step1Badge: 'En quelques minutes',
    step2Title: 'Choisissez votre freelance',
    step2Body: 'Notre système vous propose les meilleurs profils en fonction de leurs compétences et évaluations.',
    step2Badge: 'Sélection intelligente',
    step3Title: 'Livraison & Paiement garanti',
    step3Body: 'Le travail est livré, validé, et les fonds de séquestre sont débloqués en toute sécurité.',
    step3Badge: 'Séquestre garanti',
    stepLabel: 'ÉTAPE',

    // Featured Gigs Section
    featuredServices: 'Services',
    featuredTitle: 'Services à la une',
    filterAll: 'Tous',
    startingAt: 'À partir de',
    deliveryDays: 'jours de livraison',

    // Categories Section
    catBrowseBy: 'Parcourir par',
    catPopular: 'Catégories populaires',
    catLiveServices: 'services disponibles',
    catExploreCat: 'Explorer la catégorie',

    // Category Names
    catWebDev: 'Développement Web',
    catDesign: 'Design & Graphisme',
    catDataScience: 'Data Science & IA',
    catMarketing: 'Marketing Digital',
    catMobile: 'Applications Mobiles',
    catWriting: 'Rédaction & Traduction',
    catVideoAudio: 'Vidéo & Audio',
    catBusiness: 'Gestion & Conseil',

    // Marketplace / Explore Page
    exploreHeaderTag: 'Place de marché',
    exploreHeaderTitle: 'Explorer les services',
    exploreHeaderSubtitle: 'Découvrez les micro-services des meilleurs freelances en Tunisie et MENA.',
    searchServicesPlaceholder: 'Rechercher des services, compétences, tags…',
    filterCategories: 'Catégories',
    filterAllCategories: 'Toutes les catégories',
    sortBy: 'Trier par',
    sortRelevance: 'Pertinence',
    sortPriceLow: 'Prix : Croissant',
    sortPriceHigh: 'Prix : Décroissant',
    sortFastest: 'Livraison la plus rapide',
    noServicesFound: 'Aucun service ne correspond à votre recherche.',
    clearFilters: 'Réinitialiser les filtres',

    // Freelancers Page
    freelancersHeaderTag: 'Annuaire des talents',
    freelancersHeaderTitle: 'Freelances d’élite',
    freelancersHeaderSubtitle: 'Développeurs, designers et spécialistes tunisiens vérifiés prêts à intervenir.',
    searchFreelancersPlaceholder: 'Rechercher par nom, compétence, ou gouvernorat…',

    // Jobs Board Page
    jobsHeaderTag: 'Missions & Projets',
    jobsHeaderTitle: 'Projets ouverts',
    jobsHeaderSubtitle: 'Missions actives avec financement sous séquestre 100% garanti.',
    postJobButton: '+ Publier une mission',

    // Authentication (Login & Register)
    authWelcomeBack: 'Bon retour parmi nous',
    authSignInSubtitle: 'Connectez-vous à votre compte Asteria pour continuer',
    authEmail: 'Adresse email',
    authPassword: 'Mot de passe',
    authNoAccount: 'Vous n’avez pas de compte ?',
    authCreateAccount: 'Inscrivez-vous maintenant',
    authCreateAccountTitle: 'Rejoindre Asteria',
    authCreateAccountSubtitle: 'Créez votre compte client ou freelance en 30 secondes',
    authFullName: 'Nom complet',
    authRoleClient: 'Je souhaite recruter (Client)',
    authRoleFreelancer: 'Je souhaite travailler (Freelance)',
    authAgreeTerms: 'En vous inscrivant, vous acceptez nos Conditions d’utilisation et notre Politique de confidentialité.',
    authAlreadyAccount: 'Vous avez déjà un compte ?',

    // Footer
    footerDesc: 'La marketplace freelance reliant les talents tunisiens aux entreprises ambitieuses — en Tunisie et dans toute la région MENA.',
    footerPlatform: 'Plateforme',
    footerCompany: 'Entreprise',
    footerSupport: 'Assistance',
    footerHelpCenter: 'Centre d’aide',
    footerTerms: 'Conditions d’utilisation',
    footerPrivacy: 'Politique de confidentialité',
    footerContact: 'Contactez-nous',
    footerRights: 'Tous droits réservés.',

    // Dashboard Navigation
    navOverview: 'Vue d’ensemble',
    navVerification: 'Vérification (KYC)',
    navOrders: 'Commandes',
    navMessages: 'Messagerie',
    navProfile: 'Profil',
    navSettings: 'Paramètres',
    navBrowseJobs: 'Consulter les missions',
    navMyGigs: 'Mes services',
    navWallet: 'Portefeuille & Retraits',
    navAnalytics: 'Statistiques',
    navMyJobs: 'Mes offres publiées',
    navExploreGigs: 'Explorer les services',
    navLogout: 'Se déconnecter',
    navAdmin: 'Administration',

    // Settings Page
    settingsTitle: 'Paramètres de la Plateforme',
    settingsSubtitle: 'Configurez vos notifications, la visibilité de votre profil ainsi que votre langue et devise préférées.',
    
    secNotifications: 'Alertes & Notifications',
    notifNewOrdersTitle: 'Nouvelles commandes',
    notifNewOrdersDesc: 'Recevez une notification lorsqu’un client passe commande ou alimente l’escrow',
    notifMessagesTitle: 'Messages directs',
    notifMessagesDesc: 'Alertes instantanées pour les discussions et livraisons de projets',
    notifMarketingTitle: 'Nouveautés Asteria',
    notifMarketingDesc: 'Conseils pour freelances en Tunisie, promotions et mises à jour',
    notifDigestTitle: 'Récapitulatif hebdomadaire',
    notifDigestDesc: 'Résumé de vos revenus et commandes envoyé chaque semaine par email',
    btnSaveNotifications: 'Enregistrer les notifications',

    secPrivacy: 'Confidentialité & Visibilité',
    privPublicProfileTitle: 'Profil public visible',
    privPublicProfileDesc: 'Permettre aux clients tunisiens et internationaux de vous trouver',
    privShowEarningsTitle: 'Afficher les revenus cumulés',
    privShowEarningsDesc: 'Afficher le total des gains en dinars tunisiens sur votre profil',
    btnSavePrivacy: 'Enregistrer la confidentialité',

    secLocalization: 'Langue & Devise',
    langTitle: 'Langue de l’interface',
    langDesc: 'Sélectionnez la langue d’affichage du tableau de bord et des menus',
    currTitle: 'Devise par défaut',
    currDesc: 'Afficher les prix et soldes dans votre monnaie locale',
    timezoneTitle: 'Fuseau horaire',
    timezoneDesc: 'Africa/Tunis (UTC+01:00) — Heure normale de Tunisie',
    btnSavePreferences: 'Enregistrer les préférences',

    secAccount: 'Gestion du compte',
    btnSignOut: 'Déconnexion',
    dangerZone: 'Zone dangereuse',
    deleteAccountTitle: 'Supprimer définitivement le compte',
    deleteAccountDesc: 'Supprime définitivement votre compte, services et historique après clôture',
    btnDeleteAccount: 'Supprimer le compte',

    savedSuccess: 'Paramètres enregistrés avec succès',
    saveError: 'Erreur lors de l’enregistrement. Veuillez réessayer.',
  },

  Arabic: {
    // Public Navigation
    navHome: 'الرئيسية',
    navExplore: 'استكشاف',
    navFreelancers: 'المستقلون',
    navJobs: 'المشاريع',
    navHowItWorks: 'كيف نعمل',
    navAbout: 'من نحن',
    navSignIn: 'تسجيل الدخول',
    navJoinFree: 'انضم مجاناً',
    navGetStarted: 'ابدأ الآن',
    navDashboard: 'لوحة التحكم',
    navPostJob: 'نشر مشروع',

    // Hero Section
    heroBadge: '✨ أستيريا — أول منصة عمل حر تونسية محمية بالضمان المالي (Escrow)',
    heroHeading1: 'كفاءات',
    heroHeading2: 'ضمان مالي',
    heroHeading3: 'إنجاز',
    heroSubtitle: 'وظف أفضل المطورين والمصممين التونسيين مع حماية مالية 100% بالدينار التونسي عبر Flouci وD17 والبطاقات البنكية.',
    heroSearchPlaceholder: "ابحث عن 'تطبيق Next.js'، 'تصميم Figma'، 'ذكاء اصطناعي'...",
    heroSearchBtn: 'بحث',
    heroTrending: 'رائج الآن:',
    heroExploreServices: 'استكشاف الخدمات المصغرة',
    heroPostProject: 'نشر مشروع جديد',

    // Features
    featEscrowTitle: 'ضمان مالي Escrow',
    featEscrowDesc: 'أموالك محفوظة في أمان تام حتى توافق على العمل المنجز',
    featKycTitle: 'كفاءات موثقة بالهوية (CIN)',
    featKycDesc: 'فحص هوية كل فريلانسر قبل السماح له بالتقديم لضمان المصداقية',
    featLocalTitle: 'دفع محلي وسريع',
    featLocalDesc: 'معاملات بالدينار التونسي مصممة لواقع الشركات والمستقلين في تونس',
    featTunisiaTitle: 'تونس أولاً',
    featTunisiaDesc: 'منصة تونسية 100% تتوسع نحو السوق المغاربي والعربي',

    // How It Works Section
    hiwProcess: 'طريقة العمل',
    hiwTitle: 'كيف تعمل المنصة',
    hiwSubtitle: 'ثلاث خطوات سهلة ومضمونة لإنجاز أعمالك بأعلى كفاءة.',
    step1Title: 'انشر مشروعك أو اطلب خدمة',
    step1Body: 'حدد تفاصيل طلبك، ميزانيتك بالدينار التونسي، وتلق عروضاً من خيرة الكفاءات التونسية.',
    step1Badge: 'في دقائق معدودة',
    step2Title: 'اختر المستقل المناسب',
    step2Body: 'قارن العروض والملفات الشخصية الموثقة ببطاقة التعريف الوطنية، واختر الأنسب.',
    step2Badge: 'اختيار ذكي وموثق',
    step3Title: 'استلم عملك مع الضمان المالي',
    step3Body: 'يتم حفظ أموالك في الضمان المالي ولا يتم تحويلها للمستقل إلا بعد معاينة العمل والموافقة عليه.',
    step3Badge: 'حماية مالية 100%',
    stepLabel: 'الخطوة',

    // Featured Gigs Section
    featuredServices: 'الخدمات المصغرة',
    featuredTitle: 'خدمات مميزة',
    filterAll: 'الكل',
    startingAt: 'ابتداءً من',
    deliveryDays: 'أيام للتسليم',

    // Categories Section
    catBrowseBy: 'تصفح حسب',
    catPopular: 'أشهر المجالات',
    catLiveServices: 'خدمة متاحة',
    catExploreCat: 'استكشف المجال',

    // Category Names
    catWebDev: 'تطوير المواقع والبرمجيات',
    catDesign: 'التصميم والغرافيك',
    catDataScience: 'علوم البيانات والذكاء الاصطناعي',
    catMarketing: 'التسويق الرقمي',
    catMobile: 'تطبيقات الجوال',
    catWriting: 'الكتابة والترجمة',
    catVideoAudio: 'الفيديو والصوتيات',
    catBusiness: 'إدارة الأعمال والاستشارات',

    // Marketplace / Explore Page
    exploreHeaderTag: 'سوق الخدمات',
    exploreHeaderTitle: 'استكشاف الخدمات المصغرة',
    exploreHeaderSubtitle: 'تصفح خدمات من أمهر المطورين والمصممين في تونس مع ضمان مالي كامل.',
    searchServicesPlaceholder: 'ابحث عن خدمات، مهارات، أو وسوم…',
    filterCategories: 'المجالات',
    filterAllCategories: 'جميع المجالات',
    sortBy: 'ترتيب حسب',
    sortRelevance: 'الأكثر صلة',
    sortPriceLow: 'السعر: من الأقل للأعلى',
    sortPriceHigh: 'السعر: من الأعلى للأقل',
    sortFastest: 'الأسرع تسليماً',
    noServicesFound: 'لا توجد خدمات مطابقة لمعايير البحث.',
    clearFilters: 'إعادة ضبط التصفية',

    // Freelancers Page
    freelancersHeaderTag: 'دليل الكفاءات',
    freelancersHeaderTitle: 'نخبة المستقلين',
    freelancersHeaderSubtitle: 'مطورون ومصممون ومحترفون موثقون بالهوية التونسية (CIN) جاهزون للعمل.',
    searchFreelancersPlaceholder: 'ابحث بالاسم، المهارة، أو الولاية التونسية…',

    // Jobs Board Page
    jobsHeaderTag: 'فرص المشاريع',
    jobsHeaderTitle: 'المشاريع المتاحة',
    jobsHeaderSubtitle: 'مشاريع حقيقية معلنة مع إيداع مالي مؤمن بالكامل في الضمان.',
    postJobButton: '+ نشر مشروع جديد',

    // Authentication (Login & Register)
    authWelcomeBack: 'مرحباً بعودتك',
    authSignInSubtitle: 'سجل الدخول إلى حسابك في أستيريا للمتابعة',
    authEmail: 'البريد الإلكتروني',
    authPassword: 'كلمة المرور',
    authNoAccount: 'ليس لديك حساب؟',
    authCreateAccount: 'أنشئ حسابك الآن',
    authCreateAccountTitle: 'انضم إلى أستيريا',
    authCreateAccountSubtitle: 'أنشئ حسابك كصاحب مشاريع أو مستقل في 30 ثانية',
    authFullName: 'الاسم الكامل',
    authRoleClient: 'أريد توظيف كفاءات (صاحب مشروع)',
    authRoleFreelancer: 'أريد العمل كمستقل (فريلانسر)',
    authAgreeTerms: 'بتسجيلك، فإنك توافق على شروط الاستخدام وسياسة الخصوصية.',
    authAlreadyAccount: 'لديك حساب بالفعل؟',

    // Footer
    footerDesc: 'أول منصة عمل حر تونسية تربط أفضل المواهب الرقمية بالشركات ورواد الأعمال مع حماية مالية متكاملة بالدينار التونسي.',
    footerPlatform: 'المنصة',
    footerCompany: 'الشركة',
    footerSupport: 'المساعدة والدعم',
    footerHelpCenter: 'مركز المساعدة',
    footerTerms: 'شروط الاستخدام',
    footerPrivacy: 'سياسة الخصوصية',
    footerContact: 'اتصل بنا',
    footerRights: 'جميع الحقوق محفوظة.',

    // Dashboard Navigation
    navOverview: 'نظرة عامة',
    navVerification: 'توثيق الهوية (CIN)',
    navOrders: 'الطلبات والعقود',
    navMessages: 'الرسائل والمحادثات',
    navProfile: 'الملف الشخصي',
    navSettings: 'الإعدادات',
    navBrowseJobs: 'تصفح المشاريع',
    navMyGigs: 'خدماتي المنشورة',
    navWallet: 'المحفظة والسحب (TND)',
    navAnalytics: 'الإحصائيات والأرباح',
    navMyJobs: 'مشاريعي المنشورة',
    navExploreGigs: 'استكشاف الخدمات',
    navLogout: 'تسجيل الخروج',
    navAdmin: 'لوحة الإدارة',

    // Settings Page
    settingsTitle: 'إعدادات المنصة',
    settingsSubtitle: 'تحكم في إشعاراتك، خصوصية حسابك، وتفضيلات اللغة والعملة التونسية.',
    
    secNotifications: 'إشعارات المنصة',
    notifNewOrdersTitle: 'الطلبات الجديدة',
    notifNewOrdersDesc: 'تلقي إشعار فوري عند حجز خدمة أو إيداع أموال في الضمان المالي',
    notifMessagesTitle: 'الرسائل المباشرة',
    notifMessagesDesc: 'تنبيهات فورية للمحادثات ومتابعة تسليم المشاريع',
    notifMarketingTitle: 'تحديثات المنصة وعروضها',
    notifMarketingDesc: 'نصائح حصرية للمستقلين في تونس، تخفيضات في الرسوم، وميزات جديدة',
    notifDigestTitle: 'التقرير الأسبوعي',
    notifDigestDesc: 'ملخص أسبوعي لأرباحك ونشاط حسابك عبر البريد الإلكتروني',
    btnSaveNotifications: 'حفظ الإشعارات',

    secPrivacy: 'الخصوصية والظهور',
    privPublicProfileTitle: 'الملف الشخصي متاح للعموم',
    privPublicProfileDesc: 'السماح للشركات ورواد الأعمال في تونس باكتشاف ملفك وطلب خدماتك',
    privShowEarningsTitle: 'عرض إجمالي الأرباح',
    privShowEarningsDesc: 'إظهار حجم المعاملات المنجزة بالدينار التونسي في صفحتك العامة',
    btnSavePrivacy: 'حفظ إعدادات الخصوصية',

    secLocalization: 'تفضيلات اللغة والعملة',
    langTitle: 'لغة الواجهة',
    langDesc: 'اختر اللغة المناسبة لتصفح لوحة التحكم والمنصة',
    currTitle: 'عملة العرض',
    currDesc: 'عرض الأسعار، رصيد المحفظة، ودفعات الضمان بالعملة المختارة',
    timezoneTitle: 'التوقيت المحلي',
    timezoneDesc: 'توقيت تونس (UTC+01:00) — التوقيت الرسمي للجمهورية التونسية',
    btnSavePreferences: 'حفظ التفضيلات',

    secAccount: 'إدارة الحساب',
    btnSignOut: 'تسجيل الخروج من المنصة',
    dangerZone: 'منطقة الحذف',
    deleteAccountTitle: 'حذف الحساب نهائياً',
    deleteAccountDesc: 'حذف الحساب والخدمات وسحب أي رصيد متبقي بشكل نهائي',
    btnDeleteAccount: 'تأكيد حذف الحساب',

    savedSuccess: 'تم حفظ التفضيلات بنجاح',
    saveError: 'تعذر حفظ الإعدادات، يرجى إعادة المحاولة.',
  },
}
