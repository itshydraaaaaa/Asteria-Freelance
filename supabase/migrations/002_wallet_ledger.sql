-- ============================================================
-- Asteria Freelance — Wallet Ledger & Idempotency
-- Run after 001_initial_schema.sql
-- wallet_transactions and processed_requests are already created
-- in migration 001 — this file adds the derived balance view
-- and the make-checker trigger
-- ============================================================

-- ============================================================
-- DERIVED WALLET BALANCE VIEW
-- walletBalance = SUM of all transactions for a user
-- This view is the single source of truth for balances
-- ============================================================
CREATE OR REPLACE VIEW user_wallet_balances AS
SELECT
  u.id                                                   AS user_id,
  u.name,
  COALESCE(SUM(wt.amount), 0)::numeric(12,2)             AS balance,
  COUNT(wt.id)                                           AS transaction_count,
  MAX(wt.created_at)                                     AS last_transaction_at
FROM users u
LEFT JOIN wallet_transactions wt ON wt.user_id = u.id
GROUP BY u.id, u.name;

-- ============================================================
-- FUNCTION: credit_wallet
-- Inserts a positive wallet transaction with advisory locking
-- ============================================================
CREATE OR REPLACE FUNCTION credit_wallet(
  p_user_id         uuid,
  p_amount          numeric,
  p_type            text,
  p_order_id        uuid    DEFAULT NULL,
  p_milestone_id    uuid    DEFAULT NULL,
  p_note            text    DEFAULT NULL,
  p_idempotency_key text    DEFAULT NULL
) RETURNS wallet_transactions AS $$
DECLARE
  v_new_balance numeric;
  v_tx          wallet_transactions;
  v_user_lock   users;
BEGIN
  -- 1. Idempotency check
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_tx FROM wallet_transactions WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN v_tx; END IF;
  END IF;

  -- 2. Transaction-scoped advisory lock + row lock
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));
  SELECT * INTO v_user_lock FROM users WHERE id = p_user_id FOR UPDATE;

  -- 3. Calculate new balance
  SELECT COALESCE(SUM(amount), 0) + p_amount INTO v_new_balance
  FROM wallet_transactions WHERE user_id = p_user_id;

  -- 4. Insert ledger entry
  INSERT INTO wallet_transactions (user_id, order_id, milestone_id, type, amount, balance_after, note, idempotency_key)
  VALUES (p_user_id, p_order_id, p_milestone_id, p_type, p_amount, v_new_balance, p_note, p_idempotency_key)
  RETURNING * INTO v_tx;

  -- 5. Update denormalized balance column for fast reads
  UPDATE users SET wallet_balance = v_new_balance WHERE id = p_user_id;

  RETURN v_tx;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: debit_wallet
-- Inserts a negative wallet transaction with atomic row locking
-- ============================================================
CREATE OR REPLACE FUNCTION debit_wallet(
  p_user_id         uuid,
  p_amount          numeric,
  p_type            text,
  p_order_id        uuid    DEFAULT NULL,
  p_milestone_id    uuid    DEFAULT NULL,
  p_note            text    DEFAULT NULL,
  p_idempotency_key text    DEFAULT NULL
) RETURNS wallet_transactions AS $$
DECLARE
  v_current_balance numeric;
  v_new_balance     numeric;
  v_tx              wallet_transactions;
  v_user_lock       users;
BEGIN
  -- 1. Idempotency check
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_tx FROM wallet_transactions WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN v_tx; END IF;
  END IF;

  -- 2. EXCLUSIVE TRANSACTION ADVISORY & ROW LOCK: Prevent concurrent race conditions
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));
  SELECT * INTO v_user_lock FROM users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  -- 3. Calculate verified current balance under transaction lock
  SELECT COALESCE(SUM(amount), 0) INTO v_current_balance
  FROM wallet_transactions WHERE user_id = p_user_id;

  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Current: %, Requested: %', v_current_balance, p_amount;
  END IF;

  v_new_balance := v_current_balance - p_amount;

  -- 4. Insert ledger entry (negative amount)
  INSERT INTO wallet_transactions (user_id, order_id, milestone_id, type, amount, balance_after, note, idempotency_key)
  VALUES (p_user_id, p_order_id, p_milestone_id, p_type, -p_amount, v_new_balance, p_note, p_idempotency_key)
  RETURNING * INTO v_tx;

  -- 5. Update denormalized balance
  UPDATE users SET wallet_balance = v_new_balance WHERE id = p_user_id;

  RETURN v_tx;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: process_escrow_release_atomic
-- Enforces canonical user ID lock ordering (deadlock-free)
-- ============================================================
CREATE OR REPLACE FUNCTION process_escrow_release_atomic(
  p_order_id        uuid,
  p_seller_id       uuid,
  p_platform_id     uuid,
  p_total_amount    numeric,
  p_idempotency_key text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_user_first      uuid;
  v_user_second     uuid;
  v_seller_payout   numeric;
  v_platform_fee    numeric;
BEGIN
  -- Canonical lock ordering to eliminate deadlocks:
  IF p_seller_id < p_platform_id THEN
    v_user_first  := p_seller_id;
    v_user_second := p_platform_id;
  ELSE
    v_user_first  := p_platform_id;
    v_user_second := p_seller_id;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(v_user_first::text));
  PERFORM pg_advisory_xact_lock(hashtext(v_user_second::text));
  PERFORM * FROM users WHERE id = v_user_first FOR UPDATE;
  PERFORM * FROM users WHERE id = v_user_second FOR UPDATE;

  v_platform_fee  := ROUND(p_total_amount * 0.12, 2);
  v_seller_payout := p_total_amount - v_platform_fee;

  PERFORM credit_wallet(p_seller_id, v_seller_payout, 'RELEASE', p_order_id, NULL, 'Escrow payout', p_idempotency_key || '-seller');
  PERFORM credit_wallet(p_platform_id, v_platform_fee, 'PLATFORM_FEE', p_order_id, NULL, 'Platform fee', p_idempotency_key || '-platform');

  UPDATE orders SET status = 'COMPLETED' WHERE id = p_order_id;

  RETURN jsonb_build_object('seller_payout', v_seller_payout, 'platform_fee', v_platform_fee);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
