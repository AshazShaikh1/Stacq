# UI/UX Documentation - Stack MVP

## Design System Specifications
When starting to design ask for inspiration

### Color Palette

#### Primary Colors
- **Jet (Primary):** `#0A0A0A` or `#312F2C` - Used for primary actions, text headings, and key UI elements
- **Cloud White (Background):** `#FAFAFA` - Main background color
- **Light Gray (Border):** `#E5E5E5` - Borders, dividers, and subtle separations

#### Text Colors
- **Headings:** `#000000` - Primary heading text
- **Body Text:** `#111111` - Main body text
- **Muted Text:** `#555555` - Secondary text, captions, metadata

#### Interactive States
- **Hover:** Subtle opacity change or background shift
- **Active:** Slightly darker shade of Jet
- **Disabled:** `#CCCCCC` with reduced opacity
- **Focus:** Visible outline using Jet color

### Typography

#### Font Family
- **Primary:** System sans-serif stack (system-ui, -apple-system, sans-serif)
- **Fallback:** Arial, Helvetica, sans-serif

#### Font Sizes
- **H1:** `32px` (2rem) - Page titles, major headings
- **H2:** `24px` (1.5rem) - Section headings, stack titles
- **Body:** `16px` (1rem) - Main content text
- **Small:** `13-14px` (0.8125rem - 0.875rem) - Captions, metadata, helper text

#### Font Weights
- **Headings:** 600-700 (semi-bold to bold)
- **Body:** 400 (regular)
- **Emphasis:** 500-600 (medium to semi-bold)

#### Line Heights
- **Headings:** 1.2-1.3
- **Body:** 1.5-1.6
- **Small:** 1.4

### Spacing System

#### Spacing Tokens
- **Page Padding:** `24px` (1.5rem) - Main container padding
- **Column Gap:** `16px` (1rem) - Gap between grid columns
- **Card Gap:** `16px` (1rem) - Gap between cards in masonry grid
- **Section Spacing:** `32px` (2rem) - Vertical spacing between sections
- **Component Padding:** `16px` (1rem) - Internal component padding
- **Button Padding:** `12px 24px` - Standard button padding

#### Border Radius
- **Card Radius:** `12px` (0.75rem) - Card corners
- **Button Radius:** `8px` (0.5rem) - Button corners
- **Input Radius:** `8px` (0.5rem) - Input field corners
- **Modal Radius:** `16px` (1rem) - Modal container corners

### Component Guidelines

#### Buttons

**Primary Button (Jet Filled)**
- Background: Jet (`#312F2C` or `#111111`)
- Text: White (`#FFFFFF`)
- Padding: `12px 24px`
- Border Radius: `8px`
- Font Size: `16px`
- Font Weight: `500`
- Hover: Slight opacity reduction or darker shade
- Active: Pressed state with slight scale down
- Disabled: `#CCCCCC` background, reduced opacity

**Secondary Button (Jet Outline)**
- Background: Transparent
- Border: `2px solid` Jet
- Text: Jet
- Padding: `12px 24px`
- Border Radius: `8px`
- Hover: Background fill with Jet, text turns white
- Active: Pressed state

**Icon Buttons**
- Square or circular shape
- Minimum touch target: `44px × 44px`
- Icon size: `20px` or `24px`
- Hover: Background color change

#### Cards

**Stack Card / Resource Card**
- Background: White
- Border: `1px solid #E5E5E5` (optional)
- Border Radius: `12px`
- Padding: `16px`
- Shadow: Subtle on hover (`0 4px 12px rgba(0,0,0,0.1)`)
- Hover: Subtle zoom (`scale(1.02)`) + shadow
- Transition: `0.2s ease-in-out`

**Card Content Structure:**
- Thumbnail: Top, `16:9` aspect ratio, rounded top corners
- Title: H2 size, Jet color, 2-line truncation
- Domain: Small text, muted color
- Stacker Name: Small text, link style
- Action Icons: Bottom right, upvote, comment, save icons

#### Input Fields

