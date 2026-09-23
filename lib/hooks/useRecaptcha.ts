'use client'

import { useCallback } from 'react'

/**
 * Hook to execute Google reCAPTCHA Enterprise assessments on the client.
 */
export function useRecaptcha() {
  const executeRecaptcha = useCallback(async (action: string): Promise<string | null> => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6Lct-sotAAAAAJP3cxUTmxs5JYE_TTzH9pG0kPS7'
    if (typeof window === 'undefined') return null

    const grecaptcha = (window as any).grecaptcha

    // Fallback if script has not finished loading or is blocked
    if (!grecaptcha?.enterprise) {
      return null
    }

    return new Promise((resolve) => {
      try {
        grecaptcha.enterprise.ready(async () => {
          try {
            const token = await grecaptcha.enterprise.execute(siteKey, { action })
            resolve(token)
          } catch (err) {
            console.warn('reCAPTCHA enterprise execution failed:', err)
            resolve(null)
          }
        })
      } catch (err) {
        console.warn('reCAPTCHA enterprise ready failed:', err)
        resolve(null)
      }
    })
  }, [])

  return { executeRecaptcha }
}
