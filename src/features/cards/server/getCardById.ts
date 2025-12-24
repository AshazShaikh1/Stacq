import { SupabaseCardRepository } from "../infrastructure/supabase-repository";
import { CardDetail } from "../types";

export async function getCardById(id: string): Promise<CardDetail | null> {
  const repository = new SupabaseCardRepository();
  return repository.findById(id);
}
