import { Bookmark } from "lucide-react"

export default function SavedLoading() {
    return (
        <section className="max-w-7xl mx-auto min-h-screen bg-surface px-4 sm:px-6 lg:px-8 animate-pulse">
            {/* Header */}
            <div className="flex flex-col gap-2 py-6 sm:py-8 pb-4">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-muted rounded-xl sm:rounded-2xl w-11 h-11 sm:w-12 sm:h-12" />
                    <div className="space-y-1.5">
                        <div className="h-7 w-36 bg-muted rounded-lg" />
                        <div className="h-3.5 w-52 bg-muted rounded" />
                    </div>
                </div>
            </div>

            {/* Masonry grid skeleton */}
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="break-inside-avoid mb-4 sm:mb-6 rounded-2xl overflow-hidden border border-border bg-background"
                        style={{ animationDelay: `${i * 70}ms` }}
                    >
                        <div
                            className="w-full bg-muted"
                            style={{ aspectRatio: i % 2 === 0 ? '16/9' : '1/1' }}
                        />
                        <div className="p-4 space-y-2">
                            <div className="h-5 w-3/4 bg-muted rounded-lg" />
                            <div className="h-3 w-full bg-muted rounded" />
                            <div className="h-3 w-2/3 bg-muted rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}
