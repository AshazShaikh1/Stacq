# Stacq Project Report & Developer Onboarding

## 1. Executive Summary: What is Stacq?

Stacq is a **human-curated resource platform**. Think of it as "Pinterest for Knowledge/Resources" or "Spotify for Links."

In an era of AI-generated content and SEO-spam, Stacq focuses on high-quality, human-verified curation. Users create **Collections** (internally often referred to as "Stacks") to organize resources, and add **Cards** (links, articles, tools, videos) to them.

**The MVP Goal:**
To build a fast, frictionless platform for discovering and saving high-quality resources with community validation (upvotes, comments, saves) and real-time interaction.

---

## 2. Core Concepts & Domain Model

To work on this project, you must understand the main entities:

### A. The Card (Resource)
- **Definition:** A Card represents a single, canonical URL (e.g., a specific GitHub repo, a specific YouTube video).
- **Canonical Nature:** If User A saves `example.com` and User B saves `example.com`, there is only **one** row in the `cards` table.
- **Metadata:** We automatically scrape Open Graph tags (title, description, image) when a link is added.
- **Status:** Cards can be `active`, `removed`, `broken`, or `archived` (see `cards.status`).
- **Search:** Cards have `search_vector` and trigram indexes for full-text and fuzzy search.

### B. The Collection (Stack)
- **Definition:** A container for Cards. Similar to a Board on Pinterest or a Playlist on Spotify.
- **Visibility:** Can be Public, Private, or Unlisted (backed by `is_public` + `is_hidden` flags).
- **Ownership:** Owned by a specific user ("Stacker").
- **Promotion:** Collections can be promoted (`promoted_until`) via Stripe payments.
- **Search/Discovery:** Collections have `search_vector` and trigram indexes to support search and explore.

### C. The Stacqer (User)
- **Roles:**
  - `user`: Standard consumer.
  - `stacker`: Creator who can publish public cards and collections.
  - `admin`: System administrator.
- **Scoring:** Users have a `quality_score` (0–100) based on how others interact with their curated content.
- **Profile:** Users have `username`, `display_name`, `avatar_url`, and additional `metadata`.

### D. Relationships & Social Layer
- **Stack–Card Mapping:** `stack_cards` is a many-to-many join between collections and cards, with `position` and optional `note` per card.
- **Tags:**
  - `tags` is the canonical tag list.
  - `stack_tags` and `card_tags` link tags to collections and cards.
- **Votes:**
  - `votes` records upvotes on stacks or cards (`target_type` in `('stack','card')`).
- **Comments:**
  - `comments` are threaded (`parent_id`), soft-deletable, and can target stacks or cards.
- **Saves & Follows:**
  - `saves` allows users to save cards and collections.
  - `follows` lets users follow other users/stackers.
- **Notifications & Reports:**
  - `notifications` table backs in-app notifications.
  - `reports` table lets users report abusive or low-quality content.

_All schema and RLS policies live under `supabase/migrations` (start from `001_initial_schema.sql` and `002_rls_policies.sql`)._

---

## 3. Technology Stack

We are using a modern, serverless-focused stack designed for speed and rapid iteration.

| Layer | Technology | Key Libraries/Notes |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 15** (App Router) | React 19, TypeScript, Tailwind CSS |
| **Backend** | **Next.js API Routes** | Supabase client in API routes; some server actions |
| **Database** | **Supabase** (PostgreSQL) | `pg_trgm` for search, Row Level Security (RLS), views & triggers |
| **Auth** | **Supabase Auth** | Email & OAuth (Google) |
| **Storage** | **Supabase Storage** | Images, thumbnails, user avatars |
| **Caching/Rate Limit** | **Upstash Redis** | API rate limiting & feed caching |
| **Realtime** | **Supabase Realtime** | WebSocket updates for comments/notifications |
| **Cron Jobs** | **GitHub Actions** | Trigger API endpoints for background tasks |
| **Payments** | **Stripe** | Promotion, hidden collections, featured stacker, username reservation |
| **Analytics** | **Mixpanel** | Event tracking (page + key actions) |
| **Monitoring** | **(Pluggable)** | Custom monitoring/alerts module, ready to integrate with Sentry/Slack |
| **Styling** | **Tailwind CSS** | Configured in `tailwind.config.ts` |
| **Animation** | **Framer Motion** | Modal transitions and micro-interactions |

---

## 4. Key Workflows & Implementation Details

### A. Creating a Card

1. **User action:** User clicks "+" (e.g., `AddCardButton`) and opens `CreateCardModal`.
2. **Enter URL:** User enters a URL.
3. **Metadata Extraction:**
   - The app calls `POST /api/cards/metadata`.
   - We fetch the URL, extract Open Graph tags using `cheerio`, and return `title`, `description`, `image`.
