# PROJECT AUDIT ACTION PLAN & ENGINEERING REMEDIATION ROADMAP
**Document Version**: 1.0.0  
**Target System**: Asteria Freelance Platform  
**Target Completion**: Prioritized 4-Phase Sprint  

---

## 1. REMEDIATION OVERVIEW & PRIORITY MATRIX

This action plan provides a step-by-step engineering roadmap to transform the Asteria Freelance codebase from its current high-risk state into a secure, robust, scalable, and production-ready freelance marketplace.

Remediation is broken down into four distinct phases ordered strictly by risk impact:
- **Phase 0: Emergency Security Hotfixes** (Target: Hours 0–24) — Patch active backdoors, credential leaks, and financial fraud vectors.
- **Phase 1: Database & Persistence Layer Consolidation** (Target: Days 2–4) — Eliminate split-brain in-memory storage, harmonize PostgreSQL schema, and restore Row-Level Security.
- **Phase 2: Financial Ledger & Escrow Hardening** (Target: Days 5–7) — Ensure atomic double-entry transactions, state machine validation, and idempotency persistence.
- **Phase 3: Frontend Integrity, Bug Fixes & UX Realism** (Target: Days 8–10) — Connect disconnected UI actions, eliminate fake mock data, fix category filters, and resolve missing dependencies.
- **Phase 4: CI/CD, Infrastructure & Production Readiness** (Target: Days 11–14) — Edge rate limiting, automated testing pipelines, logging/telemetry, and Docker configuration.

```
+---------------------------------------------------------------------------------------+
| PHASE 0: EMERGENCY HOTFIXES                                                           |
| [X] Kill admin backdoor   [X] Remove demo_user_id   [X] Fix price tampering in Stripe |
| [X] Hash passwords        [X] Fix KYC webhook check [X] Fail-closed webhook secrets   |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| PHASE 1: PERSISTENCE & SCHEMA UNIFICATION                                             |
| [X] Harmonize snake_case PostgreSQL schema        [X] Migrate in-memory maps to DB    |
| [X] Lock down Supabase RLS (kill open policies)   [X] Fix 'platform' UUID bug         |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| PHASE 2: FINANCIAL INTEGRITY & ESCROW HARDENING                                       |
| [X] Atomic DB ledger functions with row locking   [X] Escrow state machine validation|
| [X] Persistent DB idempotency keys                [X] Real wallet withdrawal API flow |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| PHASE 3 & 4: FRONTEND, QA & DEVOPS HARDENING                                          |
| [X] Wire up real reviews & real user categories   [X] Fix notifications crash         |
| [X] Install/replace 'resend' dependency           [X] Upstash rate limiting & CI/CD  |
+---------------------------------------------------------------------------------------+
```

---

## 2. PHASE 0: EMERGENCY SECURITY HOTFIXES (HOURS 0–24)

### 2.1 Patch Unauthenticated Admin Access
- **Target File**: `app/dashboard/admin/page.tsx`
- **Issue**: Unauthenticated requests default role to `'ADMIN'` and bypass redirection.
- **Remediation Action**:
  ```typescript
  // Replace L12-L15:
  const session = await getSession()
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login?error=admin_required')
  }
  ```
- **Verification**: Attempt opening `/dashboard/admin` in an incognito window with no cookies; confirm immediate redirect to `/login`.

### 2.2 Eliminate the `demo_user_id` Authentication Bypass Backdoor
- **Target Files**: `lib/auth.ts`, `middleware.ts`
- **Issue**: Presence of `demo_user_id` cookie bypasses all token validation and logs in any user ID.
- **Remediation Action**:
  1. In `lib/auth.ts`, delete the block reading `cookieStore.get('demo_user_id')`.
  2. In `middleware.ts`, remove `const isDemo = req.cookies.has('demo_user_id')` and the bypass logic.
  3. Validate sessions solely through signed JWTs using Supabase `auth.getUser()` or verified HMAC tokens.

