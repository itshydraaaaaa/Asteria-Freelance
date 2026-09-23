import { logger as log } from '@/lib/logger'

export interface RecaptchaAssessmentResult {
  success: boolean
  score: number
  action?: string
  error?: string
  reasons?: string[]
}

/**
 * Verify a reCAPTCHA token using either:
 * 1. Google reCAPTCHA Enterprise CreateAssessment API (if RECAPTCHA_PROJECT_ID & GOOGLE_CLOUD_API_KEY are configured)
 * 2. Legacy / Enterprise siteverify endpoint (using RECAPTCHA_SECRET_KEY)
 */
export async function verifyRecaptcha(
  token: string | null | undefined,
  expectedAction?: string,
  minScore: number = 0.5
): Promise<RecaptchaAssessmentResult> {
  // In development or test environments, allow bypassing if keys or tokens are absent
  if (process.env.NODE_ENV === 'test' || (process.env.NODE_ENV !== 'production' && !token)) {
    return { success: true, score: 1.0, action: expectedAction }
  }

  if (!token) {
    return { success: false, score: 0, error: 'reCAPTCHA token is missing' }
  }

  const projectId = process.env.RECAPTCHA_PROJECT_ID
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6Lct-sotAAAAAJP3cxUTmxs5JYE_TTzH9pG0kPS7'
  const secretKey = process.env.RECAPTCHA_SECRET_KEY || '6Lct-sotAAAAAEn7gcDC0VgNI1gNqM72rVVdOeLf'

  // Method 1: Google Cloud reCAPTCHA Enterprise CreateAssessment API
  if (projectId && apiKey) {
    try {
      const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: {
            token,
            siteKey,
            expectedAction,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        log.warn('RECAPTCHA_ASSESSMENT_API_ERROR', 'Google Cloud reCAPTCHA Enterprise returned non-200', { status: response.status, data })
        // Fall back to siteverify endpoint if assessment call fails
      } else {
        const tokenProperties = data.tokenProperties
        const riskAnalysis = data.riskAnalysis

        if (!tokenProperties?.valid) {
          log.security('RECAPTCHA_INVALID_TOKEN', 'reCAPTCHA token was invalid', {
            invalidReason: tokenProperties?.invalidReason,
            expectedAction,
          })
          return {
            success: false,
            score: 0,
            error: `Invalid token: ${tokenProperties?.invalidReason || 'Verification failed'}`,
            reasons: tokenProperties?.invalidReason ? [tokenProperties.invalidReason] : [],
          }
        }

        if (expectedAction && tokenProperties.action !== expectedAction) {
          log.security('RECAPTCHA_ACTION_MISMATCH', 'reCAPTCHA action did not match expected action', {
            expectedAction,
            actualAction: tokenProperties.action,
          })
          return {
            success: false,
            score: riskAnalysis?.score ?? 0,
            action: tokenProperties.action,
            error: 'reCAPTCHA action mismatch',
          }
        }

        const score = riskAnalysis?.score ?? 1.0
        const isLegit = score >= minScore

        log.security('RECAPTCHA_ASSESSMENT_EVALUATED', 'reCAPTCHA Enterprise assessment completed', {
          score,
          isLegit,
          action: tokenProperties.action,
          reasons: riskAnalysis?.reasons,
        })

        return {
          success: isLegit,
          score,
          action: tokenProperties.action,
          reasons: riskAnalysis?.reasons,
          error: isLegit ? undefined : 'Bot activity detected (score below threshold)',
        }
      }
    } catch (err: any) {
      log.error('RECAPTCHA_ASSESSMENT_EXCEPTION', 'Exception contacting reCAPTCHA Enterprise assessment endpoint', { error: err.message })
    }
  }

  // Method 2: Standard SiteVerify Endpoint
  try {
    const params = new URLSearchParams()
    params.append('secret', secretKey)
    params.append('response', token)

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    const data = await response.json()

    if (!data.success) {
      log.security('RECAPTCHA_SITEVERIFY_FAILED', 'reCAPTCHA siteverify rejected token', {
        errorCodes: data['error-codes'],
        expectedAction,
      })
      return {
        success: false,
        score: 0,
        error: `reCAPTCHA validation failed: ${data['error-codes']?.join(', ') || 'unknown'}`,
        reasons: data['error-codes'],
      }
    }

    const score = typeof data.score === 'number' ? data.score : 1.0
    if (expectedAction && data.action && data.action !== expectedAction) {
      log.security('RECAPTCHA_ACTION_MISMATCH', 'Siteverify action mismatch', {
        expectedAction,
        actualAction: data.action,
      })
      return {
        success: false,
        score,
        action: data.action,
        error: 'reCAPTCHA action mismatch',
      }
    }

    const isLegit = score >= minScore
    log.security('RECAPTCHA_VERIFIED', 'reCAPTCHA verified successfully', {
      score,
      isLegit,
      action: data.action,
    })

    return {
      success: isLegit,
      score,
      action: data.action,
      error: isLegit ? undefined : 'Bot activity detected (score below threshold)',
    }
  } catch (err: any) {
    log.error('RECAPTCHA_VERIFY_EXCEPTION', 'Exception verifying reCAPTCHA siteverify', { error: err.message })
    return {
      success: process.env.NODE_ENV !== 'production', // gracefully allow in non-prod on network failure
      score: 0,
      error: err.message,
    }
  }
}
