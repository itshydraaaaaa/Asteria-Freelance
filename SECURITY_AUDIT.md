# COMPREHENSIVE SECURITY AUDIT & THREAT MODEL
**Document Version**: 1.0.0  
**Target System**: Asteria Freelance Platform  
**Standard**: OWASP Top 10 (2021 / 2025) & CWE Standards  
**Audit Finding**: 🚨 **EXTREME RISK — MULTIPLE CRITICAL VULNERABILITIES DETECTED**

---

## 1. THREAT MODEL & ATTACK SURFACE SUMMARY

The Asteria Freelance application exposes a wide attack surface across its public web interfaces, Next.js Server Actions, REST API route handlers, database Row-Level Security policies, and third-party payment integration hooks.

```
       [ External Attacker ] -------------------------------------------------------------+
                 |                                                                        |
                 | HTTP Requests                                                          |
                 v                                                                        |
     +-----------------------+                                                            |
     | Next.js App Router UI |                                                            |
     +-----------------------+                                                            |
        |                 |                                                               |
        | Direct Access   | Server Actions                                                |
        v                 v                                                               |
  [ Admin Page ]    [ loginAsAdminDemo() ]                                                |
   (NO AUTH CHECK)   (PUBLIC ACTION)                                                      |
        |                 |                                                               |
        +--------+--------+                                                               |
                 |                                                                        |
                 v                                                                        |
        [ Elevated Admin Rights ]                                                         |
                 |                                                                        |
                 +-----------------------+                                                |
                                         |                                                |
                                         v                                                |
                              +--------------------+                                      |
                              |   REST API & Webhooks                                     |
                              +--------------------+                                      |
                                 |          |       |                                     |
    +----------------------------+          |       +-----------------------------+       |
    |                                       |                                     |       |
    v                                       v                                     v       |
[ /api/stripe/checkout ]        [ /api/payments/flouci ]                [ /api/kyc/webhook ]      |
 (Client sets price)             (Hardcoded HMAC secret)                 (Missing signature)      |
    |                                       |                                     |       |
    +---------------------------------------+-------------------------------------+       |
                                            |                                             |
                                            v                                             |
                              +---------------------------+                               |
                              | Supabase PostgreSQL DB    |<------------------------------+
                              | (RLS: Open to Anon World) |   Direct Supabase REST API
                              +---------------------------+   using Anon Key
```

---

## 2. OWASP TOP 10 VULNERABILITY BREAKDOWN

### 2.1 A01: Broken Access Control

#### VULN-SEC-01: Public Admin Dashboard Access via Defective Guard
- **File**: `app/dashboard/admin/page.tsx:L12-L15`
- **CWE**: CWE-284 (Improper Access Control), CWE-697 (Incorrect Comparison)
- **CVSS v3.1**: 9.8 (Critical)
- **Vulnerable Code**:
  ```typescript
  export default async function AdminPage() {
    const session = await getSession()
    const role = (session?.user as any)?.role ?? 'ADMIN'
    
    // DEFECT: If session.user is null, role is 'ADMIN', condition is false:
    if (role !== 'ADMIN' && session?.user) {
      redirect('/dashboard')
    }
    // Execution continues -> Full admin UI & database dumped to anonymous user!
  ```
- **Exploitation Scenario**: An attacker navigates to `https://platform.com/dashboard/admin` in an incognito window with no cookies. The page renders complete user listings, wallet balances, transaction logs, and platform stats.
- **Remediation**:
  ```typescript
  const session = await getSession()
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login')
  }
  ```

---

#### VULN-SEC-02: Universal `demo_user_id` Authentication Bypass
- **Files**: `lib/auth.ts:L31-L42`, `middleware.ts:L41-L47`
- **CWE**: CWE-288 (Authentication Bypass Using Alternate Path)
- **CVSS v3.1**: 9.8 (Critical)
- **Vulnerable Code**:
  ```typescript
  // lib/auth.ts:
  const demoUserId = cookieStore.get('demo_user_id')
  if (demoUserId) {
    const user = await db.getUserById(demoUserId.value)
    if (user) {
      return { user: { id: user.id, email: user.email, role: user.role } }
    }
  }
  ```
- **Exploitation Scenario**: An attacker inspects browser storage, adds a cookie `demo_user_id=admin1`, and refreshes the page. The system immediately trusts the cookie without cryptographic verification and grants administrator permissions.
- **Remediation**: Completely delete the `demo_user_id` cookie check from `lib/auth.ts` and `middleware.ts`.

