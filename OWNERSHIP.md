### 1. Project Overview

| Category | Details |
| --- | --- |
| **Framework** | **Next.js 15.5.9** (App Router) with React 19.0.0 |
| **Language** | TypeScript |
| **Styling** | **Tailwind CSS** (v3.4.0) configured with custom colors (Emerald, Jet, Cloud) |
| **State Management** | React Context (`AuthContext`, `ToastContext`), `swr` for client-side fetching |
| **Auth** | **Supabase Auth** (handled via `@supabase/ssr` cookies) |
| **Database** | **Supabase** (PostgreSQL) |
| **Caching/State** | **Redis** (Upstash) used for feed caching |
| **Payments** | **Stripe** (via `stripe` SDK) |
| **Analytics** | **Mixpanel** |

---

### 2. Routing & Navigation

The application uses the **Next.js App Router** structure.

| Route Path | File Location | Render Type | Access |
| --- | --- | --- | --- |
| `/` | `src/app/page.tsx` | Server (Async) | Public (Cond. Redirect) |
| `/login` | `src/app/(auth)/login/page.tsx` | Client | Public |
| `/signup` | `src/app/(auth)/signup/page.tsx` | Client | Public |
| `/reset-password` | `src/app/(auth)/reset-password/page.tsx` | Client | Public |
| `/explore` | `src/app/(main)/explore/page.tsx` | Server (Async) | Public |
| `/collections` | `src/app/(main)/collections/page.tsx` | Server (Async) | Protected |
| `/saved` | `src/app/(main)/saved/page.tsx` | Server (Async) | Protected |
| `/search` | `src/app/(main)/search/page.tsx` | Server (Async) | Public |
| `/save` | `src/app/(main)/save/page.tsx` | Client | Protected |
| `/collection/[id]` | `src/app/(main)/collection/[id]/page.tsx` | Server (Async) | Public/Protected (Mixed) |
| `/card/[id]` | `src/app/(main)/card/[id]/page.tsx` | Server (Async) | Public |
| `/profile/[username]` | `src/app/(main)/profile/[username]/page.tsx` | Server (Async) | Public |
| `/admin/ranking` | `src/app/(main)/admin/ranking/page.tsx` | Server (Async) | Admin Only |
| `/admin/reports` | `src/app/(main)/admin/reports/page.tsx` | Server (Async) | Admin Only |
| `/stacker/dashboard` | `src/app/(main)/stacker/dashboard/page.tsx` | Server (Async) | Stacker/Admin Only |
| `/payment/success` | `src/app/(main)/payment/success/page.tsx` | Server (Async) | Public/Protected |
| `/payment/cancel` | `src/app/(main)/payment/cancel/page.tsx` | Server | Public/Protected |
| `/dev/api-test` | `src/app/(main)/dev/api-test/page.tsx` | Client | Public (Dev tool) |

---

### 3. Layout & Route Groups

The application uses **Route Groups** (folders in parentheses) to organize routes without affecting the URL path.

* **`src/app/layout.tsx` (Root Layout):**
* Wraps the entire application.
* Providers: `SuppressMixpanelErrors`, `ErrorBoundary`, `AuthProvider`, `ToastProvider`, `LandingPageButtonsProvider`.
* Uses `LayoutWrapper` to conditionally render the Sidebar/Header based on the route (e.g., hiding them on auth pages).

* **`(auth)` Group:**
* Contains: `login`, `signup`, `reset-password`.
* **Intent:** logically groups authentication-related pages. Likely isolates them from the main app shell (Sidebar/Header) via logic in `LayoutWrapper`.

* **`(main)` Group:**
* Contains: Core app features (`explore`, `collections`, `card`, `profile`, `admin`, etc.).
* **Intent:** logically groups the primary application interface.

---

### 4. Rendering Strategy

* **Default Strategy:** **Server Components (SSR)**.
* Most content-heavy pages (`/explore`, `/collection/[id]`, `/profile/[username]`) are async Server Components that fetch data directly from Supabase/Redis before rendering.

