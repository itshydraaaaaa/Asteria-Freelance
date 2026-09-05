# HARDCODED VALUES, FALLBACK SECRETS & STATIC CONFIGURATION REPORT
**Document Version**: 1.0.0  
**Target System**: Asteria Freelance Platform  
**Scope**: Repository-wide scan for hardcoded credentials, fallback strings, static business rules & endpoints  

---

## 1. EXECUTIVE SUMMARY

Relying on hardcoded fallback secrets in security-critical code paths compromises the confidentiality and integrity of user accounts, payment transactions, and administrative governance. If an environment variable is omitted or fails to inject in production, the application silently falls back to known static strings, allowing attackers to forge signatures and bypass authentication.

This report catalogs all hardcoded strings, API keys, fallback secrets, static business logic constants, and credentials discovered in the Asteria Freelance codebase.

---

## 2. HARDCODED SECRETS & CRYPTOGRAPHIC FALLBACKS

### 2.1 Flouci Webhook HMAC Fallback Secret
- **Location**: `app/api/payments/flouci/route.ts:L53`
- **Hardcoded Value**: `'asteria_flouci_sandbox_secret'`
- **Code Context**:
  ```typescript
  const secret = process.env.FLOUCI_APP_SECRET || 'asteria_flouci_sandbox_secret'
  ```
- **Severity**: 🔴 Critical
- **Vulnerability**: If `FLOUCI_APP_SECRET` is not provided in `.env.production`, an attacker can calculate HMAC signatures using `'asteria_flouci_sandbox_secret'` and send fake payment confirmations to credit unlimited funds to their account.
- **Remediation**: Fail closed immediately if `process.env.FLOUCI_APP_SECRET` is undefined.

---

### 2.2 Konnect Webhook HMAC Fallback Key
- **Location**: `app/api/payments/konnect/route.ts:L53`
- **Hardcoded Value**: `'asteria_konnect_sandbox_key'`
- **Code Context**:
  ```typescript
  const secret = process.env.KONNECT_WEBHOOK_SECRET || 'asteria_konnect_sandbox_key'
  ```
- **Severity**: 🔴 Critical
- **Vulnerability**: Allows forging Konnect payment webhook events when the environment variable is unset.
- **Remediation**: Fail closed immediately if `process.env.KONNECT_WEBHOOK_SECRET` is undefined.

---

### 2.3 JWT Authentication Fallback Secret
- **Location**: `lib/auth.ts:L18`
- **Hardcoded Value**: `'your-secret-key-min-32-chars-long!!'`
- **Code Context**:
  ```typescript
  const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long!!'
  )
  ```
- **Severity**: 🔴 Critical
- **Vulnerability**: If `JWT_SECRET` is omitted in the environment, any attacker can sign arbitrary JWT tokens with `{ role: 'ADMIN' }` using this publicly known key and authenticate as any user.
- **Remediation**: Throw an error at module evaluation time if `!process.env.JWT_SECRET`.

---

