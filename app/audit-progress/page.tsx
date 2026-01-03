'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';

interface Step {
  progress: number;
  status: string;
}

const steps: Step[] = [
  { progress: 35, status: 'Gathering online mentions...' },
  { progress: 70, status: 'Analyzing sentiment...' },
  { progress: 100, status: 'Generating reputation report...' },
];

const stepDurations = [2500, 3000, 2500];

export default function AuditProgressPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(35);
  const [status, setStatus] = useState(steps[0].status);
  const [stepsState, setStepsState] = useState<('pending' | 'active' | 'done')[]>(['active', 'pending', 'pending']);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const runStep = (stepIndex: number) => {
      if (stepIndex >= steps.length) {
        setIsComplete(true);
        setStatus('Audit complete. Review your results.');
        return;
      }

      // Set current step as active
      setStepsState(prev => {
        const newState = [...prev];
        if (stepIndex > 0) newState[stepIndex - 1] = 'done';
        newState[stepIndex] = 'active';
        return newState;
      });

      setProgress(steps[stepIndex].progress);
      setStatus(steps[stepIndex].status);
      setCurrentStep(stepIndex);

      // Move to next step after duration
      setTimeout(() => {
        setStepsState(prev => {
          const newState = [...prev];
          newState[stepIndex] = 'done';
          return newState;
        });

        if (stepIndex + 1 < steps.length) {
          runStep(stepIndex + 1);
        } else {
          setIsComplete(true);
          setStatus('Audit complete. Review your results.');
        }
      }, stepDurations[stepIndex]);
    };

    // Start after a short delay
    const timeout = setTimeout(() => runStep(0), 400);
    return () => clearTimeout(timeout);
  }, []);

  const viewResults = () => {
    router.push('/audit-results');
  };

  const stepLabels = [
    { title: 'Gathering online mentions', desc: 'Searching for reviews, articles, and brand mentions.' },
    { title: 'Analyzing sentiment', desc: 'AI-powered sentiment analysis of all mentions.' },
    { title: 'Generating reputation report', desc: 'Creating detailed analysis and recommendations.' },
  ];

  return (
    <DashboardLayout>
      <div className="row justify-content-center">
        <div className="col-xl-7 col-lg-8">
          <div className="card custom-card">
            <div className="card-body p-5">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-3">
                <div>
                  <h1 className="page-title fw-bold mb-1">Running Your Audit</h1>
                  <p className="text-muted mb-0">We are gathering signals across your web presence.</p>
                </div>
                <span className="badge bg-primary-transparent text-primary">Live Scan</span>
              </div>

              <div className="progress progress-animate mb-4" style={{ height: '6px' }}>
                <div
                  className={`progress-bar ${isComplete ? '' : 'progress-bar-striped progress-bar-animated'}`}
                  role="progressbar"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <ul className="audit-progress-steps mb-4">
                {stepLabels.map((step, index) => (
                  <li key={index} className={`audit-step is-${stepsState[index]}`}>
                    <span className="audit-step-icon">
                      <i className="ri-check-line audit-icon-done text-success"></i>
                      <span className="spinner-border spinner-border-sm text-primary audit-icon-active" role="status"></span>
                      <i className="ri-time-line audit-icon-pending text-muted"></i>
                    </span>
                    <div className="flex-fill">
                      <div className="fw-semibold">{step.title}</div>
                      <div className="text-muted fs-12">{step.desc}</div>
                    </div>
                    <span className={`badge audit-step-badge ${
                      stepsState[index] === 'done' ? 'bg-success-transparent text-success' :
                      stepsState[index] === 'active' ? 'bg-primary-transparent text-primary' :
                      'bg-light text-muted'
                    }`}>
                      {stepsState[index] === 'done' ? 'Complete' :
                       stepsState[index] === 'active' ? 'In progress' : 'Pending'}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2">
                <div className="text-muted fs-13">{status}</div>
                {isComplete && (
                  <button onClick={viewResults} className="btn btn-primary btn-sm">
                    View Results
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
