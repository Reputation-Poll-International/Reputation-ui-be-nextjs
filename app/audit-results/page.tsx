'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface TopTheme {
  theme: string;
  sentiment: string;
  frequency: number;
}

interface TopMention {
  url: string;
  sentiment: string;
  title?: string;
  source?: string;
  summary?: string;
}

interface AuditNarrative {
  executive_summary: string;
  detailed_analysis: string;
  risk_factors: string;
  opportunities: string;
}

interface GoogleBusinessProfile {
  name: string | null;
  address: string | null;
  rating: number | null;
  review_count: number | null;
}

interface AuditResult {
  business_name: string;
  verified_website?: string | null;
  verified_location?: string | null;
  verified_phone?: string | null;
  scan_date?: string | null;
  reputation_score: number;
  sentiment_breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  top_themes: TopTheme[];
  top_mentions: TopMention[];
  recommendations: string[];
  audit: AuditNarrative;
  google_business_profile: GoogleBusinessProfile | null;
}

const sampleAuditResult: AuditResult = {
  business_name: 'Sample Business',
  scan_date: new Date().toISOString(),
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
    { url: 'https://google.com', sentiment: 'positive', source: 'Google Reviews' },
    { url: 'https://yelp.com', sentiment: 'positive', source: 'Yelp' },
    { url: 'https://trustpilot.com', sentiment: 'neutral', source: 'Trustpilot' },
  ],
  recommendations: [
    'Improve response time to customer inquiries',
    'Address delivery speed concerns in negative reviews',
    'Encourage satisfied customers to leave reviews',
  ],
  google_business_profile: {
    name: 'Sample Business',
    address: '123 Main St, Sample City, CA',
    rating: 4.2,
    review_count: 24,
  },
  audit: {
    executive_summary:
      'Overall, your online reputation is Good with a score of 72/100. Positive mentions outweigh negative sentiment, with clear improvement opportunities.',
    detailed_analysis:
      'Analysis of public online sources shows mostly positive feedback around customer service and product quality, with negative clusters around delivery and turnaround times.',
    risk_factors:
      'Risk factors include unresolved negative review trends and recurring operational complaints in high-visibility channels.',
    opportunities:
      'Priority opportunities include proactive review response playbooks, testimonial collection from satisfied customers, and operational fixes for recurring pain points.',
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
    return url || 'Unknown source';
  }
}

function toNumber(value: unknown, fallback = 0): number {
  const converted = Number(value);
  return Number.isFinite(converted) ? converted : fallback;
}

function toNullableNumber(value: unknown): number | null {
  const converted = Number(value);
  return Number.isFinite(converted) ? converted : null;
}

function normalizeSentiment(value: unknown): 'positive' | 'negative' | 'neutral' {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'positive' || normalized === 'negative') return normalized;
  return 'neutral';
}

function normalizePercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function normalizeSentimentBreakdown(raw: unknown): { positive: number; negative: number; neutral: number } {
  if (!raw || typeof raw !== 'object') {
    return { positive: 0, negative: 0, neutral: 0 };
  }

  const data = raw as Record<string, unknown>;

  if (
    typeof data.positive !== 'undefined' ||
    typeof data.negative !== 'undefined' ||
    typeof data.neutral !== 'undefined'
  ) {
    return {
      positive: normalizePercent(toNumber(data.positive)),
      negative: normalizePercent(toNumber(data.negative)),
      neutral: normalizePercent(toNumber(data.neutral)),
    };
  }

  const customer = (data.customer || {}) as Record<string, unknown>;
  const employee = (data.employee || {}) as Record<string, unknown>;

  const positive = toNumber(customer.positive) + toNumber(employee.positive);
  const negative = toNumber(customer.negative) + toNumber(employee.negative);
  const neutral = toNumber(customer.neutral) + toNumber(employee.neutral);
  const total = positive + negative + neutral;

  if (total <= 0) {
    return { positive: 0, negative: 0, neutral: 0 };
  }

  return {
    positive: normalizePercent((positive / total) * 100),
    negative: normalizePercent((negative / total) * 100),
    neutral: normalizePercent((neutral / total) * 100),
  };
}

