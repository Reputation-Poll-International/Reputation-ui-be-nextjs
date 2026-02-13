'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import { ReputationCandidate, ReputationScanRequest, scanReputation } from '@/lib/reputation';

interface Step {
  status: string;
}

const steps: Step[] = [
  { status: 'Gathering online mentions...' },
  { status: 'Analyzing sentiment and themes...' },
  { status: 'Generating AI reputation report...' },
];

const stepLabels = [
  { title: 'Gathering online mentions', desc: 'Searching for reviews, articles, and brand mentions.' },
  { title: 'Analyzing sentiment', desc: 'AI-powered sentiment analysis of all mentions.' },
  { title: 'Generating reputation report', desc: 'Building recommendations and executive summary.' },
];

function getProgressStep(progress: number): number {
  if (progress >= 70) return 2;
  if (progress >= 40) return 1;
  return 0;
}

function getStepState(step: number, complete = false): ('pending' | 'active' | 'done')[] {
  if (complete) return ['done', 'done', 'done'];

  return [0, 1, 2].map((index) => {
    if (index < step) return 'done';
    if (index === step) return 'active';
    return 'pending';
  }) as ('pending' | 'active' | 'done')[];
}

function normalizeStoredRequest(raw: string | null): ReputationScanRequest | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ReputationScanRequest;
    if (!parsed || typeof parsed !== 'object') return null;

    return parsed;
  } catch {
    return null;
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Audit failed due to an unexpected error. Please try again.';
}

