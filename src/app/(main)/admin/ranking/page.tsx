/**
 * Admin Ranking Page
 * Feature flag: ranking/final-algo
 * 
 * Provides controls for:
 * - Manual recompute triggers
 * - Configuration updates
 * - Feature flag toggle
 * - View top items and stats
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { isFeatureEnabled } from '@/lib/feature-flags';

export default function AdminRankingPage() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            setIsAdmin(data?.role === 'admin');
          });
      }
    });
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadConfig();
      loadStats();
      loadTopItems();
    }
  }, [isAdmin]);

  const loadConfig = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('ranking_config')
      .select('*')
      .order('config_key');

    if (data) {
      const configMap: any = {};
      data.forEach(item => {
        configMap[item.config_key] = item.config_value;
      });
      setConfig(configMap);
    }
  };

  const loadStats = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('ranking_stats')
      .select('*')
      .order('window_end', { ascending: false })
      .limit(10);

    setStats(data || []);
  };

  const loadTopItems = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('ranking_scores')
      .select('*')
      .not('norm_score', 'is', null)
      .order('norm_score', { ascending: false })
      .limit(100);

    setTopItems(data || []);
  };

  const triggerRecompute = async (itemType?: 'card' | 'collection', dryRun: boolean = false) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/workers/ranking/recompute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_type: itemType,
          changed_since_days: 30,
          dry_run: dryRun,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger recompute');
      }

      setMessage({
        type: 'success',
        text: dryRun
          ? `Dry run completed: ${data.succeeded} succeeded, ${data.failed} failed`
          : `Recompute completed: ${data.succeeded} succeeded, ${data.failed} failed`,
      });

      // Reload stats and top items
      loadStats();
      loadTopItems();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to trigger recompute',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (key: string, value: any) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('ranking_config')
        .upsert({
          config_key: key,
          config_value: value,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        }, {
          onConflict: 'config_key',
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Configuration updated successfully' });
      loadConfig();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update configuration',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-page py-section">
        <p>Please sign in to access admin panel.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-page py-section">
        <p>Access denied. Admin role required.</p>
      </div>
    );
  }

  const featureEnabled = isFeatureEnabled('ranking/final-algo');

  return (
    <div className="container mx-auto px-page py-section">
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-jet-dark mb-2">Ranking System Admin</h1>
        <p className="text-body text-gray-muted">
          Manage feed ranking system configuration and triggers
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Feature Flag Status */}
      <Card className="mb-6 p-6">
        <h2 className="text-h2 font-semibold text-jet-dark mb-4">Feature Flag</h2>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-lg ${featureEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {featureEnabled ? 'Enabled' : 'Disabled'}
          </div>
          <p className="text-sm text-gray-muted">
            Set NEXT_PUBLIC_FEATURE_RANKING_FINAL_ALGO=true to enable
          </p>
        </div>
      </Card>

      {/* Manual Recompute */}
      <Card className="mb-6 p-6">
        <h2 className="text-h2 font-semibold text-jet-dark mb-4">Manual Recompute</h2>
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={() => triggerRecompute(undefined, true)}
            disabled={isLoading}
            variant="outline"
          >
            Dry Run (All Types)
          </Button>
          <Button
            onClick={() => triggerRecompute(undefined, false)}
            disabled={isLoading}
            variant="primary"
          >
            Recompute All
          </Button>
          <Button
            onClick={() => triggerRecompute('card', false)}
            disabled={isLoading}
            variant="outline"
          >
            Recompute Cards
          </Button>
          <Button
            onClick={() => triggerRecompute('collection', false)}
            disabled={isLoading}
            variant="outline"
          >
            Recompute Collections
          </Button>
        </div>
      </Card>

      {/* Configuration */}
      {config && (
        <Card className="mb-6 p-6">
          <h2 className="text-h2 font-semibold text-jet-dark mb-4">Configuration</h2>
          <div className="space-y-4">
            {Object.entries(config).map(([key, value]: [string, any]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-light rounded">
                <div>
                  <div className="font-medium text-jet-dark">{key}</div>
                  <div className="text-sm text-gray-muted">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Statistics */}
      {stats && stats.length > 0 && (
        <Card className="mb-6 p-6">
          <h2 className="text-h2 font-semibold text-jet-dark mb-4">Recent Statistics</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-light">
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Window</th>
                  <th className="text-right p-2">Mean</th>
                  <th className="text-right p-2">Stddev</th>
                  <th className="text-right p-2">Count</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat: any) => (
                  <tr key={stat.id} className="border-b border-gray-light">
                    <td className="p-2">{stat.item_type}</td>
                    <td className="p-2 text-gray-muted">
                      {new Date(stat.window_start).toLocaleDateString()} - {new Date(stat.window_end).toLocaleDateString()}
                    </td>
                    <td className="p-2 text-right">{stat.mean_raw_score.toFixed(4)}</td>
                    <td className="p-2 text-right">{stat.stddev_raw_score.toFixed(4)}</td>
                    <td className="p-2 text-right">{stat.item_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Top Items */}
      {topItems.length > 0 && (
        <Card className="p-6">
          <h2 className="text-h2 font-semibold text-jet-dark mb-4">Top 100 Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-light">
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">ID</th>
                  <th className="text-right p-2">Raw Score</th>
                  <th className="text-right p-2">Norm Score</th>
                  <th className="text-left p-2">Last Event</th>
                </tr>
              </thead>
              <tbody>
                {topItems.slice(0, 20).map((item: any) => (
                  <tr key={`${item.item_type}-${item.item_id}`} className="border-b border-gray-light">
                    <td className="p-2">{item.item_type}</td>
                    <td className="p-2 font-mono text-xs">{item.item_id.substring(0, 8)}...</td>
                    <td className="p-2 text-right">{item.raw_score.toFixed(4)}</td>
                    <td className="p-2 text-right">{item.norm_score?.toFixed(4) || 'N/A'}</td>
                    <td className="p-2 text-gray-muted text-xs">
                      {item.last_event_at ? new Date(item.last_event_at).toLocaleString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {topItems.length > 20 && (
              <p className="mt-4 text-sm text-gray-muted">
                Showing top 20 of {topItems.length} items
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

