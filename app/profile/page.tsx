'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';
import { fetchProfile, getAuthUser, type AuthUser } from '@/lib/auth';
import { fetchUserCurrentPlan, type CurrentPlanResponse } from '@/lib/plans';
import { fetchAuditHistory, type AuditHistoryRecord } from '@/lib/reputation';

function formatDate(value: string | null): string {
  if (!value) return '--';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPaymentMethod(value: string | null): string {
  if (!value) return '--';

  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatPlanPrice(data: CurrentPlanResponse | null): string {
  const plan = data?.plan;
  const billingInterval = data?.subscription?.billing_interval === 'annual' ? 'annual' : 'monthly';
  if (!plan) return '--';
  if (plan.contact_sales) return plan.pricing_label || 'Contact Sales';

  const price = billingInterval === 'annual' ? plan.price_yearly : plan.price_monthly;
  if (price === 0) return 'Free';

  return billingInterval === 'annual' ? `$${price}/year` : `$${price}/month`;
}

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [records, setRecords] = useState<AuditHistoryRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [planData, setPlanData] = useState<CurrentPlanResponse | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const currentUser = getAuthUser();
      if (!currentUser) {
        setError('No authenticated user found. Sign in to view your profile.');
        return;
      }

      setUser(currentUser);

      try {
        setPlanError(null);
        const [latestProfile, history] = await Promise.all([
          fetchProfile(currentUser.id),
          fetchAuditHistory({ user_id: currentUser.id, limit: 200 }),
        ]);

        setUser(latestProfile);
        setRecords(history.audits);

        try {
          const currentPlan = await fetchUserCurrentPlan({ user_id: currentUser.id });
          setPlanData(currentPlan);
        } catch (planErr) {
          if (planErr instanceof Error) {
            setPlanError(planErr.message);
          } else {
            setPlanError('Unable to load subscription details right now.');
          }
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unable to load profile data right now.');
        }
      }
    };

    void loadData();
  }, []);

  const profileImage = user?.avatar_url || '/images/faces/12.jpg';
  const displayName = user?.name || '--';
  const displayEmail = user?.email || '--';
  const displayPhone = user?.phone || '--';
  const displayLocation = user?.location || '--';
  const displayCompany = user?.company || '--';
  const displayIndustry = user?.industry || '--';
  const displayCompanySize = user?.company_size || '--';
  const displayWebsite = user?.website || '--';

  const accountStats = useMemo(() => {
    const totalAudits = records.length;

    const businessSet = new Set(
      records
        .map((audit) => (audit.business_name || '').trim().toLowerCase())
        .filter((name) => name.length > 0)
    );

    const completedAudits = records.filter(
      (audit) => audit.status === 'success' && typeof audit.reputation_score === 'number'
    );

    const avgScore =
      completedAudits.length > 0
        ? Math.round(
            completedAudits.reduce((sum, audit) => sum + (audit.reputation_score || 0), 0) /
              completedAudits.length
          )
        : null;

    return {
      totalAudits,
      businesses: businessSet.size,
      avgScore,
    };
  }, [records]);

  const memberSince = (() => {
    if (!user?.created_at) return '--';

    const date = new Date(user.created_at);
    if (Number.isNaN(date.getTime())) return '--';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  })();

  const planName =
    planData?.plan?.name || (planData?.plans_active === false ? 'Flexible Access' : '--');
  const subscriptionStatus = planData?.subscription?.status || '--';
  const usage = planData?.usage;
  const auditUsageLabel =
    !planData
      ? '--'
      : !planData.plans_active || !usage
        ? 'Unlimited access'
        : usage.audits_limit === null
          ? `${usage.audits_used} used (unlimited)`
          : `${usage.audits_used} of ${usage.audits_limit} used`;
  const concurrentUsageLabel =
    !planData
      ? '--'
      : !planData.plans_active || !usage
        ? 'No enforced limit'
        : `${usage.concurrent_running} of ${usage.concurrent_allowed} running`;

  return (
    <DashboardLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="page-title fw-bold mb-1">My Profile</h1>
          <p className="text-muted mb-0">View and manage your account information</p>
        </div>
        <Link href="/profile-settings" className="btn btn-primary">
          <i className="ri-settings-3-line me-2"></i>Edit Profile
        </Link>
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

      <div className="row">
        <div className="col-lg-4">
          {/* Profile Card */}
          <div className="card custom-card">
            <div className="card-body text-center p-5">
              <div className="avatar avatar-xxl rounded-circle mx-auto mb-3" style={{ width: '120px', height: '120px' }}>
                <img src={profileImage} alt="Profile" className="rounded-circle w-100 h-100" style={{ objectFit: 'cover' }} />
              </div>
              <h4 className="fw-semibold mb-1">{displayName}</h4>
              <p className="text-muted mb-3">{displayEmail}</p>
              <span className="badge bg-success-transparent text-success">{planName}</span>
            </div>
          </div>

          {/* Account Stats */}
          <div className="card custom-card">
            <div className="card-header">
              <h5 className="card-title mb-0">Account Stats</h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted">Total Audits</span>
                <span className="fw-semibold">{accountStats.totalAudits}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted">Businesses</span>
                <span className="fw-semibold">{accountStats.businesses}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted">Avg. Score</span>
                <span className="fw-semibold">{accountStats.avgScore ?? '--'}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Member Since</span>
                <span className="fw-semibold">{memberSince}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          {/* Personal Information */}
          <div className="card custom-card">
            <div className="card-header">
              <h5 className="card-title mb-0">Personal Information</h5>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label text-muted small">Full Name</label>
                  <p className="mb-0 fw-medium">{displayName}</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Email Address</label>
                  <p className="mb-0 fw-medium">{displayEmail}</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Phone Number</label>
                  <p className="mb-0 fw-medium">{displayPhone}</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Location</label>
                  <p className="mb-0 fw-medium">{displayLocation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="card custom-card">
            <div className="card-header">
              <h5 className="card-title mb-0">Company Information</h5>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label text-muted small">Company Name</label>
                  <p className="mb-0 fw-medium">{displayCompany}</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Industry</label>
                  <p className="mb-0 fw-medium">{displayIndustry}</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Company Size</label>
                  <p className="mb-0 fw-medium">{displayCompanySize}</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Website</label>
                  <p className="mb-0 fw-medium">{displayWebsite}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Details */}
          <div className="card custom-card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Subscription Details</h5>
              <Link href="/pricing" className="btn btn-sm btn-outline-primary">Upgrade</Link>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label text-muted small">Current Plan</label>
                  <p className="mb-0 fw-medium">
                    <span className="badge bg-primary me-2">{planName}</span>
                    {formatPlanPrice(planData)}
                  </p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Renewal Date</label>
                  <p className="mb-0 fw-medium">{formatDate(planData?.subscription?.renews_at || null)}</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Audits This Month</label>
                  <p className="mb-0 fw-medium">{auditUsageLabel}</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Concurrent Audits</label>
                  <p className="mb-0 fw-medium">{concurrentUsageLabel}</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Payment Method</label>
                  <p className="mb-0 fw-medium">{formatPaymentMethod(planData?.subscription?.payment_method || null)}</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Subscription Status</label>
                  <p className="mb-0 fw-medium text-capitalize">{subscriptionStatus}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
