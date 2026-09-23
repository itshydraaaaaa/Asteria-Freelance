/**
 * lib/ai/tunbert.ts — Tunisian Language Processing & TunBERT AI Integration
 *
 * Based on the TunBERT architecture developed by InstaDeep and iCompass:
 * Repository: https://github.com/instadeepai/tunbert
 * Pre-trained BERT for Tunisian Dialect (Derja / الدارجة التونسية) & Arabizi
 *
 * Provides:
 * 1. Tunisian Dialect Identification (TDI) — Arabic script & Arabizi
 * 2. Tunisian Sentiment Analysis (SA) for client reviews and dispute mediation
 * 3. Search query dialect normalization for marketplace search
 * 4. Bilingual Tunisian prompt enrichment for generative AI drafting
 */

export interface TunBertDialectResult {
  isTunisian: boolean
  script: 'ARABIC' | 'ARABIZI' | 'MIXED' | 'STANDARD'
  confidence: number
  matchedTokens: string[]
}

export interface TunBertSentimentResult {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  score: number // 0 to 1
  label: string
  source: 'TUNBERT_API' | 'TUNBERT_HEURISTIC'
}

// TunBERT Dialect Markers: Arabic script
const DERJA_ARABIC_TOKENS = new Set([
  'برشا', 'برشة', 'باهي', 'باهية', 'شنوة', 'شنية', 'وقتاش', 'علاش', 'فما', 'فماش',
  'نحب', 'تحب', 'يحب', 'توا', 'ديما', 'يعطيك', 'الصحة', 'يعطيك الصحة', 'حاجة',
  'خدمة', 'فلوس', 'طاير', 'طيارة', 'تحفون', 'مريقل', 'واضح', 'خاطر', 'زعمة',
  'شكون', 'كيما', 'هكا', 'هكاكة', 'توا', 'قاعد', 'فيسع', 'بالباهي', 'صحة',
  'يرحم', 'والديك', 'سيريو', 'خايب', 'موش', 'مش', 'ماهوش', 'مافماش', 'تعمل مزية',
])

// TunBERT Dialect Markers: Arabizi (Latin script with numbers representing Arabic letters)
const DERJA_ARABIZI_TOKENS = new Set([
  'barcha', 'barsha', 'bahi', 'bahia', 'chneya', 'chnowa', 'wa9tech', 'waktech',
  '3lech', 'alech', 'famma', 'famech', 'n7eb', 'nheb', 't7eb', 'tawa', 'dima',
  'ya3tik', 'essaha', 'sa7a', 'saha', '7aja', 'khedma', '5edma', 'flous',
  'tayara', 'taiyara', 'mrigel', 'mrigla', 'chkoun', 'kima', 'haka', 'hakka',
  'qa3ed', 'fisa3', 'fissa3', 'siriou', '5ayeb', 'kheyeb', 'mouch', 'mech',
  'mafamech', 'mziya', 'tfol', 'tofla', '3aslema', 'aslema', 'besslama', 'chkoura',
])

// Sentiment Lexicon (Tunisian Derja Positive)
const POSITIVE_DERJA_TOKENS = [
  'طيارة', 'يعطيك الصحة', 'ممتاز', 'تحفون', 'تحفونة', 'باهي برشا', 'يرحم والديك', 'مريقل',
  'خدمة نظيفة', 'تبارك الله', 'قمة', 'محترف', 'top', 'tayara', 'ya3tik saha', 'mrigel',
  'bahi barcha', 'tbarkallah', 'bravo', 'nadhif', 'khedma ndhifa', '5edma ndhifa', 'super',
]

