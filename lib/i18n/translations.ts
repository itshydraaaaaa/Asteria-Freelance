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
