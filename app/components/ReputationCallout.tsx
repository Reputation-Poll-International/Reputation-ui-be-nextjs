'use client';

interface ReputationCalloutProps {
  message: string;
  className?: string;
}

export default function ReputationCallout({ message, className = '' }: ReputationCalloutProps) {
  return (
    <div className={`alert alert-primary-transparent text-primary border-0 mb-4 ${className}`} role="note">
      <div className="d-flex align-items-start gap-2">
        <i className="ri-shield-check-line fs-5 mt-1" aria-hidden="true"></i>
        <p className="mb-0 fw-medium">{message}</p>
      </div>
    </div>
  );
}