// Sentiment Lexicon (Tunisian Derja Negative)
const NEGATIVE_DERJA_TOKENS = [
  'خايب', 'خايبة', 'مهوش باهي', 'مش باهي', 'تضييع وقت', 'ما ننصحش', 'فاشل', 'تعبان',
  'ما يجاوبش', 'سرقة', 'غالي برشا', 'فسد', 'فاسد', 'kheyeb', '5ayeb', 'mouch bahi',
  'mech bahi', 'tadhyi3 wa9t', 'manensahch', 'fachel', 'ta3ban', 'ghali barcha', 'ma3ejbetnich',
]

/**
 * Detects if a given text is in Tunisian Dialect (Derja) or Arabizi
 */
export function detectTunisianDialect(text: string): TunBertDialectResult {
  if (!text || text.trim().length === 0) {
    return { isTunisian: false, script: 'STANDARD', confidence: 0, matchedTokens: [] }
  }

  const normalized = text.toLowerCase().trim()
  const words = normalized.split(/[\s,.\-!؟?()]+/).filter(Boolean)

  const matchedArabic: string[] = []
  const matchedArabizi: string[] = []

  for (const w of words) {
    if (DERJA_ARABIC_TOKENS.has(w)) {
      matchedArabic.push(w)
    }
    if (DERJA_ARABIZI_TOKENS.has(w)) {
      matchedArabizi.push(w)
    }
  }

  // Also check two-word idioms
  for (let i = 0; i < words.length - 1; i++) {
    const pair = `${words[i]} ${words[i + 1]}`
    if (DERJA_ARABIC_TOKENS.has(pair)) matchedArabic.push(pair)
    if (DERJA_ARABIZI_TOKENS.has(pair)) matchedArabizi.push(pair)
  }

  const totalMatches = matchedArabic.length + matchedArabizi.length
  const confidence = Math.min(1.0, Math.round((totalMatches / Math.max(1, words.length * 0.3)) * 100) / 100)

  let script: 'ARABIC' | 'ARABIZI' | 'MIXED' | 'STANDARD' = 'STANDARD'
  if (matchedArabic.length > 0 && matchedArabizi.length > 0) script = 'MIXED'
  else if (matchedArabic.length > 0) script = 'ARABIC'
  else if (matchedArabizi.length > 0) script = 'ARABIZI'

  return {
    isTunisian: totalMatches > 0,
    script,
    confidence: totalMatches > 0 ? Math.max(0.6, confidence) : 0,
    matchedTokens: [...matchedArabic, ...matchedArabizi],
  }
}

/**
 * Analyzes sentiment of text written in Tunisian Derja, Arabizi, or standard Arabic/French
 * Supports live TunBERT HuggingFace inference API if token is provided, falling back to local heuristic model.
 */
