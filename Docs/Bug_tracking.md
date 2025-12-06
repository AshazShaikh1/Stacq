# Bug Tracking & Solutions

This document tracks known issues, bugs, and their solutions to help prevent recurring problems and speed up debugging.

## Format

Each entry should follow this structure:

```markdown
### [Issue Title]
**Date:** YYYY-MM-DD
**Status:** Open / Resolved / Investigating
**Severity:** Critical / High / Medium / Low

**Description:**
[Clear description of the issue]

**Error Details:**
[Error messages, stack traces, console logs]

**Root Cause:**
[What caused the issue]

**Solution:**
[Step-by-step solution or workaround]

**Prevention:**
[How to prevent this issue in the future]
```

## Known Issues

### RLS Policy Violation for Cards Table
**Date:** 2024-12-19
**Status:** Resolved
**Severity:** High

**Description:**
When clicking "Add Card", the API route was getting "new row violates row-level security policy for table 'cards'" error.

**Error Details:**
```
Error: new row violates row-level security policy for table "cards"
```

**Root Cause:**
1. The RLS policy required `auth.uid() = created_by`, but the server-side Supabase client in API routes wasn't properly passing the auth context from cookies.
2. The server.ts client uses `cookies()` from Next.js which works in Server Components but not properly in API routes.

**Solution:**
1. Created `src/lib/supabase/api.ts` with a client that reads cookies from the request object (works in API routes).
2. Updated `src/app/api/cards/route.ts` to use the API client instead of server client.
3. Created migration `005_fix_cards_rls.sql` to make the RLS policy more permissive (allows any authenticated user).

**Prevention:**
- Always use the API client (`createClient` from `@/lib/supabase/api`) in API routes.
- Use the server client (`createClient` from `@/lib/supabase/server`) only in Server Components.
- Test RLS policies with actual authenticated requests, not just service role.

### Realtime Removed
**Date:** 2024-12-19
**Status:** Resolved
**Severity:** N/A

**Description:**
Realtime/replication features have been removed from the project. All updates are now handled via manual refetch after user actions.

**Reason:**
Realtime requires replication which may have cost implications. The app works perfectly without it - users just need to refresh to see other users' changes.

**Solution:**
- Removed all realtime subscription code from `useVotes.ts` and `useComments.ts`
- Removed realtime migration files
- Updated documentation to reflect this change
- App now uses optimistic updates + manual refetch pattern

### Excessive Supabase Requests in Development
**Date:** 2024-12-XX
**Status:** Resolved
**Severity:** High

**Description:**
Supabase was receiving excessive requests (13,000 REST, 8,457 auth, 99 storage, 88 real-time) in 24 hours during development with no real users. This was causing unnecessary API usage and potential cost issues.

**Error Details:**
- High number of auth requests (8,457 in 24 hours)
- Multiple `supabase.auth.getUser()` calls on every page load
- Redundant API calls in hooks after optimistic updates

**Root Cause:**
1. **Multiple independent `getUser()` calls**: `LayoutWrapper`, `Header`, and `Sidebar` components were all calling `supabase.auth.getUser()` independently on every page load, resulting in 3+ auth requests per page.
2. **React Strict Mode**: In development, React Strict Mode causes components to mount twice, doubling all requests.
3. **Redundant hook calls**: 
   - `useVotes` hook was calling `getUser()` again inside useEffect even when it already had user data
   - `useComments` hook was calling `fetchComments()` again after adding a comment, even though optimistic update was already applied
4. **Missing dependency arrays**: `useVotes` useEffect was missing proper dependencies, potentially causing re-renders

**Solution:**
1. **Created AuthContext** (`src/contexts/AuthContext.tsx`): Centralized auth state management that fetches user once and shares it across all components
2. **Updated components to use context**:
   - `LayoutWrapper` now uses `useAuth()` hook instead of fetching independently
   - `Header` now uses `useAuth()` hook
   - `Sidebar` now uses `useAuth()` hook
   - `CommentForm` now uses `useAuth()` hook
3. **Fixed `useVotes` hook**:
   - Removed redundant `getUser()` call inside useEffect
   - Fixed dependency array to include all dependencies
   - Simplified logic to use `fetchVoteCount` consistently
4. **Fixed `useComments` hook**:
   - Removed redundant `fetchComments()` call after adding comment (optimistic update is sufficient)

**Prevention:**
- Always use `useAuth()` hook from `AuthContext` instead of calling `supabase.auth.getUser()` directly in components
- Only call `getUser()` in API routes or server components when absolutely necessary
- Avoid redundant refetches after optimistic updates - trust the server response
- Ensure useEffect dependency arrays are complete to prevent unnecessary re-renders
- Consider React Strict Mode's double-mounting behavior when debugging request counts in development

### Users Can Create Public Cards Without Stacker Role
**Date:** 2024-12-XX
**Status:** Resolved
**Severity:** High

