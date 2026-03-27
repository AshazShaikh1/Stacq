import MasonryFeed from "@/components/feed/masonry-feed"

// Supplying extended mock data to visualize the staggered Masonry
const defaultMockItems = [
    { id: 1, title: "UI/UX Design Inspiration", aspectRatio: "aspect-square", items: [{ title: "Mobbin" }, { title: "Awwwards" }, { title: "Dribbble" }], curator: { username: "ashaz" }, remixCount: 42 },
    { id: 2, title: "Next.js Mastery", aspectRatio: "aspect-[3/4]", items: [{ title: "App Router Docs" }, { title: "Server Actions Guide" }], curator: { username: "frontend" }, remixCount: 12 },
    { id: 3, title: "Startup Tools", aspectRatio: "aspect-video", items: [{ title: "Stripe" }, { title: "PostHog" }, { title: "Resend" }], curator: { username: "founder" }, remixCount: 89 },
    { id: 4, title: "Indie Hacker Stack", aspectRatio: "aspect-[4/5]", items: [{ title: "Supabase" }], curator: { username: "builder" }, remixCount: 156 },
    { id: 5, title: "Productivity Apps", aspectRatio: "aspect-square", items: [{ title: "Notion" }, { title: "Linear" }, { title: "Cron" }], curator: { username: "hustler" }, remixCount: 112 },
    { id: 6, title: "AI Prompts & Logic", aspectRatio: "aspect-[2/3]", items: [{ title: "Midjourney Mastery" }, { title: "ChatGPT Marketing" }, { title: "Claude Coding" }], curator: { username: "ai_guru" }, remixCount: 304 },
    { id: 7, title: "Typography Libraries", aspectRatio: "aspect-video", items: [{ title: "Google Fonts" }, { title: "Fontshare" }], curator: { username: "designer" }, remixCount: 65 },
    { id: 8, title: "Machine Learning Math", aspectRatio: "aspect-[4/3]", items: [{ title: "Linear Algebra" }, { title: "Calculus" }], curator: { username: "math_nerd" }, remixCount: 22 },
    { id: 9, title: "Gaming Assets", aspectRatio: "aspect-[3/4]", items: [{ title: "Itch.io" }, { title: "Kenney" }, { title: "OpenGameArt" }], curator: { username: "gamedev" }, remixCount: 419 },
    { id: 10, title: "Y-Combinator Advice", aspectRatio: "aspect-square", items: [{ title: "Do things that don't scale" }], curator: { username: "pg" }, remixCount: 999 },
    { id: 11, title: "React Framer Motion", aspectRatio: "aspect-video", items: [{ title: "Animation Guide" }, { title: "Spring Physics" }], curator: { username: "animator" }, remixCount: 105 },
    { id: 12, title: "Backend Architecture", aspectRatio: "aspect-[4/5]", items: [{ title: "ByteByteGo" }, { title: "System Design" }, { title: "Caching" }], curator: { username: "architect" }, remixCount: 334 },
    { id: 13, title: "Photography Portfolios", aspectRatio: "aspect-[2/3]", items: [{ title: "Peter McKinnon" }, { title: "Vuhlandes" }], curator: { username: "shooter" }, remixCount: 77 },
    { id: 14, title: "Crypto DeFi", aspectRatio: "aspect-[16/9]", items: [{ title: "Uniswap" }, { title: "Aave" }, { title: "Curve" }], curator: { username: "web3" }, remixCount: 21 },
    { id: 15, title: "Vintage Posters", aspectRatio: "aspect-[3/5]", items: [{ title: "Bauhaus" }, { title: "Swiss Style" }, { title: "Art Deco" }], curator: { username: "collector" }, remixCount: 56 },
]

export default function FeedPage() {
    return (
        <div className="min-h-screen bg-surface">
            <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Your Feed</h1>
                    <p className="text-muted-foreground mt-1">Discover what curators are checking out.</p>
                </div>
                <MasonryFeed items={defaultMockItems} />
            </div>
        </div>
    )
}