### 2.3 Delete Public Admin Promotion Action (`loginAsAdminDemo`)
- **Target Files**: `app/actions/auth.ts`, `app/login/page.tsx`
- **Issue**: `loginAsAdminDemo` is an exported server action callable via public POST request.
- **Remediation Action**:
  1. Remove `loginAsAdminDemo` function from `app/actions/auth.ts`.
  2. Remove the "Quick Demo Admin" button from `app/login/page.tsx`.

### 2.4 Server-Side Verification of Stripe Checkout Prices
- **Target File**: `app/api/stripe/checkout/route.ts`
- **Issue**: `amount` is taken directly from request body.
- **Remediation Action**:
  ```typescript
  const { orderId } = await req.json()
  const order = await db.getOrderById(orderId)
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  
  // Calculate verified server amount in cents:
  const verifiedAmountCents = Math.round(Number(order.total_amount || order.amount) * 100)
  ```
- **Verification**: Send `{ "orderId": "...", "amount": 0.50 }` via curl; verify Stripe session is created with the database price, not 50 cents.

### 2.5 Eliminate Webhook Fallback Secrets (Fail-Closed)
- **Target Files**: `app/api/payments/flouci/route.ts`, `app/api/payments/konnect/route.ts`
- **Issue**: Fallback strings permit forging valid HMAC signatures with public sandbox keys.
- **Remediation Action**:
  ```typescript
  const secret = process.env.FLOUCI_APP_SECRET
  if (!secret) {
    console.error('CRITICAL: FLOUCI_APP_SECRET environment variable is missing.')
    return NextResponse.json({ error: 'Webhook service misconfigured' }, { status: 500 })
  }
  ```

### 2.6 Patch KYC Webhook Verification Bypass
- **Target File**: `app/api/kyc/webhook/route.ts`
- **Issue**: `if (signature && signature !== expectedSignature)` evaluates to false when signature header is missing.
- **Remediation Action**:
  ```typescript
  const signature = req.headers.get('x-kyc-signature')
  if (!signature || signature !== expectedSignature) {
    return NextResponse.json({ error: 'Unauthorized signature' }, { status: 401 })
  }
  ```

### 2.7 Password Hashing & Admin API Credential Sanitization
- **Target Files**: `app/actions/auth.ts`, `app/api/admin/users/route.ts`
- **Issue**: Passwords stored as plaintext and returned in API responses.
- **Remediation Action**:
  1. Install `bcryptjs`: `npm install bcryptjs @types/bcryptjs`.
  2. In `app/actions/auth.ts`: hash passwords on register:
     `const password_hash = await bcrypt.hash(password, 12)`.
  3. Verify passwords on login:
     `const valid = await bcrypt.compare(password, user.password_hash)`.
  4. In `app/api/admin/users/route.ts`: map user results to strip `password` and `password_hash` before returning.

---

## 3. PHASE 1: DATABASE & PERSISTENCE CONSOLIDATION (DAYS 2–4)

