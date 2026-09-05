# DATABASE & PERSISTENCE ARCHITECTURE AUDIT
**Document Version**: 1.0.0  
**Target System**: Asteria Freelance Platform  
**Engines**: Supabase PostgreSQL 15+ / In-Memory JavaScript Fallback  
**Audit Finding**: 🚨 **CRITICAL SCHEMA SPLIT & DATA LOSS RISK**

---

## 1. EXECUTIVE SUMMARY

The database layer of the Asteria Freelance platform is in a severely compromised state characterized by a **"Split-Brain" architecture**:
1. Two incompatible sets of migrations define duplicate tables with different naming conventions (`users` in lowercase vs `"User"` in quoted PascalCase).
2. Five core domain entities—**Milestones, Dispute Reports, Withdrawals, Messages, and Notifications**—have NO corresponding tables in PostgreSQL, existing solely in volatile server memory.
3. Universal open policies in Supabase Row-Level Security allow anonymous web visitors full read, write, and delete permissions over user accounts, wallets, and orders.
4. Type mismatches between application code (passing string literals like `'platform'`) and PostgreSQL UUID types cause silent SQL execution aborts.

---

## 2. MIGRATION HISTORY & SCHEMA COLLISION ANALYSIS

### 2.1 The Case-Sensitivity Conflict
PostgreSQL standard behavior converts unquoted identifiers to lowercase (`CREATE TABLE users` creates `users`). However, identifiers enclosed in double quotes preserve exact casing (`CREATE TABLE "User"` creates `"User"`). 

In PostgreSQL, `users` and `"User"` are two completely independent, disconnected tables in the same schema!

```
+-----------------------------------------------------------------------------------------+
| MIGRATION 001_initial_schema.sql         | MIGRATION 20260823083000_add_missing_columns |
+------------------------------------------+----------------------------------------------+
| CREATE TABLE users (                     | CREATE TABLE IF NOT EXISTS "User" (          |
|   id UUID PRIMARY KEY,                   |   id TEXT PRIMARY KEY,                       |
|   email TEXT UNIQUE,                     |   email TEXT UNIQUE,                         |
|   full_name TEXT,                        |   name TEXT,                                 |
|   avatar_url TEXT,                       |   avatar TEXT,                               |
|   role TEXT                              |   role TEXT                                  |
| );                                       | );                                           |
|                                          |                                              |
| CREATE TABLE orders (                    | CREATE TABLE IF NOT EXISTS "Order" (         |
|   id UUID PRIMARY KEY,                   |   id TEXT PRIMARY KEY,                       |
|   total_amount NUMERIC(10,2)             |   amount NUMERIC(10,2)                       |
| );                                       | );                                           |
+-----------------------------------------------------------------------------------------+
```

### 2.2 Column Naming Divergence
| Entity | Model Property in `lib/db.ts` | Column in `001_initial_schema.sql` | Column in `20260823083000...sql` | Runtime Impact |
|---|---|---|---|---|
| User Name | `user.name` | `full_name` | `name` | Profile name resolves to `undefined` when reading from `users`. |
| User Avatar | `user.avatar` | `avatar_url` | `avatar` | Profile images fail to load. |
| Order Amount | `order.total_amount` | `total_amount` | `amount` | Financial totals calculate as `NaN` if reading wrong table. |
| User ID Type | `string` | `UUID` | `TEXT` | Passing string non-UUID crashes on `users`, succeeds on `"User"`. |

---

## 3. IN-MEMORY GHOST ENTITIES (MISSING POSTGRESQL TABLES)

The following core business entities have **no PostgreSQL tables defined anywhere in `supabase/migrations/`**:

### 3.1 Milestones (`store.milestones`)
- **Application Code**: `app/api/orders/[id]/milestones/route.ts`
- **Current Storage**: In-memory `Map<string, Milestone>` in `lib/db.ts`.
- **Failure Mode**: When a client creates milestone breakdown stages for a project, the data is saved in memory. When the serverless worker restarts or the request is routed to a different Lambda, the milestones disappear.

### 3.2 Dispute Reports (`store.reports`)
- **Application Code**: `app/api/reports/route.ts`
- **Current Storage**: In-memory array in `lib/db.ts`.
- **Failure Mode**: If a client files a scam report or dispute against a freelancer, the report vanishes on server recycle. The dispute is never seen by the admin, and escrow remains vulnerable to release.

### 3.3 Withdrawals (`store.withdrawals`)
- **Application Code**: `app/api/wallet/withdraw/route.ts`
- **Current Storage**: In-memory array in `lib/db.ts`.
- **Failure Mode**: When a user submits a payout request, no record is persisted to the database. Accounting audits cannot verify payouts, and banking payout processors cannot reconcile transactions.

### 3.4 Chat Messages (`store.messages`)
- **Application Code**: `components/orders/OrderWorkspaceClient.tsx`
- **Current Storage**: In-memory array in `lib/db.ts`.
- **Failure Mode**: Chat communication between clients and freelancers regarding project specifications, revisions, and deliveries is wiped upon server deployment.

### 3.5 Notifications (`store.notifications`)
- **Application Code**: `app/api/notifications/route.ts`
- **Current Storage**: In-memory array in `lib/db.ts`.
- **Failure Mode**: In addition to disappearing, calling `PATCH /api/notifications` crashes with `TypeError: db.markAllAsRead is not a function`.

