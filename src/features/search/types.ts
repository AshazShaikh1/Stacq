
export interface SearchResultItem {
  id: string;
  [key: string]: any;
}

export interface CollectionSearchResult extends SearchResultItem {
  title: string;
  description: string | null;
  cover_image_url: string | null;
  owner_id: string;
  slug: string;
  owner: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface CardSearchResult extends SearchResultItem {
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  canonical_url: string;
  domain: string;
}

export interface UserSearchResult extends SearchResultItem {
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export interface SearchResults {
  collections: CollectionSearchResult[];
  cards: CardSearchResult[];
  users: UserSearchResult[];
  total: number;
}
