import {
  TUNISIA_DATA,
  TUNISIAN_GOVERNORATES,
  formatTND,
  isValidTunisianPhone,
  formatTunisianPhone,
  isValidTunisianPostalCode,
  isValidTunisianCIN,
  isValidTunisianRIB,
} from '@/lib/country'

describe('Tunisia Country Data & Localization Unit Tests', () => {
  describe('Tunisia Country Metadata (REST Countries v5 Data)', () => {
    it('contains exact country codes and calling code', () => {
      expect(TUNISIA_DATA.codes.alpha2).toBe('TN')
      expect(TUNISIA_DATA.codes.alpha3).toBe('TUN')
      expect(TUNISIA_DATA.codes.numeric).toBe('788')
      expect(TUNISIA_DATA.callingCode).toBe('+216')
      expect(TUNISIA_DATA.tld).toBe('.tn')
    })

    it('contains official names and native Arabic name', () => {
      expect(TUNISIA_DATA.name.common).toBe('Tunisia')
      expect(TUNISIA_DATA.name.official).toBe('Republic of Tunisia')
      expect(TUNISIA_DATA.name.native.ara.common).toBe('تونس')
      expect(TUNISIA_DATA.name.native.ara.official).toBe('الجمهورية التونسية')
    })

    it('contains currency configuration for TND', () => {
      expect(TUNISIA_DATA.currency.code).toBe('TND')
      expect(TUNISIA_DATA.currency.name).toBe('Tunisian dinar')
      expect(TUNISIA_DATA.currency.symbol).toBe('د.ت')
      expect(TUNISIA_DATA.currency.decimals).toBe(2)
    })

    it('contains official capital and coordinates', () => {
      expect(TUNISIA_DATA.capital.name).toBe('Tunis')
      expect(TUNISIA_DATA.capital.coordinates.lat).toBeCloseTo(36.8, 1)
      expect(TUNISIA_DATA.capital.coordinates.lng).toBeCloseTo(10.18, 1)
    })

    it('contains demographic and geographical statistics', () => {
      expect(TUNISIA_DATA.population).toBeGreaterThan(11000000)
      expect(TUNISIA_DATA.areaKm2).toBe(163610)
      expect(TUNISIA_DATA.timezones).toContain('UTC+01:00')
      expect(TUNISIA_DATA.borders).toEqual(expect.arrayContaining(['DZA', 'LBY']))
    })
  })

  describe('Tunisian Governorates (24 Wilayas)', () => {
    it('includes all 24 governorates with English and Arabic names', () => {
      expect(TUNISIAN_GOVERNORATES).toHaveLength(24)
      const tunisGov = TUNISIAN_GOVERNORATES.find(g => g.id === 'tunis')
      expect(tunisGov).toBeDefined()
      expect(tunisGov?.nameAr).toBe('تونس')

      const sfaxGov = TUNISIAN_GOVERNORATES.find(g => g.id === 'sfax')
      expect(sfaxGov).toBeDefined()
      expect(sfaxGov?.nameAr).toBe('صفاقس')

      const sousseGov = TUNISIAN_GOVERNORATES.find(g => g.id === 'sousse')
      expect(sousseGov).toBeDefined()
      expect(sousseGov?.nameAr).toBe('سوسة')
    })
  })

  describe('Currency Formatting (formatTND)', () => {
    it('formats numbers into standard TND string', () => {
      const formatted = formatTND(125.5)
      expect(formatted).toContain('125')
      expect(formatted).toContain('TND')
    })

    it('supports Arabic symbol formatting', () => {
      const formatted = formatTND(250, { useArabicSymbol: true })
      expect(formatted).toContain('د.ت')
    })
  })

  describe('Tunisian Phone Number Validation & Formatting', () => {
    it('validates 8-digit local mobile and landline numbers', () => {
      expect(isValidTunisianPhone('20123456')).toBe(true) // Ooredoo
      expect(isValidTunisianPhone('98123456')).toBe(true) // Tunisie Telecom
      expect(isValidTunisianPhone('55123456')).toBe(true) // Orange
      expect(isValidTunisianPhone('71123456')).toBe(true) // Landline
      expect(isValidTunisianPhone('12345678')).toBe(false) // Invalid prefix
      expect(isValidTunisianPhone('123')).toBe(false)
    })

    it('validates international formatted numbers with +216', () => {
      expect(isValidTunisianPhone('+216 20 123 456')).toBe(true)
      expect(isValidTunisianPhone('+21620123456')).toBe(true)
      expect(isValidTunisianPhone('0021620123456')).toBe(true)
    })

    it('formats raw numbers into standard Tunisian display format', () => {
      expect(formatTunisianPhone('20123456')).toBe('+216 20 123 456')
      expect(formatTunisianPhone('+21620123456')).toBe('+216 20 123 456')
    })
  })

  describe('Tunisian Identity & Financial Validations (CIN, Postal Code, RIB)', () => {
    it('validates 4-digit postal codes', () => {
      expect(isValidTunisianPostalCode('1000')).toBe(true)
      expect(isValidTunisianPostalCode('4000')).toBe(true)
      expect(isValidTunisianPostalCode('123')).toBe(false)
      expect(isValidTunisianPostalCode('12345')).toBe(false)
      expect(isValidTunisianPostalCode('ABCD')).toBe(false)
    })

    it('validates 8-digit Carte d’Identité Nationale (CIN)', () => {
      expect(isValidTunisianCIN('08123456')).toBe(true)
      expect(isValidTunisianCIN('14890234')).toBe(true)
      expect(isValidTunisianCIN('1234567')).toBe(false) // 7 digits
      expect(isValidTunisianCIN('123456789')).toBe(false) // 9 digits
      expect(isValidTunisianCIN('0812345A')).toBe(false)
    })

    it('validates 20-digit Tunisian Bank RIB', () => {
      const validRib = '08001234567890123456'
      const validRibWithSpaces = '0800 1234 5678 9012 3456'
      expect(isValidTunisianRIB(validRib)).toBe(true)
      expect(isValidTunisianRIB(validRibWithSpaces)).toBe(true)
      expect(isValidTunisianRIB('0800123456')).toBe(false) // Too short
      expect(isValidTunisianRIB('0800123456789012345678')).toBe(false) // Too long
    })
  })
})