---

#### VULN-SEC-03: Public Server Action for Admin Elevation (`loginAsAdminDemo`)
- **File**: `app/actions/auth.ts:L69-L99`
- **CWE**: CWE-285 (Improper Authorization)
- **CVSS v3.1**: 9.8 (Critical)
- **Vulnerable Code**:
  ```typescript
  export async function loginAsAdminDemo() {
    // Finds or creates user with email itshydraaaaaa@gmail.com
    // Sets role = 'ADMIN'
    // Credits $10,000 to user wallet
    // Sets demo_user_id cookie
  }
  ```
- **Exploitation Scenario**: Next.js Server Actions are public HTTP POST endpoints. Any user or external script can dispatch a POST request with header `Next-Action: [hash]` to invoke `loginAsAdminDemo`, immediately escalating their account to Admin with $10,000 balance.
- **Remediation**: Delete `loginAsAdminDemo` from production code.

---

#### VULN-SEC-04: KYC Webhook Authentication Bypass via Missing Signature
- **File**: `app/api/kyc/webhook/route.ts:L15-L23`
- **CWE**: CWE-347 (Improper Verification of Cryptographic Signature)
- **CVSS v3.1**: 8.8 (High)
- **Vulnerable Code**:
  ```typescript
  const signature = req.headers.get('x-kyc-signature')
  // DEFECT: If signature is null/undefined, this condition evaluates to FALSE!
  if (signature && signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  // Attacker who sends NO header is approved!
  ```
- **Exploitation Scenario**: An attacker submits a POST request to `/api/kyc/webhook` with payload `{ "userId": "victim_id", "status": "APPROVED" }` and omits the `x-kyc-signature` header entirely. The server approves the verification without error.
- **Remediation**: Change to `if (!signature || signature !== expectedSignature) return NextResponse.json(...)`.

---

### 2.2 A02: Cryptographic Failures

#### VULN-SEC-05: Plaintext Password Storage and Administration Leak
- **Files**: `app/actions/auth.ts:L53, L169`, `app/api/admin/users/route.ts:L22`
- **CWE**: CWE-256 (Plaintext Storage of a Password), CWE-312 (Cleartext Storage of Sensitive Information)
- **CVSS v3.1**: 9.1 (Critical)
- **Vulnerable Code**:
  ```typescript
  // app/actions/auth.ts:
  await db.createUser({
    email,
    password: password, // UNHASHED PLAINTEXT
    role: role || 'CLIENT'
  })
  
  // Login check:
  if (user.password !== password) {
    return { error: 'Invalid credentials' }
  }
  ```
- **Impact**: Any database breach, SQL log dump, or admin dashboard inspection exposes all user passwords in clear text.
- **Remediation**: Implement `bcryptjs` or `argon2id` with work factor 12+.

---

#### VULN-SEC-06: Hardcoded Cryptographic Fallback Secrets
- **Files**: `app/api/payments/flouci/route.ts:L53`, `app/api/payments/konnect/route.ts:L53`, `lib/auth.ts:L18`
- **CWE**: CWE-798 (Use of Hard-coded Credentials)
- **CVSS v3.1**: 9.1 (Critical)
- **Vulnerable Code**:
  ```typescript
  // Flouci:
  const secret = process.env.FLOUCI_APP_SECRET || 'asteria_flouci_sandbox_secret'
  
  // Konnect:
  const secret = process.env.KONNECT_WEBHOOK_SECRET || 'asteria_konnect_sandbox_key'
  
  // JWT Auth:
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long!!'
  ```
- **Exploitation Scenario**: If any environment variable is missing in deployment, attackers generate HMAC signatures or sign arbitrary JWTs using the public fallback strings extracted from GitHub or client bundles.
- **Remediation**: Fail closed. Crash startup or return HTTP 500 if environment secrets are undefined. Never use default fallback strings for secrets.

---

### 2.3 A03: Injection & Business Logic Tampering