4. **User Confirmation:** User can edit title/description and choose a thumbnail.
5. **Select Collection:** User selects a target Collection (Stack) or creates a new one.
6. **Submission (`POST /api/cards`):**
   - **Auth:** We read the current user from Supabase Auth.
   - **Rate limiting:** We enforce a per-user, per-IP limit (Upstash) for card creation.
   - **Monitoring:** We fire `checkUserCardLimit` to flag abnormal card creation.
   - **Canonicalization:** We normalize the URL via `canonicalizeUrl` so duplicates collapse into one `cards` row.
   - **Visibility rules:**
     - If the card is attached to a collection, visibility follows the collection.
     - If it is a standalone card, only `stacker` or `admin` roles can make it public; normal users’ standalone cards remain non-public.
   - **Insert or reuse card:**
     - Try inserting into `cards` with `canonical_url`.
     - On unique constraint conflict (duplicate URL), fetch the existing card.
   - **Affiliate enrichment:** For Amazon URLs, we asynchronously add an affiliate tag and mark `metadata.is_amazon_product`.
   - **Attribution:** We write to `card_attributions` to record who added the card and from where (collection/manual).
   - **Attach to collection:** We insert into `stack_cards` to link the card to the selected collection.

### B. Collections (Stacks)

- **Creation & Editing:**
  - Handled by `CreateCollectionModal` and `EditCollectionModal` components.
  - Backed by `POST /api/collections` and `PATCH /api/collections/[id]`.
- **Visibility:**
  - `is_public` and `is_hidden` control public/explore visibility vs paid hidden collections.
  - RLS ensures only owners and authorized viewers can see private/hidden collections.
- **Cloning:**
  - `POST /api/collections/[id]/clone` lets users clone others’ collections, subject to RLS and business rules.

### C. Feed, Home, and Landing Transition

The signed-in home experience is feed-driven, and we protect against flicker between landing and feed after auth.

- **Ranking-powered feed:** Implemented in `src/lib/ranking/algorithm.ts` and served from `GET /api/feed`.

- **Signals:** Upvotes, saves, comments, visits, age (hours), creator quality, promotion boost, abuse factor.
- **Base score:**
  - For cards/collections we compute:
    - \( base = w_u \cdot \ln(1+U) + w_s \cdot \ln(1+S) + w_c \cdot \ln(1+C) + w_v \cdot \ln(1+V) \)
- **Decay & multipliers:**
  - Exponential time decay using a half-life (cards vs collections have different half-lives).
  - Creator quality multiplier (higher-quality curators get a boost).
  - Promotion multiplier for paid promotion windows.
  - Abuse penalty floor to avoid spam dominating.
- **Normalization:**
  - We can compute mean/stddev over a window and store normalized scores (z-scores) for more stable ranking.
- **Serving the feed:**
  - The API route checks Redis for a cached feed.
  - If cache miss, it queries the ranking view / scores, applies the algorithm if needed, and writes back to Redis.
- **Landing → feed guard:**
  - `LandingSignedInGuard` (client-side) overlays a skeleton on top of the landing page when the client detects a signed-in user but the server rendered the signed-out landing.
  - This prevents the marketing landing page from flashing after sign-in while the feed view loads.

### D. Background Workers (GitHub Actions)

We do not use a heavy queue system like BullMQ. Instead, we use GitHub Actions under `.github/workflows` as a cron scheduler that hits API routes under `src/app/api/workers`.

Current jobs include:

- **Ranking Refresh:**
  - `ranking-worker.yml` and `refresh-ranking.yml`.
  - Periodically call `/api/workers/ranking` and `/api/admin/refresh-ranking` to recompute scores and update ranking views.
- **Link Health:**
  - `check-links.yml`.
  - Calls `/api/workers/check-links` to detect broken or unreachable URLs and mark cards as `broken` when needed.
- **Metadata Fetch:**
  - `fetch-metadata.yml`.
  - Batches metadata refresh for cards whose metadata is stale or missing.
- **Fraud Detection & Quality Score:**
  - `fraud-detection.yml` and `quality-score.yml`.
  - Use `/api/workers/fraud-detection` and `/api/workers/quality-score` to adjust quality scores, detect abnormal activity, and update creator-level metrics.
- **Monitoring Alerts:**
  - `monitoring-alerts.yml`.
  - Calls `/api/monitoring/check-alerts` to surface anomalies (see Anti-Abuse section).

### E. Anti-Abuse & Monitoring

Anti-abuse lives primarily in two layers: rate limiting and monitoring/alerts.

