'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import ReputationCallout from '../components/ReputationCallout';
import { getAuthUser } from '@/lib/auth';
import { fetchUserCurrentPlan, type CurrentPlanResponse } from '@/lib/plans';
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

function formatPaymentMethod(value: string | null): string {
  if (!value) return '--';

  return value
    .split('_')
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(' ');
}

export default function DashboardPage() {
  const router = useRouter();
  const [records, setRecords] = useState<AuditHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [planData, setPlanData] = useState<CurrentPlanResponse | null>(null);
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
        setPlanError(null);

        const [historyResult, planResult] = await Promise.allSettled([
          fetchAuditHistory({
            user_id: user.id,
            limit: 50,
          }),
          fetchUserCurrentPlan({
            user_id: user.id,
          }),
        ]);

        if (historyResult.status === 'fulfilled') {
          setRecords(historyResult.value.audits);
        } else if (historyResult.reason instanceof Error) {
          setError(historyResult.reason.message);
        } else {
          setError('Unable to load dashboard data right now.');
        }

        if (planResult.status === 'fulfilled') {
          setPlanData(planResult.value);
        } else if (planResult.reason instanceof Error) {
          setPlanError(planResult.reason.message);
        } else {
          setPlanError('Unable to load plan usage right now.');
        }
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

  const plansActive = planData?.plans_active;
  const usage = planData?.usage;
  const subscription = planData?.subscription;
  const plan = planData?.plan;

  const auditsRemaining = isLoading
    ? '--'
    : plansActive === true && usage
      ? usage.audits_remaining === null
        ? 'Unlimited'
        : usage.audits_remaining
      : plansActive === false
        ? 'Unlimited'
        : '--';

  const usageProgressPercent =
    plansActive === true && usage?.audits_limit && usage.audits_limit > 0
      ? Math.min(100, Math.round((usage.audits_used / usage.audits_limit) * 100))
      : 0;

  const nearAuditLimit = Boolean(
    plansActive === true &&
      usage &&
      usage.audits_limit !== null &&
      usage.audits_limit > 0 &&
      usage.audits_remaining !== null &&
      usage.audits_remaining <= Math.ceil(usage.audits_limit * 0.2)
  );

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
      <ReputationCallout message="Your business reputation compounds over time. Run audits regularly to catch trust risks early and improve what customers see first." />
      <div className="card custom-card d-lg-none mb-4">
        <div className="card-body">
          <h6 className="fw-semibold mb-2">AI Engine</h6>
          <p className="text-muted mb-3 fs-13">
            Active audits, scoring, sentiment analysis, and recommendations are powered by AI.
          </p>
          <div className="d-flex flex-wrap gap-2">
            <span className="badge bg-primary-transparent text-primary">AI Audit</span>
            <span className="badge bg-primary-transparent text-primary">AI Insights</span>
            <span className="badge bg-primary-transparent text-primary">AI Recommendations</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {planError && (
        <div className="alert alert-warning" role="alert">
          {planError}
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

      <div className="row mb-4">
        <div className="col-xl-6">
          <div className="card custom-card h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Plan Usage</h5>
              <Link href="/pricing" className="btn btn-sm btn-outline-primary">
                Upgrade Plan
              </Link>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <p className="mb-1 text-muted">Audits Remaining</p>
                  <h3 className="fw-bold mb-0">{auditsRemaining}</h3>
                </div>
                {plansActive === true && (
                  <span className="badge bg-primary-transparent text-primary">
                    {usage?.audits_used ?? 0}
                    {usage?.audits_limit === null ? '' : `/${usage?.audits_limit}`} used
                  </span>
                )}
              </div>

              {plansActive === true && usage && usage.audits_limit !== null && (
                <div>
                  <div className="progress progress-sm mb-2">
                    <div
                      className={`progress-bar ${nearAuditLimit ? 'bg-warning' : 'bg-primary'}`}
                      style={{ width: `${usageProgressPercent}%` }}
                      role="progressbar"
                      aria-valuenow={usageProgressPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    ></div>
                  </div>
                  <p className="text-muted mb-0 fs-12">
                    Billing cycle: {usage.period_start} to {usage.period_end}
                  </p>
                </div>
              )}

              {plansActive === false && (
                <p className="text-muted mb-0">
                  Plan restrictions are currently disabled. Audit access is unrestricted.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="col-xl-6 mt-4 mt-xl-0">
          <div className="card custom-card h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Subscription Status</h5>
              <Link href="/profile" className="btn btn-sm btn-outline-primary">
                View Account
              </Link>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-sm-6">
                  <span className="text-muted fs-12 d-block mb-1">Current Plan</span>
                  <span className="fw-semibold">{isLoading ? '--' : plan?.name || '--'}</span>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted fs-12 d-block mb-1">Status</span>
                  <span
                    className={`badge ${
                      subscription?.status === 'active'
                        ? 'bg-success-transparent text-success'
                        : 'bg-warning-transparent text-warning'
                    }`}
                  >
                    {subscription?.status || '--'}
                  </span>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted fs-12 d-block mb-1">Renews On</span>
                  <span className="fw-medium">{formatDate(subscription?.renews_at || null)}</span>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted fs-12 d-block mb-1">Payment Method</span>
                  <span className="fw-medium">{formatPaymentMethod(subscription?.payment_method || null)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {nearAuditLimit && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between" role="alert">
          <span>
            You are close to your monthly audit limit. Upgrade your plan to avoid interruptions.
          </span>
          <Link href="/pricing" className="btn btn-sm btn-warning ms-3">
            Upgrade
          </Link>
        </div>
      )}

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
