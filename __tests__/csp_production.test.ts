import fs from 'fs'
import path from 'path'

describe('Phase 4: CSP & Production Hardening Test Suite', () => {
  describe('Task 4.1: Content-Security-Policy (CSP) Directives', () => {
    it('enforces strict script, connect, and framing policies in next.config.mjs', () => {
      const configPath = path.join(process.cwd(), 'next.config.mjs')
      const configContent = fs.readFileSync(configPath, 'utf-8')

      expect(configContent).toContain("default-src 'self'")
      expect(configContent).toContain("object-src 'none'")
      expect(configContent).toContain("frame-ancestors 'none'")
      expect(configContent).toContain("https://js.stripe.com")
      expect(configContent).toContain("https://api.stripe.com")
      expect(configContent).toContain("https://sandbox.flouci.com")
      expect(configContent).toContain("https://sandbox.gateway.konnect.network")
      expect(configContent).toContain("https://api.exchangerate-api.com")
    })
  })

  describe('Task 4.3: server-only Module Guards', () => {
    const serverOnlyFiles = [
      'lib/ledger.ts',
      'lib/auth.ts',
      'lib/db.ts',
      'lib/fx.ts',
      'lib/email.ts',
    ]

    serverOnlyFiles.forEach(file => {
      it(`verifies '${file}' includes 'server-only' guard`, () => {
        const filePath = path.join(process.cwd(), file)
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        expect(fileContent).toContain("import 'server-only'")
      })
    })
  })
})
