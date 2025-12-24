
export interface ProfileUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role?: string;
}

export interface ProfileStats {
  collections_created: number;
  collections_saved: number;
  total_upvotes: number;
  total_views: number;
  followers: number;
  following: number;
}

export interface ProfileDetail extends ProfileUser {
  stats: ProfileStats;
}

// Reusing existing types or defining simplified ones for the feed
// Since the feed items can be cards or collections, we use a union type or 'any' if we want to mirror the current loose typing, 
// but let's try to be a bit more specific based on the usage in FeedGrid/ProfileFeedClient.
export interface FeedItem {
  id: string;
  type: "card" | "collection";
  title?: string;
  description?: string | null;
  thumbnail_url?: string | null;
  cover_image_url?: string | null; // Collection specific
  canonical_url?: string | null;
  domain?: string | null;
  upvotes_count?: number | null;
  saves_count?: number | null;
  created_at?: string;
  creator?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  [key: string]: any; // Allow flexibility for now as we consolidate
}
