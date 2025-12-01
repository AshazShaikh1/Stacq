/**
 * Monitoring and Alerting System
 * Detects anomalies and triggers alerts for suspicious activity
 */

interface AlertThreshold {
  cardsPerDay: number;
  votesPerHour: number;
  extensionSavesPerHour: number;
  votesSurgeMultiplier: number; // e.g., 3x average
  extensionSavesSurgeMultiplier: number;
}

interface Alert {
  type: 'cards_per_user' | 'votes_surge' | 'extension_saves_surge';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: Record<string, any>;
  timestamp: Date;
}

// Default thresholds (can be configured via environment variables)
const DEFAULT_THRESHOLDS: AlertThreshold = {
  cardsPerDay: 50, // Alert if user creates more than 50 cards/day
  votesPerHour: 100, // Alert if more than 100 votes/hour globally
  extensionSavesPerHour: 200, // Alert if more than 200 extension saves/hour
  votesSurgeMultiplier: 3, // Alert if votes are 3x the average
  extensionSavesSurgeMultiplier: 3,
};

class MonitoringAlerts {
  private thresholds: AlertThreshold;
  private alerts: Alert[] = [];
  private alertHandlers: ((alert: Alert) => void)[] = [];

  constructor(thresholds?: Partial<AlertThreshold>) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Register an alert handler (e.g., send email, Slack notification, etc.)
   */
  onAlert(handler: (alert: Alert) => void) {
    this.alertHandlers.push(handler);
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(alert: Alert) {
    this.alerts.push(alert);
    
    // Log alert
    console.warn(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`, alert.data);

    // Call all registered handlers
    this.alertHandlers.forEach(handler => {
      try {
        handler(alert);
      } catch (error) {
        console.error('Error in alert handler:', error);
      }
    });

    // In production, you might want to:
    // - Send to Sentry
    // - Send email/Slack notification
    // - Store in database for admin dashboard
  }

  /**
   * Check if a user has exceeded card creation limits
   */
  async checkCardsPerUser(userId: string, cardsCreatedToday: number): Promise<boolean> {
    if (cardsCreatedToday > this.thresholds.cardsPerDay) {
      this.triggerAlert({
        type: 'cards_per_user',
        severity: cardsCreatedToday > this.thresholds.cardsPerDay * 2 ? 'high' : 'medium',
        message: `User ${userId} has created ${cardsCreatedToday} cards today (threshold: ${this.thresholds.cardsPerDay})`,
        data: {
          user_id: userId,
          cards_created: cardsCreatedToday,
          threshold: this.thresholds.cardsPerDay,
        },
        timestamp: new Date(),
      });
      return true;
    }
    return false;
  }

  /**
   * Check for votes surge
   */
  async checkVotesSurge(votesLastHour: number, averageVotesPerHour: number): Promise<boolean> {
    const threshold = averageVotesPerHour * this.thresholds.votesSurgeMultiplier;
    
    if (votesLastHour > this.thresholds.votesPerHour || votesLastHour > threshold) {
      this.triggerAlert({
        type: 'votes_surge',
        severity: votesLastHour > threshold * 2 ? 'critical' : 'high',
        message: `Votes surge detected: ${votesLastHour} votes in the last hour (average: ${averageVotesPerHour.toFixed(1)})`,
        data: {
          votes_last_hour: votesLastHour,
          average_votes_per_hour: averageVotesPerHour,
          threshold: threshold,
        },
        timestamp: new Date(),
      });
      return true;
    }
    return false;
  }

  /**
   * Check for extension saves spike
   */
  async checkExtensionSavesSpike(savesLastHour: number, averageSavesPerHour: number): Promise<boolean> {
    const threshold = averageSavesPerHour * this.thresholds.extensionSavesSurgeMultiplier;
    
    if (savesLastHour > this.thresholds.extensionSavesPerHour || savesLastHour > threshold) {
      this.triggerAlert({
        type: 'extension_saves_surge',
        severity: savesLastHour > threshold * 2 ? 'critical' : 'high',
        message: `Extension saves spike detected: ${savesLastHour} saves in the last hour (average: ${averageSavesPerHour.toFixed(1)})`,
        data: {
          saves_last_hour: savesLastHour,
          average_saves_per_hour: averageSavesPerHour,
          threshold: threshold,
        },
        timestamp: new Date(),
      });
      return true;
    }
    return false;
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 50): Alert[] {
    return this.alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Clear old alerts (older than specified days)
   */
  clearOldAlerts(days: number = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);
  }
}

// Singleton instance
export const monitoringAlerts = new MonitoringAlerts();

/**
 * Helper function to check cards per user (to be called from API routes)
 */
export async function checkUserCardLimit(userId: string, supabase: any): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', userId)
    .gte('created_at', today.toISOString());

  return monitoringAlerts.checkCardsPerUser(userId, count || 0);
}

/**
 * Helper function to check votes surge (to be called from scheduled jobs)
 */
export async function checkVotesSurge(supabase: any): Promise<boolean> {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  // Get votes in last hour
  const { count: votesLastHour } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneHourAgo.toISOString());

  // Calculate average votes per hour (last 24 hours)
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const { count: votesLast24Hours } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', twentyFourHoursAgo.toISOString());

  const averageVotesPerHour = (votesLast24Hours || 0) / 24;

  return monitoringAlerts.checkVotesSurge(votesLastHour || 0, averageVotesPerHour);
}

/**
 * Helper function to check extension saves spike (to be called from scheduled jobs)
 */
export async function checkExtensionSavesSpike(supabase: any): Promise<boolean> {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  // Get extension saves in last hour
  // Note: This assumes you have a way to track extension saves
  // You might need to add a flag or separate table for extension saves
  const { count: savesLastHour } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneHourAgo.toISOString())
    .eq('source', 'extension'); // Assuming you add a 'source' column

  // Calculate average saves per hour (last 24 hours)
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const { count: savesLast24Hours } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', twentyFourHoursAgo.toISOString())
    .eq('source', 'extension');

  const averageSavesPerHour = (savesLast24Hours || 0) / 24;

  return monitoringAlerts.checkExtensionSavesSpike(savesLastHour || 0, averageSavesPerHour);
}