function normalizeThemes(rawThemes: unknown, rawAudit: unknown): TopTheme[] {
  const output: TopTheme[] = [];

  const pushTheme = (entry: unknown) => {
    if (!entry || typeof entry !== 'object') return;

    const theme = entry as Record<string, unknown>;
    const name = String(theme.theme || theme.name || '').trim();
    if (!name) return;

    output.push({
      theme: name,
      sentiment: normalizeSentiment(theme.sentiment),
      frequency: Math.max(1, Math.round(toNumber(theme.frequency, 1))),
    });
  };

  if (Array.isArray(rawThemes)) {
    rawThemes.forEach(pushTheme);
  }

  if (output.length === 0 && rawAudit && typeof rawAudit === 'object') {
    const audit = rawAudit as Record<string, unknown>;

    if (Array.isArray(audit.customer_themes)) {
      audit.customer_themes.forEach(pushTheme);
    }

    if (Array.isArray(audit.employee_themes)) {
      audit.employee_themes.forEach(pushTheme);
    }
  }

  return output.slice(0, 12);
}

function normalizeMentions(rawMentions: unknown, rawAudit: unknown): TopMention[] {
  const mentions: TopMention[] = [];

  const pushMention = (entry: unknown) => {
    if (!entry || typeof entry !== 'object') return;

    const mention = entry as Record<string, unknown>;
    mentions.push({
      url: String(mention.url || '').trim(),
      sentiment: normalizeSentiment(mention.sentiment),
      title: typeof mention.title === 'string' ? mention.title : undefined,
      source: typeof mention.source === 'string' ? mention.source : undefined,
      summary: typeof mention.summary === 'string' ? mention.summary : undefined,
    });
  };

  if (Array.isArray(rawMentions)) {
    rawMentions.forEach(pushMention);
  }

  if (mentions.length === 0 && rawAudit && typeof rawAudit === 'object') {
    const audit = rawAudit as Record<string, unknown>;
    if (Array.isArray(audit.top_mentions)) {
      audit.top_mentions.forEach(pushMention);
    }
  }

  return mentions.slice(0, 10);
}

function normalizeRecommendations(rawRecommendations: unknown, rawAudit: unknown): string[] {
  const normalized: string[] = [];

  const pushRecommendation = (entry: unknown) => {
    if (typeof entry === 'string') {
      const clean = entry.trim();
      if (clean) normalized.push(clean);
      return;
    }

    if (!entry || typeof entry !== 'object') return;

    const record = entry as Record<string, unknown>;
    const candidate =
      (typeof record.recommendation === 'string' && record.recommendation) ||
      (typeof record.message === 'string' && record.message) ||
      (typeof record.text === 'string' && record.text) ||
      '';

    if (candidate.trim()) {
      normalized.push(candidate.trim());
    }
  };

  if (Array.isArray(rawRecommendations)) {
    rawRecommendations.forEach(pushRecommendation);
  }

  if (normalized.length === 0 && rawAudit && typeof rawAudit === 'object') {
    const audit = rawAudit as Record<string, unknown>;
    if (Array.isArray(audit.recommendations)) {
      audit.recommendations.forEach(pushRecommendation);
    }
  }

  return normalized.slice(0, 8);
}

function buildNarrative(
  businessName: string,
  score: number,
  sentiment: { positive: number; negative: number; neutral: number },
  themes: TopTheme[],
  recommendations: string[]
): AuditNarrative {
  const scoreBadge = getScoreBadge(score);
  const topThemeNames = themes.slice(0, 3).map((theme) => theme.theme);
  const negativeThemes = themes
    .filter((theme) => theme.sentiment === 'negative')
    .slice(0, 3)
    .map((theme) => theme.theme);

  const executiveSummary =
    `${businessName} has a ${scoreBadge.text.toLowerCase()} reputation score of ${score}/100. ` +
    `Current sentiment is ${sentiment.positive}% positive, ${sentiment.neutral}% neutral, and ${sentiment.negative}% negative.`;

  const detailedAnalysis =
    topThemeNames.length > 0
      ? `Most recurring themes across analyzed mentions are ${topThemeNames.join(', ')}. These themes represent the primary drivers of public perception.`
      : 'The scan completed successfully, but recurring theme extraction was limited for this run.';

  const riskFactors =
    negativeThemes.length > 0
      ? `Main risk factors detected in the scan include ${negativeThemes.join(', ')}. These areas should be monitored and addressed with priority responses.`
      : 'No dominant negative theme cluster was identified in this scan; continue monitoring to detect changes early.';

  const opportunities =
    recommendations.length > 0
      ? `Top opportunities: ${recommendations.slice(0, 3).join(' ')}`
      : 'Expand positive mention volume, maintain rapid responses to criticism, and strengthen your highest-performing channels.';

  return {
    executive_summary: executiveSummary,
    detailed_analysis: detailedAnalysis,
    risk_factors: riskFactors,
    opportunities,
  };
}

