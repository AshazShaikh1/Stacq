# Project Structure

## Root Directory

```
stacks/
├── .cursor/                    # Cursor AI configuration
├── .next/                      # Next.js build output (gitignored)
├── .vercel/                    # Vercel configuration (gitignored)
├── Docs/                       # Project documentation
│   ├── Implementation.md
│   ├── project_structure.md
│   ├── UI_UX_doc.md
│   └── Bug_tracking.md
├── extension/                  # Browser extension (Plasmo)
│   ├── popup/
│   ├── content/
│   ├── background/
│   ├── assets/
│   └── package.json
├── supabase/                   # Supabase migrations and functions
│   ├── migrations/
│   ├── functions/
│   └── seed.sql
├── public/                     # Static assets
│   ├── images/
│   └── icons/
├── src/                        # Main application source
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth route group
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── reset-password/
│   │   ├── (main)/            # Main app routes
│   │   │   ├── feed/
│   │   │   ├── explore/
│   │   │   ├── stack/
│   │   │   │   └── [slug]/
│   │   │   ├── profile/
│   │   │   │   └── [username]/
│   │   │   ├── search/
│   │   │   └── notifications/
│   │   ├── api/               # API routes
│   │   │   ├── stacks/
│   │   │   ├── cards/
│   │   │   ├── votes/
│   │   │   ├── comments/
│   │   │   ├── extension/
│   │   │   ├── webhooks/
│   │   │   └── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Home page
│   │   └── globals.css
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   └── ...
│   │   ├── stack/            # Stack-related components
│   │   │   ├── StackCard.tsx
│   │   │   ├── StackHeader.tsx
│   │   │   ├── StackActions.tsx
│   │   │   └── CreateStackModal.tsx
│   │   ├── card/             # Card-related components
│   │   │   ├── CardPreview.tsx
│   │   │   ├── CardDetail.tsx
│   │   │   ├── AddCardModal.tsx
│   │   │   └── CardMasonry.tsx
│   │   ├── feed/             # Feed components
│   │   │   ├── FeedGrid.tsx
│   │   │   └── FeedFilters.tsx
│   │   ├── comments/         # Comment components
│   │   │   ├── CommentThread.tsx
│   │   │   ├── CommentItem.tsx
│   │   │   └── CommentForm.tsx
│   │   ├── notifications/    # Notification components
│   │   │   ├── NotificationBell.tsx
│   │   │   └── NotificationList.tsx
│   │   ├── profile/          # Profile components
│   │   │   ├── ProfileHeader.tsx
│   │   │   └── ProfileStats.tsx
│   │   └── layout/          # Layout components
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── Sidebar.tsx
│   ├── lib/                  # Utility libraries
│   │   ├── supabase/        # Supabase client and helpers
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── upstash/         # Upstash Redis client
│   │   │   └── redis.ts
│   │   ├── stripe/          # Stripe client
│   │   │   └── client.ts
│   │   ├── mixpanel/        # Mixpanel client
│   │   │   └── client.ts
│   │   └── sentry/          # Sentry configuration
│   │       └── client.ts
│   ├── hooks/               # React hooks
│   │   ├── useRealtime.ts
│   │   ├── useAuth.ts
│   │   ├── useStacks.ts
│   │   ├── useCards.ts
│   │   ├── useVotes.ts
│   │   ├── useComments.ts
│   │   └── useNotifications.ts
│   ├── types/               # TypeScript type definitions
│   │   ├── database.ts     # Generated from Supabase
│   │   ├── stack.ts
│   │   ├── card.ts
│   │   ├── user.ts
│   │   └── api.ts
│   ├── utils/              # Utility functions
│   │   ├── rateLimit.ts
│   │   ├── canonicalize.ts
│   │   ├── slugify.ts
│   │   ├── metadata.ts
│   │   ├── validation.ts
│   │   └── format.ts
│   └── workers/            # Background workers (serverless functions)
│       ├── metadata-fetcher/
│       ├── link-checker/
│       ├── explore-refresher/
│       ├── fraud-detector/
│       └── quality-score/
├── tests/                   # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.local              # Local environment variables (gitignored)
├── .env.example            # Example environment variables
├── .gitignore
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── package.json
├── package-lock.json
└── README.md
```

## Detailed Structure

### `/src/app`

Next.js App Router directory containing all routes and pages.

- **`(auth)/`** - Authentication route group (login, signup, password reset)
- **`(main)/`** - Main application routes (feed, explore, stack detail, profile, search, notifications)
- **`api/`** - API route handlers for backend operations
- **`layout.tsx`** - Root layout with providers and global styles
- **`page.tsx`** - Home page (redirects to feed or landing page)

### `/src/components`

React components organized by feature domain.

- **`ui/`** - Reusable base UI components (Button, Input, Modal, etc.)
- **`stack/`** - Stack-related components (StackCard, StackHeader, CreateStackModal)
- **`card/`** - Card-related components (CardPreview, CardDetail, AddCardModal, CardMasonry)
- **`feed/`** - Feed and explore page components
- **`comments/`** - Comment threading and display components
- **`notifications/`** - Notification bell and list components
- **`profile/`** - User profile components
- **`layout/`** - Layout components (Header, Footer, Sidebar)

### `/src/lib`

Utility libraries and client configurations.

- **`supabase/`** - Supabase client setup (browser, server, middleware)
- **`upstash/`** - Upstash Redis client for rate limiting
- **`stripe/`** - Stripe client for payments
- **`mixpanel/`** - Mixpanel analytics client
- **`sentry/`** - Sentry error monitoring configuration

