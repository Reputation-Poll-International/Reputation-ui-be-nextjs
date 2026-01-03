'use client';

import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  popular?: boolean;
  current?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    features: [
      '5 audits per month',
      '1 business profile',
      'Basic reporting',
      '7-day history',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 29,
    period: 'month',
    features: [
      '50 audits per month',
      '5 business profiles',
      'Advanced reporting',
      '90-day history',
      'Priority support',
      'API access',
      'Export reports',
    ],
    popular: true,
    current: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 79,
    period: 'month',
    features: [
      'Unlimited audits',
      'Unlimited business profiles',
      'White-label reports',
      'Unlimited history',
      'Dedicated support',
      'Full API access',
      'Custom integrations',
      'Team collaboration',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: -1, // Custom pricing
    period: 'custom',
    features: [
      'Everything in Business',
      'Custom SLA',
      'Dedicated account manager',
      'On-premise deployment',
      'Custom development',
      'Training & onboarding',
      'Advanced security features',
    ],
  },
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const getPrice = (plan: Plan) => {
    if (plan.price === -1) return 'Custom';
    if (plan.price === 0) return 'Free';
    const price = billingPeriod === 'annual' ? plan.price * 10 : plan.price;
    return `$${price}`;
  };

  const getPeriod = (plan: Plan) => {
    if (plan.price === -1) return 'Contact Sales';
    if (plan.price === 0) return 'Forever';
    return billingPeriod === 'annual' ? '/year' : '/month';
  };

  return (
    <DashboardLayout>
      <div className="text-center mb-5">
        <h1 className="page-title fw-bold mb-2">Choose Your Plan</h1>
        <p className="text-muted mb-4">Select the perfect plan for your business needs</p>

        <div className="btn-group" role="group">
          <input
            type="radio"
            className="btn-check"
            name="billing"
            id="monthly"
            checked={billingPeriod === 'monthly'}
            onChange={() => setBillingPeriod('monthly')}
          />
          <label className="btn btn-outline-primary" htmlFor="monthly">Monthly</label>

          <input
            type="radio"
            className="btn-check"
            name="billing"
            id="annual"
            checked={billingPeriod === 'annual'}
            onChange={() => setBillingPeriod('annual')}
          />
          <label className="btn btn-outline-primary" htmlFor="annual">
            Annual <span className="badge bg-success ms-1">Save 17%</span>
          </label>
        </div>
      </div>

      <div className="row g-4 justify-content-center">
        {plans.map((plan) => (
          <div key={plan.id} className="col-xl-3 col-lg-4 col-md-6">
            <div className={`card custom-card h-100 ${plan.popular ? 'border-primary' : ''}`}>
              {plan.popular && (
                <div className="card-header bg-primary text-white text-center py-2">
                  <small className="fw-semibold">Most Popular</small>
                </div>
              )}
              <div className="card-body p-4">
                <h4 className="fw-semibold mb-2">{plan.name}</h4>
                <div className="mb-4">
                  <span className="display-5 fw-bold">{getPrice(plan)}</span>
                  <span className="text-muted">{getPeriod(plan)}</span>
                </div>

                <ul className="list-unstyled mb-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="mb-2 d-flex align-items-center">
                      <i className="ri-check-line text-success me-2"></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.current ? (
                  <button className="btn btn-light w-100" disabled>
                    Current Plan
                  </button>
                ) : plan.price === -1 ? (
                  <button className="btn btn-outline-primary w-100">
                    Contact Sales
                  </button>
                ) : (
                  <button className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline-primary'} w-100`}>
                    {plan.price === 0 ? 'Get Started' : 'Upgrade'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row mt-5">
        <div className="col-12">
          <div className="card custom-card">
            <div className="card-header">
              <h5 className="card-title mb-0">Frequently Asked Questions</h5>
            </div>
            <div className="card-body">
              <div className="accordion" id="faqAccordion">
                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                      Can I change my plan later?
                    </button>
                  </h2>
                  <div id="faq1" className="accordion-collapse collapse show" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Yes, you can upgrade or downgrade your plan at any time. Changes will take effect at the start of your next billing cycle.
                    </div>
                  </div>
                </div>
                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                      What payment methods do you accept?
                    </button>
                  </h2>
                  <div id="faq2" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      We accept all major credit cards (Visa, MasterCard, American Express) and PayPal. Enterprise customers can also pay via invoice.
                    </div>
                  </div>
                </div>
                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                      Is there a free trial?
                    </button>
                  </h2>
                  <div id="faq3" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Yes! You can start with our Free plan to try out the platform. You can upgrade anytime when you&apos;re ready for more features.
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
