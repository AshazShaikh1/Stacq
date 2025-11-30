Stack (MVP) — Cursor AI Context (Full, Detailed, Implementation-Ready)
======================================================================

Use this file as the single-source-of-truth for Cursor AI when building or coordinating the **MVP** only. It must enable execution without asking clarifying questions. It covers: short product summary, exact MVP features, how each feature will be implemented (non-code), anti-abuse / loopholes and technical controls, UI/UX rules, and full DB schema with constraints, indexes, and RLS guidance. Real-time updates are required for comments, notifications, follows and other live interactions.

Be precise. Be conservative. Ship fast.

1 — Product summary (MVP)
=========================

Stack is a human-curated resource platform: people create **Stacks** (boards) and add **Cards** (resources: links/images/videos/docs). Stack’s MVP is Pinterest-like UI + human curation + community interactions (upvotes, comments) + a browser extension for fast saves. The MVP goals:

*   Rapid discovery of high-quality human-curated resources
    
*   Fast, frictionless saving from web via extension
    
*   Community signals (upvotes, comments) to surface quality
    
*   Real-time interactions for engagement
    
*   Simple monetization (promoted stacks, featured stackers, paid hidden stacks) enabled but non-invasive
    

Core constraints:

*   Launch fast with free-tier tooling
    
*   Prioritize anti-abuse & quality
    
*   All real-time actions must reflect instantly in UI (comments, notifications, follows, votes)
    

Tech Stack (MVP):

*   Frontend: Next.js + TypeScript (App Router) + Tailwind CSS
    
*   DB/Auth/Storage/Realtime: Supabase (Postgres + Auth + Storage + Realtime)
    
*   Queue/Rate-limit: Upstash Redis (serverless) + lightweight serverless workers (Edge Functions or Vercel serverless). Migrate to BullMQ + managed Redis later if needed.
    
*   Extension: Plasmo
    
*   Payments: Stripe (Checkout + webhooks)
    
*   Analytics: Mixpanel
    
*   Monitoring: Sentry
    

2 — MVP Feature List (explicit)
===============================

These are the only features in MVP. Everything else is postponed.

Core features:

1.  Stacks — create/edit/delete, public/private/unlisted, tags, cover image
    
2.  Cards — add by URL (auto-metadata) or manual entry; thumbnail stored; cards are canonical resources that can belong to many Stacks
    
3.  Feed (signed-in) — personalized by tag interactions (basic personalization) + general trending
    
4.  Explore — categories, trending stacks, top stackers, basic filters (Most Upvoted / Newest)
    
5.  Profile — Created / Saved, basic stats (views, upvotes)
    
6.  Upvote — quality upvote on Stack or Card (one per user)
    
7.  Comments — threaded comments on Stack and Card
    
8.  Notifications — real-time in-app notifications (upvotes, comments, clones, follows)
    
9.  Clone — create private clone of any public Stack (no publish permission required for MVP)
    
10.  Browser Extension — save current page to selected Stack (quick save)
    
11.  Basic Search — Postgres full-text + pg\_trgm (Stacks/Cards/Stackers)
    
12.  Authentication — Supabase Auth (email + OAuth providers)
    
13.  Monetization (MVP minimal): Promoted Stacks, Featured Stackers, Paid hidden Stacks, Reserve username
    
14.  Realtime updates for comments, votes, notifications, follows (Supabase Realtime)
    

3 — Implementation overview (how each feature will be built; non-code)
======================================================================

A. Stacks (Board)
-----------------

*   Flow: Client submits stack create request -> API checks auth -> insert into stacks table -> generate slug -> store cover image in Supabase Storage if provided -> return stack object.
    
*   Visibility: is\_public boolean. Unlisted/hidden stacks are possible (is\_hidden).
    
*   Tags: stack\_tags many-to-many mapping. Tagging limited to, e.g., 10 tags per stack.
    
*   UI: Stack page header (cover, title, desc, tags) + action bar (Upvote, Save, Share, Clone). Cards in masonry below.
    
*   Background: materialized view for explore\_ranking refreshed periodically.
    

B. Cards (Resource)
-------------------

*   Primary flow: paste URL -> frontend shows metadata loader -> API enqueues metadata fetch job (fast response to client) -> worker fetches Open Graph / link preview -> canonicalize URL -> dedupe by canonical\_url -> store metadata in cards table -> upload thumbnail to Supabase Storage.
    
