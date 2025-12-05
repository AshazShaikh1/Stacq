# Expected Setup Guide - Stacq Platform

This is a comprehensive setup guide covering all required services, environment variables, and configurations from the very beginning.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Supabase Setup](#supabase-setup)
4. [Authentication Providers](#authentication-providers)
5. [Upstash Redis Setup](#upstash-redis-setup)
6. [Stripe Setup](#stripe-setup)
7. [Mixpanel Setup](#mixpanel-setup)
8. [Environment Variables](#environment-variables)
9. [Database Migrations](#database-migrations)
10. [Storage Buckets](#storage-buckets)
11. [Deployment Configuration](#deployment-configuration)
12. [Verification Checklist](#verification-checklist)

---

## Prerequisites

### Required Software
- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **Git** for version control
- **Code Editor** (VS Code recommended)

### Required Accounts
- [Supabase](https://app.supabase.com) - Database, Auth, Storage
- [Upstash](https://upstash.com) - Redis for caching and rate limiting (optional but recommended)
- [Stripe](https://stripe.com) - Payment processing (optional for MVP)
- [Mixpanel](https://mixpanel.com) - Analytics (optional)
- [Google Cloud Console](https://console.cloud.google.com) - For Google OAuth
- [GitHub](https://github.com) - For GitHub OAuth (optional)

---

## Project Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd stacks

# Install dependencies
npm install
```

### 2. Create Environment File

Create `.env.local` in the project root (we'll fill this in as we set up each service):

```bash
touch .env.local
```

---

## Supabase Setup

### 1. Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in:
   - **Project Name**: `stacq` (or your preferred name)
   - **Database Password**: Generate a strong password (save it securely)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient for development
4. Click **"Create new project"**
5. Wait for provisioning (2-3 minutes)

### 2. Get Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - **Keep this secret!**

### 3. Configure Authentication

1. Go to **Authentication** → **Providers**
2. **Email Provider**:
   - Enable "Email" provider
   - Configure email templates (optional for MVP)
3. **Google OAuth** (see [Authentication Providers](#authentication-providers) section below)
4. **GitHub OAuth** (optional, see [Authentication Providers](#authentication-providers) section below)

### 4. Add to `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

---

## Authentication Providers

### Google OAuth Setup

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable **Google+ API** (if not already enabled)

2. **Create OAuth 2.0 Credentials**:
   - Go to **APIs & Services** → **Credentials**
   - Click **"Create Credentials"** → **"OAuth client ID"**
   - Application type: **Web application**
   - Name: `Stacq Web App`
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://your-production-domain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/callback` (for development)
     - `https://your-production-domain.com/auth/callback` (for production)
   - Click **"Create"**
   - Copy **Client ID** and **Client Secret**

3. **Configure in Supabase**:
   - Go to Supabase Dashboard → **Authentication** → **Providers**
   - Enable **Google** provider
   - Paste **Client ID** and **Client Secret**
   - Click **"Save"**

4. **Add to `.env.local`** (if needed for direct OAuth):
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

### GitHub OAuth Setup (Optional)

1. **Create GitHub OAuth App**:
   - Go to GitHub → **Settings** → **Developer settings** → **OAuth Apps**
   - Click **"New OAuth App"**
   - **Application name**: `Stacq`
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**: `https://your-project-id.supabase.co/auth/v1/callback`
   - Click **"Register application"**
   - Copy **Client ID** and generate **Client Secret**

2. **Configure in Supabase**:
   - Go to Supabase Dashboard → **Authentication** → **Providers**
   - Enable **GitHub** provider
   - Paste **Client ID** and **Client Secret**
   - Click **"Save"**

---

## Upstash Redis Setup

### 1. Create Upstash Account

1. Go to [https://upstash.com](https://upstash.com)
2. Sign up for a free account
3. Create a new Redis database:
   - **Name**: `stacq-redis`
   - **Type**: Regional (choose closest region)
   - **Tier**: Free tier is sufficient for development
   - Click **"Create"**

### 2. Get Redis Credentials

1. In your Upstash dashboard, click on your database
2. Go to **REST API** tab
3. Copy:
   - **UPSTASH_REDIS_REST_URL** (e.g., `https://xxxxx.upstash.io`)
   - **UPSTASH_REDIS_REST_TOKEN** (starts with `AXxxxxx`)

### 3. Add to `.env.local`:

```env
# Upstash Redis (for caching and rate limiting)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token-here
```

**Note**: Redis is optional. The app will work without it but will have reduced performance (no caching, rate limiting may fail open).

---

## Stripe Setup (Optional for MVP)

### 1. Create Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for an account
3. Complete business verification (can use test mode for development)

### 2. Get API Keys

1. Go to **Developers** → **API keys**
2. Copy:
   - **Publishable key** (starts with `pk_test_...` or `pk_live_...`)
   - **Secret key** (starts with `sk_test_...` or `sk_live_...`)

### 3. Set Up Webhook

1. Go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://your-domain.com/api/payments/webhook`
4. **Events to send**:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_...`)

### 4. Add to `.env.local`:

```env
# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_your-secret-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret-here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key-here
```

**Note**: For production, use `pk_live_...` and `sk_live_...` keys.

---

## Mixpanel Setup (Optional)

### 1. Create Mixpanel Account

1. Go to [https://mixpanel.com](https://mixpanel.com)
2. Sign up for a free account
3. Create a new project:
   - **Project Name**: `Stacq`
   - Copy the **Project Token** (starts with alphanumeric string)

### 2. Add to `.env.local`:

```env
# Mixpanel Analytics (optional)
NEXT_PUBLIC_MIXPANEL_TOKEN=your-mixpanel-token-here
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

---

## Environment Variables

### Complete `.env.local` Template

Create `.env.local` in the project root with all variables:

```env
# ============================================
# SUPABASE CONFIGURATION (REQUIRED)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ============================================
# APPLICATION CONFIGURATION (REQUIRED)
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
# For production: NEXT_PUBLIC_APP_URL=https://your-domain.com

# ============================================
# UPSTASH REDIS (OPTIONAL but RECOMMENDED)
# ============================================
# Used for caching and rate limiting
# App will work without it but with reduced performance
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token-here

# ============================================
# STRIPE PAYMENTS (OPTIONAL)
# ============================================
# Required only if you want payment features
STRIPE_SECRET_KEY=sk_test_your-secret-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret-here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key-here

# ============================================
# ANALYTICS (OPTIONAL)
# ============================================
NEXT_PUBLIC_MIXPANEL_TOKEN=your-mixpanel-token-here
NEXT_PUBLIC_ANALYTICS_ENABLED=true

# ============================================
# FEATURE FLAGS (OPTIONAL)
# ============================================
# Enable ranking algorithm feature
NEXT_PUBLIC_FEATURE_RANKING_FINAL_ALGO=false
# Or: NEXT_PUBLIC_FEATURE_RANKING_FINAL_ALGO=true

# ============================================
# OAUTH PROVIDERS (OPTIONAL - if using direct OAuth)
# ============================================
# These are usually configured in Supabase, but can be set here if needed
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ============================================
# ADMIN & MONITORING (OPTIONAL)
# ============================================
# API key for ranking refresh endpoint (for cron jobs)
RANKING_REFRESH_API_KEY=your-secure-api-key-here

# ============================================
# NODE ENVIRONMENT
# ============================================
NODE_ENV=development
# For production: NODE_ENV=production
```

---

## Database Migrations

### Run All Migrations

The database schema is created through migrations in `supabase/migrations/`. Run them in order:

**Option A: Using Supabase Dashboard (Recommended for first-time setup)**

1. Go to Supabase Dashboard → **SQL Editor**
2. Run each migration file in order:
   - `001_initial_schema.sql` - Creates all tables, indexes, triggers
   - `002_rls_policies.sql` - Sets up Row-Level Security policies
   - `003_storage_buckets.sql` - Creates storage buckets and policies
   - `004_user_profile_trigger.sql` - Auto-creates user profiles
   - `005_fix_cards_rls.sql` - Fixes card RLS policies
   - ... (continue with all migrations in numerical order)
   - `033_add_performance_indexes.sql` - Adds performance indexes

**Option B: Using Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push
```

### Migration Order

Run migrations in this exact order (by filename number):

1. `001_initial_schema.sql`
2. `002_rls_policies.sql`
3. `003_storage_buckets.sql`
4. `004_user_profile_trigger.sql`
5. `005_fix_cards_rls.sql`
6. ... (all other migrations in order)
7. `033_add_performance_indexes.sql`

**Important**: Do not skip migrations. Each builds on the previous ones.

---

## Storage Buckets

### Create Storage Buckets

1. Go to Supabase Dashboard → **Storage**
2. Create the following buckets (all public):

   **Bucket 1: `thumbnails`**
   - Name: `thumbnails`
   - Public: ✅ Yes
   - File size limit: 5 MB
   - Allowed MIME types: `image/*`

   **Bucket 2: `cover-images`**
   - Name: `cover-images`
   - Public: ✅ Yes
   - File size limit: 10 MB
   - Allowed MIME types: `image/*`

   **Bucket 3: `avatars`**
   - Name: `avatars`
   - Public: ✅ Yes
   - File size limit: 2 MB
   - Allowed MIME types: `image/*`

3. **Storage Policies** (usually created by migration `003_storage_buckets.sql`):
   - Public read access for all buckets
   - Authenticated users can upload to their own folders
   - Verify policies are active in **Storage** → **Policies**

---

## GitHub Actions Setup (Optional but Recommended)

**⚠️ Important**: GitHub Actions workflows require your app to be **deployed and accessible** first. The workflows call API endpoints on your live app, so they will fail if the app is not deployed.

### Prerequisites

Before setting up GitHub Actions:
1. ✅ Your app must be deployed (Vercel, Netlify, etc.)
2. ✅ Your app must be accessible at a public URL
3. ✅ API endpoints must be working (`/api/admin/refresh-ranking`, `/api/workers/fetch-metadata`)

### 1. Deploy Your App First

**If using Vercel:**
1. Push your code to GitHub
2. Connect repository to Vercel
3. Deploy (see [Deployment Configuration](#deployment-configuration) section)
4. Note your deployment URL (e.g., `https://your-app.vercel.app`)

**If using other platforms:**
- Follow your platform's deployment guide
- Ensure your app is publicly accessible

### 2. Set Up GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:

   **Required Secret:**
   - **Name**: `APP_URL`
   - **Value**: Your **deployed** app URL (e.g., `https://your-app.vercel.app`)
   - **⚠️ Must be your production URL, not `http://localhost:3000`**

   **Optional Secrets (Recommended):**
   - **Name**: `RANKING_REFRESH_API_KEY`
   - **Value**: Generate a secure random string (e.g., `openssl rand -hex 32`)
   - **Purpose**: Secures the ranking refresh endpoint
   - **Note**: Must also be set in your deployment's environment variables

   - **Name**: `WORKER_API_KEY`
   - **Value**: Generate a secure random string (e.g., `openssl rand -hex 32`)
   - **Purpose**: Secures the metadata fetch worker endpoint
   - **Note**: Must also be set in your deployment's environment variables

### 3. Add API Keys to Deployment Environment Variables

**In Vercel (or your deployment platform):**
1. Go to your project settings → **Environment Variables**
2. Add:
   - `RANKING_REFRESH_API_KEY` (same value as GitHub Secret)
   - `WORKER_API_KEY` (same value as GitHub Secret)
3. Redeploy your app for changes to take effect

### 4. Workflow Files

The following workflows are already configured:

**Refresh Explore Ranking** (`.github/workflows/refresh-ranking.yml`):
- Runs every 10 minutes
- Calls: `POST /api/admin/refresh-ranking`
- Refreshes the explore ranking materialized view
- Can be triggered manually from Actions tab

**Fetch Metadata** (`.github/workflows/fetch-metadata.yml`):
- Runs every 15 minutes
- Calls: `POST /api/workers/fetch-metadata`
- Fetches metadata for cards missing titles/descriptions/thumbnails
- Can be triggered manually from Actions tab

### 5. Verify Workflows

1. **Wait for app deployment to complete**
2. Go to **Actions** tab in your repository
3. You should see both workflows listed
4. Click on a workflow → **Run workflow** → **Run workflow** (manual trigger)
5. Check the logs:
   - ✅ Success: Should see "✅ Ranking refreshed successfully" or "✅ Metadata fetch completed successfully"
   - ❌ Failure: Check error messages (usually means app is not deployed or `APP_URL` is wrong)

### 6. Troubleshooting Workflow Failures

**"Error: APP_URL secret is not set"**
- Add `APP_URL` secret in GitHub repository settings

**"Failed to refresh ranking (HTTP 401)"**
- API key authentication failed
- Verify `RANKING_REFRESH_API_KEY` is set in both GitHub Secrets and deployment environment variables
- Values must match exactly

**"Failed to refresh ranking (HTTP 404)"**
- App is not deployed or `APP_URL` is incorrect
- Verify your app is accessible at the URL you set
- Test the endpoint manually: `curl https://your-app.vercel.app/api/admin/refresh-ranking`

**"Connection refused" or "Could not resolve host"**
- `APP_URL` is pointing to localhost or an invalid URL
- Must use your deployed app URL (e.g., `https://your-app.vercel.app`)

**Workflows run but endpoints return errors**
- Check your deployment logs (Vercel logs, etc.)
- Verify environment variables are set in deployment
- Ensure database migrations have been run
- Check that API routes are working when called directly

### 7. Testing Workflows Locally (Optional)

You can test the API endpoints manually before setting up workflows:

```bash
# Test ranking refresh
curl -X POST https://your-app.vercel.app/api/admin/refresh-ranking \
  -H "x-api-key: your-api-key-here"

# Test metadata fetch
curl -X POST https://your-app.vercel.app/api/workers/fetch-metadata \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key-here" \
  -d '{"limit": 50}'
```

If these work, the GitHub Actions workflows should work too.

---

## Deployment Configuration

### Vercel Deployment (Recommended)

1. **Connect Repository**:
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

2. **Environment Variables**:
   - In Vercel project settings → **Environment Variables**
   - Add all variables from `.env.local`
   - Set for **Production**, **Preview**, and **Development** environments

3. **Build Settings**:
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next` (default)
   - Install Command: `npm install`

4. **Deploy**:
   - Click **"Deploy"**
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

5. **Update OAuth Redirect URLs**:
   - Update Google OAuth redirect URI to: `https://your-project.vercel.app/auth/callback`
   - Update Supabase redirect URLs in Auth settings

### Other Platforms

For other platforms (Netlify, Railway, etc.), follow their Next.js deployment guides and add all environment variables.

---

## Verification Checklist

### ✅ Pre-Launch Checklist

#### Database
- [ ] All migrations run successfully
- [ ] All tables created (check in Supabase Dashboard → Table Editor)
- [ ] RLS policies active (check in Supabase Dashboard → Authentication → Policies)
- [ ] Performance indexes created (migration 033)

#### Storage
- [ ] `thumbnails` bucket created and public
- [ ] `cover-images` bucket created and public
- [ ] `avatars` bucket created and public
- [ ] Storage policies configured correctly

#### Authentication
- [ ] Email provider enabled
- [ ] Google OAuth configured and tested
- [ ] GitHub OAuth configured (if using)
- [ ] Test user can sign up with email
- [ ] Test user can sign in with Google
- [ ] OAuth callback URL works (`/auth/callback`)

#### Environment Variables
- [ ] All Supabase variables set
- [ ] `NEXT_PUBLIC_APP_URL` set correctly
- [ ] Redis variables set (if using)
- [ ] Stripe variables set (if using payments)
- [ ] Mixpanel token set (if using analytics)

#### External Services
- [ ] Upstash Redis database created and accessible
- [ ] Stripe account configured (if using)
- [ ] Mixpanel project created (if using)
- [ ] Google OAuth app created and configured
- [ ] GitHub Actions secrets configured (if using workflows)

#### Application
- [ ] App builds successfully (`npm run build`)
- [ ] App runs locally (`npm run dev`)
- [ ] Can create account
- [ ] Can create collection
- [ ] Can add card to collection
- [ ] Can save/unsave collections
- [ ] Can upvote collections/cards
- [ ] Feed page loads correctly
- [ ] Explore page loads correctly

#### Performance
- [ ] Redis caching working (check server logs for `[Cache]` messages)
- [ ] API routes return cache headers
- [ ] Database queries are fast (check Supabase Dashboard → Database → Query Performance)

---

## Testing the Setup

### 1. Test Database Connection

```bash
npm run dev
```

Visit `http://localhost:3000` - should load without errors.

### 2. Test Authentication

1. Click **"Sign Up"**
2. Create account with email
3. Verify email (check Supabase Dashboard → Authentication → Users)
4. Sign out and sign in
5. Test Google OAuth sign-in

### 3. Test Core Features

1. **Create Collection**:
   - Click "Create" → "Collection"
   - Fill in title and description
   - Save

2. **Add Card**:
   - Open your collection
   - Click "Add Card"
   - Enter a URL
   - Save

3. **Test Feed**:
   - Go to home page
   - Verify feed loads
   - Check browser console for errors

### 4. Test Caching (if Redis configured)

1. Check server logs for `[Cache]` messages:
   - First request: `[Cache] ❌ Redis MISS`
   - Second request: `[Cache] ✅ Redis HIT`

2. Visit `/explore` page multiple times
3. Check logs - should see cache hits on subsequent visits

---

## Troubleshooting

### Common Issues

#### 1. "Supabase client not initialized"
- **Solution**: Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly

#### 2. "Redis connection failed"
- **Solution**: Check `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are correct
- **Note**: App will work without Redis, just with reduced performance

#### 3. "OAuth callback error"
- **Solution**: Verify redirect URLs match exactly in:
  - Google Cloud Console
  - Supabase Auth settings
  - Your `.env.local` `NEXT_PUBLIC_APP_URL`

#### 4. "Database migration errors"
- **Solution**: 
  - Check migration order (must run in numerical order)
  - Verify previous migrations completed successfully
  - Check for conflicting constraints or existing objects

#### 5. "Storage upload fails"
- **Solution**:
  - Verify storage buckets exist
  - Check bucket policies allow uploads
  - Verify file size is within limits

#### 6. "Rate limiting not working"
- **Solution**: 
  - Check Redis credentials
  - Verify Upstash database is active
  - Check server logs for Redis connection errors

#### 7. "GitHub Actions workflows failing"
- **Solution**:
  - Verify `APP_URL` secret is set in GitHub repository settings
  - Check that `APP_URL` points to your deployed app (not localhost)
  - For ranking refresh: Set `RANKING_REFRESH_API_KEY` in both GitHub Secrets and `.env.local`
  - For metadata fetch: Set `WORKER_API_KEY` in both GitHub Secrets and `.env.local`
  - Check workflow logs in GitHub Actions tab for specific error messages
  - Verify the API endpoints are accessible (not behind authentication that requires user login)

---

## Production Deployment

### Before Going Live

1. **Update Environment Variables**:
   - Use production Supabase project (or same project with production config)
   - Use production Stripe keys (`pk_live_...`, `sk_live_...`)
   - Update `NEXT_PUBLIC_APP_URL` to production domain
   - Set `NODE_ENV=production`

2. **Update OAuth Redirect URLs**:
   - Add production URLs to Google OAuth app
   - Update Supabase Auth redirect URLs

3. **Set Up GitHub Actions** (if using):
   - Add `APP_URL` secret pointing to your deployed app
   - Add `RANKING_REFRESH_API_KEY` and `WORKER_API_KEY` secrets
   - Test workflows manually from Actions tab
   - Verify workflows are running successfully

4. **Set Up Monitoring**:
   - Configure error tracking (Sentry, if using)
   - Set up uptime monitoring
   - Configure alerts for critical errors

4. **Set Up Cron Jobs** (if using ranking system):
   - Configure GitHub Actions or Vercel Cron to call `/api/workers/ranking/recompute`
   - Set `RANKING_REFRESH_API_KEY` for security

5. **Performance Optimization**:
   - Verify Redis caching is working
   - Check database query performance
   - Monitor API response times

---

## Support & Resources

### Documentation
- **Project Structure**: `/Docs/project_structure.md`
- **Implementation Guide**: `/Docs/Implementation.md`
- **UI/UX Guidelines**: `/Docs/UI_UX_doc.md`
- **Performance Optimization**: `/Docs/performance-optimization.md`
- **Ranking System**: `/Docs/ranking.md`

### External Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Upstash Redis Docs](https://docs.upstash.com/redis)
- [Stripe Docs](https://stripe.com/docs)

---

## Quick Reference

### Required Services (Minimum)
- ✅ Supabase (Database, Auth, Storage)
- ✅ Next.js hosting (Vercel, Netlify, etc.)

### Recommended Services
- ⭐ Upstash Redis (Caching, Rate Limiting)
- ⭐ Google OAuth (Better UX)

### Optional Services
- 💰 Stripe (Payments)
- 📊 Mixpanel (Analytics)
- 🔍 Sentry (Error Tracking)

### Environment Variables Priority

**Critical (App won't work without)**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

**Important (Reduced performance without)**:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

**Optional (Features won't work without)**:
- `STRIPE_SECRET_KEY` (payments)
- `NEXT_PUBLIC_MIXPANEL_TOKEN` (analytics)
- `GOOGLE_CLIENT_ID` (direct OAuth, if not using Supabase OAuth)

---

## Next Steps After Setup

1. ✅ Run all migrations
2. ✅ Test authentication
3. ✅ Create test collections and cards
4. ✅ Verify feed loads correctly
5. ✅ Test save/upvote functionality
6. ✅ Check cache performance (if Redis configured)
7. ✅ Deploy to production
8. ✅ Set up monitoring and alerts

---

**Last Updated**: Based on current codebase state
**Version**: 1.0

