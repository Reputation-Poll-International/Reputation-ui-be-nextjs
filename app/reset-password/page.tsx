'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { resetPassword } from '@/lib/auth';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setIsSubmitting(true);
      await resetPassword({
        email,
        token,
        password,
        password_confirmation: confirmPassword,
      });

      setSuccess('Password reset successful. You can now sign in.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to reset password right now.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="row align-items-center justify-content-center min-vh-100">
          <div className="col-xl-4 col-lg-5 col-md-6 col-sm-8">
            <div className="card custom-card border-0 shadow-lg">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <Link href="/login" className="header-logo">
                    <img src="/images/brand-logos/desktop-logo.png" alt="BizReputation AI" className="img-fluid" style={{ maxWidth: '150px' }} />
                  </Link>
                </div>

                <h3 className="text-center fw-semibold mb-1">Reset Password</h3>
                <p className="text-center text-muted fs-14 mb-4">Set a new password for your account</p>

                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="alert alert-danger py-2" role="alert">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="alert alert-success py-2" role="alert">
                      {success}
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-medium">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="token" className="form-label fw-medium">Reset Token</label>
                    <input
                      type="text"
                      className="form-control"
                      id="token"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-medium">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label fw-medium">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-wave w-100 mb-3" disabled={isSubmitting}>
                    {isSubmitting ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>

                <div className="text-center">
                  <p className="text-muted">Back to <Link href="/login" className="text-primary fw-medium">Sign In</Link></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

