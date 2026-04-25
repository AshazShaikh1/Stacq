export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio?: string | null;
  twitter?: string | null;
  github?: string | null;
  website?: string | null;
  social_links?: { platform: string; url: string }[] | null;
  followers_count?: number;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  thumbnail: string | null;
  note: string | null;
  section: string | null;
  order_index: number | null;
  stacq_id: string;
  user_id: string;
}

export interface Stacq {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  thumbnail: string | null;
  user_id: string;
  section_order: string[] | null;
  is_public: boolean; // true = visible to everyone, false = owner-only
  profiles?: Profile | Profile[]; // Supabase returns differently based on .single() or .select()
  resources?: Resource[];
}

export interface FeedItem {
  id: string;
  slug: string;
  title: string;
  aspectRatio?: string;
  thumbnail: string | null | undefined;
  items?: Resource[];
  stacqer: {
    username: string;
    avatar: string | null | undefined;
    display_name?: string | null;
  };
  remixCount: number;
}
