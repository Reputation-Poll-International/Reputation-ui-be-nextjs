'use client';

import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';

interface AuditRecord {
  id: string;
  business: string;
  website: string;
  date: string;
  score: number;
  status: 'complete' | 'pending' | 'failed';
}

const sampleAudits: AuditRecord[] = [
  { id: '1', business: 'Acme Corp', website: 'acmecorp.com', date: 'Jan 2, 2026', score: 85, status: 'complete' },
  { id: '2', business: 'Tech Dynamics', website: 'techdynamics.io', date: 'Dec 28, 2025', score: 72, status: 'complete' },
  { id: '3', business: 'Global Services', website: 'globalservices.net', date: 'Dec 20, 2025', score: 58, status: 'complete' },
  { id: '4', business: 'Acme Corp', website: 'acmecorp.com', date: 'Nov 15, 2025', score: 81, status: 'complete' },
  { id: '5', business: 'Tech Dynamics', website: 'techdynamics.io', date: 'Nov 1, 2025', score: 68, status: 'complete' },
  { id: '6', business: 'Startup Hub', website: 'startuphub.co', date: 'Oct 22, 2025', score: 45, status: 'complete' },
  { id: '7', business: 'Digital Agency', website: 'digitalagency.com', date: 'Oct 10, 2025', score: 0, status: 'failed' },
];

function getScoreBadgeClass(score: number) {
  if (score >= 80) return 'bg-success';
  if (score >= 60) return 'bg-primary';
  if (score >= 40) return 'bg-warning';
  return 'bg-danger';
}

export default function AuditHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredAudits = sampleAudits.filter(audit => {
    const matchesSearch = audit.business.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          audit.website.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || audit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="page-title fw-bold mb-1">Audit History</h1>
          <p className="text-muted mb-0">View and manage your past reputation audits</p>
        </div>
        <Link href="/start-audit" className="btn btn-primary">
          <i className="ri-add-line me-2"></i>New Audit
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
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="complete">Complete</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="col-md-3 text-end">
              <span className="text-muted">{filteredAudits.length} audits found</span>
            </div>
          </div>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAudits.map((audit) => (
                  <tr key={audit.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="avatar avatar-sm bg-primary-transparent rounded me-2">
                          <span>{audit.business.substring(0, 2).toUpperCase()}</span>
                        </div>
                        <div>
                          <span className="fw-medium">{audit.business}</span>
                          <br />
                          <small className="text-muted">{audit.website}</small>
                        </div>
                      </div>
                    </td>
                    <td>{audit.date}</td>
                    <td>
                      {audit.status === 'complete' ? (
                        <span className={`badge ${getScoreBadgeClass(audit.score)}`}>{audit.score}</span>
                      ) : (
                        <span className="text-muted">--</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        audit.status === 'complete' ? 'bg-success-transparent text-success' :
                        audit.status === 'pending' ? 'bg-warning-transparent text-warning' :
                        'bg-danger-transparent text-danger'
                      }`}>
                        {audit.status.charAt(0).toUpperCase() + audit.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      {audit.status === 'complete' ? (
                        <Link href="/audit-results" className="btn btn-sm btn-primary">View</Link>
                      ) : audit.status === 'failed' ? (
                        <button className="btn btn-sm btn-outline-primary">Retry</button>
                      ) : (
                        <span className="text-muted">--</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredAudits.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      No audits found matching your criteria
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
