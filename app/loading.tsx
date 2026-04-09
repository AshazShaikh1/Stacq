export default function Loading() {
    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/50 backdrop-blur-sm transition-opacity duration-300">
            <div className="flex flex-col items-center gap-4">
                {/* Minimalist Spinner */}
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin shadow-lg shadow-emerald/20" />
                </div>
                <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase animate-pulse">
                    Filtering the noise...
                </p>
            </div>
        </div>
    )
}
