
export interface CardCreator {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface CardDetail {
  id: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  canonical_url: string | null;
  domain: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  upvotes_count: number | null;
  saves_count: number | null;
  status: string;
  is_public: boolean;
  metadata: any;
  note?: string | null;
  creator: CardCreator | null;
}

export interface RelatedCard {
  id: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  canonical_url: string | null;
  domain: string | null;
  upvotes_count: number | null;
  saves_count: number | null;
  created_by: string | null;
  creator: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}
