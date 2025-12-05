'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Report {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  data: any;
  status: 'open' | 'resolved' | 'dismissed';
  created_at: string;
  reporter?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

interface ReportsListProps {
  initialReports: Report[];
  initialStatus: string;
}

export function ReportsList({ initialReports, initialStatus }: ReportsListProps) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [status, setStatus] = useState(initialStatus);
  const [updating, setUpdating] = useState<string | null>(null);

  const updateReportStatus = async (reportId: string, newStatus: 'resolved' | 'dismissed') => {
    setUpdating(reportId);
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update report');
      }

      // Remove from list if status changed
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Failed to update report');
    } finally {
      setUpdating(null);
    }
  };

  const getTargetLink = (report: Report) => {
    switch (report.target_type) {
      case 'collection':
      case 'stack': // Legacy support
        return `/collection/${report.target_id}`;
      case 'card':
        // Cards don't have a direct page, link to search or parent collection
        return `/search?q=${encodeURIComponent(report.target_id)}&type=cards`;
      case 'comment':
        // Comments are on collection pages, would need to fetch parent
        return '#';
      case 'user':
        return `/profile/${report.target_id}`;
      default:
        return '#';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (reports.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-h2 font-semibold text-jet-dark mb-2">
          No {status} reports
        </h2>
        <p className="text-body text-gray-muted">
          All reports have been reviewed
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id} className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* Report Header */}
              <div className="flex items-center gap-3 mb-3">
                {report.reporter?.avatar_url ? (
                  <Image
                    src={report.reporter.avatar_url}
                    alt={report.reporter.display_name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-jet/20 flex items-center justify-center text-xs font-semibold text-jet">
                    {report.reporter?.display_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <div className="text-body font-semibold text-jet-dark">
                    {report.reporter?.display_name || 'Unknown User'}
                  </div>
                  <div className="text-small text-gray-muted">
                    @{report.reporter?.username || 'unknown'} • {formatDate(report.created_at)}
                  </div>
                </div>
              </div>

              {/* Report Details */}
              <div className="mb-3">
                <div className="inline-block px-2 py-1 bg-jet/10 rounded-full text-small font-medium text-jet-dark mb-2">
                  {report.target_type}
                </div>
                <p className="text-body text-jet-dark mb-2">
                  <span className="font-semibold">Reason:</span> {report.reason}
                </p>
                {report.data && Object.keys(report.data).length > 0 && (
                  <div className="text-small text-gray-muted">
                    <pre className="whitespace-pre-wrap bg-gray-light p-2 rounded text-xs">
                      {JSON.stringify(report.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Target Link */}
              <Link
                href={getTargetLink(report)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-small text-jet hover:underline"
              >
                View {report.target_type} →
              </Link>
            </div>

            {/* Actions */}
            {report.status === 'open' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateReportStatus(report.id, 'resolved')}
                  disabled={updating === report.id}
                >
                  {updating === report.id ? '...' : 'Resolve'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateReportStatus(report.id, 'dismissed')}
                  disabled={updating === report.id}
                >
                  {updating === report.id ? '...' : 'Dismiss'}
                </Button>
              </div>
            )}

            {report.status !== 'open' && (
              <div className="px-3 py-1 bg-gray-light rounded-full text-small text-gray-muted">
                {report.status}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

