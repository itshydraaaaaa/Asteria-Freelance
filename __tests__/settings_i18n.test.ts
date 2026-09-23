import { TRANSLATIONS } from '@/lib/i18n/translations'
import { GET, POST } from '@/app/api/user/settings/route'
import { NextRequest } from 'next/server'

describe('Platform Settings & Multi-Language Localization Tests', () => {
  describe('Translation Dictionary Completeness', () => {
    it('contains all required keys across English, French, and Arabic', () => {
      const keys = Object.keys(TRANSLATIONS.English) as (keyof typeof TRANSLATIONS.English)[]
      expect(keys.length).toBeGreaterThan(20)

      for (const key of keys) {
        expect(TRANSLATIONS.French[key]).toBeDefined()
        expect(TRANSLATIONS.French[key].length).toBeGreaterThan(0)

        expect(TRANSLATIONS.Arabic[key]).toBeDefined()
        expect(TRANSLATIONS.Arabic[key].length).toBeGreaterThan(0)
      }
    })

    it('has accurate Tunisian Arabic translations for key navigation and settings items', () => {
      expect(TRANSLATIONS.Arabic.navOverview).toBe('نظرة عامة')
      expect(TRANSLATIONS.Arabic.navVerification).toContain('CIN')
      expect(TRANSLATIONS.Arabic.navWallet).toContain('TND')
      expect(TRANSLATIONS.Arabic.settingsTitle).toBe('إعدادات المنصة')
      expect(TRANSLATIONS.Arabic.timezoneDesc).toContain('تونس')
      expect(TRANSLATIONS.Arabic.navExplore).toBe('استكشاف')
      expect(TRANSLATIONS.Arabic.navFreelancers).toBe('المستقلون')
      expect(TRANSLATIONS.Arabic.navJobs).toBe('المشاريع')
      expect(TRANSLATIONS.Arabic.heroBadge).toContain('أستيريا')
    })
  })

  describe('API: /api/user/settings Endpoint', () => {
    it('GET returns default or cookie-based preferences', async () => {
      const req = new NextRequest('http://localhost:3000/api/user/settings', {
        headers: {
          cookie: 'asteria_lang=French; asteria_currency=TND',
        },
      })

      const res = await GET(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.language).toBe('French')
      expect(json.currency).toBe('TND')
      expect(json.timezone).toBe('Africa/Tunis')
    })

    it('POST validates language and currency and sets response cookies', async () => {
      const req = new NextRequest('http://localhost:3000/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'Arabic',
          currency: 'TND',
          notifications: { newOrders: true, messages: true, marketing: false, weeklyDigest: true },
          privacy: { publicProfile: true, showEarnings: false },
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.settings.language).toBe('Arabic')
      expect(json.settings.currency).toBe('TND')

      // Check cookies
      const setCookie = res.headers.get('set-cookie')
      expect(setCookie).toContain('asteria_lang=Arabic')
      expect(setCookie).toContain('asteria_currency=TND')
    })

    it('POST falls back safely to default on unknown language or currency', async () => {
      const req = new NextRequest('http://localhost:3000/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'Klingon',
          currency: 'DOGE',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)

      const json = await res.json()
      expect(json.settings.language).toBe('English') // Sanitized fallback
      expect(json.settings.currency).toBe('TND') // Sanitized fallback
    })
  })
})
