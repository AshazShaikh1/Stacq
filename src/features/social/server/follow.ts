import { SupabaseSocialRepository } from "../infrastructure/supabase-repository";

export async function toggleFollow(followerId: string, followingId: string) {
  const repository = new SupabaseSocialRepository();
  return repository.toggleFollow(followerId, followingId);
}

export async function unfollowUser(followerId: string, followingId: string) {
  const repository = new SupabaseSocialRepository();
  return repository.unfollowUser(followerId, followingId);
}

export async function getFollowStatus(currentUserId: string | null, targetUserId: string) {
  const repository = new SupabaseSocialRepository();
  return repository.getFollowStatus(currentUserId, targetUserId);
}

export async function getFollowers(userId: string) {
  const repository = new SupabaseSocialRepository();
  return repository.getFollowers(userId);
}

export async function getFollowing(userId: string) {
  const repository = new SupabaseSocialRepository();
  return repository.getFollowing(userId);
}
