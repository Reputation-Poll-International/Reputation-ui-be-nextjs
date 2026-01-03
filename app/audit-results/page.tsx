'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface AuditResult {
  reputation_score: number;
  sentiment_breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  top_themes: Array<{
    theme: string;
    sentiment: string;
    frequency: number;
  }>;
  top_mentions: Array<{
    url: string;
    sentiment: string;
  }>;
  recommendations: string[];
  audit: {
    executive_summary: string;
    detailed_analysis: string;
    risk_factors: string;
    opportunities: string;
  };
}

const sampleAuditResult: AuditResult = {
  reputation_score: 72,
  sentiment_breakdown: {
    positive: 45,
    negative: 25,
    neutral: 30,
  },
  top_themes: [
    { theme: 'Customer Service', sentiment: 'positive', frequency: 35 },
    { theme: 'Product Quality', sentiment: 'positive', frequency: 28 },
    { theme: 'Pricing', sentiment: 'neutral', frequency: 22 },
    { theme: 'Delivery Speed', sentiment: 'negative', frequency: 15 },
    { theme: 'Website Experience', sentiment: 'positive', frequency: 12 },
  ],
  top_mentions: [
    { url: 'https://google.com/reviews/example', sentiment: 'positive' },
    { url: 'https://yelp.com/biz/example', sentiment: 'positive' },
    { url: 'https://trustpilot.com/review/example', sentiment: 'neutral' },
    { url: 'https://bbb.org/business/example', sentiment: 'positive' },
    { url: 'https://facebook.com/example/reviews', sentiment: 'negative' },
  ],
  recommendations: [
    'Improve response time to customer inquiries',
    'Address delivery speed concerns in negative reviews',
    'Encourage satisfied customers to leave reviews',
    'Update business listings across all platforms',
    'Monitor and respond to social media mentions regularly',
  ],
  audit: {
    executive_summary: 'Overall, your online reputation is Good with a score of 72/100. The majority of mentions are positive, particularly around customer service and product quality. However, there are areas for improvement, especially regarding delivery speed and response times.',
    detailed_analysis: 'Analysis of 150+ online sources reveals a predominantly positive perception of your brand. Customer service is frequently praised, with multiple reviews highlighting helpful staff and quick problem resolution. Product quality receives consistent positive feedback. The main areas of concern are delivery times and some pricing perceptions.',
    risk_factors: 'Key risk areas include: 1) Recurring complaints about delivery delays could impact customer retention. 2) Some negative mentions on social media are not being addressed promptly. 3) Competitor activity in review spaces is increasing.',
    opportunities: 'Growth opportunities identified: 1) Strong customer service reputation can be leveraged in marketing. 2) Encouraging more reviews from satisfied customers could improve overall score. 3) Addressing delivery concerns proactively could convert negative experiences to positive ones. 4) Local SEO improvements could increase reach.',
  },
};

function getScoreBadge(score: number) {
  if (score >= 80) return { text: 'Excellent', className: 'bg-success' };
  if (score >= 60) return { text: 'Good', className: 'bg-primary' };
  if (score >= 40) return { text: 'Fair', className: 'bg-warning' };
  return { text: 'Needs Improvement', className: 'bg-danger' };
}

function getSentimentBadge(sentiment: string) {
  const badges: Record<string, { className: string; icon: string }> = {
    positive: { className: 'bg-success-transparent text-success', icon: 'ri-thumb-up-line' },
    neutral: { className: 'bg-warning-transparent text-warning', icon: 'ri-subtract-line' },
    negative: { className: 'bg-danger-transparent text-danger', icon: 'ri-thumb-down-line' },
  };
  return badges[sentiment] || badges.neutral;
}

