-- ============================================================
-- Asteria Freelance — Seed Data
-- Run after 001_initial_schema.sql
-- Reproduces 9 demo users, 3 orders, 3 milestones, 3 reports
-- NOTE: auth_id is NULL for demo users — set via Supabase Auth
--       when real auth is wired up. For demo purposes, the app
--       falls back to demo_user_id cookie when ENABLE_DEMO_AUTH=true
-- ============================================================

-- ============================================================
-- DEMO USERS
-- ============================================================
INSERT INTO users (id, name, email, role, image, bio, skills, wallet_balance, verified_status, rating, review_count, created_at)
VALUES
  -- FREELANCERS
  ('f1000000-0000-0000-0000-000000000001',
   'Yassine Khelifi', 'yassine.freelancer@asteria.com', 'FREELANCER',
   'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
   'Senior Full-Stack & AI Developer with 7+ years building Next.js, Python, and OpenAI-powered applications.',
   ARRAY['Next.js','TypeScript','Python','OpenAI','PostgreSQL'],
   1450.00, 'APPROVED', 4.9, 28,
   '2025-01-15 00:00:00+00'),

  ('f2000000-0000-0000-0000-000000000002',
   'Leila Ben Ali', 'leila.freelancer@asteria.com', 'FREELANCER',
   'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
   'UI/UX Designer specializing in mobile-first design systems and Figma prototyping for fintech.',
   ARRAY['Figma','UI/UX','Mobile Design','Design Systems','Prototyping'],
   820.00, 'PENDING', 4.7, 12,
   '2025-02-01 00:00:00+00'),

  ('f3000000-0000-0000-0000-000000000003',
   'Karim Ben Ammar', 'karim.freelancer@asteria.com', 'FREELANCER',
   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
   'Machine Learning Engineer focused on NLP, computer vision, and production ML pipelines.',
   ARRAY['Python','TensorFlow','PyTorch','NLP','Computer Vision','MLOps'],
   2100.00, 'APPROVED', 4.8, 19,
   '2025-01-20 00:00:00+00'),

  -- CLIENTS
  ('c1000000-0000-0000-0000-000000000001',
   'Sami Mansour', 'sami.client@asteria.com', 'CLIENT',
   'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
   'Product Manager at a Tunis-based fintech startup. Hire top developers and designers for our platform.',
   ARRAY[],
   3200.00, 'APPROVED', NULL, 0,
   '2025-02-10 00:00:00+00'),

  ('c2000000-0000-0000-0000-000000000002',
   'Nour El Houda', 'nour.client@asteria.com', 'CLIENT',
   'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
   'E-commerce entrepreneur looking for marketing and web development services.',
   ARRAY[],
   1850.00, 'UNSUBMITTED', NULL, 0,
   '2025-02-12 00:00:00+00'),

  ('c3000000-0000-0000-0000-000000000003',
   'Oussama Hamdi', 'oussama.client@asteria.com', 'CLIENT',
   'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
   'CTO at a Cairo-based SaaS company. Looking for senior engineers and ML specialists.',
   ARRAY[],
   5000.00, 'APPROVED', NULL, 0,
   '2025-01-05 00:00:00+00'),

  -- ADMINS
  ('a1000000-0000-0000-0000-000000000001',
   'Admin Master', 'admin.master@asteria.com', 'ADMIN',
   'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
   NULL, ARRAY[], 0.00, 'APPROVED', NULL, 0,
   '2025-01-01 00:00:00+00'),

  ('a2000000-0000-0000-0000-000000000002',
   'Sarah Admin', 'sarah.admin@asteria.com', 'ADMIN',
   'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
   NULL, ARRAY[], 0.00, 'APPROVED', NULL, 0,
   '2025-01-02 00:00:00+00'),

  ('a3000000-0000-0000-0000-000000000003',
   'Tarek Admin', 'tarek.admin@asteria.com', 'ADMIN',
   'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
   NULL, ARRAY[], 0.00, 'APPROVED', NULL, 0,
   '2025-01-03 00:00:00+00')

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DEMO ORDERS
-- ============================================================
INSERT INTO orders (id, gig_id, buyer_id, seller_id, amount, status, created_at)
VALUES
  ('ord10000-0000-0000-0000-000000000001',
   'g1',
   'c1000000-0000-0000-0000-000000000001',
   'f1000000-0000-0000-0000-000000000001',
   299.00, 'COMPLETED', '2025-02-01 00:00:00+00'),

  ('ord20000-0000-0000-0000-000000000002',
   'g2',
   'c1000000-0000-0000-0000-000000000001',
   'f2000000-0000-0000-0000-000000000002',
   199.00, 'ACTIVE', '2025-02-05 00:00:00+00'),

  ('ord30000-0000-0000-0000-000000000003',
   'g7',
   'c1000000-0000-0000-0000-000000000001',
   'f1000000-0000-0000-0000-000000000001',
   79.00, 'COMPLETED', '2025-02-08 00:00:00+00')

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DEMO MILESTONES (for ord2 — the active order)
-- ============================================================
INSERT INTO milestones (id, order_id, title, percentage, amount, status, position)
VALUES
  ('ms100000-0000-0000-0000-000000000001',
   'ord20000-0000-0000-0000-000000000002',
   'Milestone 1: Wireframes & Design Specs (30%)', 30, 59.70, 'FUNDED', 1),

  ('ms200000-0000-0000-0000-000000000002',
   'ord20000-0000-0000-0000-000000000002',
   'Milestone 2: Screen Implementation & Assets (40%)', 40, 79.60, 'PENDING', 2),

  ('ms300000-0000-0000-0000-000000000003',
   'ord20000-0000-0000-0000-000000000002',
   'Milestone 3: QA Review & Handoff (30%)', 30, 59.70, 'PENDING', 3)

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DEMO JOBS
-- ============================================================
INSERT INTO jobs (id, title, description, category, budget, delivery_days, skills, status, client_id, created_at)
VALUES
  ('job10000-0000-0000-0000-000000000001',
   'Build an AI Chatbot widget for Next.js app',
   'Looking for a skilled developer to build a floating AI chatbot widget integrating OpenAI API and Tailwind CSS. The widget should support multi-turn conversations, stream responses, and be fully responsive.',
   'Web Development', 500.00, 5,
   ARRAY['Next.js','OpenAI','TypeScript','Tailwind CSS'],
   'OPEN', 'c1000000-0000-0000-0000-000000000001',
   '2025-02-01 00:00:00+00'),

  ('job20000-0000-0000-0000-000000000002',
   'Figma UI/UX design for Fintech mobile app',
   'Need 12 high-fidelity screens for a modern digital wallet app targeting North Africa. Must include onboarding flow, home dashboard, transaction history, and transfer screens.',
   'Design', 750.00, 7,
   ARRAY['Figma','UI/UX','Mobile Design'],
   'OPEN', 'c1000000-0000-0000-0000-000000000001',
   '2025-02-03 00:00:00+00')

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DEMO REPORTS
-- ============================================================
INSERT INTO reports (id, reporter_id, reporter_name, target_type, target_id, target_title, reason, description, status, created_at)
VALUES
  ('rep10000-0000-0000-0000-000000000001',
   'f1000000-0000-0000-0000-000000000001',
   'Yassine Khelifi',
   'GIG', 'g3',
   'Build an ML model for customer churn',
   'Misleading pricing',
   'Price listed as $450 but the actual scope described requires enterprise ML pipelines, compliance integrations, and custom infrastructure setup costing significantly more.',
   'PENDING', '2025-02-06 00:00:00+00'),

  ('rep20000-0000-0000-0000-000000000002',
   'c1000000-0000-0000-0000-000000000001',
   'Sami Mansour',
   'ORDER', 'ord20000-0000-0000-0000-000000000002',
   'Order Dispute — Figma UI/UX Design Package',
   'Incomplete Deliverable & Scope Disagreement',
   'Freelancer submitted 3 screens out of 5 agreed upon and requested an additional custom offer upgrade of $150 via chat. The original agreement specified all 5 screens for $199.',
   'PENDING', '2025-02-14 00:00:00+00'),

  ('rep30000-0000-0000-0000-000000000003',
   'f1000000-0000-0000-0000-000000000001',
   'Yassine Khelifi',
   'ORDER', 'ord10000-0000-0000-0000-000000000001',
   'Order Dispute — Full-Stack Web Development',
   'Client Unreasonable Revision Scope',
   'Client requested 4 extra features not specified in the original contract after work was delivered and accepted. Requesting admin review of the original order scope documentation.',
   'PENDING', '2025-02-15 00:00:00+00')

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DEMO KYC VERIFICATION (for Leila Ben Ali — PENDING)
-- ============================================================
INSERT INTO verifications (id, user_id, full_name, dob, country, document_type, document_number,
  id_front_path, id_back_path, selfie_path, status, submitted_at)