### 2.4 Reconciliation Cron Job Fallback Secret
- **Location**: `app/api/cron/reconciliation/route.ts:L16`
- **Hardcoded Value**: `'default_secret'`
- **Code Context**:
  ```typescript
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'default_secret'}`)
  ```
- **Severity**: 🟠 High
- **Vulnerability**: Anyone can invoke the nightly balance reconciliation endpoint by sending `Authorization: Bearer default_secret`.
- **Remediation**: Remove fallback; require a strong 64-character hex secret.

---

## 3. HARDCODED CREDENTIALS & SPECIAL ACCOUNTS

### 3.1 Hardcoded Admin Email Backdoor
- **Location 1**: `app/actions/auth.ts:L72`
- **Location 2**: `lib/db.ts:L22`
- **Hardcoded Value**: `'itshydraaaaaa@gmail.com'`
- **Code Context**:
  ```typescript
  // app/actions/auth.ts:
  let user = await db.getUserByEmail('itshydraaaaaa@gmail.com')
  if (!user) {
    user = await db.createUser({
      email: 'itshydraaaaaa@gmail.com',
      password: 'admin_password_123',
      role: 'ADMIN'
    })
  }
  ```
- **Severity**: 🔴 Critical
- **Vulnerability**: Creates a hardcoded super-admin account tied to an external personal email address, complete with a default password and pre-funded $10,000 balance.
- **Remediation**: Delete this logic completely. Seed initial admin accounts through secure offline database migration scripts.

---

### 3.2 Hardcoded Demo Seed Users
- **Location**: `lib/db.ts:L25-L50`
- **Hardcoded Accounts**:
  - `admin1` (`itshydraaaaaa@gmail.com`, role: `ADMIN`)
  - `demo-client` (`client@asteria.local`, role: `CLIENT`)
  - `demo-freelancer` (`freelancer@asteria.local`, role: `FREELANCER`)
- **Severity**: 🟠 High
- **Remediation**: Remove in-memory mock user seeds from production code.

---

## 4. HARDCODED BUSINESS LOGIC & FINANCIAL CONSTANTS

### 4.1 Fixed Platform Commission Fee
- **Location**: `lib/ledger.ts:L40`
- **Hardcoded Value**: `0.12` (12%)
- **Code Context**:
  ```typescript
  const PLATFORM_FEE_PERCENT = 0.12
  ```
- **Analysis**: Hardcoding platform fees inside application code prevents dynamic commission adjustment, promotional discounts, tiered pricing, or enterprise fee waivers.
- **Remediation**: Move platform fees to a `platform_settings` table in PostgreSQL.

---

### 4.2 Hardcoded Foreign Exchange Rates
- **Location**: `lib/fx.ts:L5-L10`
- **Hardcoded Values**:
  - `USD_TO_TND = 3.12`
  - `TND_TO_USD = 0.32`
- **Analysis**: If the external FX API fails, currency conversions fall back to static 3.12 / 0.32 ratios. Real-world currency exchange market movements create arbitrage opportunities where users can deposit TND, convert to USD at stale rates, and withdraw more value than originally funded.
- **Remediation**: Cache dynamic FX rates with a strict freshness threshold (e.g. 1 hour) and reject transactions if rates are older than 24 hours.

---

### 4.3 Arbitrary Demo Wallet Credit
- **Location**: `app/actions/auth.ts:L88`
- **Hardcoded Value**: `10000` ($10,000.00 USD)
- **Code Context**:
  ```typescript
  await db.updateWalletBalance(user.id, 10000)
  ```
- **Severity**: 🔴 Critical Financial Vulnerability
- **Analysis**: Anyone clicking "Quick Admin Demo" is automatically minted $10,000 in spendable balance.

---

## 5. ENVIRONMENT VARIABLE SPECIFICATION SCHEMA

To prevent hardcoded fallback vulnerabilities, the application must adopt a strict environment schema that validates all variables at build and boot time using Zod:

```typescript
// env.mjs (Recommended validation schema)
import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
    JWT_SECRET: z.string().min(32),
    STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
    FLOUCI_APP_TOKEN: z.string().min(10),
    FLOUCI_APP_SECRET: z.string().min(10),
    KONNECT_API_KEY: z.string().min(10),
    KONNECT_WEBHOOK_SECRET: z.string().min(10),
    CRON_SECRET: z.string().min(32),
    GEMINI_API_KEY: z.string().min(10).optional(),
    RESEND_API_KEY: z.string().startsWith("re_").optional(),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    FLOUCI_APP_TOKEN: process.env.FLOUCI_APP_TOKEN,
    FLOUCI_APP_SECRET: process.env.FLOUCI_APP_SECRET,
    KONNECT_API_KEY: process.env.KONNECT_API_KEY,
    KONNECT_WEBHOOK_SECRET: process.env.KONNECT_WEBHOOK_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
})
```

---

## 6. COMPLETE HARDCODED VALUES INVENTORY TABLE

| File Path | Line | Type | Hardcoded Value | Risk Level |
|---|---|---|---|---|
| `app/api/payments/flouci/route.ts` | L53 | Fallback Secret | `'asteria_flouci_sandbox_secret'` | 🔴 Critical |
| `app/api/payments/konnect/route.ts` | L53 | Fallback Secret | `'asteria_konnect_sandbox_key'` | 🔴 Critical |
| `lib/auth.ts` | L18 | Fallback Secret | `'your-secret-key-min-32-chars-long!!'` | 🔴 Critical |
| `app/api/cron/reconciliation/route.ts`| L16 | Fallback Secret | `'default_secret'` | 🟠 High |
| `app/actions/auth.ts` | L72 | Hardcoded Email | `'itshydraaaaaa@gmail.com'` | 🔴 Critical |
| `app/actions/auth.ts` | L75 | Hardcoded Password | `'admin_password_123'` | 🔴 Critical |
| `app/actions/auth.ts` | L88 | Hardcoded Balance | `10000` ($10,000.00) | 🔴 Critical |
| `lib/ledger.ts` | L40 | Platform Fee | `0.12` (12%) | 🟡 Medium |
| `lib/ledger.ts` | L410 | Platform Account ID | `'platform'` (Non-UUID String) | 🔴 Critical |
| `lib/fx.ts` | L5-L6 | Fixed FX Rates | `3.12` (USD/TND), `0.32` (TND/USD) | 🟡 Medium |
| `app/freelancers/[id]/page.tsx` | L88-L105 | Fake Reviewers | "Sami Mansour", "Nour El Houda" | 🟡 Medium |
| `app/gig/[id]/page.tsx` | L120-L140 | Fake Reviewers | "Sami Mansour", "TechCorp Inc." | 🟡 Medium |
| `app/api/ai/generate/route.ts` | L35-L48 | Mock AI Text | Static Proposal Template String | 🟡 Medium |
