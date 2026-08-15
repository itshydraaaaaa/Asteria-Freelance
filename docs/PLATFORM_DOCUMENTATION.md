# Asteria Freelance — Complete Platform Documentation

> **Version**: 2.0 — August 2026
> **Stack**: Next.js 14 App Router · TypeScript · Supabase · In-Memory Mock DB · Framer Motion · GSAP · Canvas 3D

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [User Roles & Access Levels](#2-user-roles--access-levels)
3. [Authentication System](#3-authentication-system)
4. [Pages & Routes](#4-pages--routes)
5. [Dashboard System](#5-dashboard-system)
6. [Marketplace Features](#6-marketplace-features)
7. [Order & Escrow System](#7-order--escrow-system)
8. [Multi-Milestone Escrow System](#8-multi-milestone-escrow-system)
9. [Messaging & Custom Offers](#9-messaging--custom-offers)
10. [Review & Rating Engine](#10-review--rating-engine)
11. [AI Assistant Features](#11-ai-assistant-features)
12. [Notification System](#12-notification-system)
13. [Admin Master Dashboard](#13-admin-master-dashboard)
14. [KYC Identity Verification](#14-kyc-identity-verification)
15. [Wallet & Escrow Financials](#15-wallet--escrow-financials)
16. [API Routes Reference](#16-api-routes-reference)
17. [Database Schema (In-Memory Mock)](#17-database-schema-in-memory-mock)
18. [UI/UX Design System](#18-uiux-design-system)
19. [3D Animation & Motion System](#19-3d-animation--motion-system)
20. [Component Library](#20-component-library)

---

## 1. Platform Overview

**Asteria Freelance** is a full-stack AI-powered freelance marketplace built specifically for the **MENA (Middle East & North Africa) region**. It enables clients to post jobs and hire verified freelancers, while freelancers can post gig services and submit proposals for jobs. All financial transactions are protected by an **Escrow System** that guarantees payment safety for both parties.

### Core Value Propositions
- **Escrow Protection**: All payments are held in escrow until work is approved — no freelancer gets paid without client approval.
- **Multi-Milestone Payment Splits**: Large projects can be split into percentage-based milestones.
- **AI-Powered Tools**: Built-in AI assistants help freelancers write gig descriptions and proposals, and help clients write job posts and evaluate custom offers.
- **KYC Identity Verification**: Freelancers submit national ID + selfie for verified badge status.
- **Admin Dispute Resolution**: Admins have full access to deal logs, chat history, and 1-click escrow resolution.
- **Role-Based UX**: Freelancers see jobs discovery, clients see gig/talent discovery — completely separated experience.

---

## 2. User Roles & Access Levels

The platform has **3 distinct user roles**, each with a different view of the dashboard, navigation, and available features.

### 2.1 FREELANCER
A freelancer is a service provider who creates gig listings and bids on client jobs.

**Capabilities:**
- Create, edit, and manage service listings (Gigs)
- Browse and apply to client job postings with proposals
- Use AI to generate gig descriptions and proposal cover letters
- Receive orders from clients and manage deliveries
- Submit work deliverables for client approval
- Fund and submit milestones in multi-milestone orders
- Accept/decline custom offers from clients via direct messages
- Get paid through the Asteria Escrow Wallet (85% net payout after 15% platform fee)
- Submit KYC documents to receive a Verified Badge
- View their own earnings, active orders, and wallet balance

**Dashboard Discovery Feed:** Redirects to `/jobs` — freelancers browse open client job postings.

---

### 2.2 CLIENT
A client is a buyer who posts jobs or purchases freelancer gig services.

**Capabilities:**
- Post job listings with title, budget, required skills, and delivery deadline
- Browse gig marketplace and freelancer profiles
- Purchase gig services (funds go to escrow)
- Review submitted deliverables and approve/reject work
- Send custom price/scope offers to freelancers via direct messages
- Approve milestone payments per phase in multi-milestone orders
- Submit 5-star public reviews and written feedback upon completion
- Open escalated disputes that are forwarded to Admin Panel
- Manage multiple active projects

**Dashboard Discovery Feed:** Redirects to `/explore` — clients browse freelancer gig services.

---

### 2.3 ADMIN
An admin is a platform operator with full access to management tools.

**Capabilities:**
- View all platform users, freelancers, and clients
- Review and approve or reject KYC identity verification submissions
- View all platform financial transactions and order histories
- Access full report/dispute case dossiers including:
  - Full deal financial logs (order amount, escrow status, buyer/seller wallet balances)
  - Complete direct message chat history between parties
  - Reporter and target user profiles with KYC & verification status
  - 1-Click Escrow Resolution: Refund Buyer or Release Payout to Seller
  - Dismiss Report without moving funds
- View immutable Audit Logs of all admin actions
- Access platform-wide statistics

---

## 3. Authentication System

### 3.1 Mock Demo Auth (`lib/auth.ts`)
The platform uses a **Demo Cookie-Based Auth** system for development:
- Auth state is stored in a cookie named `demo_user_id`
- `auth()` server helper reads this cookie and returns the corresponding user from `lib/db.ts`
- If no cookie is found, `auth()` returns `null` (unauthenticated)

### 3.2 Login Flow (`/login`)
Users select from pre-seeded demo accounts:
- **Freelancers**: Yassine Khelifi, Leila Ben Ali, Karim Ben Ammar
- **Clients**: Sami Mansour, Nour El Houda, Oussama Hamdi
- **Admins**: Admin Master, Sarah Admin (KYC Supervisor), Tarek Admin (Finance Auditor)

Clicking a user card sets `demo_user_id` cookie and redirects to `/dashboard`.

### 3.3 Protected Routes
All `/dashboard/*` routes require authentication. If `auth()` returns null, the page calls `redirect('/login')`.

### 3.4 Middleware (`middleware.ts`)
Global middleware intercepts requests to protected paths and validates session presence before rendering.

---

## 4. Pages & Routes

### Public Pages

| Route | Description |
|---|---|
| `/` | Home page — 3D animated hero section, featured gigs, how-it-works, stats, testimonials |
| `/explore` | Gig marketplace browser with category filters and search |
| `/gig/[id]` | Individual gig detail page — title, description, pricing tiers, seller info, reviews |
| `/freelancers` | Freelancer talent discovery browser |
| `/freelancers/[id]` | Freelancer public profile page — bio, skills, gigs, stats, reviews |
| `/jobs` | Open job postings board — browse all client jobs with proposal counts |
| `/post-job` | Client job creation form with AI description writer |
| `/login` | Demo authentication — select a user role to enter the platform |

---

### Dashboard Pages (Authenticated)

| Route | Role | Description |
|---|---|---|
| `/dashboard` | ALL | Role-specific overview: earnings/orders stats, discovery feed, quick-actions |
| `/dashboard/profile` | ALL | Edit name, bio, skills, profile image |
| `/dashboard/gigs` | FREELANCER | Manage created gig listings |
| `/dashboard/gigs/new` | FREELANCER | Create a new gig with AI generator |
| `/dashboard/gigs/[id]/edit` | FREELANCER | Edit existing gig details |
| `/dashboard/orders` | ALL | View all placed/received orders |
| `/dashboard/orders/[id]` | ALL | Full Order Workspace: milestones tracker, deliverable submission, review modal, dispute |
| `/dashboard/messages` | ALL | Direct messaging between users, custom offer creation & management |
| `/dashboard/settings` | ALL | Account preferences and notification settings |
| `/dashboard/kyc` | FREELANCER | Submit KYC identity verification documents |
| `/dashboard/admin` | ADMIN | Full platform admin control panel |

---

## 5. Dashboard System

### 5.1 Dashboard Home (`/dashboard`)
The main dashboard adapts completely based on user role.

**Freelancer View:**
- **Header Banner**: "Ready to take on new projects?"
- **Quick Actions**: Create New Gig, Browse Jobs, View Orders
- **Stats Cards**: Total Earnings, Completed Orders, Active Gigs, Average Rating
- **Discovery Feed**: Live listing of open client jobs from `/jobs`

**Client View:**
- **Header Banner**: "Manage your projects & find top talent"
- **Quick Actions**: Post a New Job, Explore Gigs, View Orders
- **Stats Cards**: Total Spent, Active Orders, Jobs Posted, Proposals Received
- **Discovery Feed**: Featured gig services from `/explore`

**Admin View:**
- Full platform statistics overview with access links to admin panel

---

### 5.2 Dashboard Navigation (`DashboardNav.tsx`)
A role-based sidebar navigation that shows different menu items depending on the user's role:

**FREELANCER Sidebar:**
- Dashboard Overview
- My Gigs
- Find Jobs *(discovery feed)*
- Orders
- Messages
- Earnings / Wallet
- KYC Verification
- Settings

**CLIENT Sidebar:**
- Dashboard Overview
- Browse Services *(Explore)*
- Post a Job
- Orders
- Messages
- Wallet
- Settings

**ADMIN Sidebar:**
- Admin Control Panel
- Users Management
- Reports & Disputes
- Audit Logs
- KYC Verifications
- Financial Overview

---

## 6. Marketplace Features

### 6.1 Gig Marketplace (`/explore`)
A paginated browse interface for all active gig listings.

**Features:**
- Category filtering: Web Development, UI/UX Design, AI & Machine Learning, Mobile Development, Content Writing, Data Science
- Search by keyword (filters by gig title)
- Gig cards display: thumbnail, title, seller name, star rating, review count, starting price, delivery time, category badge
- Cards use 3D Tilt hover effect (`<Tilt3DCard>`)

### 6.2 Individual Gig Page (`/gig/[id]`)
Detailed gig listing page with full information:
- Gig title, category, delivery time
- Rich description (markdown-rendered)
- Seller profile sidebar: avatar, name, rating, review count, KYC badge, member since, response time
- Pricing tiers: Basic, Standard, Premium with feature comparisons
- Public reviews section with star breakdown bars
- Order Now / Contact Seller CTA buttons

### 6.3 Freelancer Browse (`/freelancers`)
Directory of all verified and active freelancers.

**Features:**
- Skill-based filtering
- Freelancer cards: avatar, name, role title, rating, skills tags, hourly rate, completed orders count, KYC badge
- Direct "View Profile" and "Send Message" CTAs

### 6.4 Freelancer Profile Page (`/freelancers/[id]`)
Full public profile for a freelancer:
- Hero banner: avatar, name, title, location, rating, review count, response time
- About / Bio section
- Featured Gigs carousel (their listed services)
- Work experience and portfolio items
- Public reviews with star ratings and written feedback
- "Hire Now" and "Send Message" action buttons

### 6.5 Job Board (`/jobs`)
A list of all open client job postings that freelancers can browse and apply to.

**Job Card displays:**
- Job title, description snippet
- Category badge, required skills tags
- Budget range (e.g., `$500`)
- Delivery deadline
- Number of proposals received
- Client name
- "Submit Proposal" CTA button

### 6.6 Submit Proposal (ProposalForm)
When a freelancer clicks "Submit Proposal" on a job listing:
- Form fields: Cover Letter, Proposed Price, Estimated Delivery Days
- **AI Proposal Writer**: Integrated AI button to auto-generate a professional cover letter based on the job title/description
- Submit sends data to `POST /api/proposals`

### 6.7 Post a Job (`/post-job`)
Client-facing job creation form:
- Fields: Job Title, Description, Category, Budget, Delivery Days, Required Skills (tag input)
- **AI Job Description Writer**: AI button generates a professional job description based on title input
- Submit sends data to `POST /api/jobs`

---

## 7. Order & Escrow System

### 7.1 How Orders Work
1. **Client places an order** on a gig → funds are locked in **Escrow**
2. **Freelancer receives order notification** and begins work
3. **Freelancer submits deliverables** (archive link + notes)
4. **Client reviews** and either:
   - ✅ **Approves**: Escrow funds released to freelancer (85% net after 15% platform fee)
   - ❌ **Rejects**: Client can request revisions or open a dispute
5. Upon completion, client is prompted to **submit a public review & rating**

### 7.2 Order Workspace (`/dashboard/orders/[id]`)
A full-featured workspace page for both buyers and sellers:
- **Order Details**: Gig title, category, delivery deadline
- **Milestone Tracker**: Multi-phase escrow breakdown (see Section 8)
- **Deliverable Submission** (Seller only): URL input + notes textarea
- **Approval Panel** (Buyer only): Approve & Release Funds button + Open Dispute button
- **Completion State**: Success banner with Review CTA

### 7.3 Order Status States
| Status | Description |
|---|---|
| `ACTIVE` | Order placed and in progress |
| `PENDING` | Deliverable submitted, awaiting buyer approval |
| `COMPLETED` | Buyer approved work, funds released |
| `CANCELLED` | Order cancelled or dispute resolved |

### 7.4 API Endpoints
- `POST /api/orders/[id]/deliver` — Freelancer submits deliverable
- `POST /api/orders/[id]/complete` — Buyer approves and releases escrow
- `POST /api/orders/[id]/dispute` — Buyer opens an escalated dispute

---

## 8. Multi-Milestone Escrow System

### 8.1 Concept
For large, complex projects, instead of one lump-sum escrow, the order can be divided into **multiple milestone payment phases** with individual percentage allocations.

**Default 3-Milestone Split:**
| Milestone | Description | Percentage |
|---|---|---|
| Milestone 1 | Design Specs & Wireframes | 30% |
| Milestone 2 | Code Implementation & API Integration | 40% |
| Milestone 3 | QA Testing & Production Launch | 30% |

### 8.2 Milestone Lifecycle
Each milestone follows its own independent lifecycle:

```
PENDING → FUNDED → SUBMITTED → RELEASED
```

| Status | Actor | Action |
|---|---|---|
| `PENDING` | Client (Buyer) | Funds the milestone (locks escrow for that phase) |
| `FUNDED` | Freelancer (Seller) | Submits work for this phase |
| `SUBMITTED` | Client (Buyer) | Approves work and releases phase funds |
| `RELEASED` | System | Net payout (85%) credited to seller wallet |

### 8.3 MilestoneTracker Component
- Visual progress stepper showing all milestones
- Overall completion progress bar (released % of total escrow)
- Role-specific action buttons (Buyer sees Fund/Approve, Seller sees Submit)
- Real-time updates on action success

### 8.4 API: `POST /api/orders/[id]/milestones`
Accepts action: `'FUND' | 'SUBMIT' | 'RELEASE'` and `milestoneId`. On `RELEASE`, automatically credits the seller wallet with 85% net payout for that milestone's amount.

---

## 9. Messaging & Custom Offers

### 9.1 Direct Messaging (`/dashboard/messages`)
Real-time-style direct messaging between clients and freelancers.

**Features:**
- Conversation list sidebar showing all active threads
- Chat message composer with multi-line text input
- File attachment placeholder
- Message timestamps and sender avatars

### 9.2 Custom Offer System
Clients can send a **Custom Price Offer** to a freelancer directly inside the chat:

**Custom Offer Fields:**
- Title / Service Description
- Custom Price (in USD $)
- Delivery Time (in days)
- Scope Notes

**Offer Card in Chat:**
When a custom offer is sent, it appears as a special visual card in the chat with:
- Title and scope summary
- Proposed price badge
- Delivery time
- **Accept & Fund Escrow** button (1-click order creation with escrow funding)
- **Decline** button

### 9.3 API: `POST /api/messages/offer`
Creates a custom offer message in the conversation and stores it in `db.messages`.

---

## 10. Review & Rating Engine

### 10.1 How Reviews Work
1. Client completes an order (`POST /api/orders/[id]/complete`)
2. A **Review Submission Modal** automatically opens
3. Client selects 1–5 stars and writes detailed text feedback
4. Submitting calls `POST /api/reviews` which:
   - Saves the review record to `db.reviews`
   - Recalculates the freelancer's **weighted average rating**:
     ```
     newRating = (currentRating × currentCount + newRating) / newCount
     ```
   - Increments `reviewCount` on the freelancer user record

### 10.2 ReviewSubmissionModal Component
- Interactive 5-star picker with hover physics (stars scale up on hover)
- Written feedback textarea (required, minimum content)
- Submission loading state
- Success confirmation animation

### 10.3 Public Review Display
- Reviews appear on freelancer profile pages (`/freelancers/[id]`)
- Reviews appear on gig detail pages (`/gig/[id]`)
- Each review shows: reviewer avatar, name, star rating, written comment, date

---

## 11. AI Assistant Features

### 11.1 AI Assistant Modal (`components/ai/AIAssistantModal.tsx`)
A multi-mode AI assistant integrated across the platform. It adapts its prompt and output based on the user's current task.

### 11.2 AI Modes

**GIG_GENERATOR** (For Freelancers — `/dashboard/gigs/new`)
- Input: Gig title + category
- Output: Full gig description with service overview, deliverables list, requirements, and FAQ
- Helps freelancers write compelling service listings

**JOB_DESCRIPTION** (For Clients — `/post-job`)
- Input: Job title
- Output: Professional job posting with scope, deliverables, required skills, and timeline expectations
- Helps clients articulate their needs clearly

**PROPOSAL_LETTER** (For Freelancers — Job Board)
- Input: Job title + description
- Output: Personalized cover letter highlighting relevant experience, proposed approach, and delivery plan
- Helps freelancers win competitive bids

**OFFER_ASSISTANT** (For Clients — Messages)
- Input: Custom offer scope notes
- Output: Professionally structured offer description with clear scope boundaries and pricing rationale

### 11.3 Integration Points
| Page | AI Mode | Trigger |
|---|---|---|
| `/dashboard/gigs/new` | GIG_GENERATOR | "✨ AI Generate" button |
| `/post-job` | JOB_DESCRIPTION | "✨ AI Write Description" button |
| `ProposalForm` | PROPOSAL_LETTER | "✨ AI Write Proposal" button |
| `/dashboard/messages` | OFFER_ASSISTANT | "✨ AI Draft Offer" button |

---

## 12. Notification System

### 12.1 Notification Dropdown (`components/ui/NotificationDropdown.tsx`)
A bell icon notification center embedded in the Navbar.

**Notification Types:**
| Type | Description |
|---|---|
| NEW_ORDER | Client placed an order on your gig |
| ORDER_COMPLETE | Order completed & funds released |
| MESSAGE | New direct message received |
| PROPOSAL | New proposal received on your job |
| REVIEW | New public review posted on your profile |
| KYC_APPROVED | Identity verification was approved |
| OFFER_RECEIVED | Custom price offer received in chat |

**Features:**
- Unread count badge on bell icon
- Click notification to navigate to relevant page
- Mark all as read action
- Animated slide-down dropdown panel

---

## 13. Admin Master Dashboard

### 13.1 Overview (`/dashboard/admin`)
The Master Admin Dashboard is a tabbed control center for platform operators.

**Tabs:**
1. **Platform Overview** — Key statistics: total users, orders, GMV, pending KYC reviews
2. **User Management** — Searchable table of all users with role, KYC status, wallet balance, join date
3. **Financial Transactions** — All orders with buyer/seller names, amounts, statuses
4. **Flagged Reports** — All active dispute/report cases with full Inspect Case access
5. **KYC Verifications** — Pending identity verification submissions with Approve/Reject controls
6. **Audit Log** — Immutable timestamped record of all admin actions

### 13.2 User Management
- Searchable by name or email
- Filter by role (FREELANCER, CLIENT, ADMIN)
- Per-user actions: Suspend Account, Lock Account, View Profile

### 13.3 KYC Verification Panel
When a freelancer submits KYC documents, they appear in this panel:
- Displays: Full name, date of birth, nationality, document type, document number
- Shows: ID Front image, ID Back image, Selfie photo (full-resolution preview)
- Admin actions:
  - ✅ **Approve** → Sets user `verifiedStatus` to `APPROVED`, displays "KYC ✓" badge
  - ❌ **Reject** → Sets status to `REJECTED` with reason
- All actions written to Audit Log

### 13.4 Deep Case Inspection Dossier
When an admin clicks **Inspect Case** on any report:

A full-screen modal dossier opens with **3 tabs**:

**Tab 1 — Deal Financial Logs:**
- Order ID, service title, category
- Total escrow amount
- Order status (ACTIVE / COMPLETED / CANCELLED)
- Buyer name, email, wallet balance, KYC status
- Seller name, email, wallet balance, KYC status

**Tab 2 — Chat History Transcript:**
- Full chronological direct message conversation between buyer and seller
- Sender names, message text, timestamps
- Context showing the dispute escalation

**Tab 3 — Reporter & Target Profiles:**
- Reporter user: name, email, role, KYC badge, wallet balance
- Submitted report reason and full description
- Report submission timestamp

**Admin Resolution Actions (1-Click):**
| Action | Effect |
|---|---|
| 🔴 Refund Buyer & Close | Full escrow amount returned to buyer's wallet balance, order cancelled, report resolved, Audit Log entry created |
| 🟢 Release Payout to Seller | 85% net payout credited to seller wallet, order completed, report resolved, Audit Log entry created |
| ⚫ Dismiss Report | Report marked resolved with no escrow movement |

### 13.5 Audit Log
An immutable, append-only log of all admin actions:
- Admin name and ID
- Action type (e.g., `KYC_APPROVED`, `ESCROW_REFUND`, `ACCOUNT_SUSPENDED`)
- Detailed description
- Timestamp

---

## 14. KYC Identity Verification

### 14.1 Why KYC?
KYC (Know Your Customer) verification ensures all active freelancers are real, verified individuals — protecting clients from fraud and building marketplace trust.

### 14.2 Verification Flow
1. Freelancer visits `/dashboard/kyc`
2. Fills the submission form:
   - Full legal name (as on ID)
   - Date of birth
   - Country / Nationality
   - Document type: National ID / Passport / Driving License
   - Document number
   - Upload: **ID Front Image** (URL or file)
   - Upload: **ID Back Image** (URL or file)
   - Upload: **Selfie Photo** (URL or file — must match ID)
3. Submits to `POST /api/kyc`
4. Status set to `PENDING` — visible in Admin KYC Panel
5. Admin reviews → Approves or Rejects
6. Status updates on user profile

### 14.3 Verification Statuses
| Status | Description |
|---|---|
| `UNSUBMITTED` | User has not started KYC |
| `PENDING` | Submission under admin review |
| `APPROVED` | Verified — displays "KYC ✓" badge on profile |
| `REJECTED` | Documents rejected — user can resubmit |

---

## 15. Wallet & Escrow Financials

### 15.1 Wallet Balance
Every user has a `walletBalance` (in USD $) stored on their user record.

**How wallet is funded:**
- Clients load wallet balance to place orders
- Freelancers receive net payouts from completed orders/milestones

### 15.2 Escrow Flow
```
Client Wallet → [ESCROW LOCKED] → Freelancer Wallet (85%)
                                 → Platform Fee (15%)
```

1. Client places order → `order.amount` deducted from client wallet
2. Funds held in escrow (represented by order status `ACTIVE`)
3. Order approved / milestone released → `amount × 0.85` credited to seller wallet
4. Platform retains `amount × 0.15` (15% commission)

### 15.3 Platform Fee
- **15% commission** on all successful transactions
- Freelancer net payout = 85% of escrow amount

---

## 16. API Routes Reference

### Auth & Users
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/auth/me` | Returns current authenticated user |
| `GET` | `/api/auth/logout` | Clears session cookie |

### Gigs
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/gigs` | List all gigs (supports `?category=` filter) |
| `POST` | `/api/gigs` | Create a new gig (requires FREELANCER role) |
| `PATCH` | `/api/gigs/[id]` | Update gig details |

### Jobs
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/jobs` | List all open jobs |
| `POST` | `/api/jobs` | Create a new job (requires CLIENT role) |

### Proposals
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/proposals` | Submit a proposal on a job |

### Orders
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/orders/[id]/deliver` | Freelancer submits deliverable |
| `POST` | `/api/orders/[id]/complete` | Buyer approves and releases escrow |
| `POST` | `/api/orders/[id]/dispute` | Buyer opens escalated dispute |
| `POST` | `/api/orders/[id]/milestones` | Fund, submit, or release a milestone |

### Reviews
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/reviews` | Submit a star rating + review |
| `GET` | `/api/reviews?freelancerId=` | Fetch reviews for a freelancer |
| `GET` | `/api/reviews?gigId=` | Fetch reviews for a gig |

### Messages
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/messages/offer` | Send a custom price offer in chat |

### Reports
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/reports` | Submit a report/dispute |

### Admin
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/admin/reports/[id]` | Fetch full case dossier (Admin only) |
| `GET` | `/api/admin/verifications` | List all KYC submissions |
| `POST` | `/api/admin/verifications/[id]` | Approve or Reject KYC submission |

### KYC
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/kyc` | Submit KYC documents |

### AI
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/ai` | Generate AI content (mode: GIG_GENERATOR, JOB_DESCRIPTION, PROPOSAL_LETTER, OFFER_ASSISTANT) |

---

## 17. Database Schema (In-Memory Mock)

The platform uses `lib/db.ts` as its in-memory data store powered by `globalThis.__ASTERIA_DB__` — a singleton object persisted across Next.js hot-reloads in development.

### UserRecord
```typescript
{
  id: string
  name: string
  email: string
  role: 'CLIENT' | 'FREELANCER' | 'ADMIN'
  image?: string
  bio?: string
  skills?: string[]
  walletBalance: number
  verifiedStatus?: 'UNSUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED'
  rating?: number
  reviewCount?: number
  createdAt: Date
}
```

### OrderRecord
```typescript
{
  id: string
  gigId: string
  buyerId: string
  sellerId: string
  amount: number
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  milestones?: MilestoneItem[]
  gig?: any
  buyer?: any
  seller?: any
  createdAt: Date
}
```

### MilestoneItem
```typescript
{
  id: string
  title: string
  percentage: number
  amount: number
  status: 'PENDING' | 'FUNDED' | 'SUBMITTED' | 'RELEASED'
}
```

### JobRecord
```typescript
{
  id: string
  title: string
  description: string
  category: string
  budget: number
  deliveryDays: number
  skills: string[]
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED'
  clientId: string
  client?: { name: string }
  _count?: { proposals: number }
  createdAt: Date
}
```

### ReportRecord
```typescript
{
  id: string
  reporterId: string
  reporterName: string
  targetType: 'GIG' | 'ORDER' | 'USER'
  targetId: string
  targetTitle: string
  reason: string
  description: string
  status: 'PENDING' | 'DISMISSED' | 'RESOLVED'
  createdAt: Date
}
```

### VerificationRecord (KYC)
```typescript
{
  id: string
  userId: string
  fullName: string
  dob: string
  country: string
  documentType: string
  documentNumber: string
  idFrontUrl: string
  idBackUrl: string
  selfieUrl: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string
  submittedAt: Date
  reviewedAt?: Date
}
```

### AuditLogRecord
```typescript
{
  id: string
  adminId: string
  adminName: string
  action: string
  details: string
  createdAt: Date
}
```

---

## 18. UI/UX Design System

### 18.1 Color Palette
| Token | Value | Usage |
|---|---|---|
| `--ast-dark` | `#0a3a40` | Primary dark teal — hero backgrounds, CTAs |
| `--ast-primary` | `#11606e` | Brand primary — buttons, accents |
| `--ast-light` | `#60c8d4` | Brand accent — glows, highlights, gradients |
| `--ast-surface` | `#f4f8f8` | Light background for cards and panels |
| `--ast-gray` | `#6b7280` | Muted text, labels, secondary info |

### 18.2 Typography
| Variable | Font | Usage |
|---|---|---|
| `--font-heading` | Exo 2 (Bold/ExtraBold) | Page titles, section headings, brand text |
| `--font-body` | Plus Jakarta Sans | Body text, paragraphs, descriptions |
| `--font-mono` | JetBrains Mono | Code, tags, timestamps, labels |

### 18.3 Spacing & Radius
- **Border Radius**: Cards use `rounded-2xl` (16px) to `rounded-3xl` (24px) for premium feel
- **Shadow System**: `shadow-sm` for base cards, `shadow-xl` for modals and dropdowns
- **Backdrop Blur**: `backdrop-blur-xl` for glassmorphic elements

### 18.4 Animation Principles
- **Entrance Animations**: `framer-motion` variants with stagger timing
- **Hover States**: `transition-transform hover:-translate-y-1` for lift effect
- **Loading States**: `animate-pulse` skeleton screens
- **Scroll Indicator**: Animated `animate-bounce` arrow
- **GSAP Text Reveals**: Staggered `yPercent` reveal from clipped overflow containers

---

## 19. 3D Animation & Motion System

### 19.1 HeroCanvas (3D Particle Engine)
A `<canvas>` element rendering a real-time 3D scene:

**Features:**
- **3D Depth-of-Field Particles**: 180 particles with z-axis velocity creating a starfield tunnel effect
- **Mouse Parallax Tracking**: Particle positions shift based on cursor position via smooth interpolation (lerp)
- **Perspective Wave Grid Floor**: 3D grid lines drawn using projection math — creates vanishing point floor
- **Constellation Lines**: Nearby projected particles connected with opacity-weighted lines
- **Particle Glow**: Each particle has a `shadowBlur` glow matching its hue (HSL 180–220 range)

### 19.2 LogoModel (3D Holographic Graphic)
An SVG-based 3D isometric graphic with layered Framer Motion animations:

- **Ambient Aura**: Soft radial blur glow in brand teal
- **Outer Orbit Ring**: `rotate(360deg)` in 25s continuous spin
- **Inner Counter Ring**: `rotate(-360deg)` in 18s reverse spin
- **Holographic Prism Pyramid**: SVG polygon with gradient fill and stroke — continuously floating
- **Pulsing Core Orb**: Glowing center circle with `scale` keyframes
- **Status Pill Cards**: Two floating glassmorphic badges with escrow and delivery stats

### 19.3 Tilt3DCard Component
A reusable 3D perspective card wrapper built with Framer Motion:

```tsx
<Tilt3DCard className="your-card-classes">
  {/* Any card content */}
</Tilt3DCard>
```

**Mechanism:**
- Tracks `mousemove` relative to card boundaries
- Maps cursor offset to `rotateX` / `rotateY` values (max ±10°)
- Uses `framer-motion` spring physics for smooth return-to-center on mouse leave
- `transform-style: preserve-3d` and `perspective: 1000px` for real depth

---

## 20. Component Library

### Layout Components
| Component | Location | Description |
|---|---|---|
| `Navbar` | `components/layout/Navbar.tsx` | Top navigation with logo, role-aware links, notifications bell, user avatar |
| `Footer` | `components/layout/Footer.tsx` | Platform footer with links |
| `DashboardNav` | `components/dashboard/DashboardNav.tsx` | Role-based sidebar navigation |

### UI Primitives
| Component | Location | Description |
|---|---|---|
| `Tilt3DCard` | `components/ui/Tilt3DCard.tsx` | 3D perspective tilt hover card wrapper |
| `NotificationDropdown` | `components/ui/NotificationDropdown.tsx` | Bell icon notification center |
| `ScrollProgressBar` | `components/ui/ScrollProgressBar.tsx` | Thin top progress bar showing scroll position |
| `CustomCursor` | `components/cursor/CustomCursor.tsx` | Custom branded mouse cursor |
| `LoadingScreen` | `components/loading/LoadingScreen.tsx` | Full-screen animated loading screen on hero entry |

### 3D Components
| Component | Location | Description |
|---|---|---|
| `HeroCanvas` | `components/3d/HeroCanvas.tsx` | 3D particle constellation + wave grid canvas |
| `LogoModel` | `components/3d/LogoModel.tsx` | Holographic prism SVG with orbital rings and status pills |

### Section Components (Home Page)
| Component | Location | Description |
|---|---|---|
| `HeroSection` | `components/sections/HeroSection.tsx` | Full-screen animated 3D hero with search, stats, and CTA |
| `HowItWorksSection` | `components/sections/HowItWorksSection.tsx` | Step-by-step platform explanation |
| `StatsSection` | `components/sections/StatsSection.tsx` | Animated platform statistics counters |
| `FeaturedGigsSection` | `components/sections/FeaturedGigsSection.tsx` | Curated featured service listings |
| `CategoriesSection` | `components/sections/CategoriesSection.tsx` | Browse-by-category grid |
| `TestimonialsSection` | `components/sections/TestimonialsSection.tsx` | Social proof testimonials |

### Feature Components
| Component | Location | Description |
|---|---|---|
| `AIAssistantModal` | `components/ai/AIAssistantModal.tsx` | Multi-mode AI content generation modal |
| `MilestoneTracker` | `components/orders/MilestoneTracker.tsx` | Multi-milestone escrow tracker with actions |
| `OrderWorkspaceClient` | `components/orders/OrderWorkspaceClient.tsx` | Full order workspace with deliverables, milestones, review & dispute |
| `ReviewSubmissionModal` | `components/orders/ReviewSubmissionModal.tsx` | Interactive 5-star rating + feedback modal |
| `ProposalForm` | `components/jobs/ProposalForm.tsx` | Job proposal submission form with AI writer |
| `FreelancerBrowser` | `components/freelancers/FreelancerBrowser.tsx` | Filterable freelancer directory browser |

### Dashboard Components
| Component | Location | Description |
|---|---|---|
| `DashboardStats` | `components/dashboard/DashboardStats.tsx` | Animated stat cards |
| `DashboardChart` | `components/dashboard/DashboardChart.tsx` | Earnings/orders chart |
| `AdminClient` | `app/dashboard/admin/AdminClient.tsx` | Full admin panel with all management tabs |

---

## Seed Test Data

### Demo Users
| ID | Name | Role | Wallet |
|---|---|---|---|
| `f1` | Yassine Khelifi | FREELANCER ✓ KYC | $1,450 |
| `f2` | Leila Ben Ali | FREELANCER ⏳ KYC | $820 |
| `f3` | Karim Ben Ammar | FREELANCER ✓ KYC | $2,100 |
| `c1` | Sami Mansour | CLIENT ✓ KYC | $3,200 |
| `c2` | Nour El Houda | CLIENT ❌ No KYC | $1,850 |
| `c3` | Oussama Hamdi | CLIENT ✓ KYC | $5,000 |
| `admin1` | Admin Master | ADMIN | — |
| `admin2` | Sarah Admin | ADMIN (KYC Supervisor) | — |
| `admin3` | Tarek Admin | ADMIN (Finance Auditor) | — |

### Demo Orders
| ID | Buyer | Seller | Amount | Status |
|---|---|---|---|---|
| `ord1` | Sami Mansour | Yassine Khelifi | $299 | COMPLETED |
| `ord2` | Sami Mansour | Leila Ben Ali | $199 | ACTIVE |
| `ord3` | Sami Mansour | Yassine Khelifi | $79 | COMPLETED |

### Demo Reports (for Admin testing)
| ID | Reporter | Target | Reason | Status |
|---|---|---|---|---|
| `r1` | Yassine Khelifi | Gig #g3 | Misleading pricing | PENDING |
| `r2` | Sami Mansour | Order #ord2 | Incomplete Deliverable | PENDING |
| `r3` | Yassine Khelifi | Order #ord1 | Unreasonable Revision Scope | PENDING |

---

*Documentation last updated: August 2026 — Asteria Freelance v2.0*
