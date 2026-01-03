'use client';

import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: 'How often should I run audits?',
    answer: 'We recommend running audits monthly to track meaningful changes in your online reputation. For high-volume businesses or those actively managing their reputation, weekly audits may be beneficial.',
  },
  {
    question: 'What sources do you analyze?',
    answer: 'We analyze a wide range of sources including Google reviews, Yelp, social media mentions, news articles, blog posts, forum discussions, and industry-specific review platforms.',
  },
  {
    question: 'How is the reputation score calculated?',
    answer: 'The reputation score is calculated using a proprietary algorithm that considers sentiment analysis, review ratings, mention frequency, source authority, and recency of mentions.',
  },
  {
    question: 'Can I export my audit results?',
    answer: 'Yes! All audit results can be exported as PDF reports. You can also use the Print feature to generate printable versions of your results.',
  },
  {
    question: 'How do I add multiple businesses?',
    answer: 'Depending on your plan, you can add multiple businesses. Go to Start Audit and enter the details for each business you want to track.',
  },
];

export default function SupportPage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for your message. We will get back to you within 24 hours.');
    setContactForm({ subject: '', message: '' });
  };

  return (
    <DashboardLayout>
      <div className="text-center mb-5">
        <h1 className="page-title fw-bold mb-2">Support & Help</h1>
        <p className="text-muted fs-16">We&apos;re here to help you get the most out of BizReputation AI</p>
      </div>

      {/* Quick Links */}
      <div className="row mb-5">
        <div className="col-md-4">
          <div className="card custom-card text-center h-100">
            <div className="card-body p-4">
              <div className="avatar avatar-lg bg-primary-transparent rounded-circle mx-auto mb-3">
                <i className="ri-mail-line fs-24 text-primary"></i>
              </div>
              <h5 className="fw-semibold mb-2">Email Support</h5>
              <p className="text-muted mb-3">Get help via email within 24 hours</p>
              <a href="mailto:support@bizreputation.ai" className="btn btn-sm btn-primary">
                support@bizreputation.ai
              </a>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card custom-card text-center h-100">
            <div className="card-body p-4">
              <div className="avatar avatar-lg bg-success-transparent rounded-circle mx-auto mb-3">
                <i className="ri-chat-3-line fs-24 text-success"></i>
              </div>
              <h5 className="fw-semibold mb-2">Live Chat</h5>
              <p className="text-muted mb-3">Chat with our support team</p>
              <button className="btn btn-sm btn-success">Start Chat</button>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card custom-card text-center h-100">
            <div className="card-body p-4">
              <div className="avatar avatar-lg bg-info-transparent rounded-circle mx-auto mb-3">
                <i className="ri-book-2-line fs-24 text-info"></i>
              </div>
              <h5 className="fw-semibold mb-2">Documentation</h5>
              <p className="text-muted mb-3">Browse our help articles</p>
              <button className="btn btn-sm btn-info">View Docs</button>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* FAQ Section */}
        <div className="col-lg-6">
          <div className="card custom-card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">Frequently Asked Questions</h5>
            </div>
            <div className="card-body">
              <div className="accordion" id="faqAccordion">
                {faqs.map((faq, index) => (
                  <div key={index} className="accordion-item">
                    <h2 className="accordion-header">
                      <button
                        className={`accordion-button ${activeIndex !== index ? 'collapsed' : ''}`}
                        type="button"
                        onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                      >
                        {faq.question}
                      </button>
                    </h2>
                    <div className={`accordion-collapse collapse ${activeIndex === index ? 'show' : ''}`}>
                      <div className="accordion-body text-muted">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="col-lg-6">
          <div className="card custom-card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">Contact Us</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Subject</label>
                  <select
                    className="form-select"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                    required
                  >
                    <option value="">Select a topic</option>
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing Question</option>
                    <option value="feature">Feature Request</option>
                    <option value="account">Account Help</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-control"
                    rows={6}
                    placeholder="Describe your issue or question..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  <i className="ri-send-plane-line me-2"></i>Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Resources */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card custom-card">
            <div className="card-header">
              <h5 className="card-title mb-0">Additional Resources</h5>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="d-flex align-items-start">
                    <div className="avatar avatar-sm bg-primary-transparent rounded me-3">
                      <i className="ri-vidicon-line text-primary"></i>
                    </div>
                    <div>
                      <h6 className="fw-semibold mb-1">Video Tutorials</h6>
                      <p className="text-muted mb-0 small">Learn how to use BizReputation AI with step-by-step videos</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex align-items-start">
                    <div className="avatar avatar-sm bg-success-transparent rounded me-3">
                      <i className="ri-article-line text-success"></i>
                    </div>
                    <div>
                      <h6 className="fw-semibold mb-1">Blog</h6>
                      <p className="text-muted mb-0 small">Tips and best practices for reputation management</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex align-items-start">
                    <div className="avatar avatar-sm bg-warning-transparent rounded me-3">
                      <i className="ri-code-line text-warning"></i>
                    </div>
                    <div>
                      <h6 className="fw-semibold mb-1">API Documentation</h6>
                      <p className="text-muted mb-0 small">Integrate BizReputation AI into your applications</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
