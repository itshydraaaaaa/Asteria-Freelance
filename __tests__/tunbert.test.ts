import {
  detectTunisianDialect,
  analyzeTunisianSentiment,
  expandTunisianSearchQuery,
  enhancePromptForTunisianContext,
} from '@/lib/ai/tunbert'

describe('TunBERT Tunisian Dialect & NLP Test Suite (InstaDeep & iCompass Architecture)', () => {
  describe('Tunisian Dialect Identification (TDI)', () => {
    it('detects Tunisian Derja in Arabic script', () => {
      const text = 'نحب نعمل سيت ويب باهي برشا يعطيك الصحة'
      const result = detectTunisianDialect(text)

      expect(result.isTunisian).toBe(true)
      expect(result.script).toBe('ARABIC')
      expect(result.matchedTokens).toEqual(expect.arrayContaining(['نحب', 'باهي', 'برشا', 'يعطيك الصحة']))
      expect(result.confidence).toBeGreaterThanOrEqual(0.6)
    })

    it('detects Tunisian Arabizi (Latin numbers & letters)', () => {
      const text = '3aslema n7eb khedma tayara barcha fissa3'
      const result = detectTunisianDialect(text)

      expect(result.isTunisian).toBe(true)
      expect(result.script).toBe('ARABIZI')
      expect(result.matchedTokens).toEqual(expect.arrayContaining(['3aslema', 'n7eb', 'khedma', 'tayara', 'barcha', 'fissa3']))
      expect(result.confidence).toBeGreaterThanOrEqual(0.6)
    })

    it('identifies standard non-Tunisian text correctly', () => {
      const text = 'Hello please build a responsive Next.js web application with Tailwind CSS.'
      const result = detectTunisianDialect(text)

      expect(result.isTunisian).toBe(false)
      expect(result.script).toBe('STANDARD')
      expect(result.confidence).toBe(0)
    })
  })

  describe('Tunisian Sentiment Analysis (SA)', () => {
    it('accurately rates positive reviews in Derja and Arabizi', async () => {
      const positiveArabic = await analyzeTunisianSentiment('يعطيك الصحة خدمة ممتازة وطيارة برشا تبارك الله')
      expect(positiveArabic.sentiment).toBe('POSITIVE')
      expect(positiveArabic.score).toBeGreaterThan(0.6)

      const positiveArabizi = await analyzeTunisianSentiment('khedma tayara barcha ya3tik saha mrigel')
      expect(positiveArabizi.sentiment).toBe('POSITIVE')
      expect(positiveArabizi.score).toBeGreaterThan(0.6)
    })

    it('accurately flags negative feedback and dispute sentiments', async () => {
      const negativeArabic = await analyzeTunisianSentiment('خدمة خايبة برشا وتضييع وقت ما ننصحش بيه')
      expect(negativeArabic.sentiment).toBe('NEGATIVE')
      expect(negativeArabic.score).toBeGreaterThan(0.6)

      const negativeArabizi = await analyzeTunisianSentiment('5ayeb barcha ma3ejbetnich el khedma jemla')
      expect(negativeArabizi.sentiment).toBe('NEGATIVE')
      expect(negativeArabizi.score).toBeGreaterThan(0.6)
    })

    it('handles neutral comments cleanly', async () => {
      const neutral = await analyzeTunisianSentiment('تم استلام الملف وجاري المراجعة حسب الاتفاق')
      expect(neutral.sentiment).toBe('NEUTRAL')
    })
  })

  describe('Marketplace Search Dialect Query Expansion', () => {
    it('expands Tunisian search queries to relevant technical categories', () => {
      const webQuery = expandTunisianSearchQuery('siteweb')
      expect(webQuery).toEqual(expect.arrayContaining(['web development', 'website']))

      const designQuery = expandTunisianSearchQuery('تصميم')
      expect(designQuery).toEqual(expect.arrayContaining(['graphic design', 'ui/ux', 'logo design']))

      const videoQuery = expandTunisianSearchQuery('montage video')
      expect(videoQuery).toEqual(expect.arrayContaining(['video editing']))
    })
  })

  describe('Tunisian Context Prompt Enrichment', () => {
    it('enriches system instructions with Tunisian economic and cultural realities', () => {
      const prompt = enhancePromptForTunisianContext('Write a gig description for e-commerce website development')
      expect(prompt).toContain('Tunisian Context & Language Intelligence')
      expect(prompt).toContain('Tunisian Dinar (TND / د.ت)')
      expect(prompt).toContain('Flouci')
      expect(prompt).toContain('TunBERT')
    })
  })
})