VALUES
  ('ver10000-0000-0000-0000-000000000001',
   'f2000000-0000-0000-0000-000000000002',
   'Leila Ben Ali', '1996-05-14', 'Tunisia',
   'National ID', '14890234',
   'kyc-documents/f2/id_front.jpg',
   'kyc-documents/f2/id_back.jpg',
   'kyc-documents/f2/selfie.jpg',
   'PENDING', '2025-02-05 00:00:00+00')

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DEMO AUDIT LOG
-- ============================================================
INSERT INTO audit_logs (id, admin_id, admin_name, action, details, created_at)
VALUES
  ('log10000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000001',
   'Admin Master',
   'SYSTEM_INITIALIZED',
   'Platform audit logging started. Schema v1 deployed.',
   '2025-02-01 00:00:00+00')

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DEMO WALLET TRANSACTIONS (retroactive ledger for demo orders)
-- ============================================================
-- Sami Mansour (c1): initial deposit
INSERT INTO wallet_transactions (user_id, type, amount, balance_after, note, created_at)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'DEPOSIT', 3677.00, 3677.00, 'Initial demo wallet deposit', '2025-01-15 00:00:00+00');

-- ord1: Sami funded $299 to escrow, Yassine received $254.15 (85%)
INSERT INTO wallet_transactions (user_id, order_id, type, amount, balance_after, note, created_at)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'ord10000-0000-0000-0000-000000000001', 'FUND_ESCROW', -299.00, 3378.00, 'Escrow funded for ord1', '2025-02-01 00:00:00+00'),
  ('f1000000-0000-0000-0000-000000000001', 'ord10000-0000-0000-0000-000000000001', 'RELEASE', 254.15, 254.15, 'Payout for ord1 (85%)', '2025-02-03 00:00:00+00'),
  ('a1000000-0000-0000-0000-000000000001', 'ord10000-0000-0000-0000-000000000001', 'PLATFORM_FEE', 44.85, 44.85, 'Platform fee for ord1 (15%)', '2025-02-03 00:00:00+00');

-- ord2: Sami funded $199 (active order)
INSERT INTO wallet_transactions (user_id, order_id, type, amount, balance_after, note, created_at)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'ord20000-0000-0000-0000-000000000002', 'FUND_ESCROW', -199.00, 3179.00, 'Escrow funded for ord2', '2025-02-05 00:00:00+00');

-- ord3: Sami funded $79, Yassine received $67.15
INSERT INTO wallet_transactions (user_id, order_id, type, amount, balance_after, note, created_at)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'ord30000-0000-0000-0000-000000000003', 'FUND_ESCROW', -79.00, 3200.00, 'Escrow funded for ord3', '2025-02-08 00:00:00+00'),
  ('f1000000-0000-0000-0000-000000000001', 'ord30000-0000-0000-0000-000000000003', 'RELEASE', 67.15, 1450.00, 'Payout for ord3 (85%)', '2025-02-10 00:00:00+00');