**Text Input**
- Border: `1px solid #E5E5E5`
- Border Radius: `8px`
- Padding: `12px 16px`
- Font Size: `16px`
- Focus: Border color changes to Jet, outline visible
- Placeholder: Muted color (`#555555`)

**Textarea**
- Same styling as text input
- Minimum height: `100px`
- Resizable: Vertical only

#### Modals

**Modal Container**
- Background: White
- Border Radius: `16px`
- Padding: `24px`
- Max Width: `600px` (or `90vw` on mobile)
- Shadow: `0 8px 32px rgba(0,0,0,0.2)`
- Backdrop: Semi-transparent overlay (`rgba(0,0,0,0.5)`)

**Modal Header**
- Title: H2 size
- Close Button: Top right, icon button
- Border Bottom: `1px solid #E5E5E5` (optional)

**Modal Footer**
- Actions aligned right
- Button spacing: `12px`
- Border Top: `1px solid #E5E5E5` (optional)

#### Navigation

**Header**
- Background: White
- Border Bottom: `1px solid #E5E5E5`
- Height: `64px`
- Padding: `0 24px`
- Sticky: Yes, top of viewport

**Navigation Items**
- Font Size: `16px`
- Spacing: `24px` between items
- Active State: Underline or bold
- Hover: Color change

## Layout Patterns

### Masonry Grid

**Implementation:**
- Use CSS Grid with `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`
- Or use `react-masonry-css` library
- Column gap: `16px`
- Row gap: `16px`
- Responsive breakpoints:
  - Mobile: 1 column
  - Tablet: 2 columns
  - Desktop: 3-4 columns
  - Large Desktop: 4-5 columns

**Card Sizing:**
- Minimum width: `280px`
- Maximum width: `400px`
- Height: Auto (content-based)

### Stack Detail Page Layout

**Header Section:**
- Cover Image: Full width, `400px` height, rounded top corners
- Title: H1, below cover
- Description: Body text, below title
- Tags: Chip-style, below description
- Action Bar: Upvote, Save, Share, Clone buttons
- Stacker Info: Avatar, name, stats

**Cards Section:**
- Masonry grid below header
- Same card styling as feed

### Card Detail Modal

**Layout:**
- Split view (desktop) or stacked (mobile)
- Left: Preview/thumbnail (60% width on desktop)
- Right: Details and comments (40% width on desktop)
- Scroll: Independent scrolling for each section
- Close: X button top right

**Content:**
- Title, description, domain
- Stacker info
- Action buttons (upvote, save, share)
- Comments section below

## User Experience Flows

### Create Stack Flow

1. **Trigger:** Click "Create Stack" button
2. **Modal Opens:** Create Stack modal appears
3. **Form Fields:**
   - Title (required, max 100 chars)
   - Description (optional, max 500 chars)
   - Tags (optional, max 10 tags, autocomplete)
   - Visibility (Public/Private/Unlisted) - Radio buttons
   - Cover Image (optional, upload button)
4. **Validation:** Real-time validation on blur
5. **Submit:** Primary button "Create Stack"
6. **Loading:** Button shows loading state
7. **Success:** Modal closes, redirect to new stack page
8. **Error:** Error message displayed below form

### Add Card Flow

1. **Trigger:** Click "Add Card" button or extension save
2. **Modal Opens:** Add Card modal appears
3. **URL Input:** Paste URL, show loading state
4. **Metadata Fetch:** Background worker fetches Open Graph data
5. **Preview:** Show fetched metadata (title, description, thumbnail)
6. **Manual Override:** User can edit title, description, thumbnail
7. **Stack Selection:** Dropdown to select target stack(s)
8. **Submit:** "Add to Stack" button
9. **Loading:** Button shows loading state
10. **Success:** Modal closes, card appears in selected stack(s)
11. **Error:** Error message with retry option

### Upvote Flow

1. **Trigger:** Click upvote icon/button
2. **Optimistic Update:** UI immediately shows upvoted state
3. **API Call:** Send vote request to backend
4. **Real-time Update:** Supabase Realtime confirms update
5. **Reconciliation:** If server response differs, update UI
6. **Error Handling:** If vote fails, revert optimistic update and show error

