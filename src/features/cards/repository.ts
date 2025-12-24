import { CardDetail, RelatedCard } from "./types";

export interface CardRepository {
  findById(id: string): Promise<CardDetail | null>;
  findRelated(card: CardDetail): Promise<RelatedCard[]>;
}
