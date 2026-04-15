import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { FeedItem, Resource } from "@/lib/types";

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export function StacqCard({ item }: { item: FeedItem }) {
  const title = item.title || "Untitled Stacq";
  const stacqItems = item.items || [];
  const thumbnail =
    item.thumbnail ||
    stacqItems[0]?.thumbnail ||
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop";

  const username = item.stacqer?.username || "anonymous";
  const avatar = item.stacqer?.avatar || "";
  const displayName = item.stacqer?.display_name || username;

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
        <ul className="space-y-2 sm:space-y-2.5">
          {stacqItems.slice(0, 3).map((listItem: Resource, i: number) => (
            <li key={i} className="flex items-start gap-2 min-w-0">
              {/* Green dot */}
              <span className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground line-clamp-1 leading-snug">
                  {listItem.title}
                </p>
                {listItem.url && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs text-primary/70 font-medium mt-0.5">
                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    {getDomain(listItem.url)}
                  </span>
                )}
              </div>
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
              {displayName.charAt(0).toUpperCase()}
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
