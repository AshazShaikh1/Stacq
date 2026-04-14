export default function StacqDetailLoading() {
    return (
        <div className="max-w-4xl mx-auto p-6 md:p-12 pb-24 md:pb-12 space-y-8 min-h-screen animate-pulse">
            {/* Category badge + title */}
            <div className="space-y-4 mb-10">
                <div className="h-6 w-28 bg-muted rounded-full" />
                <div className="h-12 w-3/4 bg-muted rounded-xl" />
                <div className="h-12 w-1/2 bg-muted rounded-xl" />
                <div className="mt-4 h-20 w-full max-w-2xl bg-muted rounded-2xl" />
            </div>

            {/* Creator bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-6 border-y border-border gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted shrink-0" />
                    <div className="space-y-1.5">
                        <div className="h-4 w-28 bg-muted rounded" />
                        <div className="h-3 w-16 bg-muted rounded" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="h-10 w-24 bg-muted rounded-full" />
                    <div className="h-10 w-24 bg-muted rounded-full" />
                </div>
            </div>

            {/* Resource list */}
            <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex flex-col sm:flex-row rounded-3xl overflow-hidden border border-border bg-background"
                        style={{ animationDelay: `${i * 100}ms` }}
                    >
                        <div className="w-full sm:w-44 aspect-video sm:aspect-square bg-muted shrink-0" />
                        <div className="flex-1 p-4 sm:p-6 space-y-3">
                            <div className="h-5 w-3/4 bg-muted rounded-lg" />
                            <div className="h-4 w-full bg-muted rounded" />
                            <div className="h-4 w-5/6 bg-muted rounded" />
                            <div className="h-9 w-32 bg-muted rounded-full mt-auto" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
