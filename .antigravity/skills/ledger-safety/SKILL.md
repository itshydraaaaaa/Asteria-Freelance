---
name: ledger-safety
description: Standing rules and concurrency controls for Asteria Freelance double-entry ledger, wallet operations, escrow locks, and financial mutations.
---

# Asteria Freelance — Ledger Safety & Concurrency Locking Rules

This skill enforces strict rules on any code modification involving financial calculations, wallet debits/credits, escrow state transitions, and database transactions in the Asteria Freelance codebase.

## 1. Concurrency & Locking Correctness (P0)

1. **Distributed / Row-Level Locking**:
   - Never rely on an in-process JavaScript `Map` or in-memory mutex for cross-instance locking in serverless/multi-instance deployments.
   - All balance-mutating transactions MUST use PostgreSQL transaction-level locks:
     - Row lock on `users`: `SELECT * FROM users WHERE id = p_user_id FOR UPDATE` inside Postgres functions (e.g. `debit_wallet`).
     - Or transaction-scoped Postgres advisory locks: `pg_advisory_xact_lock(hashtext(user_id::text))`.
   - Never perform balance reads outside of the locked transaction before debiting.

2. **Strict Lock Ordering (Deadlock Prevention)**:
   - When any transaction acquires locks on multiple user rows (e.g., buyer + seller during escrow release, dispute resolution, or transfer), **locks MUST always be acquired in canonical ascending order by user ID (`user_id_1 < user_id_2`)**.
   - Example:
     ```sql
     -- Always lock in ascending order:
     IF p_buyer_id < p_seller_id THEN
       PERFORM * FROM users WHERE id = p_buyer_id FOR UPDATE;
       PERFORM * FROM users WHERE id = p_seller_id FOR UPDATE;
     ELSE
       PERFORM * FROM users WHERE id = p_seller_id FOR UPDATE;
       PERFORM * FROM users WHERE id = p_buyer_id FOR UPDATE;
     END IF;
     ```

3. **Idempotency Keys**:
   - Every money-mutating API endpoint (`/api/wallet/withdraw`, `/api/orders`, `/api/messages/offer/accept`, `/api/stripe/webhook`) MUST require and check an `Idempotency-Key` or generated unique transaction key before executing any balance debit or credit.

4. **Never Trust Client-Submitted Amounts**:
   - Never read prices, fees, or milestone amounts from the client request payload on contract acceptance or milestone funding.
   - Always re-fetch the verified server-persisted offer or gig record from the database.

5. **Applied Exchange Rate Storage**:
   - Every transaction involving currency conversion MUST write the exact `exchange_rate_applied` onto the transaction record itself at execution time. Never recompute historical transactions using a dynamic or current rate.