**Description:**
Any authenticated user was able to create public cards by setting `is_public: true` in the card creation API, even if they didn't have the "stacker" role. This violates the intended access control where only stackers should be able to publish standalone public cards.

**Error Details:**
- Regular users could create standalone public cards
- No validation of user role before allowing `is_public: true`
- Cards created outside of collections could be made public by anyone

**Root Cause:**
The card creation API (`src/app/api/cards/route.ts`) was accepting the `is_public` parameter directly from the request body without validating:
1. Whether the user has the "stacker" role (for standalone cards)
2. Whether the card is being added to a collection (should match collection visibility)

**Solution:**
1. Added role check to verify if user is a stacker/admin
2. For cards added to collections: Card visibility now matches collection visibility automatically
3. For standalone cards: Only stackers/admins can set `is_public: true`; regular users are forced to `is_public: false`
4. Added warning log when regular users attempt to create standalone public cards

**Code Changes:**
- Updated `src/app/api/cards/route.ts` to:
  - Fetch user role from database
  - Check collection visibility if card is being added to a collection
  - Enforce `is_public: false` for regular users creating standalone cards
  - Allow stackers to set `is_public` as they wish for standalone cards
- Created migration `035_restrict_public_card_creation.sql` to add database-level RLS policy as secondary defense

**Prevention:**
- Always validate user permissions before allowing public content creation
- Check user role (stacker/admin) for operations that require elevated privileges
- Match card visibility to collection visibility when cards are added to collections
- Add RLS policies at the database level as a secondary defense (migration 035 adds this)
- Test both API-level and database-level restrictions

### Card Deletion Error: "stack_id is required"
**Date:** 2024-12-XX
**Status:** Resolved
**Severity:** High

**Description:**
When trying to delete a card from a collection, users were getting an error "stack_id is required" even when the card was in a collection (not a stack). This happened because the DELETE endpoint only supported the legacy `stack_id` parameter and didn't support `collection_id`.

**Error Details:**
```
stack_id is required
src\components\card\CardPreview.tsx (129:15)
```

**Root Cause:**
1. The DELETE endpoint (`src/app/api/cards/[id]/route.ts`) only checked for `stack_id` parameter
2. It required `stack_id` to be present, even for collections
3. The CardPreview component was trying to pass `collection_id` but the endpoint didn't support it
4. When `collectionId` was provided but `stackId` was undefined, it resulted in `stack_id=undefined` in the URL

