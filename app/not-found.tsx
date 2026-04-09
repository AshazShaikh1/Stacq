import Link from "next/link"
import { SearchX } from "lucide-react"

export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center space-y-6">
            <div className="w-20 h-20 bg-surface border border-border flex items-center justify-center rounded-full mb-4">
                <SearchX className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-5xl font-black tracking-tight text-foreground">404</h1>
            <h2 className="text-2xl font-bold text-foreground">Stacq Not Found</h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto font-medium">
                The collection or profile you're looking for doesn't exist, has been deleted, or is set to private.
            </p>
            <div className="pt-4">
                <Link href="/" className="inline-flex items-center justify-center bg-foreground text-background font-bold px-8 py-4 rounded-full hover:bg-foreground/90 transition-colors shadow-lg active:scale-95">
                    Return to Home
                </Link>
            </div>
        </div>
    )
}
