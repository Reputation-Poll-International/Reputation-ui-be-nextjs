'use client';

import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';
import { getAuthUser } from '@/lib/auth';

export default function ProfilePage() {
  const user = getAuthUser();
  const profileImage = user?.avatar_url || '/images/faces/12.jpg';
  const displayName = user?.name || 'John Doe';
  const displayEmail = user?.email || 'user@bizreputation.ai';

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
                <span className="badge bg-success-transparent text-success">Pro Plan</span>
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
                <span className="fw-semibold">24</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted">Businesses</span>
                <span className="fw-semibold">3</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted">Avg. Score</span>
                <span className="fw-semibold">78</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Member Since</span>
                <span className="fw-semibold">Oct 2025</span>
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
                  <p className="mb-0 fw-medium">+1 (555) 123-4567</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Location</label>
                  <p className="mb-0 fw-medium">San Francisco, CA</p>
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
                  <p className="mb-0 fw-medium">Acme Corp</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Industry</label>
                  <p className="mb-0 fw-medium">Technology</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Company Size</label>
                  <p className="mb-0 fw-medium">51-200 employees</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Website</label>
                  <p className="mb-0 fw-medium">acmecorp.com</p>
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
                    <span className="badge bg-primary me-2">Pro</span>
                    $29/month
                  </p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Renewal Date</label>
                  <p className="mb-0 fw-medium">February 1, 2026</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Audits This Month</label>
                  <p className="mb-0 fw-medium">12 of 50 used</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small">Businesses</label>
                  <p className="mb-0 fw-medium">3 of 5 used</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
