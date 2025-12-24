
export interface CollectionOwner {
  username: string;
  display_name: string;
  avatar_url: string;
}

export interface CollectionTag {
  tag: {
    id: string;
    name: string;
  };
}

export interface CollectionDetail {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  is_public: boolean;
  is_hidden: boolean;
  owner_id: string;
  slug?: string;
  owner: CollectionOwner | CollectionOwner[];
  tags: CollectionTag[];
  stats: any;
  created_at?: string;
}

export interface CollectionCard {
  id: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  canonical_url: string | null;
  domain: string | null;
  upvotes_count: number | null;
  saves_count: number | null;
  created_by: string | null;
  created_at: string;
  creator: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  addedBy?: string;
  type: "card";
}
