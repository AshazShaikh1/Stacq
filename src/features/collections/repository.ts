import { CollectionDetail, CollectionCard } from "./types";

export interface CollectionsRepository {
  findByIdOrSlug(idOrSlug: string): Promise<CollectionDetail | null>;
  findCards(collectionId: string): Promise<CollectionCard[]>;
}
