import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { FeedItem, Resource } from "@/lib/types";

export function StacqCard({ item }: { item: FeedItem }) {
  const title = item.title || "Untitled Stacq";
  const stacqItems = item.items || [];
  const thumbnail =
    item.thumbnail ||
    stacqItems[0]?.thumbnail ||
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop";

  const username = item.stacqer?.username || "anonymous";
  const avatar = item.stacqer?.avatar || "";
  const remixCount = item.remixCount || 0;

  return (
    <Card className="overflow-hidden transition-all duration-300 md:hover:-translate-y-1 border-border/50 md:border-transparent md:hover:border-primary active:scale-[0.98] md:active:scale-100 hover:shadow-xl hover:shadow-primary/10 cursor-pointer bg-background group">
      <div className="w-full overflow-hidden bg-muted relative aspect-video">
        <Image
          src={thumbnail}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      <CardHeader className="p-3 sm:p-4 pb-2">
        <h3 className="font-bold text-base sm:text-lg leading-tight line-clamp-2">
          {title}
        </h3>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 pt-0 text-xs sm:text-sm text-muted-foreground">
        <ul className="space-y-1.5 sm:space-y-2">
          {stacqItems.slice(0, 3).map((listItem: Resource, i: number) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 mt-0.5 text-primary/70" />

              <span className="line-clamp-1">{listItem.title}</span>
            </li>
          ))}

          {stacqItems.length === 0 && (
            <li className="text-[10px] sm:text-xs italic text-muted-foreground/70">
              No items available.
            </li>
          )}
        </ul>
      </CardContent>

      <CardFooter className="p-3 sm:p-4 flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground mt-2 border-t pt-3">
        <div className="flex items-center gap-2">
          <Avatar className="w-5 h-5 sm:w-6 sm:h-6 border">
            <AvatarImage src={avatar} />
            <AvatarFallback className="text-[9px] sm:text-[10px] font-semibold">
              {username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-none">
            @{username}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
