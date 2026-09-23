/**
 * lib/country.ts — Tunisian Country & Regional Localization Data
 *
 * Source of truth generated from REST Countries v5 API for Tunisia (TN / TUN / 788)
 * API Endpoint: https://api.restcountries.com/countries/v5/names.common/Tunisia
 */

export interface CountryData {
  name: {
    common: string
    official: string
    native: {
      ara: {
        common: string
        official: string
      }
    }
  }
  codes: {
    alpha2: string
    alpha3: string
    numeric: string
    cioc: string
    fifa: string
  }
  capital: {
    name: string
    coordinates: {
      lat: number
      lng: number
    }
  }
  currency: {
    code: string
    name: string
    symbol: string
    decimals: number
  }
  callingCode: string
  timezones: string[]
  population: number
  areaKm2: number
  postalCode: {
    format: string
    regex: string
  }
  languages: {
    code: string
    name: string
    nativeName: string
  }[]
  flag: {
    emoji: string
    svgUrl: string
    pngUrl: string
  }
  borders: string[]
  tld: string
}

export const TUNISIA_DATA: CountryData = {
  name: {
    common: 'Tunisia',
    official: 'Republic of Tunisia',
    native: {
      ara: {
        common: 'تونس',
        official: 'الجمهورية التونسية',
      },
    },
  },
  codes: {
    alpha2: 'TN',
    alpha3: 'TUN',
    numeric: '788',
    cioc: 'TUN',
    fifa: 'TUN',
  },
  capital: {
    name: 'Tunis',
    coordinates: {
      lat: 36.8,
      lng: 10.18,
    },
  },
  currency: {
    code: 'TND',
    name: 'Tunisian dinar',
    symbol: 'د.ت',
    decimals: 2,
  },
  callingCode: '+216',
  timezones: ['UTC+01:00'],
  population: 11992843,
  areaKm2: 163610,
  postalCode: {
    format: '####',
    regex: '^(\\d{4})$',
  },
  languages: [
    {
      code: 'ara',
      name: 'Arabic',
      nativeName: 'العربية',
    },
    {
      code: 'fra',
      name: 'French',
      nativeName: 'Français',
    },
  ],
  flag: {
    emoji: '🇹🇳',
    svgUrl: 'https://flags.restcountries.com/v5/svg/tn.svg',
    pngUrl: 'https://flags.restcountries.com/v5/w640/tn.png',
  },
  borders: ['DZA', 'LBY'],
  tld: '.tn',
}

/**
 * All 24 Administrative Governorates (Wilayas) of Tunisia
 */
