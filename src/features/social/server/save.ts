import { SupabaseSocialRepository } from "../infrastructure/supabase-repository";

export async function toggleSave(
  userId: string,
  targetType: string,
  targetId: string,
  metadata?: { collectionId?: string; cardId?: string; stackId?: string }
) {
  const repository = new SupabaseSocialRepository();
  return repository.toggleSave(userId, targetType, targetId, metadata);
}

export async function getUserSaves(userId: string, limit: number, offset: number) {
  const repository = new SupabaseSocialRepository();
  return repository.getUserSaves(userId, limit, offset);
}
