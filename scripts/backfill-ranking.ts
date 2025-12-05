/**
 * Backfill Ranking Scores Script
 * Feature flag: ranking/final-algo
 * 
 * Usage:
 *   npm run backfill-ranking [--dry-run] [--item-type=card|collection]
 */

import { createServiceClient } from '../src/lib/supabase/api-service';
import { fullRecomputeWorker, refreshRankingView } from '../src/lib/ranking/worker';

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const itemTypeArg = args.find(arg => arg.startsWith('--item-type='));
  const itemType = itemTypeArg ? itemTypeArg.split('=')[1] as 'card' | 'collection' : undefined;

  console.log('Starting ranking backfill...');
  console.log(`Dry run: ${dryRun}`);
  console.log(`Item type: ${itemType || 'all'}`);

  try {
    const results = await fullRecomputeWorker(itemType || 'card', 30, dryRun);
    
    if (itemType !== 'collection') {
      console.log('\nCard Results:', results);
    }

    if (!itemType || itemType === 'collection') {
      const collectionResults = await fullRecomputeWorker('collection', 30, dryRun);
      console.log('\nCollection Results:', collectionResults);
    }

    if (!dryRun) {
      console.log('\nRefreshing materialized view...');
      await refreshRankingView();
      console.log('Done!');
    } else {
      console.log('\nDry run completed. No changes made to database.');
    }
  } catch (error) {
    console.error('Error during backfill:', error);
    process.exit(1);
  }
}

main();