* **Client Boundaries:** Explicitly marked with `'use client'`.
* Used for interactive forms (`login`, `signup`, `save` modal).
* Used for developer tools (`api-test`).

* **Dynamic Rendering:**
* The use of `await cookies()` and dynamic params (`[id]`, `[username]`) opts these routes into dynamic rendering (not static).

* **SEO Critical Routes:**
* `/collection/[id]`, `/card/[id]`, and `/profile/[username]` generate dynamic metadata (`generateMetadata`) for SEO tags.

---

### 5. Data Fetching & Data Flow

* **Server-Side Fetching (Primary):**
* Uses `createClient()` from `@/lib/supabase/server`.
* **Pattern:** Direct database queries inside `page.tsx` components.
* **Examples:**
* `ExplorePage`: Fetches trending collections/cards via **Redis Cache** (`cached` wrapper).
* `CollectionPage`: Fetches collection details, owner, and cards.
* `ProfilePage`: Fetches user profile, stats, and feed items parallelized with `Promise.all`.

* **Client-Side Fetching (Secondary):**
* Uses `createClient()` from `@/lib/supabase/client`.
* Used for user actions (Auth, Upvoting, Saving) and real-time updates in client components.
* `APITestPage` performs raw `fetch` calls to `/api/*` endpoints.

* **API Routes:**
* Extensive API surface at `src/app/api/...` handles write operations and complex logic (ranking, workers, payments) which client components likely call.

---

### 6. Middleware & Access Control

* **File:** `src/middleware.ts`
* **Mechanism:** Supabase Auth Session management.
* **Public Routes Allowlist:**
* `/`, `/login`, `/signup`, `/reset-password`
* `/explore`, `/collection/*`
* `/stack/*` (Legacy support)
* `/auth/callback`

* **Behavior:**
* **Unauthenticated:** Redirects to `/login` if trying to access protected routes.
* **Authenticated:** Redirects to `/` if trying to access auth pages (`/login`, etc.).

* **Role-Based Access Control (RBAC):**
* **Admin:** Enforced inside specific page components (`/admin/*`) by checking `userProfile.role !== 'admin'`.
* **Stacker:** Enforced inside `/stacker/dashboard` by checking `userProfile.role`.

---

### 7. Component Structure & Reuse

* **UI System (`src/components/ui`):**
* Contains atomic components: `Button`, `Card`, `Input`, `Modal`, `Skeleton`, `Toast`, `Tooltip`.
* Style consistency via Tailwind classes.

* **Feature Modules:**
* **Feed:** `FeedGrid` and `FeedItem` are highly reusable components used across Home, Explore, Profile, and Collection views.
* **Cards:** `CardPreview`, `CardActionsBar`, `CreateCardModal`.
* **Collections:** `CollectionCard`, `CollectionHeader`.
* **Auth:** `LoginFormContent`, `SignupFormContent`.

* **Layout:**
* `LayoutWrapper` manages the composition of `Sidebar`, `Header`, and `MobileNav`.



---

### 8. Assets & Performance Signals

* **Images:**
* Uses `next/image` extensively.
* **Configuration:** `remotePatterns` in `next.config.js` allows images from Supabase, YouTube, Imgur, GitHub, Unsplash, Cloudinary, Amazon S3, and Google.
* **Risk:** `dangerouslyAllowSVG: true` is enabled (security risk if user uploads unchecked SVGs, though CSP is set).

* **Caching:**
* **Redis** (via `@upstash/redis`) is implemented for high-traffic read paths like the Explore feed (`src/lib/redis.ts`).

* **Fonts:**
* `next/font/google` loading **Inter** font in `layout.tsx`.

* **Lazy Loading:**
* `Suspense` boundaries used for Comments and heavy UI sections.
* `lazy` import used for `CommentsSection` in `CollectionPage`.



---

### 9. SEO Infrastructure

* **Metadata:**
* Dynamic `generateMetadata` functions present in `layout.tsx`, `collection/[id]`, `card/[id]`, `profile/[username]`.
* Handles Title, Description, OpenGraph Images.

