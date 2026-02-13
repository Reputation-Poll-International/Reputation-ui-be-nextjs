'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import { getAuthUser } from '@/lib/auth';
import { fetchUserPaymentHistory, type PaymentHistoryRecord } from '@/lib/plans';

function formatDateTime(value: string | null): string {
  if (!value) return '--';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatAmount(amount: number, currency: string): string {
  const normalizedCurrency = (currency || 'USD').toUpperCase();

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalizedCurrency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${normalizedCurrency}`;
  }
}

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<PaymentHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      const user = getAuthUser();
      if (!user) {
        setError('No authenticated user found. Sign in to view payment history.');
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        const response = await fetchUserPaymentHistory({
          user_id: user.id,
          limit: 100,
        });
        setPayments(response.payments);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unable to load payment history right now.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadHistory();
  }, []);

  const totals = useMemo(() => {
    const paid = payments.filter((item) => item.status === 'paid');
    const totalPaid = paid.reduce((sum, item) => sum + item.amount, 0);

    return {
      count: payments.length,
      paidCount: paid.length,
      totalPaid,
    };
  }, [payments]);

  return (
    <DashboardLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="page-title fw-bold mb-1">Payment History</h1>
          <p className="text-muted mb-0">All plan payments with date and time.</p>
        </div>
        <Link href="/pricing" className="btn btn-outline-primary">
          <i className="ri-arrow-left-line me-1"></i>Back to Plans
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row mb-4">
        <div className="col-xl-4 col-md-6">
          <div className="card custom-card">
            <div className="card-body">
              <span className="text-muted fs-12">Total Transactions</span>
              <h4 className="fw-semibold mb-0 mt-1">{isLoading ? '--' : totals.count}</h4>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-6">
          <div className="card custom-card">
            <div className="card-body">
              <span className="text-muted fs-12">Paid Transactions</span>
              <h4 className="fw-semibold mb-0 mt-1">{isLoading ? '--' : totals.paidCount}</h4>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-6">
          <div className="card custom-card">
            <div className="card-body">
              <span className="text-muted fs-12">Total Paid</span>
              <h4 className="fw-semibold mb-0 mt-1">{isLoading ? '--' : formatAmount(totals.totalPaid, 'USD')}</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="card custom-card">
        <div className="card-header">
          <h5 className="card-title mb-0">Payments</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Interval</th>
                  <th>Expires On</th>
                  <th>Status</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading &&
                  payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{formatDateTime(payment.paid_at || payment.created_at)}</td>
                      <td>{payment.plan?.name || '--'}</td>
                      <td>{formatAmount(payment.amount, payment.currency)}</td>
                      <td className="text-capitalize">{payment.billing_interval || '--'}</td>
                      <td>{formatDateTime(payment.entitlement_expires_at)}</td>
                      <td>
                        <span
                          className={`badge ${
                            payment.status === 'paid'
                              ? 'bg-success-transparent text-success'
                              : payment.status === 'pending'
                                ? 'bg-warning-transparent text-warning'
                                : 'bg-danger-transparent text-danger'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td>{payment.provider_session_id || payment.provider_transaction_id || '--'}</td>
                    </tr>
                  ))}

                {!isLoading && payments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      No payments found.
                    </td>
                  </tr>
                )}

                {isLoading && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      Loading payment history...
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
