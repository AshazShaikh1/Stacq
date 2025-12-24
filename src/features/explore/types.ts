
export interface TrendingItem {
  id: string;
  type: "collection" | "card";
  trendingScore: number;
  metadata?: any;
  [key: string]: any; // Allow loose typing to match current flexible structure
}

export interface TrendingStacqer {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  totalScore: number;
  stats: {
    upvotes_received: number;
    followers_increased: number;
    saves_received: number;
  };
}
