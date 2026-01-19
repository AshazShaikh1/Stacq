import { SupabaseCollectionsRepository } from "../infrastructure/supabase-repository";
import { CollectionDetail } from "../types";

export async function getRelatedCollections(collectionId: string): Promise<CollectionDetail[]> {
  const repository = new SupabaseCollectionsRepository();
  return repository.findRelatedCollections(collectionId);
}