function normalizeAuditResult(raw: unknown): AuditResult | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const payload = raw as Record<string, unknown>;

  if (typeof payload.status === 'string' && payload.status !== 'success') {
    return null;
  }

  const results = (payload.results || payload) as Record<string, unknown>;
  const businessName = String(payload.business_name || 'Business').trim() || 'Business';
  const score = normalizePercent(toNumber(results.reputation_score, 0));
  const sentimentBreakdown = normalizeSentimentBreakdown(results.sentiment_breakdown);
  const topThemes = normalizeThemes(results.top_themes, results.audit);
  const topMentions = normalizeMentions(results.top_mentions, results.audit);
  const recommendations = normalizeRecommendations(results.recommendations, results.audit);

  const generatedNarrative = buildNarrative(
    businessName,
    score,
    sentimentBreakdown,
    topThemes,
    recommendations
  );

  let auditNarrative = generatedNarrative;
  if (results.audit && typeof results.audit === 'object') {
    const audit = results.audit as Record<string, unknown>;
    auditNarrative = {
      executive_summary:
        typeof audit.executive_summary === 'string' && audit.executive_summary.trim()
          ? audit.executive_summary
          : generatedNarrative.executive_summary,
      detailed_analysis:
        typeof audit.detailed_analysis === 'string' && audit.detailed_analysis.trim()
          ? audit.detailed_analysis
          : generatedNarrative.detailed_analysis,
      risk_factors:
        typeof audit.risk_factors === 'string' && audit.risk_factors.trim()
          ? audit.risk_factors
          : generatedNarrative.risk_factors,
      opportunities:
        typeof audit.opportunities === 'string' && audit.opportunities.trim()
          ? audit.opportunities
          : generatedNarrative.opportunities,
    };
  }

  let googleBusinessProfile: GoogleBusinessProfile | null = null;
  const onlineProfile = results.online_profile;
  if (onlineProfile && typeof onlineProfile === 'object') {
    const profile = onlineProfile as Record<string, unknown>;
    const rating = toNullableNumber(profile.rating);
    const reviewCount = toNullableNumber(profile.review_count);
    googleBusinessProfile = {
      name: typeof profile.name === 'string' ? profile.name : null,
      address: typeof profile.address === 'string' ? profile.address : null,
      rating,
      review_count: reviewCount === null ? null : Math.round(reviewCount),
    };
  }

  return {
    business_name: businessName,
    verified_website: typeof payload.verified_website === 'string' ? payload.verified_website : null,
    verified_location: typeof payload.verified_location === 'string' ? payload.verified_location : null,
    verified_phone: typeof payload.verified_phone === 'string' ? payload.verified_phone : null,
    scan_date: typeof payload.scan_date === 'string' ? payload.scan_date : null,
    reputation_score: score,
    sentiment_breakdown: sentimentBreakdown,
    top_themes: topThemes,
    top_mentions: topMentions,
    recommendations,
    audit: auditNarrative,
    google_business_profile: googleBusinessProfile,
  };
}

