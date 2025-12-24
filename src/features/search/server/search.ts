import { SupabaseSearchRepository } from "../infrastructure/supabase-repository";

export async function search(
  query: string,
  type: "all" | "collections" | "cards" | "users" = "all",
  limit: number = 20,
  offset: number = 0
) {
  const repository = new SupabaseSearchRepository();
  return repository.search(query, type, limit, offset);
}
