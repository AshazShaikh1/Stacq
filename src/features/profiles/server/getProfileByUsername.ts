import { SupabaseProfilesRepository } from "../infrastructure/supabase-repository";
import { ProfileUser } from "../types";

export async function getProfileByUsername(username: string): Promise<ProfileUser | null> {
  const repository = new SupabaseProfilesRepository();
  return repository.findByUsername(username);
}
