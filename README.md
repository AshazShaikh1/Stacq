# Stacq — The Expert Filter for the Digital Age.

Stop searching and start finding. Stacq helps you curate the high-signal resources that Google and AI often miss.

## 🚀 Vision
In an era of information overload and AI-generated noise, Stacq prioritizes human expertise and "The Why." Every resource in a Stacq collection is curated by a person who has actually tested it, read it, or used it.

## 🛠️ Technology Stack
- **Framework**: Next.js 16 (App Router + Turbopack)
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Styling**: Tailwind CSS v4 + Vanilla CSS
- **UI Components**: Shadcn UI + Lucide React
- **Drag & Drop**: @dnd-kit (Core, Sortable)
- **Design System**: Material 3 Inspired

## 📦 Features
- **Dynamic Boards**: Drag-and-drop resource organization.
- **Human Curation**: Rich metadata and context notes for every link.
- **Smart Metadata**: Automatic scraping of titles and descriptions for easy link additions.
- **Seamless Auth**: Google OAuth and Secure Email Auth via Supabase.
- **Production Ready**: Full SEO, OpenGraph social sharing, and responsive layouts.

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- Supabase Account

### Setup
1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd stacq
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env.local` file with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## 📄 License
All rights reserved © 2026 Stacq.in
