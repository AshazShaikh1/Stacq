export default function FeedLoading() {
    return (
        <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 md:px-8">
            {/* Header skeleton */}
            <div className="mb-8 sm:mb-10">
                <div className="h-9 w-40 bg-muted rounded-xl animate-pulse mb-2" />
                <div className="h-4 w-60 bg-muted rounded-lg animate-pulse" />
            </div>

            {/* Masonry grid skeleton */}
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 sm:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="break-inside-avoid mb-4 sm:mb-6 rounded-2xl overflow-hidden border border-border bg-background animate-pulse"
                        style={{ animationDelay: `${i * 60}ms` }}
                    >
                        {/* Thumbnail */}
                        <div
                            className="w-full bg-muted"
                            style={{ aspectRatio: i % 3 === 0 ? '1/1' : i % 3 === 1 ? '16/9' : '4/5' }}
                        />
                        {/* Card body */}
                        <div className="p-4 space-y-3">
                            <div className="h-5 bg-muted rounded-lg w-3/4" />
                            <div className="h-3 bg-muted rounded w-full" />
                            <div className="h-3 bg-muted rounded w-5/6" />
                            <div className="h-3 bg-muted rounded w-2/3" />
                            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                                <div className="w-6 h-6 rounded-full bg-muted" />
                                <div className="h-3 w-24 bg-muted rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