* **Sitemap:**
* `src/app/sitemap.ts` dynamically generates URLs for static pages, public collections (limit 1000), and profiles (limit 500).

* **Robots:**
* `src/app/robots.txt` (or `public/robots.txt`) exists.

* **Canonical URLs:**
* Logic exists to handle canonical URLs, defaulting to `process.env.NEXT_PUBLIC_APP_URL`.

---

### 10. Tech Debt & Risk Summary

1. **Complexity in Trending Logic:** The `ExplorePage` contains complex, hard-coded scoring algorithms mixed with Redis caching and direct DB calls. This logic is duplicated/embedded directly in the Page component rather than a dedicated service/lib function.
2. **Type Safety (`any`):** Significant usage of `any` type in data mapping functions (e.g., `src/app/(main)/explore/page.tsx`, `search/page.tsx`), reducing TypeScript's effectiveness.
3. **Legacy Code:** References to "Stacks" (legacy name for Collections) persist in API routes (`stack-id-legacy`) and database columns (seen in `saved/page.tsx` fallback logic).
4. **Security/RBAC Distribution:** Role checks (Admin/Stacker) are performed inside Page components. If a new route is added, the developer must remember to manually add these checks, which is error-prone compared to Middleware or Layout-level enforcement.
5. **Data Fetching Duplication:** Similar queries for cards/collections appear in `Explore`, `Profile`, and `Saved` pages with slight variations.

**Explore page**
-Fetches data from: Supabase (PostgreSQL). The page makes direct server-side queries to multiple tables including collections, cards, votes, follows, saves, and users to calculate trending scores and retrieve content.

-Cached via: Redis (Upstash). The expensive data fetching and "trending" score calculations are wrapped in a cached() utility function that stores the result in Redis. It uses specific cache keys like "today-trending" and "week-trending" with a TTL (Time To Live) defined in CACHE_TTL.EXPLORE.

-SEO impact: High / Positive. Since this is an async Server Component, all trending data is fetched and rendered on the server before the HTML is sent to the browser. Search crawlers will immediately see the full list of trending cards, collections, and creators, which helps index dynamic content and improves internal linking structure.

-If I break this: Users lose the primary discovery engine. The /explore page is the main way users find new content. If this breaks, the "Today Trending," "Top Trending Stacqers," and "Last Week Trending" sections will fail to load, potentially leaving users with an error screen or an empty page, severely hurting engagement and content discoverability.


**Collection page (Collection detals)**
-Fetches data from: Supabase (PostgreSQL). It performs two primary queries: one to fetch the collection metadata (title, owner, tags) and another to fetch all cards associated with that collection via the collection_cards join table/page.tsx].

-Cached via: No explicit application-level cache (Redis). Unlike the Explore page, this page fetches fresh data on every request because it calls cookies() (via createClient), which opts the page into Dynamic Rendering. Next.js may deduplicate simultaneous requests, but it does not cache the HTML statically/page.tsx].

-SEO impact: High. It exports a generateMetadata function that fetches the collection's title, description, and cover image to populates the <head> tags. This ensures that when a user shares a collection link on social media, the correct preview card appears/page.tsx].

-If I break this: Users cannot view collections (Stacks). This is the core "container" view of the application. Breaking it means users can click on a stack but will see nothing, rendering the organizational part of the app useless.

-Access (URL): /collection/[id] or /collection/[slug]

-Example: stacq.app/collection/my-design-resources or stacq.app/collection/123e4567-e89b...

-What it shows:
--Header: Title, description, owner info, and aggregated stats (views, upvotes).
--Content: A grid of cards (links/resources) contained in the collection.
-Interaction: Tools to add new cards (if you are the owner) and a comments section.


**Card page (Card Details)**
-Fetches data from: Supabase (PostgreSQL). It fetches the specific card details and executes a second query to find "Related Resources" by matching the card's domain or creator/page.tsx].