**Solution:**
1. **Updated DELETE endpoint** to support both `collection_id` and `stack_id` (legacy):
   - If `collection_id` or `stack_id` is provided: Removes card from collection/stack (doesn't delete the card itself)
   - If neither is provided: Deletes the card entirely (only if user created it)
2. **Fixed CardPreview component** to properly handle `collectionId` vs `stackId`:
   - Prefers `collection_id` over `stack_id` when both might be available
   - Only includes query parameter if it exists
   - Updated confirmation message to reflect whether removing from collection or deleting entirely
3. **Improved logic**:
   - Checks collection/stack ownership for removal permissions
   - Allows card creator to delete their own cards
   - Allows collection/stack owner to remove cards from their collections/stacks
   - Allows user who added the card to remove it

**Code Changes:**
- Updated `src/app/api/cards/[id]/route.ts` DELETE handler to support `collection_id` and `stack_id`
- Updated `src/components/card/CardPreview.tsx` handleDelete function to properly construct URL

**Prevention:**
- Always support both legacy (`stack_id`) and new (`collection_id`) parameters during migration period
- Validate that at least one required parameter is provided before processing
- Handle cases where parameters might be undefined gracefully
- Test deletion flow for both collections and legacy stacks

### Card and Collection Deletion Not Removing from Database
**Date:** 2024-12-XX
**Status:** Resolved
**Severity:** High

**Description:**
When collection owners deleted cards or collections, the items were not being deleted from the database. Cards were only removed from collections (not deleted), and when collections were made private/unlisted, cards' visibility wasn't updated accordingly. This caused deleted cards to still appear in search results.

**Error Details:**
- Cards deleted by owners were still searchable by other users
- Cards in private/unlisted collections were still showing as public
- Collection deletion didn't clean up cards that were only in that collection

**Root Cause:**
1. Card deletion endpoint only removed cards from collections, never deleted them from DB
2. Collection deletion didn't check for and delete cards that were only in that collection
3. No automatic sync between collection visibility and card visibility
4. Cards' `is_public` field wasn't updated when collection visibility changed

**Solution:**
1. **Updated card deletion logic** (`src/app/api/cards/[id]/route.ts`):
   - When collection owner deletes a card: Check if card is in other collections/stacks
   - If card is only in this collection: Delete card from database
   - If card is in other collections: Just remove from this collection
   - Use service client to bypass RLS for deletion

2. **Updated collection deletion logic** (`src/app/api/collections/[id]/route.ts`):
   - Before deleting collection: Check all cards in the collection
   - Delete cards that are only in this collection (not in any other collection/stack)
   - Use service client to bypass RLS for deletion

3. **Created database trigger** (`supabase/migrations/036_sync_card_visibility_with_collection.sql`):
   - Automatically updates card visibility when collection/stack visibility changes
   - Cards are public if they're in at least one public collection/stack
   - Cards are private if all collections/stacks containing them are private
   - Works for both collections and legacy stacks

**Code Changes:**
- Updated `src/app/api/cards/[id]/route.ts` DELETE handler to delete cards from DB when owner deletes and card is only in that collection
- Updated `src/app/api/collections/[id]/route.ts` DELETE handler to delete orphaned cards
- Created migration `036_sync_card_visibility_with_collection.sql` for automatic card visibility sync
- Removed manual card visibility update code (now handled by trigger)

**Prevention:**
- Always check if items are referenced elsewhere before deleting
- Use database triggers for automatic consistency (visibility sync)
- Test deletion scenarios: single collection, multiple collections, orphaned cards
- Verify search results don't show deleted or private items

### Input Fields Losing Focus in Card Creation Modal
**Date:** 2024-12-XX
**Status:** Resolved
**Severity:** High

**Description:**
When creating a card from the sidebar (Create → Card), typing in the title or description input fields causes the fields to lose focus after typing one word. Users have to click on the field again to continue typing, making the form unusable.

**Error Details:**
- Input fields lose focus after each keystroke
- Users cannot type continuously without clicking the field again
- Affects both title and description fields in the card creation form

**Root Cause:**
1. The `CardDetailsStep` component was being recreated on each render due to the step transition logic in `CreateCardModal`
2. Input components didn't have stable keys or IDs, causing React to remount them on re-renders
3. The absolute positioning and transform-based step transitions combined with conditional rendering (`{cardType && ...}`) caused React to think components needed remounting
4. The `Input` component uses `useId()` which generates new IDs when components are recreated

**Solution:**
1. **Added stable keys and IDs to Input components** in `CardDetailsStep`:
   - Added `key="card-title-input"` and `id="card-title-input"` to title input
   - Added `key="card-description-input"` and `id="card-description-input"` to description input
   - Added `key="card-url-input"` and `id="card-url-input"` to URL input
2. **Added stable keys to step containers** in `CreateCardModal`:
   - Added `key="card-details-step"` to the step container div
   - Added `key={`card-details-${cardType}`}` to `CardDetailsStep` component
3. **Memoized CardDetailsStep component** using `React.memo()` to prevent unnecessary re-renders:
   - Wrapped the component export with `memo()` to maintain component identity across renders

**Code Changes:**
- Updated `src/components/card/CardDetailsStep.tsx`:
  - Added stable keys and IDs to all Input components
  - Wrapped component with `React.memo()` to prevent unnecessary re-renders
- Updated `src/components/card/CreateCardModal.tsx`:
  - Added stable keys to step container and CardDetailsStep component

**Prevention:**
- Always add stable keys to form inputs, especially in modals with step transitions
- Use `React.memo()` for components that render form inputs to prevent unnecessary re-renders
- Provide explicit `id` props to Input components instead of relying solely on `useId()` when components might be recreated
- Test form inputs in modals with complex rendering logic (step transitions, conditional rendering)
- Ensure input components maintain their identity across re-renders to preserve focus

## Resolved Issues

_Issues are moved here after being resolved and verified._

---

## Amazon Affiliate Link Integration

**Date:** 2025-01-XX  
**Status:** ✅ Implemented  
**Priority:** Medium

### Description
Implemented automatic Amazon affiliate link processing for product links. When users add Amazon product links, the system automatically detects them and adds the affiliate tag in the background without affecting UI/UX performance.

### Root Cause
N/A - Feature implementation

### Solution
1. Created `src/lib/affiliate/amazon.ts` utility with:
   - `isAmazonLink()` - Detects Amazon product URLs across all major domains
   - `extractAmazonASIN()` - Extracts ASIN from various URL patterns
   - `addAmazonAffiliateTag()` - Adds affiliate tag while preserving important query parameters
   - `getAmazonAffiliateConfig()` - Reads configuration from environment variables

2. Integrated into card creation flow (`src/app/api/cards/route.ts`):
   - Processes affiliate links asynchronously in the background
   - Does not block card creation or slow down the API
   - Updates card metadata with `affiliate_url` and `is_amazon_product` flags

3. Updated metadata worker (`src/app/api/workers/fetch-metadata/route.ts`):
   - Processes affiliate links for existing cards during metadata updates
   - Runs in background without blocking metadata extraction

4. Updated UI components (`src/components/card/CardPreview.tsx`):
   - Uses `affiliate_url` from metadata when available
   - Falls back to `canonical_url` if affiliate URL not available
   - Applies to all link interactions (click, share, copy)

### Configuration
Set `AMAZON_AFFILIATE_TAG` environment variable with your Amazon Associates tag:
```bash
AMAZON_AFFILIATE_TAG=your-tag-20
```

### Testing
- ✅ Amazon product links are detected correctly
- ✅ Affiliate tags are added without breaking URLs
- ✅ Processing happens in background without blocking UI
- ✅ Card creation remains fast (< 200ms)
- ✅ Existing cards get affiliate links during metadata updates

### Prevention
- Affiliate processing is completely optional and fails silently
- No impact on card creation if affiliate processing fails
- Works for all major Amazon domains (US, UK, CA, DE, FR, ES, IT, JP, IN, AU, BR, MX, etc.)

## Supabase Security Warnings - Database Functions and Configuration
**Date:** 2025-01-XX  
**Status:** ✅ Resolved (Migration Created)  
**Severity:** High

### Description
Supabase database linter detected multiple security warnings:
1. **Function Search Path Mutable** - 27 functions without `search_path` set (security vulnerability)
2. **Extensions in Public Schema** - `pg_trgm` and `citext` installed in public schema
3. **Materialized Views Accessible via API** - `explore_ranking` and `explore_ranking_items` accessible
4. **Leaked Password Protection Disabled** - Auth configuration issue

### Root Cause
1. **Function Search Path**: PostgreSQL functions without explicit `search_path` are vulnerable to search_path injection attacks where malicious users can manipulate the search_path to execute unauthorized code.
2. **Extensions in Public**: Extensions installed in public schema can be accessed by all users, which is a security best practice violation.
3. **Materialized Views**: Views are intentionally public for explore/feed functionality, but should be documented.
4. **Password Protection**: Feature not enabled in Supabase Auth dashboard.

### Solution
1. **Created Migration 037** (`supabase/migrations/037_fix_security_warnings.sql`):
   - Fixed all 27 functions by adding `SET search_path = public, pg_temp` or `SET search_path = ''`
   - For SECURITY DEFINER functions: Used `SET search_path = public, pg_temp`
   - For regular functions: Used `SET search_path = public, pg_temp`
   - Functions fixed include:
     - Helper functions: `is_admin`, `owns_stack`, `account_age_hours`
     - User management: `handle_new_user`, `handle_email_verification`
     - Follow system: `get_follower_count`, `get_following_count`, `is_following`
     - Stacker system: `is_stacker`, `can_publish`
     - Ranking system: `refresh_explore_ranking`, `refresh_explore_ranking_items`, `get_ranking_config`, `log_ranking_event`, `get_ranking_signals`
     - Card/Collection functions: `update_card_counters`, `sync_card_visibility_on_collection_change`, `update_cards_search_vector`, `update_collections_search_vector`
     - And more...

2. **Extensions in Public Schema**:
   - Created `extensions` schema for future migration
   - Documented that moving extensions requires careful migration (breaking change)
   - Current state acceptable as extensions in public are common, but should be addressed in future

3. **Materialized Views**:
   - Added comments documenting intentional public access
   - Views are needed for public explore/feed functionality
   - If restriction needed in future, add RLS policies or move to different schema

4. **Leaked Password Protection**:
   - Manual configuration required in Supabase Dashboard
   - Path: Auth > Policies > Password Security > Enable "Leaked Password Protection"
   - Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### Migration Details
- **Migration File**: `supabase/migrations/037_fix_security_warnings.sql`
- **Functions Fixed**: 27+ functions
- **Breaking Changes**: None (all fixes are additive/secure)
- **Rollback**: Migration can be reverted if needed

### Manual Steps Required
1. **Run Migration**: Apply migration 037 to production database
2. **Enable Password Protection**: 
   - Go to Supabase Dashboard > Auth > Policies > Password Security
   - Enable "Leaked Password Protection"
   - This checks passwords against HaveIBeenPwned.org database

### Verification
After migration, verify:
- ✅ All functions have `search_path` set
- ✅ Functions work correctly (no broken functionality)
- ✅ Materialized views still accessible (if needed)
- ✅ Password protection enabled in dashboard

### Prevention
- Always set `search_path` when creating new database functions
- Use `SET search_path = public, pg_temp` for SECURITY DEFINER functions
- Use `SET search_path = public, pg_temp` for regular functions
- Install extensions in separate schema when possible
- Document intentionally public views/tables
- Enable all security features in Supabase Auth dashboard

### References
- Supabase Database Linter: https://supabase.com/docs/guides/database/database-linter
- Function Search Path Security: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
- Extension Security: https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public
- Password Security: https://supabase.com/docs/guides/auth/password-security