*   If duplicates exist: create stack\_cards mapping referencing existing card row (avoid duplication).
    
*   Manual fallback: user can edit title/description/thumbnail before final save.
    
*   Background link checks scheduled (link health check job) to update link\_checks.
    

C. Feed & Explore
-----------------

*   MVP feed algorithm: server query that combines weighting:
    
    *   score = alpha \* upvotes\_weighted + beta \* saves\_count + gamma \* stacker\_quality\_score + decay(age)
        
    *   Personalization: filter boost if user interacts with tags or follows stackers (simple tag-based boosting for MVP).
        
*   Implementation: compute ranking in SQL and maintain explore\_ranking materialized view; refresh every 5–15 minutes. Use Redis cache for hot pages.
    
*   Explore: same materialized view, plus filters for categories and promoted stacks (promoted stacks get higher temporary boost via promoted\_until).
    

D. Comments & Discussions
-------------------------

*   Data: comments table with parent\_id for threading.
    
*   UI: thread component with nested replies (limit nesting depth to 4).
    
*   Posting: API enforces content sanity, rate limits, quick moderation.
    
*   Moderation: OpenAI/Perspective moderate in worker (optional for MVP) — highly toxic comments auto-hide; reports table for manual review.
    
*   Realtime: client subscribes to comment channels (Supabase Realtime); comments appear instantly.
    

E. Upvotes
----------

*   Data: votes table with unique constraint (user\_id, target\_type, target\_id).
    
*   Rules: require account\_age >= 48 hours to upvote (configurable) to prevent sockpuppeting. Enforce rate-limits.
    
*   Impact: upvote updates stacks.stats.upvotes\_count / cards.stats.upvotes\_count via aggregate job or immediate incremental update. Realtime update via Supabase Realtime.
    

F. Clone
--------

*   Implementation: POST /api/stacks/:id/clone creates a new stack record with owner\_id = current\_user, copies metadata (title, desc, tags) and creates stack\_cards rows that reference existing card ids. The clone is private (is\_public = false) by default.
    
*   Limits: clones/day enforced via Upstash counters.
    

G. Extension
------------

*   Plasmo/Vite extension popup obtains short-lived token from backend on login flow; lists user's stacks and last-used stack; sends POST /api/extension/save with URL + target stack -> server enqueues extension\_saves row -> worker processes as regular card creation.
    
*   Rate-limits & dedupe enforced server-side. Show helpful messages inside the extension for rate-limit or success.
    

H. Notifications (Realtime)
---------------------------

*   notifications table populated on events (vote, comment, clone, follow). Use Supabase Realtime or Postgres NOTIFY to push updates to clients.
    
*   In-app bell shows unread counts, clicking marks as read. Use WebSocket / Realtime subscription.
    

I. Search
---------

*   Start with Postgres tsvector on stacks.title||description, cards.title||description, plus pg\_trgm for fuzzy matching. Return paged results sorted by relevance + weight. Future: index to Typesense.
    

J. Monetization (MVP)
---------------------

*   Stripe Checkout for purchase. On webhook success, set promoted\_until on Stack or featured\_until on Stacker. Use payments table to record transaction. Payouts to creators deferred to V2 (no Connect initial).
    

4 — Realtime requirements (explicit)
====================================

All these must update in realtime in UI without full-page refresh:

*   Comments (new, edited, deleted)
    
*   Notifications (new, read-status)
    
*   Upvotes (counts and UI state)
    
*   Follows (follower counts, follow/unfollow actions)
    
*   Card saves (optional real-time UI changes like saved count)
    

Implementation:

*   Use **Supabase Realtime** (Postgres replication channel) or WebSockets; each client subscribes to relevant channels:
    
    *   realtime:comments:target\_type:target\_id
        
    *   realtime:notifications:user\_id
        
    *   realtime:votes:target\_id
        
    *   realtime:user:follows:user\_id
        
*   Ensure UI components update optimistic UI for immediate feedback then reconcile on server ack.
    

5 — Anti-abuse / Known loopholes & solutions (MVP-level)
========================================================

For each vulnerability, list technical control and detection/response.

### 1) Spammy Card Additions

*   **Problem:** Users (or bots) create mass cards, polluting feed.
    