export default function AuditProgressPage() {
  const router = useRouter();
  const [runId, setRunId] = useState(0);
  const [progress, setProgress] = useState(12);
  const [status, setStatus] = useState(steps[0].status);
  const [stepsState, setStepsState] = useState<('pending' | 'active' | 'done')[]>(['active', 'pending', 'pending']);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [selectionMessage, setSelectionMessage] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ReputationCandidate[]>([]);
  const [pendingRequest, setPendingRequest] = useState<ReputationScanRequest | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isResolvingSelection, setIsResolvingSelection] = useState(false);

  useEffect(() => {
    const requestPayload = normalizeStoredRequest(sessionStorage.getItem('auditRequest'));

    if (!requestPayload) {
      setError('No audit request found. Start a new audit first.');
      setIsRunning(false);
      setStatus('Audit request missing.');
      return;
    }

    let isCancelled = false;
    let visualTimer: ReturnType<typeof setInterval> | null = null;

    setError(null);
    setSelectionMessage(null);
    setCandidates([]);
    setPendingRequest(null);
    setSelectedPlaceId(null);
    setIsRunning(true);
    setIsComplete(false);
    setProgress(12);
    setStatus(steps[0].status);
    setStepsState(['active', 'pending', 'pending']);

    const updateVisualProgress = () => {
      setProgress((previous) => {
        const nextProgress = Math.min(previous + 8, 90);
        const step = getProgressStep(nextProgress);

        setStepsState(getStepState(step));
        setStatus(steps[step].status);

        return nextProgress;
      });
    };

    visualTimer = setInterval(updateVisualProgress, 1800);

    const runAudit = async () => {
      try {
        const response = await scanReputation(requestPayload);
        if (isCancelled) return;

        if (response.status === 'selection_required') {
          sessionStorage.setItem('auditCandidates', JSON.stringify(response.candidates));
          sessionStorage.setItem('auditPendingRequest', JSON.stringify(requestPayload));

          setSelectionMessage(response.message);
          setCandidates(response.candidates);
          setPendingRequest(requestPayload);
          setSelectedPlaceId(response.candidates[0]?.place_id ?? null);
          setStatus('Business profile selection required. Choose the Google Business Profile that matches your business.');
          setProgress(35);
          setStepsState(['active', 'pending', 'pending']);
          setIsRunning(false);
          return;
        }

        sessionStorage.setItem('auditResults', JSON.stringify(response));
        setStepsState(getStepState(2, true));
        setProgress(100);
        setStatus('Audit complete. Review your results.');
        setIsComplete(true);
      } catch (err) {
        if (isCancelled) return;

        setError(toErrorMessage(err));
        setStatus('Audit failed. Please retry.');
      } finally {
        if (!isCancelled) {
          setIsRunning(false);
        }

        if (visualTimer) {
          clearInterval(visualTimer);
        }
      }
    };

    runAudit();

    return () => {
      isCancelled = true;
      if (visualTimer) {
        clearInterval(visualTimer);
      }
    };
  }, [runId]);

  const viewResults = () => {
    router.push('/audit-results');
  };

  const retryAudit = () => {
    setRunId((prev) => prev + 1);
  };

  const handleContinueScan = async (requestPayload: ReputationScanRequest) => {
    setError(null);
    setIsResolvingSelection(true);
    setIsRunning(true);
    setStatus('Continuing scan with selected business...');
    setProgress(55);
    setStepsState(['done', 'active', 'pending']);

    try {
      const response = await scanReputation(requestPayload);

      if (response.status === 'selection_required') {
        setSelectionMessage(response.message);
        setCandidates(response.candidates);
        setPendingRequest(requestPayload);
        setSelectedPlaceId(response.candidates[0]?.place_id ?? null);
        setStatus('Business profile selection required. Choose the Google Business Profile that matches your business.');
        setIsRunning(false);
        return;
      }

      sessionStorage.removeItem('auditCandidates');
      sessionStorage.removeItem('auditPendingRequest');
      sessionStorage.setItem('auditResults', JSON.stringify(response));
      setStepsState(['done', 'done', 'done']);
      setProgress(100);
      setStatus('Audit complete. Review your results.');
      setIsComplete(true);
      setSelectionMessage(null);
      setCandidates([]);
      setPendingRequest(null);
    } catch (err) {
      setError(toErrorMessage(err));
      setStatus('Audit failed. Please retry.');
    } finally {
      setIsRunning(false);
      setIsResolvingSelection(false);
    }
  };

  const continueWithSelectedBusiness = async () => {
    if (!pendingRequest) {
      setError('Missing pending audit request. Restart the audit.');
      return;
    }

    if (!selectedPlaceId) {
      setError('Select the Google Business Profile that matches your business before continuing.');
      return;
    }

    await handleContinueScan({
      ...pendingRequest,
      place_id: selectedPlaceId,
      skip_places: false,
    });
  };

  const continueWithoutGooglePlaces = async () => {
    if (!pendingRequest) {
      setError('Missing pending audit request. Restart the audit.');
      return;
    }

    await handleContinueScan({
      ...pendingRequest,
      place_id: undefined,
      skip_places: true,
    });
  };

  const goToStartAudit = () => {
    router.push('/start-audit');
  };

  return (
    <DashboardLayout>
      <div className="row justify-content-center">
        <div className="col-xl-7 col-lg-8">
          <div className="card custom-card">
            <div className="card-body p-5">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-3">
                <div>
                  <h1 className="page-title fw-bold mb-1">Running Your Audit</h1>
                  <p className="text-muted mb-0">We are processing your request with the AI reputation engine.</p>
                </div>
                <span className="badge bg-primary-transparent text-primary">
                  {isComplete ? 'Completed' : 'Live Scan'}
                </span>
              </div>

              <div className="progress progress-animate mb-4" style={{ height: '6px' }}>
                <div
                  className={`progress-bar ${isComplete || error ? '' : 'progress-bar-striped progress-bar-animated'}`}
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
                    <span
                      className={`badge audit-step-badge ${
                        stepsState[index] === 'done'
                          ? 'bg-success-transparent text-success'
                          : stepsState[index] === 'active'
                            ? 'bg-primary-transparent text-primary'
                            : 'bg-light text-muted'
                      }`}
                    >
                      {stepsState[index] === 'done'
                        ? 'Complete'
                        : stepsState[index] === 'active'
                          ? 'In progress'
                          : 'Pending'}
                    </span>
                  </li>
                ))}
              </ul>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {selectionMessage && candidates.length > 0 && (
                <div className="card border mb-3">
                  <div className="card-body">
                    <h6 className="fw-semibold mb-2">Select Your Google Business Profile</h6>
                    <p className="text-muted mb-3">{selectionMessage}</p>

                    <div className="d-flex flex-column gap-2 mb-3">
                      {candidates.map((candidate, index) => {
                        const inputId = `candidate-${index}`;
                        const placeId = candidate.place_id ?? '';
                        const isSelected = placeId !== '' && selectedPlaceId === placeId;

                        return (
                          <label
                            key={`${candidate.place_id ?? 'candidate'}-${index}`}
                            htmlFor={inputId}
                            className={`border rounded p-3 ${isSelected ? 'border-primary' : ''}`}
                          >
                            <div className="form-check">
                              <input
                                id={inputId}
                                className="form-check-input"
                                type="radio"
                                name="place-selection"
                                value={placeId}
                                checked={isSelected}
                                onChange={() => setSelectedPlaceId(placeId || null)}
                              />
                              <div className="form-check-label ms-2">
                                <div className="fw-semibold">{candidate.name || 'Unnamed business'}</div>
                                <div className="text-muted fs-12">{candidate.address || 'No address available'}</div>
                                <div className="text-muted fs-12">
                                  Rating: {candidate.rating ?? '--'} | Reviews: {candidate.review_count ?? '--'}
                                </div>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={continueWithSelectedBusiness}
                        disabled={isResolvingSelection || !selectedPlaceId}
                      >
                        {isResolvingSelection ? 'Continuing...' : 'Use Selected Profile'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={continueWithoutGooglePlaces}
                        disabled={isResolvingSelection}
                      >
                        Google Business Not Found
                      </button>
                    </div>
                    <p className="text-muted fs-12 mt-3 mb-0">
                      After you continue, we&apos;ll email you when your audit is complete.
                    </p>
                  </div>
                </div>
              )}

              <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2">
                <div className="text-muted fs-13">{status}</div>
                <div className="d-flex gap-2">
                  {error && !selectionMessage && (
                    <>
                      <button onClick={goToStartAudit} className="btn btn-outline-secondary btn-sm" type="button">
                        Back to Start Audit
                      </button>
                      <button onClick={retryAudit} className="btn btn-outline-primary btn-sm" type="button" disabled={isRunning}>
                        Retry
                      </button>
                    </>
                  )}
                  {isComplete && !error && (
                    <button onClick={viewResults} className="btn btn-primary btn-sm" type="button">
                      View Results
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
