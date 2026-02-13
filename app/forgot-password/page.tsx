'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setResetUrl(null);

    try {
      setIsSubmitting(true);
      const response = await forgotPassword(email);

      setSuccess('If that email exists, we generated a reset link.');
      if (response.resetUrl) {
        setResetUrl(response.resetUrl);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to process request right now.');
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

                <h3 className="text-center fw-semibold mb-1">Forgot Password</h3>
                <p className="text-center text-muted fs-14 mb-4">Enter your email to receive a reset link</p>

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

                  {resetUrl && (
                    <div className="alert alert-info py-2" role="alert">
                      Dev reset link: <a href={resetUrl}>{resetUrl}</a>
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-medium">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-wave w-100 mb-3" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Reset Link'}
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