---

## 4. UUID TYPING MISMATCH & SILENT RPC FAILURES

In `lib/ledger.ts:L410, L450`:
```typescript
// Deduct platform fee and credit to platform account:
const adminId = 'platform'
await credit_wallet(adminId, platformFee)
```

In `supabase/migrations/002_functions.sql`:
```sql
CREATE OR REPLACE FUNCTION credit_wallet(
  p_user_id UUID,
  p_amount NUMERIC
) RETURNS VOID AS $$ ... $$;
```

### The Failure Chain:
1. `credit_wallet` expects parameter 1 to be of type `UUID`.
2. Application code passes the 8-character string literal `'platform'`.
3. PostgreSQL throws error `22P02`: `invalid input syntax for type uuid: "platform"`.
4. The JavaScript `try ... catch` block in `lib/ledger.ts` catches the error:
   ```typescript
   try {
     await supabase.rpc('credit_wallet', { p_user_id: adminId, p_amount: platformFee })
   } catch (err) {
     console.error('Database credit failed, falling back to memory store', err)
     store.updateWalletBalance(adminId, newBalance)
   }
   ```
5. As a result, the platform account is NEVER credited in PostgreSQL, and the ledger permanently diverges!

---

## 5. ROW-LEVEL SECURITY (RLS) AUDIT

### 5.1 The Universal Open Policy Defect
In `supabase/migrations/20260823083000_add_missing_columns.sql`, RLS was enabled on tables, but negated by universal open policies:

```sql
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for anon" ON "User" FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for anon" ON "Order" FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE "Wallet" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for anon" ON "Wallet" FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
```

### Impact:
- **Zero Access Control**: The `USING (true)` and `WITH CHECK (true)` clauses permit anonymous users to `SELECT`, `INSERT`, `UPDATE`, and `DELETE` any row in these tables.
- An attacker can change their wallet balance to $1,000,000 using standard Supabase client libraries from their browser console.

---

## 6. CONSOLIDATED PRODUCTION DATABASE SCHEMA (DDL)

To eliminate the split-brain architecture, all migrations must be consolidated into a single, clean PostgreSQL 15+ schema adhering to strict foreign key relationships, check constraints, and secure RLS policies.

```sql
-- ====================================================================
-- ASTERIA FREELANCE: CANONICAL PRODUCTION SCHEMA (005_canonical_schema.sql)
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('CLIENT', 'FREELANCER', 'ADMIN')),
    avatar_url TEXT,
    category TEXT,
    skills TEXT[] DEFAULT '{}',
    badge TEXT,
    bio TEXT,
    hourly_rate NUMERIC(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Platform Reserve Treasury Account
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'treasury@asteria.local', 'RESERVED_SYSTEM_ACCOUNT', 'Asteria Platform Reserve', 'ADMIN')
ON CONFLICT (id) DO NOTHING;

-- 2. WALLETS TABLE
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0.00),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Platform Treasury Wallet
INSERT INTO wallets (id, user_id, balance, currency)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 0.00, 'USD')
ON CONFLICT (user_id) DO NOTHING;

-- 3. GIGS TABLE
CREATE TABLE IF NOT EXISTS gigs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(12,2) NOT NULL CHECK (price > 0),
    category TEXT NOT NULL,
    packages JSONB,
    delivery_time_days INTEGER NOT NULL DEFAULT 3,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'DRAFT')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID REFERENCES gigs(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES users(id),
    freelancer_id UUID NOT NULL REFERENCES users(id),
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED', 'CANCELLED')),
    escrow_status TEXT NOT NULL DEFAULT 'UNFUNDED' CHECK (escrow_status IN ('UNFUNDED', 'HELD', 'RELEASED', 'REFUNDED')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('WALLET', 'STRIPE', 'FLOUCI', 'KONNECT')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. MILESTONES TABLE (PERSISTENT REPLACEMENT FOR MEMORY MAP)
CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED')),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TRANSACTIONS / LEDGER JOURNAL
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'ESCROW_LOCK', 'ESCROW_RELEASE', 'PLATFORM_FEE', 'REFUND')),
    amount NUMERIC(14,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    reference_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    method TEXT NOT NULL CHECK (method IN ('BANK_TRANSFER', 'FLOUCI', 'STRIPE')),
    payout_details JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. DISPUTES / REPORTS TABLE
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    reporter_id UUID NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED')),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. IDEMPOTENCY KEYS TABLE
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key TEXT PRIMARY KEY,
    response JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- ====================================================================
-- INDEXES FOR HIGH-TRAFFIC QUERY PATHS
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_freelancer_id ON orders(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_order_id ON messages(order_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read = FALSE;

-- ====================================================================
-- PRODUCTION ROW-LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "Public profiles viewable by all" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Wallets: Strictly private to user; no direct client mutations
CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);

-- Orders: Viewable only by participants
CREATE POLICY "Participants can view orders" ON orders FOR SELECT 
  USING (auth.uid() = client_id OR auth.uid() = freelancer_id);

-- Messages: Viewable only by order participants
CREATE POLICY "Participants can view order messages" ON messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = messages.order_id AND (orders.client_id = auth.uid() OR orders.freelancer_id = auth.uid())));
CREATE POLICY "Participants can send messages" ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can mark own notifications as read" ON notifications FOR UPDATE USING (auth.uid() = user_id);
```
