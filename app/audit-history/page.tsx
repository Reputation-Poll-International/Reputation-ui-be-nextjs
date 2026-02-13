'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import {
  AuditHistoryRecord,
  ReputationCandidate,
  ReputationScanRequest,
  fetchAuditHistory,
  fetchAuditHistoryItem,
} from '@/lib/reputation';

type FilterStatus = 'all' | 'queued' | 'running' | 'complete' | 'failed' | 'needs_selection';

function getScoreBadgeClass(score: number) {
  if (score >= 80) return 'bg-success';
  if (score >= 60) return 'bg-primary';
  if (score >= 40) return 'bg-warning';
  return 'bg-danger';
}

function mapStatus(status: AuditHistoryRecord['status']): Exclude<FilterStatus, 'all'> {
  if (status === 'pending') return 'queued';
  if (status === 'processing') return 'running';
  if (status === 'success') return 'complete';
  if (status === 'selection_required') return 'needs_selection';
  return 'failed';
}

function statusBadgeClass(status: Exclude<FilterStatus, 'all'>): string {
  if (status === 'queued') return 'bg-info-transparent text-info';
  if (status === 'running') return 'bg-primary-transparent text-primary';
  if (status === 'complete') return 'bg-success-transparent text-success';
  if (status === 'needs_selection') return 'bg-warning-transparent text-warning';
  return 'bg-danger-transparent text-danger';
}

function statusLabel(status: Exclude<FilterStatus, 'all'>): string {
  if (status === 'queued') return 'Submitted';
  if (status === 'running') return 'Processing';
  if (status === 'complete') return 'Complete';
  if (status === 'needs_selection') return 'Needs Selection';
  return 'Failed';
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

export default function AuditHistoryPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [records, setRecords] = useState<AuditHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queueNotice, setQueueNotice] = useState<string | null>(null);
  const [loadingAuditId, setLoadingAuditId] = useState<number | null>(null);

  const loadHistory = useCallback(async (silent = false) => {
    const user = getAuthUser();
    if (!user) {
      if (!silent) {
        setError('No authenticated user found. Sign in to view audit history.');
        setIsLoading(false);
      }
      return;
    }

    try {
      if (!silent) {
        setIsLoading(true);
      }
      setError(null);
      const response = await fetchAuditHistory({
        user_id: user.id,
        limit: 100,
      });
      setRecords(response.audits);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to load audit history right now.');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadHistory(false);

    const pollId = setInterval(() => {
      void loadHistory(true);
    }, 10000); // Poll every 10 seconds for updates

    return () => clearInterval(pollId);
  }, [loadHistory]);

  useEffect(() => {
    const rawNotice = sessionStorage.getItem('auditQueueNotice');
    if (!rawNotice) return;

    try {
      const parsed = JSON.parse(rawNotice) as { message?: string };
      setQueueNotice(parsed.message || 'Your audit has started successfully.');
    } catch {
      setQueueNotice('Your audit has started successfully.');
    } finally {
      sessionStorage.removeItem('auditQueueNotice');
    }
  }, []);

  const filteredAudits = useMemo(() => {
    return records.filter((audit) => {
      const mappedStatus = mapStatus(audit.status);
      const matchesStatus = statusFilter === 'all' || mappedStatus === statusFilter;

      const business = (audit.business_name || '').toLowerCase();
      const website = (audit.website || '').toLowerCase();
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch = term === '' || business.includes(term) || website.includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [records, searchTerm, statusFilter]);

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

  const handleResolveSelection = async (auditId: number) => {
    const user = getAuthUser();
    if (!user) {
      setError('No authenticated user found. Sign in and try again.');
      return;
    }

    try {
      setLoadingAuditId(auditId);
      setError(null);

      const response = await fetchAuditHistoryItem(auditId, { user_id: user.id });
      const audit = response.audit;
      const responsePayload = (audit.response_payload || {}) as Record<string, unknown>;
      const requestPayload = (audit.request_payload || null) as ReputationScanRequest | null;
      const rawCandidates = responsePayload.candidates;

      if (!requestPayload || !Array.isArray(rawCandidates) || rawCandidates.length === 0) {
        setError('Unable to restore this selection. Start a new audit to continue.');
        return;
      }

      const candidates = rawCandidates as ReputationCandidate[];
      const message =
        typeof responsePayload.message === 'string'
          ? responsePayload.message
          : 'Select your business, or click Continue without Google Business Profile if your business is not listed.';

      sessionStorage.setItem(
        'auditSelectionContext',
        JSON.stringify({
          audit_id: auditId,
          message,
          candidates,
          pending_payload: {
            ...requestPayload,
            audit_id: auditId,
          },
          created_at: new Date().toISOString(),
        })
      );

      router.push('/start-audit');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to open selection flow right now.');
      }
    } finally {
      setLoadingAuditId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="page-title fw-bold mb-1">Audit History</h1>
          <p className="text-muted mb-0">Review your completed and in-progress AI audit analyses</p>
        </div>
        <Link href="/start-audit" className="btn btn-primary">
          <i className="ri-add-line me-2"></i>New AI Audit
        </Link>
      </div>

      <div className="card custom-card">
        <div className="card-header">
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Search by business or website..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              >
                <option value="all">All Status</option>
                <option value="queued">Submitted</option>
                <option value="running">Processing</option>
                <option value="complete">Complete</option>
                <option value="needs_selection">Needs Selection</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="col-md-3 text-end">
              <span className="text-muted">{filteredAudits.length} audits found</span>
            </div>
          </div>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {queueNotice && (
            <div className="alert alert-success" role="alert">
              {queueNotice}
            </div>
          )}

          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading && filteredAudits.map((audit) => {
                  const mappedStatus = mapStatus(audit.status);
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
                        ) : mappedStatus === 'queued' ? (
                          <button className="btn btn-sm btn-outline-info" type="button" disabled>
                            Submitted
                          </button>
                        ) : mappedStatus === 'running' ? (
                          <button className="btn btn-sm btn-outline-primary" type="button" disabled>
                            Processing
                          </button>
                        ) : mappedStatus === 'needs_selection' ? (
                          <button
                            className="btn btn-sm btn-outline-warning"
                            type="button"
                            onClick={() => handleResolveSelection(audit.id)}
                            disabled={loadingAuditId === audit.id}
                          >
                            {loadingAuditId === audit.id ? 'Opening...' : 'Resolve'}
                          </button>
                        ) : (
                          <Link href="/start-audit" className="btn btn-sm btn-outline-primary">
                            Retry
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {!isLoading && filteredAudits.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      No audits found matching your criteria
                    </td>
                  </tr>
                )}

                {isLoading && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      Loading audit history...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
