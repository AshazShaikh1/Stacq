export default function ProfileLoading() {
    return (
        <div className="min-h-screen bg-surface animate-pulse">
            {/* Header skeleton */}
            <div className="bg-background border-b border-border">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-12 md:py-16">
                    <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start md:items-center">
                        {/* Avatar */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-muted shrink-0" />

                        {/* Name & bio */}
                        <div className="flex-1 space-y-3 min-w-0">
                            <div className="h-9 w-56 bg-muted rounded-xl" />
                            <div className="h-5 w-32 bg-muted rounded-lg" />
                            <div className="h-4 w-full max-w-md bg-muted rounded-lg" />
                            <div className="h-4 w-5/6 bg-muted rounded-lg" />
                        </div>
                    </div>

                    {/* Stats row skeleton */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:flex gap-8 md:gap-16 mt-10 py-6 border-t border-border/50">
                        {['Collections', 'Resources', 'Followers'].map((label) => (
                            <div key={label} className="space-y-2">
                                <div className="h-10 w-16 bg-muted rounded-xl" />
                                <div className="h-3 w-20 bg-muted rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Masonry skeleton */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-12">
                <div className="h-7 w-48 bg-muted rounded-xl mb-6 sm:mb-8" />
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 sm:gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="break-inside-avoid mb-4 sm:mb-6 rounded-2xl overflow-hidden border border-border bg-background"
                            style={{ animationDelay: `${i * 80}ms` }}
                        >
                            <div className="w-full aspect-square bg-muted" />
                            <div className="p-4 space-y-2">
                                <div className="h-5 w-3/4 bg-muted rounded-lg" />
                                <div className="h-3 w-full bg-muted rounded" />
                                <div className="h-3 w-5/6 bg-muted rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
