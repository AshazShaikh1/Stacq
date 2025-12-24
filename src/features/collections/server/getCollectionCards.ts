import { SupabaseCollectionsRepository } from "../infrastructure/supabase-repository";
import { CollectionCard } from "../types";

export async function getCollectionCards(collectionId: string): Promise<CollectionCard[]> {
  const repository = new SupabaseCollectionsRepository();
  return repository.findCards(collectionId);
}
