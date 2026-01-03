'use client';

import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="page-title fw-bold mb-1">Dashboard</h1>
          <p className="text-muted mb-0">Welcome back! Here&apos;s your reputation overview.</p>
        </div>
        <Link href="/start-audit" className="btn btn-primary">
          <i className="ri-add-line me-2"></i>New Audit
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-lg-6 col-md-6">
          <div className="card custom-card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="fs-13 fw-medium text-muted">Total Audits</span>
                  <h3 className="fw-bold mb-0 mt-1">24</h3>
                </div>
                <div className="avatar avatar-lg bg-primary-transparent rounded-circle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256" fill="currentColor">
                    <circle cx="128" cy="128" r="96" opacity="0.2"/>
                    <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
                    <polyline points="128 72 128 128 176 168" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
                  </svg>
                </div>
              </div>
              <div className="mt-3">
                <span className="badge bg-success-transparent text-success">+12%</span>
                <span className="text-muted fs-12 ms-2">vs last month</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-6 col-md-6">
          <div className="card custom-card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="fs-13 fw-medium text-muted">Avg. Reputation Score</span>
                  <h3 className="fw-bold mb-0 mt-1">78</h3>
                </div>
                <div className="avatar avatar-lg bg-success-transparent rounded-circle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z" opacity="0.2"/>
                    <polyline points="88 136 112 160 168 104" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
                    <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
                  </svg>
                </div>
              </div>
              <div className="mt-3">
                <span className="badge bg-success-transparent text-success">+5%</span>
                <span className="text-muted fs-12 ms-2">improvement</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-6 col-md-6">
          <div className="card custom-card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="fs-13 fw-medium text-muted">Businesses Tracked</span>
                  <h3 className="fw-bold mb-0 mt-1">3</h3>
                </div>
                <div className="avatar avatar-lg bg-info-transparent rounded-circle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256" fill="currentColor">
                    <rect x="32" y="80" width="192" height="128" rx="8" opacity="0.2"/>
                    <rect x="32" y="80" width="192" height="128" rx="8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
                    <path d="M168,80V56a16,16,0,0,0-16-16H104A16,16,0,0,0,88,56V80" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
                  </svg>
                </div>
              </div>
              <div className="mt-3">
                <span className="badge bg-primary-transparent text-primary">Active</span>
                <span className="text-muted fs-12 ms-2">all businesses</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-6 col-md-6">
          <div className="card custom-card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="fs-13 fw-medium text-muted">Mentions Found</span>
                  <h3 className="fw-bold mb-0 mt-1">156</h3>
                </div>
                <div className="avatar avatar-lg bg-warning-transparent rounded-circle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M224,128a96,96,0,0,1-144.07,83.11l-49.27,14.08,14.08-49.27A96,96,0,1,1,224,128Z" opacity="0.2"/>
                    <path d="M224,128a96,96,0,0,1-144.07,83.11l-49.27,14.08,14.08-49.27A96,96,0,1,1,224,128Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
                  </svg>
                </div>
              </div>
              <div className="mt-3">
                <span className="badge bg-warning-transparent text-warning">+23</span>
                <span className="text-muted fs-12 ms-2">new this week</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Audits */}
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
                    <tr>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm bg-primary-transparent rounded me-2">
                            <span>AC</span>
                          </div>
                          <div>
                            <span className="fw-medium">Acme Corp</span>
                            <br />
                            <small className="text-muted">acmecorp.com</small>
                          </div>
                        </div>
                      </td>
                      <td>Jan 2, 2026</td>
                      <td><span className="badge bg-success">85</span></td>
                      <td><span className="badge bg-success-transparent text-success">Complete</span></td>
                      <td>
                        <Link href="/audit-results" className="btn btn-sm btn-primary">View</Link>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm bg-info-transparent rounded me-2">
                            <span>TD</span>
                          </div>
                          <div>
                            <span className="fw-medium">Tech Dynamics</span>
                            <br />
                            <small className="text-muted">techdynamics.io</small>
                          </div>
                        </div>
                      </td>
                      <td>Dec 28, 2025</td>
                      <td><span className="badge bg-primary">72</span></td>
                      <td><span className="badge bg-success-transparent text-success">Complete</span></td>
                      <td>
                        <Link href="/audit-results" className="btn btn-sm btn-primary">View</Link>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm bg-warning-transparent rounded me-2">
                            <span>GS</span>
                          </div>
                          <div>
                            <span className="fw-medium">Global Services</span>
                            <br />
                            <small className="text-muted">globalservices.net</small>
                          </div>
                        </div>
                      </td>
                      <td>Dec 20, 2025</td>
                      <td><span className="badge bg-warning">58</span></td>
                      <td><span className="badge bg-success-transparent text-success">Complete</span></td>
                      <td>
                        <Link href="/audit-results" className="btn btn-sm btn-primary">View</Link>
                      </td>
                    </tr>
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
