import fs from 'fs'
import path from 'path'

describe('Task 12.2: Security Headers Regression Tests', () => {
  it('verifies next.config.mjs provides strict security headers (COOP, CSP, HSTS, X-Frame-Options)', () => {
    const configPath = path.resolve(__dirname, '../next.config.mjs')
    const configContent = fs.readFileSync(configPath, 'utf-8')

    expect(configContent).toContain("key: 'Cross-Origin-Opener-Policy', value: 'same-origin'")
    expect(configContent).toContain("key: 'X-Frame-Options', value: 'DENY'")
    expect(configContent).toContain("key: 'X-Content-Type-Options', value: 'nosniff'")
    expect(configContent).toContain("key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'")
    expect(configContent).toContain("key: 'Strict-Transport-Security'")
    expect(configContent).toContain('max-age=63072000; includeSubDomains; preload')
    expect(configContent).toContain("default-src 'self'")
    expect(configContent).toContain("frame-ancestors 'none'")
  })
})
