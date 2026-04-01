import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2, Repeat } from "lucide-react"

export function StacqCard({ item }: { item?: any }) {
    // Default mock data tailored for empty props
    const stacq = item || {
        title: "Discovering Top Resources",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
        items: [
            { title: "First interesting link" },
            { title: "Another great resource" },
            { title: "A third useful tool" }
        ],
        curator: {
            username: "curator123",
            avatar: ""
        },
    };

    // Safely extract so the UI never breaks
    const title = stacq.title || "Untitled Stacq"
    const thumbnail = stacq.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop"
    const stacqItems = stacq.items || []
    const username = stacq.curator?.username || "anonymous"
    const avatar = stacq.curator?.avatar || ""
    const remixCount = stacq.remixCount || 0

    return (
        <Card className="overflow-hidden transition-all duration-300 hover:-translate-y-1 border-transparent hover:border-primary hover:shadow-lg hover:shadow-primary/5 cursor-pointer">
            <div className={`w-full h-full overflow-hidden bg-muted`}>
                <img
                    src={thumbnail}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            </div>

            <CardHeader className="p-4 pb-2">
                <h3 className="font-bold text-lg leading-tight line-clamp-2">{title}</h3>
            </CardHeader>

            <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                <ul className="space-y-2">
                    {stacqItems.slice(0, 3).map((listItem: any, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-primary/70" />
                            <span className="line-clamp-1">{listItem.title}</span>
                        </li>
                    ))}
                    {stacqItems.length === 0 && (
                        <li className="text-xs italic text-muted-foreground/70">No items available.</li>
                    )}
                </ul>
            </CardContent>

            <CardFooter className="p-4 flex items-center justify-between text-xs text-muted-foreground mt-2 border-t pt-3">
                <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6 border">
                        <AvatarImage src={avatar} />
                        <AvatarFallback className="text-[10px] font-semibold">
                            {username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">@{username}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                    <Repeat className="w-3.5 h-3.5" />
                    <span>{remixCount}</span>
                </div>
            </CardFooter>
        </Card>
    )
}
