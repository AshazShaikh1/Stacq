/**
 * Ranking Worker Implementation
 * Feature flag: ranking/final-algo
 * 
 * Handles full recompute and delta updates for ranking scores
 */

import { createServiceClient } from '@/lib/supabase/api-service';
import { computeRawScore, computeNormalizedScore, computeStats, loadConfig, type RankingConfig, type RankingSignals } from './algorithm';

const BATCH_SIZE = 1000;
const NORMALIZATION_WINDOW_DAYS = 7;

/**
 * Full recompute worker - processes all items or items changed in last N days
 */
export async function fullRecomputeWorker(
  itemType: 'card' | 'collection',
  changedSinceDays: number = 30,
  dryRun: boolean = false
): Promise<{ processed: number; succeeded: number; failed: number; errors: string[] }> {
  const supabase = createServiceClient();
  const config = await loadConfig(supabase);

  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Fetch items that need recomputation
    const changedSince = new Date();
    changedSince.setDate(changedSince.getDate() - changedSinceDays);

    let items: any[] = [];
    
    if (itemType === 'card') {
      const { data, error } = await supabase
        .from('cards')
        .select('id, created_at, created_by')
        .eq('status', 'active')
        .gte('created_at', changedSince.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      items = data || [];
    } else {
      const { data, error } = await supabase
        .from('collections')
        .select('id, created_at, owner_id')
        .eq('is_public', true)
        .eq('is_hidden', false)
        .gte('created_at', changedSince.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      items = data || [];
    }

    console.log(`[Ranking Worker] Processing ${items.length} ${itemType}s`);

    // Process in batches
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      
      for (const item of batch) {
        try {
          // Get signals using the database function
          const { data: signalsData, error: signalsError } = await supabase
            .rpc('get_ranking_signals', {
              p_item_type: itemType,
              p_item_id: item.id,
            });

          if (signalsError || !signalsData || signalsData.length === 0) {
            throw new Error(`Failed to fetch signals: ${signalsError?.message || 'No data'}`);
          }

          const signals: RankingSignals = signalsData[0];

          // Compute raw score
          const rawScore = computeRawScore(itemType, signals, config);

          if (!dryRun) {
            // Upsert ranking_scores
            const { error: upsertError } = await supabase
              .from('ranking_scores')
              .upsert({
                item_type: itemType,
                item_id: item.id,
                raw_score: rawScore,
                last_raw_updated: new Date().toISOString(),
              }, {
                onConflict: 'item_type,item_id',
              });

            if (upsertError) {
              throw upsertError;
            }
          }

          results.succeeded++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`${itemType} ${item.id}: ${error.message || 'Unknown error'}`);
          console.error(`[Ranking Worker] Error processing ${itemType} ${item.id}:`, error);
        }

        results.processed++;
      }
    }

    // Normalization pass
    if (!dryRun && results.succeeded > 0) {
      await normalizeScores(supabase, itemType, config);
    }

    console.log(`[Ranking Worker] Completed: ${results.succeeded} succeeded, ${results.failed} failed`);
  } catch (error: any) {
    console.error('[Ranking Worker] Fatal error:', error);
    results.errors.push(`Fatal: ${error.message || 'Unknown error'}`);
  }

  return results;
}

/**
 * Normalize scores for an item type
 */
