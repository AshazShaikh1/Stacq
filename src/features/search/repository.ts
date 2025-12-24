import { SearchResults } from "./types";

export interface SearchRepository {
  search(
    query: string,
    type: "all" | "collections" | "cards" | "users",
    limit: number,
    offset: number
  ): Promise<SearchResults>;
}
