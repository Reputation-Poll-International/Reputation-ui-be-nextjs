'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { getAuthUser } from '@/lib/auth';
import { fetchPlans, fetchUserSubscription, type UserPlan } from '@/lib/plans';

function formatPrice(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2);
}

function toFeatureList(plan: UserPlan): string[] {
  const features: string[] = [];
  const maxAudits = plan.features.max_audits_per_month;
  const concurrentAudits = plan.features.concurrent_audits_allowed;

  if (maxAudits === null || typeof maxAudits === 'undefined') {
    features.push('Unlimited AI audits per month');
  } else {
    features.push(`Up to ${maxAudits} AI audits per month`);
  }

  if (concurrentAudits === null || typeof concurrentAudits === 'undefined') {
    features.push('Unlimited concurrent audits');
  } else {
    features.push(
      `${concurrentAudits} concurrent audit${concurrentAudits === 1 ? '' : 's'} at a time`
    );
  }

  if (plan.description) {
    features.push(plan.description);
  }

  if (plan.contact_sales) {
    features.push('Custom allocation and onboarding support');
  }

  return features;
}

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [plans, setPlans] = useState<UserPlan[]>([]);
  const [plansActive, setPlansActive] = useState(true);
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlans = async () => {
      const user = getAuthUser();
      setIsLoading(true);
      setError(null);

      try {
        const plansPromise = fetchPlans();
        const subscriptionPromise = user
          ? fetchUserSubscription({ user_id: user.id })
          : Promise.resolve(null);

        const [plansResult, subscriptionResult] = await Promise.allSettled([
          plansPromise,
          subscriptionPromise,
        ]);

        if (plansResult.status === 'fulfilled') {
          setPlans(plansResult.value.plans);
          setPlansActive(plansResult.value.plans_active);
        } else if (plansResult.reason instanceof Error) {
          setError(plansResult.reason.message);
        } else {
          setError('Unable to load plans right now.');
        }

        if (
          subscriptionResult.status === 'fulfilled' &&
          subscriptionResult.value?.subscription?.plan?.id
        ) {
          setCurrentPlanId(subscriptionResult.value.subscription.plan.id);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadPlans();
  }, []);

  const sortedPlans = useMemo(
    () =>
      [...plans].sort((a, b) => {
        if (a.contact_sales && !b.contact_sales) return 1;
        if (!a.contact_sales && b.contact_sales) return -1;
        return a.price_monthly - b.price_monthly;
      }),
    [plans]
  );

  const getPrice = (plan: UserPlan) => {
    if (plan.contact_sales) return plan.pricing_label || 'Contact Sales';

    const price = billingPeriod === 'annual' ? plan.price_yearly : plan.price_monthly;
    if (price === 0) return 'Free';
    return `$${formatPrice(price)}`;
  };

  const getPeriod = (plan: UserPlan) => {
    if (plan.contact_sales) return '';
    if (plan.price_monthly === 0 && plan.price_yearly === 0) return 'Forever';
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

      {!plansActive && (
        <div className="alert alert-info" role="alert">
          Plan restrictions are currently disabled. Pricing is shown for reference.
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row g-4 justify-content-center">
        {!isLoading &&
          sortedPlans.map((plan) => {
            const isPopular = plan.name.toLowerCase() === 'professional';
            const isCurrent = currentPlanId === plan.id;
            const features = toFeatureList(plan);

            return (
          <div key={plan.id} className="col-xl-3 col-lg-4 col-md-6">
            <div className={`card custom-card h-100 ${isPopular ? 'border-primary' : ''}`}>
              {isPopular && (
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
                  {features.map((feature) => (
                    <li key={`${plan.id}-${feature}`} className="mb-2 d-flex align-items-center">
                      <i className="ri-check-line text-success me-2"></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button className="btn btn-light w-100" disabled>
                    Current Plan
                  </button>
                ) : plan.contact_sales ? (
                  <Link href="/support" className="btn btn-outline-primary w-100">
                    Contact Sales
                  </Link>
                ) : (
                  <button className={`btn ${isPopular ? 'btn-primary' : 'btn-outline-primary'} w-100`}>
                    {plan.price_monthly === 0 ? 'Get Started' : 'Upgrade'}
                  </button>
                )}
              </div>
            </div>
          </div>
            );
          })}

        {isLoading && (
          <div className="col-12">
            <div className="card custom-card">
              <div className="card-body text-center text-muted py-5">Loading plans...</div>
            </div>
          </div>
        )}
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