### 3.1 PostgreSQL Schema Harmonization
- **Issue**: Dual schemas exist with mixed casing: `users` vs `"User"`, `orders` vs `"Order"`.
- **Remediation Action**:
  1. Create migration `005_consolidate_schema.sql`.
  2. Standardize on PostgreSQL standard lowercase snake_case:
     - `users` (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT UNIQUE, password_hash TEXT, full_name TEXT, role TEXT, avatar_url TEXT, category TEXT, skills TEXT[], badge TEXT, created_at TIMESTAMPTZ)
     - `gigs` (id UUID PRIMARY KEY, freelancer_id UUID REFERENCES users(id), title TEXT, description TEXT, price NUMERIC(12,2), category TEXT, created_at TIMESTAMPTZ)
     - `orders` (id UUID PRIMARY KEY, gig_id UUID REFERENCES gigs(id), client_id UUID REFERENCES users(id), freelancer_id UUID REFERENCES users(id), total_amount NUMERIC(12,2), status TEXT, escrow_status TEXT, created_at TIMESTAMPTZ)
     - `wallets` (id UUID PRIMARY KEY, user_id UUID UNIQUE REFERENCES users(id), balance NUMERIC(14,2) DEFAULT 0.00 CHECK (balance >= 0), currency VARCHAR(3) DEFAULT 'USD', updated_at TIMESTAMPTZ)
     - `transactions` (id UUID PRIMARY KEY, wallet_id UUID REFERENCES wallets(id), type TEXT, amount NUMERIC(14,2), status TEXT, reference_id TEXT, created_at TIMESTAMPTZ)
     - `milestones` (id UUID PRIMARY KEY, order_id UUID REFERENCES orders(id), title TEXT, amount NUMERIC(12,2), status TEXT, due_date TIMESTAMPTZ)
     - `disputes` (id UUID PRIMARY KEY, order_id UUID REFERENCES orders(id), reporter_id UUID REFERENCES users(id), reason TEXT, status TEXT, created_at TIMESTAMPTZ)
     - `withdrawals` (id UUID PRIMARY KEY, user_id UUID REFERENCES users(id), amount NUMERIC(12,2), method TEXT, payout_details JSONB, status TEXT, created_at TIMESTAMPTZ)
     - `messages` (id UUID PRIMARY KEY, order_id UUID REFERENCES orders(id), sender_id UUID REFERENCES users(id), content TEXT, created_at TIMESTAMPTZ)
     - `notifications` (id UUID PRIMARY KEY, user_id UUID REFERENCES users(id), title TEXT, message TEXT, read BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ)
     - `idempotency_keys` (key TEXT PRIMARY KEY, response JSONB, created_at TIMESTAMPTZ DEFAULT NOW(), expires_at TIMESTAMPTZ)

### 3.2 Establish the Platform Reserve Account (Fix UUID Bug)
- **Issue**: Ledger passes `'platform'` to UUID fields.
- **Remediation Action**:
  1. Insert a permanent platform treasury account in PostgreSQL:
     ```sql
     INSERT INTO users (id, email, full_name, role)
     VALUES ('00000000-0000-0000-0000-000000000000', 'platform@asteria.local', 'Platform Escrow Treasury', 'ADMIN')
     ON CONFLICT (id) DO NOTHING;
     
     INSERT INTO wallets (id, user_id, balance, currency)
     VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 0.00, 'USD')
     ON CONFLICT (user_id) DO NOTHING;
     ```
  2. Update `lib/ledger.ts`:
     ```typescript
     export const PLATFORM_USER_ID = '00000000-0000-0000-0000-000000000000'
     ```

### 3.3 Lock Down Row-Level Security (RLS) Policies
- **Target File**: `supabase/migrations/`
- **Issue**: Open policies `FOR ALL TO anon, authenticated USING (true)`.
- **Remediation Action**:
  ```sql
  -- Drop insecure open policies
  DROP POLICY IF EXISTS "Allow all operations for anon" ON "User";
  DROP POLICY IF EXISTS "Allow all operations for anon" ON "Order";
  DROP POLICY IF EXISTS "Allow all operations for anon" ON "Wallet";

  -- Enforce authenticated user isolation
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can read own profile and public freelancer profiles"
    ON users FOR SELECT USING (true);
  CREATE POLICY "Users can update only their own profile"
    ON users FOR UPDATE USING (auth.uid() = id);

  ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can view own wallet"
    ON wallets FOR SELECT USING (auth.uid() = user_id);
  -- Disallow direct client updates on wallets (only via service_role / security definer RPCs)

  ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Participants can view orders"
    ON orders FOR SELECT USING (auth.uid() = client_id OR auth.uid() = freelancer_id);
  ```

### 3.4 Decommission In-Memory Fallback Maps
- **Target File**: `lib/db.ts`
- **Remediation Action**:
  - Delete `const store = { ... }`.
  - Rewrite every db method (`getMilestones`, `createReport`, `getWithdrawals`, etc.) to execute directly against Supabase client `supabase.from(...)`.
  - Throw clear database exceptions if Supabase is unreachable rather than silently degrading to volatile memory.

---

