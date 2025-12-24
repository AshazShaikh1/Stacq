import { SupabaseSocialRepository } from "../infrastructure/supabase-repository";

export async function toggleVote(userId: string, targetType: string, targetId: string) {
  const repository = new SupabaseSocialRepository();
  return repository.toggleVote(userId, targetType, targetId);
}
