-- ============================================================================
-- Migration 006: Atomic Ledger Operations & Escrow Protection
-- Asteria Freelance Production Hardening (Phase 2)
-- ============================================================================

-- 1. ATOMIC ESCROW RELEASE STORED PROCEDURE
-- Releases held escrow funds upon order completion with:
--   - Row-level locking (FOR UPDATE)
--   - Strict 12% integer cent platform fee calculation
--   - Double-entry ledger recording
--   - Order status state machine transition (ACTIVE/DELIVERED -> COMPLETED)
CREATE OR REPLACE FUNCTION execute_escrow_release(
  p_order_id  TEXT,
  p_caller_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_order_id         TEXT := p_order_id;
  v_buyer_id         TEXT;
  v_seller_id        TEXT;
  v_amount           NUMERIC;
  v_status           TEXT;
  v_escrow_status    TEXT;
  v_amount_cents     BIGINT;
  v_fee_cents        BIGINT;
  v_seller_cents     BIGINT;
  v_platform_fee     NUMERIC;
  v_seller_payout    NUMERIC;
  v_treasury_id      TEXT := '00000000-0000-4000-8000-000000000000';
  v_seller_tx_id     TEXT;
  v_fee_tx_id        TEXT;
BEGIN
  -- 1. Lock the order row exclusively to prevent concurrent double-releases
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Order') THEN
    SELECT "buyerId", "sellerId", amount, status, "escrowStatus"
    INTO v_buyer_id, v_seller_id, v_amount, v_status, v_escrow_status
    FROM "Order"
    WHERE id = v_order_id
    FOR UPDATE;
  ELSE
    SELECT client_id, freelancer_id, total_amount, status, escrow_status
    INTO v_buyer_id, v_seller_id, v_amount, v_status, v_escrow_status
    FROM orders
    WHERE id::text = v_order_id
    FOR UPDATE;
  END IF;

  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Order % not found', v_order_id;
  END IF;

  -- 2. State verification: Order must be active/delivered and escrow held
  IF v_status NOT IN ('ACTIVE', 'DELIVERED', 'IN_PROGRESS') THEN
    RAISE EXCEPTION 'Cannot release escrow for order in % status', v_status;
  END IF;

  IF v_escrow_status = 'RELEASED' THEN
    RAISE EXCEPTION 'Escrow for order % has already been released', v_order_id;
  END IF;

  -- 3. Authorization verification: Caller must be the buyer or an admin
  IF p_caller_id IS NOT NULL AND p_caller_id <> '' THEN
    IF p_caller_id <> v_buyer_id THEN
      -- Check if caller is admin
      IF NOT EXISTS (
        SELECT 1 FROM "User" WHERE id = p_caller_id AND role = 'ADMIN'
        UNION
        SELECT 1 FROM users WHERE id::text = p_caller_id AND role = 'ADMIN'
      ) THEN
        RAISE EXCEPTION 'Unauthorized: Only the contract buyer or an admin can release escrow';
      END IF;
    END IF;
  END IF;

  -- 4. Calculate exact cent-rounded amounts (zero floating-point drift)
  v_amount_cents  := ROUND(v_amount * 100);
  v_fee_cents     := ROUND((v_amount_cents * 12) / 100);
  v_seller_cents  := v_amount_cents - v_fee_cents;
  v_platform_fee  := v_fee_cents / 100.0;
  v_seller_payout := v_seller_cents / 100.0;

  -- 5. Lock seller & treasury rows in sorted order to prevent deadlocks
  PERFORM pg_advisory_xact_lock(hashtext(v_seller_id));
  PERFORM pg_advisory_xact_lock(hashtext(v_treasury_id));

  -- 6. Credit Seller Net Payout (88%)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User') THEN
    UPDATE "User"
    SET "walletBalance" = COALESCE("walletBalance", 0) + v_seller_payout
    WHERE id = v_seller_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    UPDATE users
    SET wallet_balance = COALESCE(wallet_balance, 0) + v_seller_payout
    WHERE id::text = v_seller_id;
  END IF;

  -- 7. Credit Platform Treasury Commission (12%)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User') THEN
    UPDATE "User"
    SET "walletBalance" = COALESCE("walletBalance", 0) + v_platform_fee
    WHERE id = v_treasury_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    UPDATE users
    SET wallet_balance = COALESCE(wallet_balance, 0) + v_platform_fee
    WHERE id::text = v_treasury_id;
  END IF;

  -- 8. Record Immutable Double-Entry Ledger Transactions
  v_seller_tx_id := 'tx_rel_' || md5(v_order_id || '_seller_' || now()::text);
  v_fee_tx_id    := 'tx_fee_' || md5(v_order_id || '_platform_' || now()::text);

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_transactions') THEN
    INSERT INTO wallet_transactions (id, user_id, order_id, type, amount, note, idempotency_key)
    VALUES
      (v_seller_tx_id, v_seller_id, v_order_id, 'RELEASE', v_seller_payout, 'Escrow payout for order #' || v_order_id, 'release-' || v_order_id || '-seller'),
      (v_fee_tx_id, v_treasury_id, v_order_id, 'PLATFORM_FEE', v_platform_fee, '12% Platform commission for order #' || v_order_id, 'release-' || v_order_id || '-platform')
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;

  -- 9. Transition Order Status to COMPLETED & Escrow to RELEASED
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Order') THEN
    UPDATE "Order"
    SET status = 'COMPLETED', "escrowStatus" = 'RELEASED'
    WHERE id = v_order_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    UPDATE orders
    SET status = 'COMPLETED', escrow_status = 'RELEASED', updated_at = now()
    WHERE id::text = v_order_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'total_amount', v_amount,
    'seller_payout', v_seller_payout,
    'platform_fee', v_platform_fee,
    'seller_tx_id', v_seller_tx_id,
    'fee_tx_id', v_fee_tx_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. ATOMIC WALLET WITHDRAWAL STORED PROCEDURE
-- Validates available balance, acquires row locks, deducts funds, and creates pending payout
CREATE OR REPLACE FUNCTION execute_wallet_withdrawal(
  p_user_id         TEXT,
  p_amount          NUMERIC,
  p_method          TEXT,
  p_account_details TEXT,
  p_idempotency_key TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance     NUMERIC;
  v_withdrawal_id   TEXT;
  v_tx_id           TEXT;
BEGIN
  IF p_amount <= 0 OR p_amount < 20 THEN
    RAISE EXCEPTION 'Minimum withdrawal amount is 20 TND';
  END IF;

  -- 1. Advisory lock + row lock to serialize user mutations
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id));

  -- 2. Check current balance under lock
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User') THEN
    SELECT "walletBalance" INTO v_current_balance
    FROM "User"
    WHERE id = p_user_id
    FOR UPDATE;
  ELSE
    SELECT wallet_balance INTO v_current_balance
    FROM users
    WHERE id::text = p_user_id
    FOR UPDATE;
  END IF;

  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS: Current balance % TND is less than requested % TND', v_current_balance, p_amount;
  END IF;

  v_new_balance := ROUND((v_current_balance - p_amount) * 100) / 100.0;

  -- 3. Deduct balance from User / users table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User') THEN
    UPDATE "User"
    SET "walletBalance" = v_new_balance
    WHERE id = p_user_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    UPDATE users
    SET wallet_balance = v_new_balance
    WHERE id::text = p_user_id;
  END IF;

  -- 4. Create Withdrawal Request
  v_withdrawal_id := 'wth_' || md5(p_user_id || '_' || now()::text || '_' || random()::text);
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'withdrawals') THEN
    INSERT INTO withdrawals (id, user_id, amount, method, account_details, status)
    VALUES (v_withdrawal_id, p_user_id, p_amount, p_method, p_account_details, 'PENDING');
  END IF;

  -- 5. Record negative debit transaction in ledger
  v_tx_id := 'tx_wth_' || md5(v_withdrawal_id);
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_transactions') THEN
    INSERT INTO wallet_transactions (id, user_id, type, amount, balance_after, note, idempotency_key)
    VALUES (
      v_tx_id,
      p_user_id,
      'WITHDRAWAL',
      -p_amount,
      v_new_balance,
      'Payout request via ' || p_method || ' (' || p_account_details || ')',
      p_idempotency_key
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id,
    'amount', p_amount,
    'remaining_balance', v_new_balance,
    'status', 'PENDING'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