-Cached via: No explicit cache. Like the collection page, this is dynamically rendered on every request to ensure up-to-date vote counts and comments/page.tsx].

-SEO impact: High. It generates unique metadata for every single resource link. This page serves as the "permalink" for a resource, allowing individual tools or articles to rank in search engines under the Stacq domain/page.tsx].

-If I break this: Discussion and context for resources are lost. Users can probably still visit the external link from the feed, but they lose the "Stacq layer"—the comments, related items, and ability to upvote/save that specific item in detail.

-Access (URL): /card/[id]
-Example: stacq.app/card/a1b2c3d4-e5f6...

-What it shows:
--Detail View: Large thumbnail, full description, and direct link to the external resource.
--Actions: Upvote and Save buttons.
--Community: A discussion/comments section and a list of related cards.


**Prifile page**
-Fetches data from: Supabase (PostgreSQL). It uses Promise.all to execute multiple parallel queries: fetching user details, counting collections created, saved items, total upvotes received, followers, and following. It then conditionally fetches a list of items based on the active tab (Cards, Collections, or Saved)/page.tsx].

-Cached via: No explicit cache. Profile data is highly dynamic (followers/stats change often), so it is fetched fresh on every visit.

-SEO impact: Medium/High. It creates a landing page for every user (Stacq - [User's Name]), which helps creators build their presence on the platform and appear in search results for their own username/page.tsx].

-If I break this: User identity and portfolio are inaccessible. Users cannot see their own library of saved content or view what others have curated. This destroys the "social" aspect of the platform.

-Access (URL): /profile/[username]
-Example: stacq.app/profile/johndoe (Tabs can be accessed via query params: ?tab=cards or ?tab=saved).

-What it shows:
--Profile Header: Avatar, display name, bio, and "Follow" button.
--Stats: Counts for collections, saves, and followers.
--Tabs: Navigation to switch between "Collections" (created by user), "Cards" (submitted by user), and "Saved" (curated by user).

**Auth pages**
-Fetches data from: Client-side Supabase Auth. The pages themselves are lightweight wrappers around client components (e.g., LoginFormContent). The actual data interaction happens securely on the client side or via auth/callback routes to exchange tokens and set cookies.

-Cached via: None (Client-side dynamic). These pages are Client Components ('use client') wrapped in Suspense boundaries to handle search parameters (like ?next=/profile), forcing them to render dynamically on the client.

-SEO impact: Low/None. These pages are strictly functional. While they are accessible, they contain no indexable content. Your robots.txt does not explicitly block them, but they offer no value to search engines.

-If I break this: Critical Failure. No new users can sign up, and existing users cannot log in. The application effectively becomes read-only for everyone.
-Access (URL): /login, /signup, /reset-password

-What it shows:
--Forms: Email/Password inputs or OAuth provider buttons (Google, Github, etc.).
--Feedback: Success messages for password reset emails or error messages for invalid credentials.

**Admin page**
-Fetches data from: Supabase (PostgreSQL).
--Ranking: Fetches raw data from ranking_config, ranking_stats, and ranking_scores tables to visualize algorithm performance.
--Reports: Fetches from the reports table, joining with the users table to show reporter details.

-Cached via: No cache (Real-time). These are async Server Components performing direct database queries. This ensures admins always see the absolute latest state of reports and ranking metrics without delay.

-SEO impact: None (Blocked). These pages are behind an authentication guard (if (userProfile?.role !== "admin") redirect("/")) and are explicitly disallowed in robots.txt (Disallow: /admin/).

-If I break this: Operational Blindness. Regular users won't notice, but the team loses the ability to moderate content (handle reports) or tune the discovery algorithm. Spam or bad content could accumulate unchecked.

-Access (URL):
--/admin/ranking (Algorithm intelligence)
--/admin/reports (Moderation queue)

-What it shows:
--Ranking: Charts showing "window end" times, configuration keys for the algorithm, and a list of top-scoring items.
--Reports: A moderation queue with tabs for "Open", "Resolved", and "Dismissed" tickets, showing the target content and the reason for the report.