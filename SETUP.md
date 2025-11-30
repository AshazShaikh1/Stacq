# Quick Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

1. **Create Supabase Project**
   - Go to https://app.supabase.com
   - Create a new project
   - Wait for provisioning (2-3 minutes)

2. **Get API Keys**
   - Go to Settings → API
   - Copy: Project URL, anon key, service_role key

3. **Run Database Migrations**
   
   **Option A: Using Supabase Dashboard (Easiest)**
   - Go to SQL Editor
   - Run `supabase/migrations/001_initial_schema.sql`
   - Run `supabase/migrations/002_rls_policies.sql`
   - Review `supabase/migrations/003_storage_buckets.sql` for storage setup

   **Option B: Using Supabase CLI**
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref your-project-ref
   supabase db push
   ```

4. **Create Storage Buckets**
   - Go to Storage in Supabase dashboard
   - Create: `thumbnails`, `cover-images`, `avatars`
   - Set all as public
   - Configure policies (see `003_storage_buckets.sql`)

### 3. Configure Environment Variables

Create `.env.local` file:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the App
```bash
npm run dev
```

Visit http://localhost:3000

## 📋 Complete Setup Checklist

- [ ] Supabase project created
- [ ] Database migrations run (001, 002)
- [ ] Storage buckets created (thumbnails, cover-images, avatars)
- [ ] Environment variables configured (.env.local)
- [ ] Authentication providers configured (Email, Google, GitHub)
- [ ] Test user created
- [ ] RLS policies verified

## 📚 Detailed Documentation

See `Docs/Supabase_Setup_Guide.md` for complete setup instructions.

## 🗄️ Database Schema

All tables are created via migrations:
- `users` - User profiles
- `stacks` - Stack/board data
- `cards` - Canonical resources
- `stack_cards` - Many-to-many mapping
- `tags`, `stack_tags`, `card_tags` - Tagging system
- `votes` - Upvotes on stacks/cards
- `comments` - Threaded comments
- `notifications` - Real-time notifications
- `clones` - Stack cloning records
- `extension_saves` - Browser extension queue
- `link_checks` - Link health monitoring
- `reports` - User reports
- `payments` - Stripe payment records
- `explore_ranking` - Materialized view for feed

## 🔒 Security

- Row-Level Security (RLS) enabled on all tables
- Policies enforce:
  - Public stacks are viewable by everyone
  - Private stacks only by owner
  - Users can only modify their own data
  - Admins have elevated permissions
  - 48-hour account age requirement for voting

## 🎯 Next Steps

After Supabase setup:
1. Set up Upstash Redis (for rate limiting)
2. Set up Stripe (for payments)
3. Continue with Stage 2: Core Features