### Comment Flow

1. **Trigger:** Click comment icon or "Add Comment" button
2. **Comment Form:** Textarea appears (inline or in modal)
3. **Submit:** "Post Comment" button
4. **Optimistic Update:** Comment appears immediately in thread
5. **API Call:** Send comment to backend
6. **Real-time Update:** Supabase Realtime confirms and broadcasts to other users
7. **Reconciliation:** Update with server response
8. **Threading:** Reply button creates nested comment (max 4 levels)

### Notification Flow

1. **Trigger:** Real-time event (upvote, comment, clone, follow)
2. **Notification Created:** Backend creates notification record
3. **Real-time Push:** Supabase Realtime pushes to user's notification channel
4. **Bell Update:** Notification bell shows unread count badge
5. **Click Bell:** Notification list modal opens
6. **Mark as Read:** Clicking notification marks as read
7. **Navigation:** Clicking notification navigates to relevant content

## Responsive Design Requirements

### Breakpoints

- **Mobile:** `0px - 640px`
- **Tablet:** `641px - 1024px`
- **Desktop:** `1025px - 1440px`
- **Large Desktop:** `1441px+`

### Mobile Adaptations

- **Navigation:** Hamburger menu instead of full nav
- **Masonry Grid:** 1 column
- **Modals:** Full screen on mobile
- **Card Detail:** Stacked layout instead of split
- **Touch Targets:** Minimum `44px × 44px`
- **Spacing:** Reduced padding (`16px` instead of `24px`)

### Tablet Adaptations

- **Masonry Grid:** 2-3 columns
- **Modals:** Centered, max width `600px`
- **Navigation:** Full nav bar
- **Card Detail:** Split view if space allows

### Desktop Adaptations

- **Masonry Grid:** 3-4 columns
- **Modals:** Centered, max width `600px`
- **Sidebar:** Optional sidebar for filters/categories
- **Card Detail:** Split view (60/40)

## Accessibility Standards

### WCAG 2.1 Level AA Compliance

#### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Tab order follows visual flow
- Focus indicators clearly visible (Jet outline)
- Skip links for main content

#### Screen Readers
- All images have descriptive alt text
- Form inputs have associated labels
- ARIA labels for icon-only buttons
- ARIA live regions for real-time updates
- Semantic HTML (header, nav, main, footer, article, section)

#### Color Contrast
- Text contrast ratio: Minimum 4.5:1 for body text, 3:1 for large text
- Interactive elements: Minimum 3:1 contrast
- Focus indicators: High contrast

#### Motion
- Respect `prefers-reduced-motion` media query
- Disable animations for users who prefer reduced motion
- Provide static alternatives for animated content

#### Focus Management
- Visible focus outline on all interactive elements
- Focus trap in modals
- Return focus to trigger after modal closes
- Focus management for dynamic content updates

## Component Library Organization

### Base Components (`/components/ui`)

- **Button** - Primary, secondary, icon variants
- **Input** - Text input, textarea
- **Modal** - Reusable modal container
- **Card** - Base card component
- **Avatar** - User avatar display
- **Badge** - Tag/chip component
- **Spinner** - Loading indicator
- **Toast** - Notification toast messages
- **Dropdown** - Dropdown menu component
- **Tooltip** - Tooltip component

### Feature Components

Organized by feature domain:
- **Stack Components** - StackCard, StackHeader, StackActions, CreateStackModal
- **Card Components** - CardPreview, CardDetail, AddCardModal, CardMasonry
- **Feed Components** - FeedGrid, FeedFilters
- **Comment Components** - CommentThread, CommentItem, CommentForm
- **Notification Components** - NotificationBell, NotificationList
- **Profile Components** - ProfileHeader, ProfileStats

## User Journey Maps

### New User Journey