## 4. PHASE 2: FINANCIAL INTEGRITY & ESCROW HARDENING (DAYS 5–7)

### 4.1 Atomic Double-Entry Ledger Transactions
- **Target File**: `supabase/migrations/006_ledger_functions.sql`, `lib/ledger.ts`
- **Remediation Action**:
  - Implement a PostgreSQL `SECURITY DEFINER` function for atomic escrow funding and release:
  ```sql
  CREATE OR REPLACE FUNCTION execute_escrow_release(
    p_order_id UUID,
    p_client_id UUID
  ) RETURNS JSONB AS $$
  DECLARE
    v_order RECORD;
    v_freelancer_amount NUMERIC;
    v_platform_fee NUMERIC;
  BEGIN
    -- 1. Lock and fetch order
    SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Order not found';
    END IF;
    IF v_order.client_id <> p_client_id THEN
      RAISE EXCEPTION 'Only the client can release escrow funds';
    END IF;
    IF v_order.escrow_status <> 'HELD' THEN
      RAISE EXCEPTION 'Escrow is not in HELD state';
    END IF;

    v_platform_fee := ROUND(v_order.total_amount * 0.12, 2);
    v_freelancer_amount := v_order.total_amount - v_platform_fee;

    -- 2. Credit freelancer wallet
    UPDATE wallets SET balance = balance + v_freelancer_amount, updated_at = NOW()
    WHERE user_id = v_order.freelancer_id;

    -- 3. Credit platform treasury wallet
    UPDATE wallets SET balance = balance + v_platform_fee, updated_at = NOW()
    WHERE user_id = '00000000-0000-0000-0000-000000000000';

    -- 4. Record ledger transaction journals
    INSERT INTO transactions (id, wallet_id, type, amount, status, reference_id, created_at)
    VALUES 
      (gen_random_uuid(), (SELECT id FROM wallets WHERE user_id = v_order.freelancer_id), 'ESCROW_RELEASE', v_freelancer_amount, 'COMPLETED', p_order_id::text, NOW()),
      (gen_random_uuid(), (SELECT id FROM wallets WHERE user_id = '00000000-0000-0000-0000-000000000000'), 'PLATFORM_FEE', v_platform_fee, 'COMPLETED', p_order_id::text, NOW());

    -- 5. Update order state
    UPDATE orders SET status = 'COMPLETED', escrow_status = 'RELEASED' WHERE id = p_order_id;

    RETURN jsonb_build_object('success', true, 'freelancer_amount', v_freelancer_amount, 'platform_fee', v_platform_fee);
  END;
  $$ LANGUAGE plpgsql;
  ```

### 4.2 Persistent Idempotency Engine
- **Target File**: `lib/idempotency.ts`
- **Remediation Action**:
  - Replace the JavaScript Map with Supabase table `idempotency_keys`.
  - Check key existence before executing financial mutations; return cached response if key exists within 24 hours.

### 4.3 Implement Real Wallet Withdrawal Flow
- **Target Files**: `components/wallet/WalletActionClient.tsx`, `app/api/wallet/withdraw/route.ts`
- **Remediation Action**:
  1. Remove `setTimeout` simulation in `WalletActionClient.tsx`.
  2. Implement an actual `fetch('/api/wallet/withdraw', { method: 'POST', body: JSON.stringify({ amount, method, payoutDetails }) })`.
  3. In `/api/wallet/withdraw`:
     - Deduct balance atomically using PostgreSQL row lock `FOR UPDATE`.
     - Record withdrawal record in `withdrawals` table with status `'PENDING'`.
     - Dispatch admin notification or webhook to payout provider.

---

## 5. PHASE 3: FRONTEND INTEGRITY, BUG FIXES & UX REALISM (DAYS 8–10)

