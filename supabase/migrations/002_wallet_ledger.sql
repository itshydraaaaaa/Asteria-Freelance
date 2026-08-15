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
-- Inserts a positive wallet transaction and updates the
-- users.wallet_balance column (maintained for fast reads)
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
BEGIN
  -- Idempotency check
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_tx FROM wallet_transactions WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN v_tx; END IF;
  END IF;

  -- Calculate new balance
  SELECT COALESCE(SUM(amount), 0) + p_amount INTO v_new_balance
  FROM wallet_transactions WHERE user_id = p_user_id;

  -- Insert ledger entry
  INSERT INTO wallet_transactions (user_id, order_id, milestone_id, type, amount, balance_after, note, idempotency_key)
  VALUES (p_user_id, p_order_id, p_milestone_id, p_type, p_amount, v_new_balance, p_note, p_idempotency_key)
  RETURNING * INTO v_tx;

  -- Update denormalized balance column for fast reads
  UPDATE users SET wallet_balance = v_new_balance WHERE id = p_user_id;

  RETURN v_tx;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: debit_wallet
-- Inserts a negative wallet transaction with balance check
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
BEGIN
  -- Idempotency check
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_tx FROM wallet_transactions WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN v_tx; END IF;
  END IF;

  -- Check sufficient balance
  SELECT COALESCE(SUM(amount), 0) INTO v_current_balance
  FROM wallet_transactions WHERE user_id = p_user_id;

  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Current: %, Requested: %', v_current_balance, p_amount;
  END IF;

  v_new_balance := v_current_balance - p_amount;

  -- Insert ledger entry (negative amount)
  INSERT INTO wallet_transactions (user_id, order_id, milestone_id, type, amount, balance_after, note, idempotency_key)
  VALUES (p_user_id, p_order_id, p_milestone_id, p_type, -p_amount, v_new_balance, p_note, p_idempotency_key)
  RETURNING * INTO v_tx;

  -- Update denormalized balance
  UPDATE users SET wallet_balance = v_new_balance WHERE id = p_user_id;

  RETURN v_tx;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
