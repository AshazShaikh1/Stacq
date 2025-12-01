import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/api-service';
import { monitoringAlerts } from '@/lib/monitoring/alerts';

/**
 * POST /api/workers/fraud-detection
 * Fraud detection worker - scans for vote spikes, clone spikes, and extension anomalies
 * Should be called periodically (e.g., every hour via GitHub Actions)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is called from an authorized source
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.WORKER_API_KEY;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();
    const results: Record<string, any> = {
      voteSpikes: [],
      cloneSpikes: [],
      extensionAnomalies: [],
      flaggedUsers: [],
    };

    // 1. Detect vote spikes per user
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { data: recentVotes } = await supabase
      .from('votes')
      .select('user_id')
      .gte('created_at', oneHourAgo.toISOString());

    if (recentVotes) {
      // Count votes per user
      const votesPerUser = recentVotes.reduce((acc: Record<string, number>, vote) => {
        acc[vote.user_id] = (acc[vote.user_id] || 0) + 1;
        return acc;
      }, {});

      // Flag users with > 50 votes in the last hour
      for (const [userId, count] of Object.entries(votesPerUser)) {
        if (count > 50) {
          results.voteSpikes.push({ user_id: userId, votes: count });
          results.flaggedUsers.push({ user_id: userId, reason: 'vote_spike', count });
        }
      }
    }

    // 2. Detect clone spikes per user
    const { data: recentClones } = await supabase
      .from('clones')
      .select('cloner_id')
      .gte('created_at', oneHourAgo.toISOString());

    if (recentClones) {
      const clonesPerUser = recentClones.reduce((acc: Record<string, number>, clone) => {
        if (clone.cloner_id) {
          acc[clone.cloner_id] = (acc[clone.cloner_id] || 0) + 1;
        }
        return acc;
      }, {});

      // Flag users with > 10 clones in the last hour
      for (const [userId, count] of Object.entries(clonesPerUser)) {
        if (count > 10) {
          results.cloneSpikes.push({ user_id: userId, clones: count });
          results.flaggedUsers.push({ user_id: userId, reason: 'clone_spike', count });
        }
      }
    }

    // 3. Detect extension anomalies
    // Check for users creating many cards via extension in short time
    const { data: recentCards } = await supabase
      .from('cards')
      .select('created_by, created_at')
      .gte('created_at', oneHourAgo.toISOString());

    if (recentCards) {
      const cardsPerUser = recentCards.reduce((acc: Record<string, number>, card) => {
        acc[card.created_by] = (acc[card.created_by] || 0) + 1;
        return acc;
      }, {});

      // Flag users with > 30 cards in the last hour (extension abuse)
      for (const [userId, count] of Object.entries(cardsPerUser)) {
        if (count > 30) {
          results.extensionAnomalies.push({ user_id: userId, cards: count });
          results.flaggedUsers.push({ user_id: userId, reason: 'extension_anomaly', count });
        }
      }
    }

    // 4. Update flagged users (add to a flag or shadowban if needed)
    if (results.flaggedUsers.length > 0) {
      for (const flagged of results.flaggedUsers) {
        // Log the flag (in production, you might want to store this in a database)
        console.warn(`[FRAUD DETECTION] User ${flagged.user_id} flagged for ${flagged.reason} (count: ${flagged.count})`);
        
        // Optionally, update user's quality_score or add to a flagged_users table
        // For now, we'll just log it
      }
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in fraud detection worker:', error);
    return NextResponse.json(
      { error: 'Failed to run fraud detection' },
      { status: 500 }
    );
  }
}