async function normalizeScores(
  supabase: any,
  itemType: 'card' | 'collection',
  config: RankingConfig
): Promise<void> {
  try {
    // Get recent raw scores for normalization window
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - config.normalizationWindowDays);

    const { data: recentScores, error } = await supabase
      .from('ranking_scores')
      .select('id, raw_score')
      .eq('item_type', itemType)
      .gte('last_raw_updated', windowStart.toISOString());

    if (error) throw error;

    if (!recentScores || recentScores.length === 0) {
      console.log(`[Ranking Worker] No recent scores for ${itemType}, skipping normalization`);
      return;
    }

    const rawScores = recentScores.map((r: any) => r.raw_score);
    const { mean, stddev } = computeStats(rawScores);

    // Store stats
    await supabase
      .from('ranking_stats')
      .upsert({
        item_type: itemType,
        window_start: windowStart.toISOString(),
        window_end: new Date().toISOString(),
        mean_raw_score: mean,
        stddev_raw_score: stddev,
        item_count: recentScores.length,
      }, {
        onConflict: 'item_type,window_start,window_end',
      });

    // Update normalized scores
    for (const score of recentScores) {
      const normScore = computeNormalizedScore(score.raw_score, mean, stddev);

      await supabase
        .from('ranking_scores')
        .update({
          norm_score: normScore,
          last_norm_updated: new Date().toISOString(),
        })
        .eq('id', score.id);
    }

    console.log(`[Ranking Worker] Normalized ${recentScores.length} ${itemType}s (mean: ${mean.toFixed(4)}, stddev: ${stddev.toFixed(4)})`);
  } catch (error) {
    console.error(`[Ranking Worker] Error normalizing ${itemType}:`, error);
    throw error;
  }
}

/**
 * Delta recompute worker - processes a single item after an event
 */
export async function deltaRecomputeWorker(
  itemType: 'card' | 'collection',
  itemId: string,
  debounceSeconds: number = 5
): Promise<void> {
  const supabase = createServiceClient();
  const config = await loadConfig(supabase);

  try {
    // Check if we should debounce (if last update was very recent)
    const { data: existing } = await supabase
      .from('ranking_scores')
      .select('last_raw_updated')
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .single();

    if (existing?.last_raw_updated) {
      const lastUpdate = new Date(existing.last_raw_updated);
      const now = new Date();
      const secondsSinceUpdate = (now.getTime() - lastUpdate.getTime()) / 1000;

      if (secondsSinceUpdate < debounceSeconds) {
        // Too soon, skip (event will be processed later)
        return;
      }
    }

    // Get signals
    const { data: signalsData, error: signalsError } = await supabase
      .rpc('get_ranking_signals', {
        p_item_type: itemType,
        p_item_id: itemId,
      });

    if (signalsError || !signalsData || signalsData.length === 0) {
      throw new Error(`Failed to fetch signals: ${signalsError?.message || 'No data'}`);
    }

    const signals: RankingSignals = signalsData[0];

    // Compute raw score
    const rawScore = computeRawScore(itemType, signals, config);

    // Update ranking_scores
    const { error: upsertError } = await supabase
      .from('ranking_scores')
      .upsert({
        item_type: itemType,
        item_id: itemId,
        raw_score: rawScore,
        last_raw_updated: new Date().toISOString(),
        last_event_at: new Date().toISOString(),
      }, {
        onConflict: 'item_type,item_id',
      });

    if (upsertError) {
      throw upsertError;
    }

    // Note: Normalization is handled by full worker on schedule
    // For near-real-time, we could implement incremental normalization here
  } catch (error) {
    console.error(`[Ranking Worker] Error in delta recompute for ${itemType} ${itemId}:`, error);
    throw error;
  }
}

/**
 * Refresh materialized view
 */
export async function refreshRankingView(): Promise<void> {
  const supabase = createServiceClient();
  
  try {
    const { error } = await supabase.rpc('refresh_explore_ranking_items');
    
    if (error) {
      // Fallback: direct SQL if RPC doesn't exist
      await supabase.rpc('exec_sql', {
        sql: 'REFRESH MATERIALIZED VIEW CONCURRENTLY explore_ranking_items',
      });
    }
  } catch (error) {
    console.error('[Ranking Worker] Error refreshing view:', error);
    // Try non-concurrent refresh as fallback
    try {
      await supabase.rpc('exec_sql', {
        sql: 'REFRESH MATERIALIZED VIEW explore_ranking_items',
      });
    } catch (fallbackError) {
      console.error('[Ranking Worker] Fallback refresh also failed:', fallbackError);
    }
  }
}

