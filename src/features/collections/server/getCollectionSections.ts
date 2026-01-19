import { SupabaseCollectionsRepository } from "../infrastructure/supabase-repository";
import { Section } from "../types";

export async function getCollectionSections(collectionId: string): Promise<Section[]> {
  const repository = new SupabaseCollectionsRepository();
  return repository.findSections(collectionId);
}