export const TUNISIAN_GOVERNORATES = [
  { id: 'tunis', nameEn: 'Tunis', nameAr: 'تونس', postalPrefix: '10' },
  { id: 'ariana', nameEn: 'Ariana', nameAr: 'أريانة', postalPrefix: '20' },
  { id: 'ben_arous', nameEn: 'Ben Arous', nameAr: 'بن عروس', postalPrefix: '20' },
  { id: 'manouba', nameEn: 'Manouba', nameAr: 'منوبة', postalPrefix: '20' },
  { id: 'nabeul', nameEn: 'Nabeul', nameAr: 'نابل', postalPrefix: '80' },
  { id: 'zaghouan', nameEn: 'Zaghouan', nameAr: 'زغوان', postalPrefix: '11' },
  { id: 'bizerte', nameEn: 'Bizerte', nameAr: 'بنزرت', postalPrefix: '70' },
  { id: 'beja', nameEn: 'Béja', nameAr: 'باجة', postalPrefix: '90' },
  { id: 'jendouba', nameEn: 'Jendouba', nameAr: 'جندوبة', postalPrefix: '81' },
  { id: 'kef', nameEn: 'Le Kef', nameAr: 'الكاف', postalPrefix: '71' },
  { id: 'siliana', nameEn: 'Siliana', nameAr: 'سليانة', postalPrefix: '61' },
  { id: 'sousse', nameEn: 'Sousse', nameAr: 'سوسة', postalPrefix: '40' },
  { id: 'monastir', nameEn: 'Monastir', nameAr: 'المنستير', postalPrefix: '50' },
  { id: 'mahdia', nameEn: 'Mahdia', nameAr: 'المهدية', postalPrefix: '51' },
  { id: 'sfax', nameEn: 'Sfax', nameAr: 'صفاقس', postalPrefix: '30' },
  { id: 'kairouan', nameEn: 'Kairouan', nameAr: 'القيروان', postalPrefix: '31' },
  { id: 'kasserine', nameEn: 'Kasserine', nameAr: 'القصرين', postalPrefix: '12' },
  { id: 'sidi_bouzid', nameEn: 'Sidi Bouzid', nameAr: 'سيدي بوزيد', postalPrefix: '91' },
  { id: 'gabes', nameEn: 'Gabès', nameAr: 'قابس', postalPrefix: '60' },
  { id: 'medenine', nameEn: 'Medenine', nameAr: 'مدنين', postalPrefix: '41' },
  { id: 'tataouine', nameEn: 'Tataouine', nameAr: 'تطاوين', postalPrefix: '32' },
  { id: 'gafsa', nameEn: 'Gafsa', nameAr: 'قفصة', postalPrefix: '21' },
  { id: 'tozeur', nameEn: 'Tozeur', nameAr: 'توزر', postalPrefix: '22' },
  { id: 'kebili', nameEn: 'Kebili', nameAr: 'قبلي', postalPrefix: '42' },
] as const

/**
 * Format an amount in Tunisian Dinars (TND)
 * Default: "120.00 TND" or with Arabic symbol "120.00 د.ت"
 */
export function formatTND(amount: number, options?: { useArabicSymbol?: boolean; decimals?: number }): string {
  const decimals = options?.decimals ?? 2
  const formattedNumber = Number(amount || 0).toLocaleString('fr-TN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  if (options?.useArabicSymbol) {
    return `${formattedNumber} ${TUNISIA_DATA.currency.symbol}`
  }
  return `${formattedNumber} ${TUNISIA_DATA.currency.code}`
}

/**
 * Validates Tunisian Phone Number
 * Formats supported: +216XXXXXXXX, 00216XXXXXXXX, or 8-digit local numbers starting with 2, 4, 5, 7, 9
 */
export function isValidTunisianPhone(phone: string): boolean {
  if (!phone) return false
  const clean = phone.replace(/[\s\-\(\)\.]/g, '')
  // +216 followed by 8 digits (starting with 2, 3, 4, 5, 7, or 9)
  const fullRegex = /^(?:\+216|00216)?[234579]\d{7}$/
  return fullRegex.test(clean)
}

/**
 * Format Tunisian phone number to standardized "+216 XX XXX XXX"
 */
export function formatTunisianPhone(phone: string): string {
  if (!phone) return ''
  const clean = phone.replace(/[\s\-\(\)\.]/g, '').replace(/^(?:\+216|00216)/, '')
  if (clean.length === 8) {
    return `+216 ${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5)}`
  }
  return phone
}

/**
 * Validates Tunisian 4-digit postal code (e.g. 1000 for Tunis, 4000 for Sousse, 3000 for Sfax)
 */
export function isValidTunisianPostalCode(code: string): boolean {
  return /^\d{4}$/.test(code.trim())
}

/**
 * Validates Tunisian Carte d'Identité Nationale (CIN)
 * Must be exactly 8 digits
 */
export function isValidTunisianCIN(cin: string): boolean {
  return /^\d{8}$/.test(cin.trim())
}

/**
 * Validates Tunisian Bank RIB (Relevé d'Identité Bancaire)
 * Must be exactly 20 digits: 2 digits bank code + 3 digits branch + 13 digits account + 2 digits key
 */
export function isValidTunisianRIB(rib: string): boolean {
  const clean = rib.replace(/\s+/g, '')
  return /^\d{20}$/.test(clean)
}