*   **Controls:** Upstash sliding window counters (per user) — default 20 cards/day. Trusted stackers allowed higher limit. Duplicate detection by canonical\_url de-duplicates. Low-quality users have throttled reach via quality\_score.
    
*   **Detection:** monitoring alerts when cards\_created\_per\_user > threshold or global surge.
    

### 2) Fake Upvotes / Vote Farming

*   **Problem:** Sockpuppets inflate popularity.
    
*   **Controls:** DB unique constraint on (user\_id,target\_type,target\_id). Account must be older than 48 hours to vote. Device/IP heuristics and weight reduction for votes from accounts created in same IP cluster. A fraud worker flags abnormal vote bursts; isolate and shadowban suspicious accounts.
    
*   **Detection:** Spike detection worker (votes/time-window > X).
    

### 3) Clone Abuse

*   **Problem:** Mass cloning to game metrics.
    
*   **Controls:** clones/day limit (10/day). Clones are private by default and auto-hidden from Explore until edited. Auto-delete clones with zero activity after 7 days.
    
*   **Detection:** monitor clone counts and clone-to-edit ratio.
    

### 4) Comment spam & toxicity

*   **Problem:** Toxic / spammy comments.
    
*   **Controls:** comment rate-limit (3/min), automatic moderation via OpenAI/Perspective API (score threshold -> auto-hide), manual report queue & admin moderation UI. Stacker owners can remove comments on their stacks.
    
*   **Detection:** reports per comment, toxicity score thresholds.
    

### 5) Extension abuse

*   **Problem:** Rapid saves via extension.
    
*   **Controls:** extension-specific rate-limits (10/min, 60/day), short-lived tokens for extension calls, server-side dedupe. CAPTCHA fallback for suspicious behavior.
    
*   **Detection:** session-based abuse detection, IP clustering.
    

### 6) Sockpuppet Accounts

*   **Problem:** Multiple accounts manipulating content.
    
*   **Controls:** lightweight device fingerprint (UA + IP hash) and heuristics; require phone verification for elevated privileges (Stacker tools) in future. Weight votes/saves from suspicious clusters as 0 or lower.
    
*   **Detection:** worker that finds identical fingerprints across multiple accounts.
    

### 7) Feed manipulation by owners

*   **Problem:** Owners gaming their stacks by self-saves/upvotes.
    
*   **Controls:** Owner actions excluded from ranking computations. Saves/upvotes by owner do not increase ranking. Ranking uses weighted scores and age-decay to limit short spikes.
    

6 — UI/UX Guidelines (MVP-specific, must-follow)
================================================

Visuals / theme
---------------

