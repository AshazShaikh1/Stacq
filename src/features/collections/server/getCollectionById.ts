import { SupabaseCollectionsRepository } from "../infrastructure/supabase-repository";
import { CollectionDetail } from "../types";

export async function getCollectionById(idOrSlug: string): Promise<CollectionDetail | null> {
  const repository = new SupabaseCollectionsRepository();
  return repository.findByIdOrSlug(idOrSlug);
}
