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
  // Navigation & General
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
  navPostJob: string
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
    navPostJob: 'Post a Job',
    navExploreGigs: 'Explore Services',
    navLogout: 'Sign Out',
    navAdmin: 'Admin Governance',

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
    navPostJob: 'Publier une mission',
    navExploreGigs: 'Explorer les services',
    navLogout: 'Se déconnecter',
    navAdmin: 'Administration',

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
    navPostJob: 'نشر مشروع جديد',
    navExploreGigs: 'استكشاف الخدمات',
    navLogout: 'تسجيل الخروج',
    navAdmin: 'لوحة الإدارة',

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