### `/src/hooks`

Custom React hooks for data fetching and real-time subscriptions.

- **`useRealtime.ts`** - Supabase Realtime subscription hook
- **`useAuth.ts`** - Authentication state management
- **`useStacks.ts`** - Stack data fetching and mutations
- **`useCards.ts`** - Card data fetching and mutations
- **`useVotes.ts`** - Vote operations with optimistic updates
- **`useComments.ts`** - Comment operations with real-time updates
- **`useNotifications.ts`** - Notification fetching and real-time updates

### `/src/types`

TypeScript type definitions.

- **`database.ts`** - Auto-generated types from Supabase schema
- **`stack.ts`** - Stack-related types
- **`card.ts`** - Card-related types
- **`user.ts`** - User and profile types
- **`api.ts`** - API request/response types

### `/src/utils`

Utility functions for common operations.

- **`rateLimit.ts`** - Rate limiting using Upstash Redis
- **`canonicalize.ts`** - URL canonicalization (normalize-url)
- **`slugify.ts`** - URL slug generation
- **`metadata.ts`** - Open Graph metadata extraction helpers
- **`validation.ts`** - Input validation functions
- **`format.ts`** - Data formatting utilities (dates, numbers, etc.)

### `/src/workers`

Serverless functions for background job processing.

- **`metadata-fetcher/`** - Fetches Open Graph data, canonicalizes URLs, creates cards
- **`link-checker/`** - Periodic health checks for card links
- **`explore-refresher/`** - Refreshes explore_ranking materialized view
- **`fraud-detector/`** - Detects vote spikes, clone abuse, extension anomalies
- **`quality-score/`** - Calculates user quality scores

### `/extension`

Plasmo browser extension source code.

- **`popup/`** - Extension popup UI (React components)
- **`content/`** - Content scripts (if needed)
- **`background/`** - Background service worker
- **`assets/`** - Extension-specific assets (icons, images)

### `/supabase`

Supabase database migrations and Edge Functions.

- **`migrations/`** - SQL migration files (numbered: 001_initial_schema.sql, etc.)
- **`functions/`** - Supabase Edge Functions (if using instead of Vercel functions)
- **`seed.sql`** - Seed data for development

### `/public`

Static assets served directly.

- **`images/`** - Static images (logos, placeholders)
- **`icons/`** - Favicon and app icons

### `/tests`

Test files organized by test type.

- **`unit/`** - Unit tests for utilities and components
- **`integration/`** - Integration tests for API routes
- **`e2e/`** - End-to-end tests using Playwright or Cypress

## File Naming Conventions

### Components
- Use PascalCase: `StackCard.tsx`, `AddCardModal.tsx`
- One component per file
- Co-locate related components in feature folders

### Utilities
- Use camelCase: `rateLimit.ts`, `canonicalize.ts`
- Descriptive, action-oriented names

### Types
- Use camelCase: `database.ts`, `stack.ts`
- Export types with descriptive names: `Stack`, `Card`, `UserProfile`

### API Routes
- Use kebab-case for route folders: `/api/stacks/[id]/clone`
- Use descriptive route names: `route.ts` or `route.tsx`

### Database Migrations
- Use numbered prefix: `001_initial_schema.sql`, `002_add_indexes.sql`
- Descriptive names indicating purpose

## Configuration Files

### Root Level
- **`next.config.js`** - Next.js configuration (image domains, redirects, etc.)
- **`tailwind.config.js`** - Tailwind CSS theme and design tokens
- **`tsconfig.json`** - TypeScript compiler options
- **`package.json`** - Dependencies and scripts
- **`.env.example`** - Template for environment variables
- **`.gitignore`** - Git ignore patterns

### Environment Variables
Store in `.env.local` (gitignored):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `MIXPANEL_TOKEN`
- `SENTRY_DSN`

## Build and Deployment Structure

### Development
- Run `npm run dev` for local development
- Use Supabase local development (optional)
- Hot reload for all changes

### Production Build
- `npm run build` creates optimized production build in `.next/`
- Static assets optimized and minified
- API routes compiled to serverless functions

### Deployment
- **Vercel** - Automatic deployments from Git
- **Supabase** - Database migrations run automatically
- **Extension** - Build separately with Plasmo CLI

## Module Organization Patterns

### Feature-Based Organization
Components, hooks, and utilities are organized by feature domain (stack, card, feed, etc.) to maintain clear boundaries and improve maintainability.

### Shared Components
Base UI components in `/components/ui` are shared across features and follow a consistent API.

### Data Fetching
- Server Components for initial data fetching (Next.js App Router)
- Client Components with hooks for interactive features
- API routes for mutations and complex operations

### Real-time Subscriptions
All real-time subscriptions managed through custom hooks in `/hooks` that abstract Supabase Realtime complexity.

## Asset Organization

### Images
- **Thumbnails:** Stored in Supabase Storage, served via CDN
- **Cover Images:** Stored in Supabase Storage
- **Avatars:** Stored in Supabase Storage
- **Static Images:** Stored in `/public/images`

### Icons
- Use icon library (Lucide React or similar) for UI icons
- Custom icons stored in `/public/icons`

### Fonts
- Load fonts via Next.js font optimization
- Define in `layout.tsx` or `globals.css`

## Documentation Placement

All project documentation lives in `/Docs`:
- **`Implementation.md`** - Implementation plan and task tracking
- **`project_structure.md`** - This file
- **`UI_UX_doc.md`** - Design system and UI/UX guidelines
- **`Bug_tracking.md`** - Known issues and solutions

