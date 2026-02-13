'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import { getAuthUser } from '@/lib/auth';
import {
  AuditHistoryRecord,
  fetchAuditHistory,
  fetchAuditHistoryItem,
} from '@/lib/reputation';

type DashboardAuditStatus = 'queued' | 'processing' | 'complete' | 'failed' | 'needs_selection';

function mapAuditStatus(status: AuditHistoryRecord['status']): DashboardAuditStatus {
  if (status === 'pending') return 'queued';
  if (status === 'processing') return 'processing';
  if (status === 'success') return 'complete';
  if (status === 'selection_required') return 'needs_selection';
  return 'failed';
}

function statusBadgeClass(status: DashboardAuditStatus): string {
  if (status === 'queued') return 'bg-info-transparent text-info';
  if (status === 'processing') return 'bg-primary-transparent text-primary';
  if (status === 'complete') return 'bg-success-transparent text-success';
  if (status === 'needs_selection') return 'bg-warning-transparent text-warning';
  return 'bg-danger-transparent text-danger';
}

function statusLabel(status: DashboardAuditStatus): string {
  if (status === 'queued') return 'Submitted';
  if (status === 'processing') return 'Processing';
  if (status === 'complete') return 'Complete';
  if (status === 'needs_selection') return 'Needs Selection';
  return 'Failed';
}

function getScoreBadgeClass(score: number) {
  if (score >= 80) return 'bg-success';
  if (score >= 60) return 'bg-primary';
  if (score >= 40) return 'bg-warning';
  return 'bg-danger';
}

function formatDate(value: string | null): string {
  if (!value) return '--';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function extractDomain(website: string | null): string {
  if (!website) return '--';

  try {
    return new URL(website).hostname.replace('www.', '');
  } catch {
    return website;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [records, setRecords] = useState<AuditHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingAuditId, setLoadingAuditId] = useState<number | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      const user = getAuthUser();
      if (!user) {
        setError('No authenticated user found. Sign in to view dashboard.');
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        const response = await fetchAuditHistory({
          user_id: user.id,
          limit: 50,
        });
        setRecords(response.audits);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unable to load dashboard data right now.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboardData();
  }, []);

  const totalAudits = records.length;
  const successfulAudits = useMemo(
    () => records.filter((audit) => mapAuditStatus(audit.status) === 'complete'),
    [records]
  );
  const averageScore = useMemo(() => {
    if (successfulAudits.length === 0) return null;

    const sum = successfulAudits.reduce((acc, audit) => acc + (audit.reputation_score || 0), 0);
    return Math.round(sum / successfulAudits.length);
  }, [successfulAudits]);
  const processingAudits = useMemo(
    () => records.filter((audit) => {
      const mapped = mapAuditStatus(audit.status);
      return mapped === 'queued' || mapped === 'processing';
    }).length,
    [records]
  );
  const failedAudits = useMemo(
    () => records.filter((audit) => mapAuditStatus(audit.status) === 'failed').length,
    [records]
  );
  const recentAudits = useMemo(() => records.slice(0, 5), [records]);

  const handleViewAudit = async (auditId: number) => {
    const user = getAuthUser();
    if (!user) {
      setError('No authenticated user found. Sign in and try again.');
      return;
    }

    try {
      setLoadingAuditId(auditId);
      setError(null);

      const response = await fetchAuditHistoryItem(auditId, { user_id: user.id });
      const scanResponse = response.audit.scan_response;

      if (!scanResponse) {
        setError('This audit does not have a completed scan result yet.');
        return;
      }

      sessionStorage.setItem('auditResults', JSON.stringify(scanResponse));
      router.push('/audit-results');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to open this audit right now.');
      }
    } finally {
      setLoadingAuditId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="page-title fw-bold mb-1">Dashboard</h1>
          <p className="text-muted mb-0">Track AI-driven audits, scoring, and insights in one place.</p>
        </div>
        <Link href="/start-audit" className="btn btn-primary">
          <i className="ri-add-line me-2"></i>New AI Audit
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row mb-4">
        <div className="col-xl-3 col-lg-6 col-md-6">
          <div className="card custom-card">
            <div className="card-body">
              <span className="fs-13 fw-medium text-muted">Total Audits</span>
              <h3 className="fw-bold mb-0 mt-1">{isLoading ? '--' : totalAudits}</h3>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-6 col-md-6">
          <div className="card custom-card">
            <div className="card-body">
              <span className="fs-13 fw-medium text-muted">Avg. Reputation Score</span>
              <h3 className="fw-bold mb-0 mt-1">{isLoading ? '--' : averageScore ?? '--'}</h3>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-6 col-md-6">
          <div className="card custom-card">
            <div className="card-body">
              <span className="fs-13 fw-medium text-muted">Submitted / Processing</span>
              <h3 className="fw-bold mb-0 mt-1">{isLoading ? '--' : processingAudits}</h3>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-6 col-md-6">
          <div className="card custom-card">
            <div className="card-body">
              <span className="fs-13 fw-medium text-muted">Failed Audits</span>
              <h3 className="fw-bold mb-0 mt-1">{isLoading ? '--' : failedAudits}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card custom-card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Recent Audits</h5>
              <Link href="/audit-history" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>Date</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!isLoading && recentAudits.map((audit) => {
                      const mappedStatus = mapAuditStatus(audit.status);
                      const businessName = audit.business_name || 'Unnamed Business';
                      const websiteLabel = extractDomain(audit.website);

                      return (
                        <tr key={audit.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar avatar-sm bg-primary-transparent rounded me-2">
                                <span>{businessName.substring(0, 2).toUpperCase()}</span>
                              </div>
                              <div>
                                <span className="fw-medium">{businessName}</span>
                                <br />
                                <small className="text-muted">{websiteLabel}</small>
                              </div>
                            </div>
                          </td>
                          <td>{formatDate(audit.scan_date || audit.created_at)}</td>
                          <td>
                            {mappedStatus === 'complete' && typeof audit.reputation_score === 'number' ? (
                              <span className={`badge ${getScoreBadgeClass(audit.reputation_score)}`}>
                                {audit.reputation_score}
                              </span>
                            ) : (
                              <span className="text-muted">--</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${statusBadgeClass(mappedStatus)}`}>
                              {statusLabel(mappedStatus)}
                            </span>
                          </td>
                          <td>
                            {mappedStatus === 'complete' ? (
                              <button
                                className="btn btn-sm btn-primary"
                                type="button"
                                onClick={() => handleViewAudit(audit.id)}
                                disabled={loadingAuditId === audit.id}
                              >
                                {loadingAuditId === audit.id ? 'Opening...' : 'View'}
                              </button>
                            ) : (
                              <Link href="/audit-history" className="btn btn-sm btn-outline-primary">
                                Track
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {!isLoading && recentAudits.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          No audits yet. Start your first audit.
                        </td>
                      </tr>
                    )}

                    {isLoading && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          Loading dashboard data...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