1. **Landing:** Arrive at homepage
2. **Sign Up:** Click sign up, complete registration
3. **Onboarding:** Optional quick tour (skip available)
4. **Explore:** Browse trending stacks
5. **Create Stack:** Create first stack
6. **Add Card:** Add first card to stack
7. **Engage:** Upvote or comment on content
8. **Extension:** Install browser extension
9. **Save:** Save first resource via extension

### Returning User Journey

1. **Login:** Authenticate
2. **Feed:** View personalized feed
3. **Discover:** Browse explore page
4. **Interact:** Upvote, comment, save stacks
5. **Create:** Add cards to existing stacks or create new stacks
6. **Notifications:** Check and respond to notifications
7. **Profile:** View own profile and stats

### Power User Journey

1. **Feed:** Check personalized feed
2. **Create:** Create multiple stacks with curated content
3. **Engage:** Actively comment and upvote
4. **Monetize:** Promote stacks or become featured stacker
5. **Analytics:** Track stack performance
6. **Community:** Follow other stackers, build audience

## Wireframe References

### Key Pages

1. **Feed Page**
   - Header with navigation
   - Filter bar (optional)
   - Masonry grid of stack cards
   - Infinite scroll or pagination

2. **Stack Detail Page**
   - Cover image header
   - Title, description, tags
   - Action bar (upvote, save, share, clone)
   - Stacker info
   - Masonry grid of cards

3. **Profile Page**
   - Profile header (avatar, name, stats)
   - Tabs: Created Stacks / Saved Stacks
   - Masonry grid of stacks

4. **Explore Page**
   - Category filters
   - Sort options (Most Upvoted, Newest)
   - Masonry grid of stacks
   - Top stackers section

5. **Search Page**
   - Search input
   - Filter tabs (Stacks, Cards, Stackers)
   - Results list/grid
   - Pagination

## Design Tool Integration

### Recommended Tools

- **Figma** - Design mockups and component library
- **Storybook** - Component documentation and testing
- **Tailwind CSS** - Utility-first styling (already in tech stack)

### Design Tokens

All design tokens should be defined in `tailwind.config.js`:
- Colors (Jet, White, Gray scale)
- Spacing scale
- Typography scale
- Border radius values
- Shadow presets
- Breakpoints

### Component Documentation

Each component should include:
- Visual examples
- Props documentation
- Usage guidelines
- Accessibility notes
- Responsive behavior

## Empty States

### Empty State Patterns

**No Stacks:**
- Icon: Stack/board icon
- Title: "No stacks here"
- Description: "Create your first Stack to get started"
- CTA: "Create Stack" button

**No Cards:**
- Icon: Card/resource icon
- Title: "This stack is empty"
- Description: "Add your first card to get started"
- CTA: "Add Card" button

**No Search Results:**
- Icon: Search icon
- Title: "No results found"
- Description: "Try different keywords or filters"
- CTA: "Clear Filters" button

**No Notifications:**
- Icon: Bell icon
- Title: "All caught up!"
- Description: "You'll see notifications here when you get upvotes, comments, or new followers"

## Loading States

### Skeleton Screens

- **Card Skeleton:** Rectangle with rounded corners, shimmer effect
- **Stack Header Skeleton:** Large rectangle (cover), title line, description lines
- **Comment Skeleton:** Avatar circle, text lines
- **Profile Skeleton:** Avatar circle, name line, stats boxes

### Spinner States

- **Button Loading:** Spinner replaces text or appears alongside
- **Page Loading:** Full-page spinner or skeleton screen
- **Modal Loading:** Spinner in modal center
- **Inline Loading:** Small spinner next to content

## Error States

### Error Messages

- **User-Friendly Copy:** Clear, actionable error messages
- **Rate Limit Errors:** "You've hit the save limit. Try again in X minutes."
- **Validation Errors:** Inline below form fields
- **Network Errors:** "Something went wrong. Please try again."
- **Permission Errors:** "You don't have permission to perform this action."

### Error UI Patterns

- **Toast Notifications:** Non-blocking error toasts
- **Inline Errors:** Below form fields or action buttons
- **Error Pages:** 404, 500 error pages with helpful navigation
- **Retry Mechanisms:** Retry buttons for failed operations

