/**
 * Ranking Algorithm Implementation
 * Feature flag: ranking/final-algo
 * 
 * Implements the production feed ranking pipeline for Cards and Collections
 */

export interface RankingConfig {
  // Weights
  cardWeights: {
    w_u: number; // upvotes
    w_s: number; // saves
    w_c: number; // comments
    w_v: number; // visits
  };
  collectionWeights: {
    w_u: number;
    w_s: number;
    w_c: number;
    w_v: number;
  };
  // Half-lives in hours
  cardHalfLifeHours: number;
  collectionHalfLifeHours: number;
  // Promotion multiplier base
  promotionMultiplier: number;
  // Normalization window in days
  normalizationWindowDays: number;
  // Default creator quality (0-100)
  defaultCreatorQuality: number;
  // Abuse penalty floor
  abusePenaltyFloor: number;
}

export interface RankingSignals {
  upvotes_count: number;
  saves_count: number;
  comments_count: number;
  visits_count: number;
  age_hours: number;
  creator_quality: number;
  promotion_boost: number;
  abuse_factor: number;
}

export interface RankingResult {
  raw_score: number;
  norm_score: number | null;
}

const LN2 = Math.log(2);
const EPSILON = 0.0001;

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: RankingConfig = {
  cardWeights: {
    w_u: 1.0,
    w_s: 2.0,
    w_c: 2.5,
    w_v: 1.5,
  },
  collectionWeights: {
    w_u: 0.8,
    w_s: 3.0,
    w_c: 2.0,
    w_v: 0.5,
  },
  cardHalfLifeHours: 48,
  collectionHalfLifeHours: 168,
  promotionMultiplier: 0.5,
  normalizationWindowDays: 7,
  defaultCreatorQuality: 30,
  abusePenaltyFloor: 0.01,
};

/**
 * Compute raw score for an item
 */
export function computeRawScore(
  itemType: 'card' | 'collection',
  signals: RankingSignals,
  config: RankingConfig = DEFAULT_CONFIG
): number {
  const weights = itemType === 'card' ? config.cardWeights : config.collectionWeights;
  const halfLifeHours = itemType === 'card' ? config.cardHalfLifeHours : config.collectionHalfLifeHours;

  // Base formula: w_u * ln(1 + U) + w_s * ln(1 + S) + w_c * ln(1 + C) + w_v * ln(1 + V)
  const base =
    weights.w_u * Math.log(1 + signals.upvotes_count) +
    weights.w_s * Math.log(1 + signals.saves_count) +
    weights.w_c * Math.log(1 + signals.comments_count) +
    weights.w_v * Math.log(1 + signals.visits_count);

  // Age factor: exp(-lambda * age_hours)
  // lambda = ln(2) / half_life_hours
  const lambda = LN2 / halfLifeHours;
  const ageFactor = Math.exp(-lambda * signals.age_hours);

  // Creator factor: 1 + (Q / 100)
  const creatorFactor = 1 + (signals.creator_quality / 100);

  // Promotion factor: 1 + P (if promoted)
  const promoFactor = 1 + (signals.promotion_boost > 0 ? config.promotionMultiplier : 0);

  // Abuse factor (already in signals, clamped to floor)
  const abuseFactor = Math.max(signals.abuse_factor, config.abusePenaltyFloor);

  // Final raw score
  const rawScore = base * creatorFactor * promoFactor * ageFactor * abuseFactor;

  return rawScore;
}

/**
 * Compute normalized score (z-score)
 */
export function computeNormalizedScore(
  rawScore: number,
  mean: number,
  stddev: number
): number {
  if (stddev < EPSILON) {
    // Avoid divide-by-zero, return raw score
    return rawScore;
  }
  return (rawScore - mean) / stddev;
}

/**
 * Compute mean and standard deviation from an array of raw scores
 */
export function computeStats(rawScores: number[]): { mean: number; stddev: number } {
  if (rawScores.length === 0) {
    return { mean: 0, stddev: 0 };
  }

  const mean = rawScores.reduce((sum, score) => sum + score, 0) / rawScores.length;
  
  const variance = rawScores.reduce((sum, score) => {
    const diff = score - mean;
    return sum + diff * diff;
  }, 0) / rawScores.length;

  const stddev = Math.sqrt(variance);

  return { mean, stddev };
}

/**
 * Load configuration from database or use defaults
 */
export async function loadConfig(supabase: any): Promise<RankingConfig> {
  try {
    const config: RankingConfig = { ...DEFAULT_CONFIG };

    // Load card weights
    const { data: cardWeights } = await supabase
      .from('ranking_config')
      .select('config_value')
      .eq('config_key', 'card_weights')
      .single();

    if (cardWeights?.config_value) {
      config.cardWeights = cardWeights.config_value;
    }

    // Load collection weights
    const { data: collectionWeights } = await supabase
      .from('ranking_config')
      .select('config_value')
      .eq('config_key', 'collection_weights')
      .single();

    if (collectionWeights?.config_value) {
      config.collectionWeights = collectionWeights.config_value;
    }

    // Load other config values
    const configKeys = [
      'card_half_life_hours',
      'collection_half_life_hours',
      'promotion_multiplier',
      'normalization_window_days',
      'default_creator_quality',
      'abuse_penalty_floor',
    ];

    for (const key of configKeys) {
      const { data } = await supabase
        .from('ranking_config')
        .select('config_value')
        .eq('config_key', key)
        .single();

      if (data?.config_value) {
        const value = typeof data.config_value === 'string' 
          ? parseFloat(data.config_value) 
          : data.config_value;
        
        switch (key) {
          case 'card_half_life_hours':
            config.cardHalfLifeHours = value;
            break;
          case 'collection_half_life_hours':
            config.collectionHalfLifeHours = value;
            break;
          case 'promotion_multiplier':
            config.promotionMultiplier = value;
            break;
          case 'normalization_window_days':
            config.normalizationWindowDays = value;
            break;
          case 'default_creator_quality':
            config.defaultCreatorQuality = value;
            break;
          case 'abuse_penalty_floor':
            config.abusePenaltyFloor = value;
            break;
        }
      }
    }

    return config;
  } catch (error) {
    console.error('Error loading ranking config, using defaults:', error);
    return DEFAULT_CONFIG;
  }
}

