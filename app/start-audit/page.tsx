'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';

interface FormData {
  website: string;
  business_name: string;
  phone: string;
  location: string;
  industry: string;
}

export default function StartAuditPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    website: '',
    business_name: '',
    phone: '',
    location: '',
    industry: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    if (!formData.website) {
      alert('Please enter a website URL');
      return false;
    }
    if (!formData.location) {
      alert('Please enter a location');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    setCurrentStep(2);
  };

  const previousStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Store audit data in sessionStorage for the progress page
    sessionStorage.setItem('auditRequest', JSON.stringify(formData));
    router.push('/audit-progress');
  };

  return (
    <DashboardLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="page-title fw-bold mb-1">Start New Audit</h1>
          <p className="text-muted mb-0">Enter your business details to begin the reputation audit</p>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8 offset-lg-2">
          {/* Progress Bar */}
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
            {/* Step 1: Business Info */}
            {currentStep === 1 && (
              <div className="card custom-card mb-4">
                <div className="card-body p-5">
                  <h4 className="fw-semibold mb-4">Business Information</h4>

                  <div className="mb-3">
                    <label className="form-label fw-medium">Website URL <span className="text-danger">*</span></label>
                    <input
                      type="url"
                      className="form-control"
                      name="website"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={handleChange}
                      required
                    />
                    <small className="text-muted">The website you want to analyze</small>
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
                    <small className="text-muted">Optional - Required if no website provided</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium">Location <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      name="location"
                      placeholder="San Francisco, CA"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      minLength={3}
                      maxLength={100}
                    />
                    <small className="text-muted">City, State or Country</small>
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

            {/* Step 2: Review & Submit */}
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
                          <td>{formData.website || 'Not provided'}</td>
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

                  <div className="alert alert-info">
                    <i className="ri-information-line me-2"></i>
                    The audit will analyze your online reputation including reviews, mentions, and sentiment across the web.
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="d-flex gap-2 justify-content-between">
              {currentStep > 1 && (
                <button type="button" className="btn btn-light" onClick={previousStep}>
                  <i className="ri-arrow-left-line me-2"></i>Previous
                </button>
              )}
              {currentStep === 1 && (
                <button type="button" className="btn btn-primary ms-auto" onClick={nextStep}>
                  Next<i className="ri-arrow-right-line ms-2"></i>
                </button>
              )}
              {currentStep === 2 && (
                <button type="submit" className="btn btn-success ms-auto">
                  <i className="ri-check-line me-2"></i>Start Audit Now
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