1. **Rate Limiting (Upstash Redis):**
   - Implemented in `src/lib/rate-limit.ts` and used in key write-heavy endpoints (`/api/cards`, comments, votes, etc.).
   - Per-user and per-IP limits to prevent spammy behavior.

2. **Monitoring & Alerts (`src/lib/monitoring/alerts.ts`):**
   - Configurable thresholds for:
     - Cards per user per day.
     - Global votes per hour.
     - Browser extension saves per hour.
   - When thresholds are exceeded, we trigger structured alerts with type, severity, message, and data payload.
   - Handlers can forward these alerts to Sentry, email, or Slack (pluggable).

3. **Database-Level Protections (RLS policies):**
   - Users cannot delete others’ collections or cards.
   - Private/hidden collections are only visible to owners (and in some cases followers, depending on policy).
   - Only `stacker`/`admin` can create public content in certain tables.

### F. Payments & Monetization

Stripe payments are wired through `POST /api/payments/checkout` and `POST /api/payments/webhook`.

- **Supported payment types (`PaymentType`):**
  - `promote`: Promote a collection in explore feeds for a duration.
  - `hidden_stack`: Make a collection hidden (paid privacy feature) for a duration.
  - `featured_stacker`: Feature a creator profile as a top stacker for a duration.
  - `reserve_username`: Reserve a username permanently.
- **Validation:**
  - All requests must be authenticated via Supabase Auth.
  - For `promote`/`hidden_stack`, the collection must exist and belong to the user.
  - For `reserve_username`, we verify the username is available (case-insensitive).
- **Pricing & Durations:**
  - Calculated with helpers in `src/lib/stripe.ts` (`getPrice`, `getDurationDays`).
- **Post-payment effects:**
  - Webhook applies side effects: updating `promoted_until`, marking hidden collections, reserving usernames, etc.

### G. Notifications, Follows, and Reports

- **Follows:**
  - Users can follow other users; follow data powers parts of the feed and profile views.
- **Notifications:**
  - API routes under `/api/notifications` manage listing, marking as read, and counting unread notifications.
  - Used for events such as new followers, comments, or promotions.
- **Reports:**
  - `/api/reports` lets users report content.
  - Admin tools (under `/app/(main)/admin`) expose reports and ranking dashboards.

### H. Search, Explore, and Saved Views

- **Explore:**
  - `/app/(main)/explore` shows ranked cards/collections from the ranking pipeline.
- **Search:**
  - `/api/search` uses PostgreSQL `pg_trgm` and `tsvector` indexes on `cards` and `collections`.
  - `SearchAutocomplete` component powers instant search UX.
- **Saved:**
  - `/app/(main)/saved` and related components show a user’s saved cards and collections.

---

## 5. Frontend Architecture (High-Level)

- **Routing:**
  - Next.js App Router with layout groups: auth routes (`/login`, `/signup`, `/reset-password`) and main app routes under `(main)`.
- **State & Contexts:**
  - `AuthContext` wraps Supabase auth state on the client.
  - `ToastContext` provides global toasts.
- **UI Components:**
  - `components/ui/*` exposes primitives (`Button`, `Input`, `Modal`, `Tooltip`, `Toast`, etc.).
  - Feature directories (`card`, `collection`, `comments`, `profile`, `stacker`, `feed`, etc.) contain cohesive UI + logic per domain area.
- **Data Fetching:**
  - SWR-based fetcher for client-side data where needed.
  - Direct calls to API routes or Supabase client in server components where possible.
- **Analytics:**
  - `lib/analytics.ts` integrates Mixpanel to track key events (signups, card saves, follows, etc.).
 - **Navigation & Avatars:**
   - Shared `AccountDropdown` is used on desktop and mobile headers for a consistent account menu.
   - Header and bottom mobile navigation avatars read from the `users` table (with fallback to auth metadata) so profile picture updates stay in sync across the app.

---

## 6. Getting Started (Developer Checklist)

1. **Install dependencies:**
   - `npm install`
2. **Environment variables:**
   - Copy `.env.example` → `.env.local`.
   - Fill in Supabase URL & anon/service keys, Upstash, Stripe keys, Mixpanel token, and any monitoring/webhook secrets.
3. **Run the dev server:**
   - `npm run dev` → open `http://localhost:3000`.
4. **Database:**
   - Use Supabase with the SQL files under `supabase/migrations` applied in order.
5. **Background jobs:**
   - Ensure GitHub Actions or an equivalent scheduler is configured to hit worker endpoints in production.

This report is kept in sync with the current codebase (Next.js 15, React 19, Supabase, Stripe, Upstash, Mixpanel) and should be your primary onboarding document when starting work on Stacq.