*   Primary color: **Jet** (##312F2C)
    
*   Background: **Cloud White** (#FAFAFA)
    
*   Text: head #000, body #111, muted #555
    
*   Accent: light gray border #E5E5E5
    
*   Buttons: Jet filled for primary; Jet outline for secondary
    
*   Typography: provided font (sans-serif). Sizes: H1 32px, H2 24px, body 16px, small 13–14px.
    
*   Spacing tokens: page padding 24px, column gap 16px, card radius 12px, button radius 8px.
    

Layout / interactions
---------------------

*   Masonry grid (CSS masonry or react-masonry-css) for feed, explore, profile.
    
*   Cards: thumbnail, title, domain, Stacker name, quick action icons (upvote, comment, save). Hover: subtle zoom + shadow.
    
*   Card detail: open in modal (prefer modal) with left preview, right details & comments. Modal scroll-lock.
    
*   Create Stack: modal or dedicated page. Keep creation flow short (title, tags, visibility).
    
*   Add Card: fast modal with URL input -> metadata loader -> manual override -> select target stack -> save.
    
*   Real-time updates: subscribe to Realtime channels. Use optimistic UI for votes/saves/comments with server reconciliation.
    
*   Accessibility: ARIA labels for icons, visible focus outline, alt text for images, prefers-reduced-motion respected.
    

UX microcopy
------------

*   Clear, action-oriented CTAs: “Save to Stack”, “Create Stack”, “Upvote”, “Clone Stack”.
    
*   Friendly error messages for rate limits: “You’ve hit the save limit. Try again in X minutes.”
    
*   Empty states with CTA: “No stacks here — create your first Stack.”
    

7 — Full DB schema (MVP) — fields, types, constraints, indexes, notes
=====================================================================

Below is the Postgres schema to implement. Use Supabase migrations. Include required constraints and recommended indexes.

> All id fields are uuid (use gen\_random\_uuid() extension). Timestamps created\_at default now().

### 1) users (profiles)

*   id uuid PRIMARY KEY
    
*   email text UNIQUE NOT NULL
    
*   email\_verified boolean DEFAULT false
    
*   username text UNIQUE NOT NULL — enforce case-insensitive uniqueness via LOWER(username) index and unique constraint or use citext.
    
*   display\_name text NOT NULL
    
*   avatar\_url text
    
*   role text DEFAULT 'user' — enum options: user, stacker, admin
    
*   created\_at timestamptz DEFAULT now()
    
*   last\_active\_at timestamptz
    
*   quality\_score numeric DEFAULT 0 — derived metric (0..100) updated periodically by worker
    
*   metadata jsonb — device fingerprints, preferences**Indexes:** idx\_users\_username\_lower (LOWER(username)) unique, idx\_users\_email unique**RLS:** SELECT mostly public for profiles; updates only by owner or admin.
    

### 2) stacks

*   id uuid PK
    
*   owner\_id uuid REFERENCES users(id) NOT NULL
    
*   title text NOT NULL
    
*   description text
    
*   slug text UNIQUE NOT NULL — ensure url-safe via slugify on insert
    
*   is\_public boolean DEFAULT false
    
*   is\_hidden boolean DEFAULT false — for paid hidden stacks
    
*   cover\_image\_url text
    
*   created\_at timestamptz DEFAULT now()
    
*   updated\_at timestamptz DEFAULT now()
    
*   stats jsonb DEFAULT '{}' — cached stats: { "views":0, "upvotes":0, "saves":0, "comments":0 }
    
*   promoted\_until timestamptz NULL — promotion expiry**Indexes:** idx\_stacks\_owner, idx\_stacks\_is\_public, full-text index on title+description (tsvector)**RLS idea:** SELECT if is\_public = true OR owner\_id = auth.uid() OR (is\_hidden = true AND owner\_id = auth.uid()). INSERT allowed for authenticated; UPDATE/DELETE only owner or admin.
    

### 3) cards (canonical resources)

*   id uuid PK
    
*   canonical\_url text NOT NULL — normalized canonical URL; unique index on canonical\_url (to dedupe)
    
*   title text
    
*   description text
    
*   thumbnail\_url text
    
*   domain text — e.g., example.com for browsing & filtering
    
*   metadata jsonb — raw OG data, fetch timestamps, provider info
    
*   created\_by uuid REFERENCES users(id) — who created/added initially
    
*   created\_at timestamptz DEFAULT now()
    
*   last\_checked\_at timestamptz
    
*   status text DEFAULT 'active' — enum: active, removed, broken, archived**Indexes:** unique on canonical\_url, full-text on title+description; index on domain.
    

### 4) stack\_cards (mapping)

*   id uuid PK
    
*   stack\_id uuid REFERENCES stacks(id) NOT NULL
    
*   card\_id uuid REFERENCES cards(id) NOT NULL
    
*   added\_by uuid REFERENCES users(id)
    
*   added\_at timestamptz DEFAULT now()
    
*   position integer NULL — for ordering (optional)
    
*   note text NULL — user note in the stack context**Constraints:** unique (stack\_id, card\_id) to prevent duplicate entries.**Indexes:** by stack\_id, by card\_id.
    

### 5) tags

*   id uuid PK
    
*   name text NOT NULL — canonicalized lower-case
    
*   created\_at timestamptz
    

### 6) stack\_tags

*   stack\_id uuid REFERENCES stacks(id)
    
*   tag\_id uuid REFERENCES tags(id)**Constraints:** unique (stack\_id, tag\_id); index on tag\_id.
    

### 7) card\_tags

*   card\_id uuid REFERENCES cards(id)
    
*   tag\_id uuid REFERENCES tags(id)**Constraints:** unique (card\_id, tag\_id).
    

### 8) votes

*   id uuid PK
    
*   user\_id uuid REFERENCES users(id) NOT NULL
    
*   target\_type text NOT NULL — enum card or stack
    
*   target\_id uuid NOT NULL — FK cannot be polymorphic in SQL; enforce via app logic (or use two columns with nullable card\_id and stack\_id)
    
*   created\_at timestamptz DEFAULT now()**Constraints:** unique (user\_id, target\_type, target\_id) to prevent duplicate votes.**Indexes:** idx\_votes\_target (target\_type, target\_id)
    

### 9) comments

*   id uuid PK
    
*   user\_id uuid REFERENCES users(id) NOT NULL
    
*   target\_type text NOT NULL — card | stack
    
*   target\_id uuid NOT NULL
    
*   parent\_id uuid NULL REFERENCES comments(id)
    
*   content text NOT NULL
    
*   deleted boolean DEFAULT false
    
*   created\_at timestamptz DEFAULT now()
    
*   updated\_at timestamptz**Indexes:** (target\_type, target\_id), parent\_id.
    

### 10) notifications

*   id uuid PK
    
*   user\_id uuid REFERENCES users(id) NOT NULL — recipient
    
*   actor\_id uuid — who triggered the notification
    
*   type text — e.g., upvote, comment, clone, follow
    
*   data jsonb — payload with links to objects
    
*   read boolean DEFAULT false
    
*   created\_at timestamptz DEFAULT now()**RLS:** SELECT only where user\_id = auth.uid().
    

### 11) clones

*   id uuid PK
    
*   original\_stack\_id uuid REFERENCES stacks(id) NOT NULL
    
*   new\_stack\_id uuid REFERENCES stacks(id) NOT NULL
    
*   cloner\_id uuid REFERENCES users(id)
    
*   created\_at timestamptz DEFAULT now()
    

### 12) extension\_saves

*   id uuid PK
    
*   user\_id uuid REFERENCES users(id)
    
*   url text NOT NULL
    
*   stack\_id uuid REFERENCES stacks(id) NULL
    
*   status text DEFAULT 'queued' — queued, processing, done, failed
    
*   created\_at timestamptz DEFAULT now()**Use this as a durable queue for extension saves.**
    

### 13) link\_checks / link\_cache

*   id uuid PK
    
*   card\_id uuid REFERENCES cards(id)
    
*   last\_checked\_at timestamptz
    
*   status text — ok, redirect, broken, timeout
    
*   status\_code integer NULL
    
*   redirect\_url text NULL
    
*   response\_time\_ms integer
    
*   attempts integer DEFAULT 0
    
*   metadata jsonb — last fetch metadata**Use to control periodic health checks and to drive user notifications about broken links.**
    

### 14) reports

*   id uuid PK
    
*   reporter\_id uuid REFERENCES users(id)
    
*   target\_type text
    
*   target\_id uuid
    
*   reason text
    
*   data jsonb
    
*   status text DEFAULT 'open' — open, resolved, dismissed
    
*   created\_at timestamptz
    

### 15) payments

*   id uuid PK
    
*   stripe\_payment\_id text UNIQUE
    
*   user\_id uuid REFERENCES users(id)
    
*   amount integer
    
*   currency text
    
*   type text — promote, reserve\_username, hidden\_stack
    
*   status text
    
*   created\_at timestamptz
    

### 16) materialized view: explore\_ranking

*   Columns: stack\_id, score numeric, updated\_at
    
*   Populated via SQL combining stats, quality\_score, promoted\_until, recency decay.
    

8 — Indexes, triggers, and important constraints
================================================

*   users: UNIQUE LOWER(username) to prevent Bob vs bob conflicts. Use citext or unique expression index.
    
*   cards: UNIQUE(canonical\_url) to dedupe. Use normalized canonical URL for uniqueness.
    
*   stack\_cards: UNIQUE(stack\_id,card\_id).
    
*   votes: UNIQUE(user\_id,target\_type,target\_id).
    
*   comments: index on (target\_type, target\_id) for reads.
    
*   stacks: GIN tsvector index on to\_tsvector('english', title || ' ' || description) for full-text. Add trigram (pg\_trgm) on slug & title for fuzzy search.
    
*   Triggers: maintain tsvector columns on insert/update; maintain stacks.stats sums (or use background aggregator). Avoid heavy triggers for high concurrency—prefer scheduled aggregation for stats if necessary.
    

9 — Row-Level Security (RLS) policies (high-level examples)
===========================================================

Implement RLS using Supabase JWT auth.uid() claims. Create helper SQL functions (e.g., is\_stacker(uid), is\_admin(uid)).

Examples:

*   stacks SELECT: is\_public = true OR owner\_id = auth.uid() OR (is\_hidden = true AND owner\_id = auth.uid())
    
*   stacks INSERT: auth.uid() IS NOT NULL
    
*   stacks UPDATE/DELETE: owner\_id = auth.uid() OR is\_admin(auth.uid())
    
*   cards SELECT: expose only status = 'active' unless user owns via stack\_cards in a private stack
    
*   votes INSERT: allow if auth.uid() IS NOT NULL AND age\_check(auth.uid()) (account older than 48h) OR admin override
    

**Important:** Always test RLS with the Supabase service role to validate flows and then remove service role usage from client.

10 — Workers, Queues, Scheduling (details)
==========================================

Workers run background jobs via serverless functions or Node workers. Keep them idempotent and idempotency-key-aware.

Key queues/jobs:

*   metadata-fetcher (priority): fetch Open Graph, normalize URL, compute canonical\_url, create card if new, upload thumbnail. Retries with exponential backoff. Idempotency by URL hash.
    
*   link-checker (scheduled): periodic health checks (HEAD/GET), update link\_checks, send notifications if link broken.
    
*   explore-refresher (cron): recompute explore\_ranking materialized view.
    
*   fraud-detector (periodic): scan for vote spikes, clone spikes, extension anomalies — flag accounts.
    
*   payment-webhook-handler: process Stripe webhook events.
    
*   reports-processor: aggregate reports for admin review.
    

Queue infra:

*   Start with Upstash for counters & small queue orchestration + serverless functions to poll DB (or use Supabase Edge Functions triggered by inserts). If heavy processing needed, migrate to BullMQ + managed Redis.
    

11 — Observability & monitoring
===============================

*   Track events in Mixpanel: signup, create\_stack, add\_card, extension\_save, clone\_stack, upvote, comment, purchase\_promotion.
    
*   Sentry for exceptions.
    
*   Logging: use Logflare for Supabase logs or integrate server logs to Logflare/Datadog.
    
*   Alerts: set up threshold alerts for anomalies (cards/day per user, votes surge, extension saves spike).
    

12 — Small but crucial operational notes
========================================

*   **Canonicalization**: use normalize-url library with consistent options (strip UTM, lowercase host, default ports removed) before computing canonical\_url hash.
    
*   **Link scraping**: obey robots.txt and throttle scrapes. Cache results in link\_cache with TTL (e.g., 7 days).
    
*   **Image thumbnailing**: generate 16:9 or appropriate sizes and store in Supabase Storage; use CDN & next/image for responsive delivery.
    
*   **Email & Notifications**: do not send email on every event; batch digest optional. In-app realtime notifications are mandatory.
    
*   **SEO**: public stacks & cards must be server-rendered (Next.js SSR/ISR) for indexability. Use metadata for stacks’ pages.
    

13 — Execution constraints & quick checklist for Cursor
=======================================================

When acting on this context, Cursor must:

1.  Build only the **MVP features above**. Do not add collaboration, full AI features, messaging, or V2 monetization here.
    
2.  Implement RLS and DB constraints before enabling public writes. Test RLS thoroughly on staging.
    
3.  Ensure real-time subscriptions (Supabase Realtime) for comments, upvotes, notifications, follows — implement optimistic UI patterns.
    
4.  Implement Upstash rate-limits for the APIs: card creation, extension saves, votes, comments, clones. Return clear error messages with cooldown times.
    
5.  Implement dedupe canonical\_url logic in the metadata-fetcher job; ensure cards.canonical\_url unique constraint catches collisions and job handles idempotency.
    
6.  Implement key monitoring events & alerts in Mixpanel + Sentry.
    
7.  Provide admin UI for reports & manual moderation (minimal but functional).
    

14 — Deliverables Cursor should produce from this context (in order)
====================================================================

1.  DB migration SQL (all tables, constraints, indexes) + RLS policy SQL templates.
    
2.  API spec for all MVP endpoints (request/response shapes) and auth requirements.
    
3.  Worker spec: queues, job flow, idempotency keys, retry strategies, and example job payloads.
    
4.  Frontend component list + UI/UX rules mapped to components (masonry grid, card, stack header, modals, notifications).
    
5.  Test cases matrix for anti-abuse simulation (scripts to simulate spam, vote fraud, extension abuse).
    
6.  Minimal admin/moderation UI wireframe.