function formatScanDate(value?: string | null): string {
  if (!value) {
    return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AuditResultsPage() {
  const [data, setData] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAccordion, setActiveAccordion] = useState('detailed');

  useEffect(() => {
    const storedResults = sessionStorage.getItem('auditResults');

    if (!storedResults) {
      setData(sampleAuditResult);
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(storedResults);
      const normalized = normalizeAuditResult(parsed);
      setData(normalized || sampleAuditResult);
    } catch {
      setData(sampleAuditResult);
    } finally {
      setLoading(false);
    }
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
  const googleProfileName =
    data.google_business_profile?.name || data.business_name || '--';
  const googleProfileLocation =
    data.google_business_profile?.address || data.verified_location || '--';
  const googleProfileRating =
    typeof data.google_business_profile?.rating === 'number'
      ? String(data.google_business_profile.rating)
      : '--';
  const googleProfileReviews =
    typeof data.google_business_profile?.review_count === 'number'
      ? String(data.google_business_profile.review_count)
      : '--';

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
          <h1 className="page-title fw-bold">{data.business_name} AI Audit Results</h1>
          <p className="text-muted mb-0">Completed: {formatScanDate(data.scan_date)}</p>
          <small className="d-block text-muted mb-1">AI-generated report with sentiment scoring and recommendations</small>
          {(data.verified_website || data.verified_location) && (
            <small className="text-muted">
              {data.verified_website ? `Website: ${data.verified_website}` : ''}
              {data.verified_website && data.verified_location ? ' | ' : ''}
              {data.verified_location ? `Location: ${data.verified_location}` : ''}
            </small>
          )}
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary" onClick={() => window.print()}>
            <i className="ri-printer-line me-2"></i>Print Report
          </button>
          <Link href="/start-audit" className="btn btn-primary">
            <i className="ri-refresh-line me-2"></i>New AI Audit
          </Link>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-lg-4">
          <div className="card custom-card text-center h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">AI Reputation Score</h5>
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
              <h5 className="card-title mb-0">AI Sentiment Breakdown</h5>
            </div>
            <div className="card-body">
              <Chart
                options={sentimentOptions}
                series={[
                  data.sentiment_breakdown.positive,
                  data.sentiment_breakdown.neutral,
                  data.sentiment_breakdown.negative,
                ]}
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
              <h5 className="card-title mb-0">AI Executive Summary</h5>
            </div>
            <div className="card-body">
              <p className="mb-2"><strong>Company:</strong> {googleProfileName}</p>
              <p className="mb-2"><strong>Location:</strong> {googleProfileLocation}</p>
              <p className="mb-3"><strong>Info on Google Business:</strong> Rating: {googleProfileRating} | Reviews: {googleProfileReviews}</p>
              <p className="text-muted">{data.audit.executive_summary}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="card custom-card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">AI Top Themes</h5>
              <span className="badge bg-primary-transparent text-primary">Key Topics</span>
            </div>
            <div className="card-body">
              <div className="row">
                {data.top_themes.length > 0 ? (
                  data.top_themes.map((theme, index) => {
                    const badge = getSentimentBadge(theme.sentiment);
                    return (
                      <div key={index} className="col-md-4 col-lg-3 mb-3">
                        <div className="card border h-100">
                          <div className="card-body text-center p-3">
                            <h6 className="mb-2">{theme.theme}</h6>
                            <span className={`badge ${badge.className}`}>
                              <i className={`${badge.icon} me-1`}></i>
                              {theme.sentiment}
                            </span>
                            <div className="mt-2">
                              <small className="text-muted">{theme.frequency} mentions</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-12">
                    <p className="text-muted mb-0">No prominent themes were extracted for this scan.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-lg-6">
          <div className="card custom-card h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">AI Top Mentions</h5>
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
                    {data.top_mentions.length > 0 ? (
                      data.top_mentions.map((mention, index) => {
                        const badge = getSentimentBadge(mention.sentiment);
                        return (
                          <tr key={index}>
                            <td>
                              {mention.url ? (
                                <a href={mention.url} target="_blank" rel="noopener noreferrer" className="text-primary">
                                  <i className="ri-external-link-line me-1"></i>
                                  {mention.source || mention.title || extractDomain(mention.url)}
                                </a>
                              ) : (
                                <span className="text-muted">{mention.source || mention.title || 'Unknown source'}</span>
                              )}
                              {mention.summary && <div className="text-muted fs-12 mt-1">{mention.summary}</div>}
                            </td>
                            <td>
                              <span className={`badge ${badge.className}`}>
                                <i className={`${badge.icon} me-1`}></i>
                                {mention.sentiment}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={2} className="text-muted">
                          No mention sources available for this scan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card custom-card h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">AI Recommendations</h5>
              <span className="badge bg-success-transparent text-success">Action Items</span>
            </div>
            <div className="card-body">
              {data.recommendations.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {data.recommendations.map((rec, index) => (
                    <li key={index} className="list-group-item d-flex align-items-start">
                      <span className="badge bg-primary me-3">{index + 1}</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted mb-0">No recommendations generated for this scan.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="card custom-card">
            <div className="card-header">
              <h5 className="card-title mb-0">AI Detailed Analysis</h5>
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
                      <i className="ri-file-text-line me-2"></i>AI Full Analysis Report
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
                      <i className="ri-alert-line me-2 text-danger"></i>AI Risk Factors
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
                      <i className="ri-lightbulb-line me-2 text-success"></i>AI Opportunities
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
