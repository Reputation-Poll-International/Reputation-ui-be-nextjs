'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import ReputationCallout from '../components/ReputationCallout';
import { ReputationCandidate, ReputationScanRequest, scanReputation } from '@/lib/reputation';
import { getAuthUser } from '@/lib/auth';

interface FormData {
  website: string;
  business_name: string;
  phone: string;
  location: string;
  industry: string;
}

interface StoredSelectionContext {
  message?: string;
  candidates?: ReputationCandidate[];
  pending_payload?: ReputationScanRequest;
}

const SELECTION_MESSAGE =
  'Select your business, or click Continue without Google Business Profile if your business is not listed.';

function normalizeWebsite(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export default function StartAuditPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectionMessage, setSelectionMessage] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ReputationCandidate[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [pendingPayload, setPendingPayload] = useState<ReputationScanRequest | null>(null);
  const [formData, setFormData] = useState<FormData>({
    website: '',
    business_name: '',
    phone: '',
    location: '',
    industry: '',
  });

  useEffect(() => {
    const rawContext = sessionStorage.getItem('auditSelectionContext');
    if (!rawContext) {
      return;
    }

    try {
      const parsed = JSON.parse(rawContext) as StoredSelectionContext;
      const restoredCandidates = Array.isArray(parsed.candidates)
        ? parsed.candidates.filter((candidate) => candidate && typeof candidate === 'object')
        : [];

      const restoredPayload = parsed.pending_payload && typeof parsed.pending_payload === 'object'
        ? parsed.pending_payload
        : null;

      if (restoredCandidates.length > 0 && restoredPayload) {
        setSelectionMessage(SELECTION_MESSAGE);
        setCandidates(restoredCandidates);
        setPendingPayload(restoredPayload);
        setSelectedPlaceId(restoredPayload.place_id || restoredCandidates[0]?.place_id || null);
        setCurrentStep(2);

        setFormData({
          website: restoredPayload.website || '',
          business_name: restoredPayload.business_name || '',
          phone: restoredPayload.phone || '',
          location: restoredPayload.location || '',
          industry: restoredPayload.industry || '',
        });
      }
    } catch {
      // Ignore invalid stored context and start fresh.
    } finally {
      sessionStorage.removeItem('auditSelectionContext');
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildScanPayload = (): ReputationScanRequest => {
    const website = normalizeWebsite(formData.website);
    const authUser = getAuthUser();
    const payload: ReputationScanRequest = {
      skip_places: false,
    };

    if (authUser?.id) payload.user_id = authUser.id;
    if (website) payload.website = website;
    if (formData.business_name.trim()) payload.business_name = formData.business_name.trim();
    if (formData.phone.trim()) payload.phone = formData.phone.trim();
    if (formData.location.trim()) payload.location = formData.location.trim();
    if (formData.industry.trim()) payload.industry = formData.industry.trim();

    return payload;
  };

  const validateStep1 = () => {
    setFormError(null);

    const website = normalizeWebsite(formData.website);
    const hasWebsite = website.length > 0;
    const hasBusinessName = formData.business_name.trim().length > 0;
    const hasPhone = formData.phone.trim().length > 0;
    const hasLocation = formData.location.trim().length > 0;

    if (!hasWebsite && !hasBusinessName && !(hasPhone && hasLocation)) {
      setFormError('Provide business name, or website, or both phone and location to continue.');
      return false;
    }

    if (hasPhone && !hasLocation) {
      setFormError('Location is required when a phone number is provided.');
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (!validateStep1()) return;
    setCurrentStep(2);
  };

  const previousStep = () => {
    setCurrentStep(1);
  };

  const handleQueuedAudit = (auditId: number, message: string) => {
    sessionStorage.setItem(
      'auditQueueNotice',
      JSON.stringify({
        audit_id: auditId,
        message,
        created_at: new Date().toISOString(),
      })
    );

    setCandidates([]);
    setSelectionMessage(null);
    setPendingPayload(null);
    setSelectedPlaceId(null);

    router.push('/audit-history');
  };

  const runAuditRequest = async (payload: ReputationScanRequest) => {
    const response = await scanReputation(payload);

    if (response.status === 'selection_required') {
      setSelectionMessage(SELECTION_MESSAGE);
      setCandidates(response.candidates);
      setPendingPayload({
        ...payload,
        audit_id: response.audit_id ?? payload.audit_id,
      });
      setSelectedPlaceId(response.candidates[0]?.place_id ?? null);
      return;
    }

    if (response.status === 'queued') {
      handleQueuedAudit(response.audit_id, response.message);
      return;
    }

    if (response.status === 'success') {
      sessionStorage.setItem('auditResults', JSON.stringify(response));
      router.push('/audit-results');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    try {
      setIsSubmitting(true);
      await runAuditRequest(buildScanPayload());
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Unable to start the audit right now. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const continueWithSelectedBusiness = async () => {
    if (!pendingPayload) {
      setFormError('Missing pending audit request. Please submit the form again.');
      return;
    }

    if (!selectedPlaceId) {
      setFormError('Select the Google Business Profile that matches your business before continuing.');
      return;
    }

    const selectedCandidate = candidates.find((candidate) => candidate.place_id === selectedPlaceId) || null;

    try {
      setIsSubmitting(true);
      await runAuditRequest({
        ...pendingPayload,
        place_id: selectedPlaceId,
        skip_places: false,
        selected_place_name: selectedCandidate?.name || undefined,
        selected_place_address: selectedCandidate?.address || undefined,
        selected_place_rating:
          typeof selectedCandidate?.rating === 'number' ? selectedCandidate.rating : undefined,
        selected_place_review_count:
          typeof selectedCandidate?.review_count === 'number' ? selectedCandidate.review_count : undefined,
      });
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Unable to continue audit right now. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const continueWithoutGooglePlaces = async () => {
    if (!pendingPayload) {
      setFormError('Missing pending audit request. Please submit the form again.');
      return;
    }

    try {
      setIsSubmitting(true);
      await runAuditRequest({
        ...pendingPayload,
        place_id: undefined,
        skip_places: true,
      });
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Unable to continue audit right now. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="page-title fw-bold mb-1">Start New AI Audit</h1>
          <p className="text-muted mb-0">Enter your business details to launch an AI-powered reputation audit</p>
        </div>
      </div>
      <ReputationCallout message="A strong audit starts with accurate business details. Better inputs produce clearer reputation signals and higher-impact recommendations." />

      <div className="row">
        <div className="col-lg-8 offset-lg-2">
          <div className="mb-5">
            <div className="progress" style={{ height: '3px' }}>
              <div
                className="progress-bar"
                role="progressbar"
                style={{ width: `${currentStep * 50}%` }}
              ></div>
            </div>
            <div className="row text-center mt-4">
              <div className="col-6">
                <small className={`fw-semibold step-label ${currentStep === 1 ? 'text-primary' : 'text-muted'}`}>
                  Business Info
                </small>
              </div>
              <div className="col-6">
                <small className={`fw-semibold step-label ${currentStep === 2 ? 'text-primary' : 'text-muted'}`}>
                  Review & Submit
                </small>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {formError && (
              <div className="alert alert-danger" role="alert">
                {formError}
              </div>
            )}

            {currentStep === 1 && (
              <div className="card custom-card mb-4">
                <div className="card-body p-5">
                  <h4 className="fw-semibold mb-4">Business Information</h4>

                  <div className="mb-3">
                    <label className="form-label fw-medium">Website URL</label>
                    <input
                      type="text"
                      className="form-control"
                      name="website"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={handleChange}
                    />
                    <small className="text-muted">Optional - if provided without protocol, https:// will be added</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium">Business Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="business_name"
                      placeholder="Your Company Name"
                      value={formData.business_name}
                      onChange={handleChange}
                      minLength={2}
                      maxLength={100}
                    />
                    <small className="text-muted">Optional - 2 to 100 characters</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      placeholder="+1-555-123-4567"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                    <small className="text-muted">Optional - use with location for better matching</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium">Location</label>
                    <input
                      type="text"
                      className="form-control"
                      name="location"
                      placeholder="San Francisco, CA"
                      value={formData.location}
                      onChange={handleChange}
                      minLength={3}
                      maxLength={100}
                    />
                    <small className="text-muted">Optional unless phone is provided</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium">Industry</label>
                    <select
                      className="form-control"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                    >
                      <option value="">Select Industry (Optional)</option>
                      <option value="Technology">Technology</option>
                      <option value="Retail">Retail</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Finance">Finance</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Hospitality">Hospitality</option>
                      <option value="Education">Education</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Professional Services">Professional Services</option>
                      <option value="Other">Other</option>
                    </select>
                    <small className="text-muted">Optional - Max 50 characters</small>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="card custom-card mb-4">
                <div className="card-body p-5">
                  <h4 className="fw-semibold mb-4">Review Your Information</h4>
                  <p className="text-muted mb-4">Please review the details below before starting the audit</p>

                  <div className="table-responsive mb-4">
                    <table className="table table-bordered">
                      <tbody>
                        <tr>
                          <th className="bg-light" style={{ width: '30%' }}>Website</th>
                          <td>{normalizeWebsite(formData.website) || 'Not provided'}</td>
                        </tr>
                        <tr>
                          <th className="bg-light">Business Name</th>
                          <td>{formData.business_name || 'Not provided'}</td>
                        </tr>
                        <tr>
                          <th className="bg-light">Phone</th>
                          <td>{formData.phone || 'Not provided'}</td>
                        </tr>
                        <tr>
                          <th className="bg-light">Location</th>
                          <td>{formData.location || 'Not provided'}</td>
                        </tr>
                        <tr>
                          <th className="bg-light">Industry</th>
                          <td>{formData.industry || 'Not specified'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="alert alert-info mb-0">
                    <i className="ri-information-line me-2"></i>
                    Your audit will begin immediately and we&apos;ll email you once your analysis is complete.
                  </div>
                </div>
              </div>
            )}

            {selectionMessage && candidates.length > 0 && (
              <div className="card custom-card mb-4 border-warning">
                <div className="card-body p-4">
                  <h5 className="fw-semibold mb-2">Select Your Google Business Profile</h5>
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
                      disabled={isSubmitting || !selectedPlaceId}
                    >
                      {isSubmitting ? 'Submitting...' : 'Use Selected Profile'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={continueWithoutGooglePlaces}
                      disabled={isSubmitting}
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

            <div className="d-flex gap-2 justify-content-between">
              {currentStep > 1 && (
                <button type="button" className="btn btn-light" onClick={previousStep} disabled={isSubmitting}>
                  <i className="ri-arrow-left-line me-2"></i>Previous
                </button>
              )}
              {currentStep === 1 && (
                <button type="button" className="btn btn-primary ms-auto" onClick={nextStep}>
                  Next<i className="ri-arrow-right-line ms-2"></i>
                </button>
              )}
              {currentStep === 2 && !(selectionMessage && candidates.length > 0) && (
                <button type="submit" className="btn btn-success ms-auto" disabled={isSubmitting}>
                  <i className="ri-check-line me-2"></i>
                  {isSubmitting ? 'Starting...' : 'Start Audit'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