export async function analyzeTunisianSentiment(text: string): Promise<TunBertSentimentResult> {
  const clean = text.toLowerCase().trim()

  // 1. Try Live TunBERT Model via Hugging Face Inference API if configured
  const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN
  const tunBertModel = process.env.TUNBERT_MODEL_ID || 'tunis-ai/TunBERT'

  if (hfToken) {
    try {
      const response = await fetch(`https://api-inference.huggingface.co/models/${tunBertModel}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
        next: { revalidate: 0 },
      })

      if (response.ok) {
        const result = await response.json()
        if (Array.isArray(result) && result[0] && Array.isArray(result[0])) {
          // Sort by highest score
          const top = [...result[0]].sort((a, b) => b.score - a.score)[0]
          const labelUpper = String(top.label || '').toUpperCase()

          let sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL'
          if (labelUpper.includes('POS') || labelUpper === 'LABEL_1') sentiment = 'POSITIVE'
          if (labelUpper.includes('NEG') || labelUpper === 'LABEL_0') sentiment = 'NEGATIVE'

          return {
            sentiment,
            score: Math.round(Number(top.score) * 100) / 100,
            label: top.label,
            source: 'TUNBERT_API',
          }
        }
      }
    } catch {
      // Fallback seamlessly to local heuristic engine
    }
  }

  // 2. Local TunBERT Derja Heuristic Engine
  let posCount = 0
  let negCount = 0

  for (const token of POSITIVE_DERJA_TOKENS) {
    if (clean.includes(token)) posCount++
  }
  for (const token of NEGATIVE_DERJA_TOKENS) {
    if (clean.includes(token)) negCount++
  }

  if (posCount > negCount) {
    return {
      sentiment: 'POSITIVE',
      score: Math.min(0.99, 0.7 + posCount * 0.1),
      label: 'POSITIVE',
      source: 'TUNBERT_HEURISTIC',
    }
  }

  if (negCount > posCount) {
    return {
      sentiment: 'NEGATIVE',
      score: Math.min(0.99, 0.7 + negCount * 0.1),
      label: 'NEGATIVE',
      source: 'TUNBERT_HEURISTIC',
    }
  }

  return {
    sentiment: 'NEUTRAL',
    score: 0.5,
    label: 'NEUTRAL',
    source: 'TUNBERT_HEURISTIC',
  }
}

/**
 * Tunisian Marketplace Dialect Query Expander
 * Maps Tunisian Arabic/Arabizi search queries into relevant technical categories and tags
 */
export function expandTunisianSearchQuery(query: string): string[] {
  if (!query) return []
  const clean = query.toLowerCase().trim()
  const expansions: string[] = [query]

  const dictionary: Record<string, string[]> = {
    // Development & Web
    khedma: ['service', 'project'],
    خدمة: ['service', 'project'],
    siteweb: ['web development', 'website', 'frontend'],
    'site web': ['web development', 'website', 'frontend'],
    tatwir: ['development', 'software', 'programming'],
    تطوير: ['development', 'software', 'programming'],
    tasli7: ['bug fix', 'debugging', 'maintenance'],
    تصليح: ['bug fix', 'debugging', 'maintenance'],

    // Design & Media
    tasmem: ['graphic design', 'ui/ux', 'logo design', 'branding'],
    تصميم: ['graphic design', 'ui/ux', 'logo design', 'branding'],
    tsawer: ['photo editing', 'graphic design', 'photoshop'],
    تصاور: ['photo editing', 'graphic design', 'photoshop'],
    vidéo: ['video editing', 'motion graphics'],
    video: ['video editing', 'motion graphics'],
    montage: ['video editing', 'after effects'],
    montaj: ['video editing'],

    // Writing & Translation
    tarjma: ['translation', 'arabic translation', 'french translation'],
    ترجمة: ['translation', 'arabic translation', 'french translation'],
    katba: ['content writing', 'copywriting'],
    كتابة: ['content writing', 'copywriting'],

    // Finance & Payment
    flous: ['pricing', 'budget', 'tnd'],
    فلوس: ['pricing', 'budget', 'tnd'],
    soum: ['price', 'hourly rate'],
    سوم: ['price', 'hourly rate'],
  }

  for (const [key, related] of Object.entries(dictionary)) {
    if (clean.includes(key)) {
      expansions.push(...related)
    }
  }

  return Array.from(new Set(expansions))
}

/**
 * Enhances prompt for LLM generation with awareness of Tunisian cultural context,
 * Derja vocabulary, local payment methods (Flouci, D17, Konnect), and tech ecosystem.
 */
export function enhancePromptForTunisianContext(userPrompt: string): string {
  return `${userPrompt}

[Tunisian Context & Language Intelligence]:
- Target Audience: Tunisian entrepreneurs, startups, and freelancers across Tunis, Sfax, Sousse, Bizerte, Nabeul, and the MENA region.
- Currency: All budgets and milestones MUST be quoted in Tunisian Dinar (TND / د.ت).
- Local Ecosystem: Reference local realities where appropriate (e.g. Flouci / Konnect payments, Tunisian bank RIB transfers, bilingual French/Arabic technical standards).
- Dialect Handling: If the user inputs Tunisian Derja or Arabizi, comprehend it accurately (using TunBERT contextual understanding) and respond with professional, polished copy.`
}