#### VULN-SEC-07: Client-Controlled Order Price Tampering in Stripe Checkout
- **File**: `app/api/stripe/checkout/route.ts:L26-L41`
- **CWE**: CWE-602 (Client-Side Enforcement of Server-Side Security), CWE-20 (Improper Input Validation)
- **CVSS v3.1**: 9.3 (Critical)
- **Vulnerable Code**:
  ```typescript
  export async function POST(req: Request) {
    const { orderId, amount, currency = 'usd' } = await req.json()
    // Directly charges the amount submitted by client!
    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price_data: {
          unit_amount: Math.round(amount * 100),
          ...
        }
      }],
      metadata: { orderId }
    })
  ```
- **Exploitation Scenario**:
  1. Attacker commissions a $2,500 enterprise mobile app gig (`orderId: "ord-999"`).
  2. Attacker intercepts checkout POST request and changes `amount: 2500` to `amount: 0.50`.
  3. Attacker pays 50 cents on Stripe.
  4. Stripe webhook fires `checkout.session.completed` for `ord-999`.
  5. Asteria backend marks order `IN_PROGRESS` and funds escrow with full contract status.
  6. On completion, the freelancer is paid $2,200 ($2,500 minus 12% fee) out of platform liquidity, netting the attacker a massive financial theft.
- **Remediation**: Query `order.total_amount` from the database using `orderId`. Ignore `amount` in client payload.

---

### 2.4 A05: Security Misconfiguration

#### VULN-SEC-08: Supabase RLS Bypassed via Universal Open Policy
- **File**: `supabase/migrations/20260823083000_add_missing_columns.sql:L45-L75`
- **CWE**: CWE-284 (Improper Access Control)
- **CVSS v3.1**: 9.4 (Critical)
- **Vulnerable Code**:
  ```sql
  CREATE POLICY "Allow all operations for anon" ON "User" FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all operations for anon" ON "Order" FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all operations for anon" ON "Wallet" FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "Allow all operations for anon" ON "Transaction" FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  ```
- **Exploitation Scenario**: Any individual on the internet with the public Supabase URL and Anon Key (which is exposed in frontend browser JS) can execute:
  ```bash
  curl -X PATCH 'https://[project].supabase.co/rest/v1/Wallet?id=eq.any_id' \
    -H "apikey: [anon_key]" \
    -H "Content-Type: application/json" \
    -d '{"balance": 999999}'
  ```
- **Remediation**: Drop all open `TO anon` policies. Enforce strict `auth.uid() = user_id` rules.

---

### 2.5 A04: Concurrency Race Conditions

#### VULN-SEC-09: Race Condition / Double-Spend on Wallet Withdrawals
- **File**: `app/api/wallet/withdraw/route.ts:L33-L50`
- **CWE**: CWE-362 (Concurrent Execution using Shared Resource with Improper Synchronization)
- **CVSS v3.1**: 8.1 (High)
- **Vulnerable Code**:
  ```typescript
  const wallet = await db.getWallet(session.user.id)
  if (wallet.balance < amount) {
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
  }
  // Time gap allows parallel requests:
  await db.updateWalletBalance(session.user.id, wallet.balance - amount)
  ```
- **Exploitation Scenario**: A user with $100 balance submits 5 concurrent withdrawal requests for $100 simultaneously via an automated script. All 5 read `$100 balance >= $100` before the first update completes, causing 5 withdrawals ($500) against a $100 balance.
- **Remediation**: Execute balance deductions inside a database transaction with `SELECT balance FROM wallets WHERE user_id = $1 FOR UPDATE`.

---

## 3. SECURITY COMPLIANCE SCORECARD

| Security Domain | Status | Key Risk |
|---|---|---|
| **Access Control (RBAC)** | 🔴 Critical | Admin routes unauthenticated; demo backdoor active |
| **Authentication & Sessions** | 🔴 Critical | Plaintext passwords; unverified demo cookies |
| **Data Protection at Rest** | 🔴 Critical | Passwords and financial accounts unencrypted |
| **Payment Integrity** | 🔴 Critical | Client-tampered prices; webhook secret fallback |
| **Database Security (RLS)** | 🔴 Critical | Full CRUD granted to anonymous web traffic |
| **Input Validation** | 🟠 High | No Zod schemas on API payloads |
| **Concurrency & Race Conditions**| 🟠 High | Wallet deductions lack pessimistic row locking |
| **Rate Limiting & DoS** | 🟠 High | AI and auth endpoints unprotected against floods |
| **Transport Security (Cookies)** | 🟡 Medium | Missing `secure: true` and `sameSite: 'lax'` flags |