function extractDomain(url: string) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export default function AuditResultsPage() {
  const [data, setData] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAccordion, setActiveAccordion] = useState('detailed');

  useEffect(() => {
    // Try to get data from sessionStorage first
    const storedResults = sessionStorage.getItem('auditResults');
    const auditData = storedResults ? JSON.parse(storedResults) : sampleAuditResult;

    // Simulate loading delay
    setTimeout(() => {
      setData(auditData);
      setLoading(false);
    }, 500);
  }, []);

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading audit results...</p>
        </div>
      </DashboardLayout>
    );
  }

  const scoreBadge = getScoreBadge(data.reputation_score);

  const gaugeOptions: ApexCharts.ApexOptions = {
    chart: { type: 'radialBar', height: 180 },
    series: [data.reputation_score],
    colors: [data.reputation_score >= 60 ? '#05a34a' : data.reputation_score >= 40 ? '#f7b731' : '#fc5c65'],
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: { size: '60%' },
        dataLabels: {
          name: { show: false },
          value: { offsetY: 5, fontSize: '24px', fontWeight: 700 },
        },
      },
    },
  };

  const sentimentOptions: ApexCharts.ApexOptions = {
    chart: { type: 'donut', height: 250 },
    labels: ['Positive', 'Neutral', 'Negative'],
    colors: ['#05a34a', '#f7b731', '#fc5c65'],
    legend: { position: 'bottom' },
  };

  return (
    <DashboardLayout>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="page-title fw-bold">Reputation Audit Results</h1>
          <p className="text-muted">
            Completed: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary" onClick={() => window.print()}>
            <i className="ri-printer-line me-2"></i>Print Report
          </button>
          <Link href="/start-audit" className="btn btn-primary">
            <i className="ri-refresh-line me-2"></i>New Audit
          </Link>
        </div>
      </div>

      {/* Row 1: Reputation Score and Sentiment Breakdown */}
      <div className="row mb-4">
        <div className="col-lg-4">
          <div className="card custom-card text-center h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">Reputation Score</h5>
            </div>
            <div className="card-body d-flex flex-column justify-content-center align-items-center p-4">
              <div style={{ width: '180px', height: '180px' }}>
                <Chart options={gaugeOptions} series={[data.reputation_score]} type="radialBar" height={180} />
              </div>
              <h2 className="fw-bold mt-3">{data.reputation_score}/100</h2>
              <span className={`badge mt-2 ${scoreBadge.className}`}>{scoreBadge.text}</span>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card custom-card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">Sentiment Breakdown</h5>
            </div>
            <div className="card-body">
              <Chart
                options={sentimentOptions}
                series={[data.sentiment_breakdown.positive, data.sentiment_breakdown.neutral, data.sentiment_breakdown.negative]}
                type="donut"
                height={250}
              />
              <div className="row text-center mt-3">
                <div className="col-4">
                  <span className="badge bg-success-transparent text-success d-block mb-1">Positive</span>
                  <strong>{data.sentiment_breakdown.positive}%</strong>
                </div>
                <div className="col-4">
                  <span className="badge bg-warning-transparent text-warning d-block mb-1">Neutral</span>
                  <strong>{data.sentiment_breakdown.neutral}%</strong>
                </div>
                <div className="col-4">
                  <span className="badge bg-danger-transparent text-danger d-block mb-1">Negative</span>
                  <strong>{data.sentiment_breakdown.negative}%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card custom-card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">Executive Summary</h5>
            </div>
            <div className="card-body">
              <p className="text-muted">{data.audit.executive_summary}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Top Themes */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card custom-card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Top Themes</h5>
              <span className="badge bg-primary-transparent text-primary">Key Topics</span>
            </div>
            <div className="card-body">
              <div className="row">
                {data.top_themes.map((theme, index) => {
                  const badge = getSentimentBadge(theme.sentiment);
                  return (
                    <div key={index} className="col-md-4 col-lg-2 mb-3">
                      <div className="card border h-100">
                        <div className="card-body text-center p-3">
                          <h6 className="mb-2">{theme.theme}</h6>
                          <span className={`badge ${badge.className}`}>
                            <i className={`${badge.icon} me-1`}></i>{theme.sentiment}
                          </span>
                          <div className="mt-2">
                            <small className="text-muted">{theme.frequency} mentions</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Top Mentions and Recommendations */}
      <div className="row mb-4">
        <div className="col-lg-6">
          <div className="card custom-card h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Top Mentions</h5>
              <span className="badge bg-info-transparent text-info">Online Sources</span>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Sentiment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_mentions.map((mention, index) => {
                      const badge = getSentimentBadge(mention.sentiment);
                      return (
                        <tr key={index}>
                          <td>
                            <a href={mention.url} target="_blank" rel="noopener noreferrer" className="text-primary">
                              <i className="ri-external-link-line me-1"></i>{extractDomain(mention.url)}
                            </a>
                          </td>
                          <td>
                            <span className={`badge ${badge.className}`}>
                              <i className={`${badge.icon} me-1`}></i>{mention.sentiment}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card custom-card h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">Recommendations</h5>
              <span className="badge bg-success-transparent text-success">Action Items</span>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                {data.recommendations.map((rec, index) => (
                  <li key={index} className="list-group-item d-flex align-items-start">
                    <span className="badge bg-primary me-3">{index + 1}</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Detailed Analysis */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card custom-card">
            <div className="card-header">
              <h5 className="card-title mb-0">Detailed Analysis</h5>
            </div>
            <div className="card-body">
              <div className="accordion" id="analysisAccordion">
                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button
                      className={`accordion-button ${activeAccordion !== 'detailed' ? 'collapsed' : ''}`}
                      type="button"
                      onClick={() => setActiveAccordion(activeAccordion === 'detailed' ? '' : 'detailed')}
                    >
                      <i className="ri-file-text-line me-2"></i>Full Analysis Report
                    </button>
                  </h2>
                  <div className={`accordion-collapse collapse ${activeAccordion === 'detailed' ? 'show' : ''}`}>
                    <div className="accordion-body">
                      <p>{data.audit.detailed_analysis}</p>
                    </div>
                  </div>
                </div>
                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button
                      className={`accordion-button ${activeAccordion !== 'risks' ? 'collapsed' : ''}`}
                      type="button"
                      onClick={() => setActiveAccordion(activeAccordion === 'risks' ? '' : 'risks')}
                    >
                      <i className="ri-alert-line me-2 text-danger"></i>Risk Factors
                    </button>
                  </h2>
                  <div className={`accordion-collapse collapse ${activeAccordion === 'risks' ? 'show' : ''}`}>
                    <div className="accordion-body">
                      <p>{data.audit.risk_factors}</p>
                    </div>
                  </div>
                </div>
                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button
                      className={`accordion-button ${activeAccordion !== 'opportunities' ? 'collapsed' : ''}`}
                      type="button"
                      onClick={() => setActiveAccordion(activeAccordion === 'opportunities' ? '' : 'opportunities')}
                    >
                      <i className="ri-lightbulb-line me-2 text-success"></i>Opportunities
                    </button>
                  </h2>
                  <div className={`accordion-collapse collapse ${activeAccordion === 'opportunities' ? 'show' : ''}`}>
                    <div className="accordion-body">
                      <p>{data.audit.opportunities}</p>
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
