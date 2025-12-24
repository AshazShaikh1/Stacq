import { TrendingItem, TrendingStacqer } from "./types";

export interface ExploreRepository {
  getTodayTrending(): Promise<TrendingItem[]>;
  getTrendingStacqers(): Promise<TrendingStacqer[]>;
  getWeekTrending(): Promise<TrendingItem[]>;
}
