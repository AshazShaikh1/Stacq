import { Card } from "@/components/ui/card"
import { ExternalLink, Quote } from "lucide-react"

export interface ResourceItem {
    title: string;
    url: string;
    thumbnail?: string;
    note?: string;
}

export function ResourceCard({ resource }: { resource?: ResourceItem }) {
    // Apply safe defaults for robust rendering
    const item = resource || {
        title: "Tailwind CSS Documentation",
        url: "https://tailwindcss.com",
        thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
        note: "This is my go-to utility framework for absolutely everything. Check out the typography plugin specifically for beautiful text defaults!"
    }

    const { title, url, thumbnail, note } = item;

    // Securely format domain
    const getDomain = (link: string) => {
        try {
            return new URL(link).hostname.replace('www.', '')
        } catch {
            return link
        }
    }

    return (
        <Card className="flex flex-col sm:flex-row overflow-hidden bg-slate-50 hover:bg-primary/5 transition-colors duration-300 border-border group shadow-sm">
            {/* Left Side: Thumbnail / Site Preview */}
            <div className="w-full sm:w-40 md:w-48 shrink-0 aspect-video sm:aspect-square bg-white border-b sm:border-b-0 sm:border-r border-border overflow-hidden">
                <img 
                    src={thumbnail}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
            </div>

            {/* Right Side: Content */}
            <div className="flex flex-col flex-1 p-5 sm:p-6 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                    <div className="space-y-1.5 flex-1 pr-4">
                        <h3 className="font-bold text-lg md:text-xl text-foreground leading-tight line-clamp-1">{title}</h3>
                        <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors line-clamp-1 inline-flex items-center gap-1.5 px-1 py-0.5 -ml-1 rounded-md"
                        >
                            {getDomain(url)}
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                    
                    <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center h-9 px-6 text-sm font-medium bg-white hover:bg-primary border border-primary/30 text-primary hover:text-primary-foreground shadow-sm transition-all rounded-full cursor-pointer"
                    >
                        Visit
                    </a>
                </div>

                <div className="mt-auto pt-4 border-t border-border/60">
                    <div className="flex gap-3 items-start p-1.5">
                        <Quote className="w-5 h-5 text-primary shrink-0 mt-0.5 fill-primary/10" />
                        <p className="text-sm md:text-base italic text-slate-600 leading-relaxed font-medium">
                            {note}
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    )
}