### 5.1 Fix Freelancer Category & Badge Filtering
- **Target Files**: `components/freelancers/FreelancerBrowser.tsx`, `app/actions/auth.ts`
- **Remediation Action**:
  1. Add `category: 'DEVELOPMENT' | 'DESIGN' | 'MARKETING' | 'WRITING' | 'AI_SERVICES'`, `badge: 'PRO' | 'VERIFIED' | 'TOP_RATED'`, and `skills: string[]` to the user profile schema and registration form.
  2. Update `FreelancerBrowser.tsx` to safely fallback: `const category = f.category || 'GENERAL'`.

### 5.2 Remove Fake Mock Reviews & Replace with Dynamic System
- **Target Files**: `app/freelancers/[id]/page.tsx`, `app/gig/[id]/page.tsx`
- **Remediation Action**:
  1. Remove hardcoded arrays containing "Sami Mansour", "Nour El Houda", etc.
  2. Fetch real reviews from `reviews` table (`SELECT * FROM reviews WHERE gig_id = $1`).
  3. Render an honest empty state if count is 0: `<div className="text-gray-400">No client reviews yet for this listing.</div>`.

### 5.3 Fix Notification API Crash
- **Target Files**: `app/api/notifications/route.ts`, `lib/db.ts`
- **Remediation Action**:
  - Add `markAllNotificationsAsRead(userId: string)` to `lib/db.ts` executing `UPDATE notifications SET read = true WHERE user_id = $1`.

### 5.4 Resolve `resend` Missing Package
- **Target Files**: `lib/email.ts`, `package.json`
- **Remediation Action**:
  - Option A (Recommended): `npm install resend` and configure `RESEND_API_KEY` in `.env.local`.
  - Option B: Replace `lib/email.ts` with Supabase Auth transactional emails.

---

## 6. PHASE 4: CI/CD, INFRASTRUCTURE & PRODUCTION HARDENING (DAYS 11–14)

### 6.1 Implement Edge Rate Limiting with Upstash
- **Target File**: `middleware.ts`
- **Remediation Action**:
  - Install `@upstash/ratelimit` and `@upstash/redis`.
  - Apply 10 req/min limit on `/api/ai/generate`, 5 req/min on `/api/auth/login`, and 20 req/min on financial endpoints.

### 6.2 Setup Automated CI/CD GitHub Action
- **Target File**: `.github/workflows/ci.yml`
- **Remediation Action**:
  ```yaml
  name: CI Pipeline
  on: [push, pull_request]
  jobs:
    test-and-build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: 20
            cache: 'npm'
        - run: npm ci
        - run: npm run lint
        - run: npm run test
        - run: npm run build
  ```

### 6.3 Local Development Docker Compose Setup
- **Target File**: `docker-compose.yml`
- **Remediation Action**:
  - Provide a single command setup: `docker compose up` spinning up PostgreSQL 16, pgAdmin, and Redis.

---

## 7. VERIFICATION MATRIX & SIGN-OFF CHECKLIST

| Milestone | Task | Verification Command / Step | Sign-Off Criteria |
|---|---|---|---|
| **P0-1** | Admin route guard | Direct GET `/dashboard/admin` with empty cookie jar | Returns 307 Redirect to `/login` |
| **P0-2** | Delete demo login | Search `demo_user_id` across codebase | 0 occurrences in `lib/` and `middleware.ts` |
| **P0-3** | Stripe price security | Send Tampered `amount: 0.01` to `/api/stripe/checkout` | Stripe session total matches DB `order.total_amount` |
| **P0-4** | Password hashing | Inspect `users` table after registering new test account | `password_hash` starts with `$2a$` or `$argon2` |
| **P1-1** | Drop open RLS | Query Supabase REST API as `anon` to update wallet | Returns 401 Unauthorized or 403 Forbidden |
| **P1-2** | In-memory removal | Grep `const store =` in `lib/` | File deleted or 0 references |
| **P2-1** | Atomic ledger | Trigger concurrent double-release on same order | Only 1 succeeds; 2nd returns 400 'Escrow already released' |
| **P3-1** | Notifications fix | Send PATCH to `/api/notifications` | Returns 200 OK without `TypeError` |
| **P4-1** | CI Pipeline | Push git branch to GitHub | GitHub Action executes lint, test, build successfully |
