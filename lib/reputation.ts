export interface ReputationScanRequest {
  user_id?: number;
  lookup_email?: string;
  audit_id?: number;
  website?: string;
  business_name?: string;
  phone?: string;
  location?: string;
  industry?: string;
  country?: string;
  place_id?: string;
  skip_places?: boolean;
  selected_place_name?: string;
  selected_place_address?: string;
  selected_place_rating?: number;
  selected_place_review_count?: number;
}

export interface ReputationCandidate {
  place_id: string | null;
  name: string | null;
  address: string | null;
  rating: number | null;
  review_count: number | null;
}

export interface ReputationScanSuccessResponse {
  status: 'success';
  business_name: string;
  verified_website?: string | null;
  verified_location?: string | null;
  verified_phone?: string | null;
  scan_date?: string | null;
  results: {
    reputation_score?: number;
    sentiment_breakdown?: unknown;
    top_themes?: unknown[];
    top_mentions?: unknown[];
    recommendations?: unknown;
    audit?: unknown;
    online_profile?: unknown;
  };
}

export interface ReputationSelectionRequiredResponse {
  status: 'selection_required';
  message: string;
  candidates: ReputationCandidate[];
  total: number;
  audit_id?: number;
}

export interface ReputationQueuedResponse {
  status: 'queued';
  message: string;
  audit_id: number;
  audit: AuditHistoryRecord;
}

export type AuditHistoryStatus =
  | 'pending'
  | 'processing'
  | 'success'
  | 'error'
  | 'selection_required';

export interface AuditHistoryRecord {
  id: number;
  status: AuditHistoryStatus;
  business_name: string | null;
  website: string | null;
  location: string | null;
  industry: string | null;
  reputation_score: number | null;
  scan_date: string | null;
  created_at: string | null;
  error_code: string | null;
  error_message: string | null;
}

export interface AuditHistoryResponse {
  status: 'success';
  total: number;
  audits: AuditHistoryRecord[];
}

export interface AuditHistoryItemResponse {
  status: 'success';
  audit: AuditHistoryRecord & {
    request_payload?: ReputationScanRequest | null;
    response_payload?: Record<string, unknown> | null;
    scan_response?: Record<string, unknown> | null;
  };
}

interface ReputationApiErrorResponse {
  status: 'error';
  code?: string;
  message?: string;
  details?: unknown;
}

export type ReputationScanResponse =
  | ReputationScanSuccessResponse
  | ReputationSelectionRequiredResponse
  | ReputationQueuedResponse;

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:8000/api'
).replace(/\/$/, '');

function buildErrorMessage(data: ReputationApiErrorResponse | null, fallback: string): string {
  if (data?.details && typeof data.details === 'object' && data.details !== null) {
    const firstValue = Object.values(data.details)[0];
    if (Array.isArray(firstValue) && firstValue.length > 0) {
      return String(firstValue[0]);
    }
    if (typeof firstValue === 'string') {
      return firstValue;
    }
  }

  return data?.message || fallback;
}

export async function scanReputation(payload: ReputationScanRequest): Promise<ReputationScanResponse> {
  const response = await fetch(`${API_BASE_URL}/reputation/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let data: (ReputationScanResponse | ReputationApiErrorResponse) | null = null;

  try {
    data = (await response.json()) as ReputationScanResponse | ReputationApiErrorResponse;
  } catch {
    throw new Error('Audit request failed. Please try again.');
  }

  if (!response.ok || !data || data.status === 'error') {
    throw new Error(
      buildErrorMessage(
        (data as ReputationApiErrorResponse) || null,
        'Audit request failed. Please try again.'
      )
    );
  }

  if (data.status !== 'success' && data.status !== 'selection_required' && data.status !== 'queued') {
    throw new Error('Unexpected audit response from server.');
  }

  return data;
}

export async function fetchAuditHistory(payload: {
  user_id?: number;
  lookup_email?: string;
  limit?: number;
}): Promise<AuditHistoryResponse> {
  const params = new URLSearchParams();
  if (payload.user_id) params.set('user_id', String(payload.user_id));
  if (payload.lookup_email) params.set('lookup_email', payload.lookup_email);
  if (payload.limit) params.set('limit', String(payload.limit));

  const response = await fetch(`${API_BASE_URL}/reputation/history?${params.toString()}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  let data: (AuditHistoryResponse | ReputationApiErrorResponse) | null = null;
  try {
    data = (await response.json()) as AuditHistoryResponse | ReputationApiErrorResponse;
  } catch {
    throw new Error('Unable to load audit history right now.');
  }

  if (!response.ok || !data || data.status === 'error') {
    throw new Error(buildErrorMessage((data as ReputationApiErrorResponse) || null, 'Unable to load audit history right now.'));
  }

  return data as AuditHistoryResponse;
}

export async function fetchAuditHistoryItem(
  auditId: number,
  payload: {
    user_id?: number;
    lookup_email?: string;
  }
): Promise<AuditHistoryItemResponse> {
  const params = new URLSearchParams();
  if (payload.user_id) params.set('user_id', String(payload.user_id));
  if (payload.lookup_email) params.set('lookup_email', payload.lookup_email);

  const response = await fetch(`${API_BASE_URL}/reputation/history/${auditId}?${params.toString()}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  let data: (AuditHistoryItemResponse | ReputationApiErrorResponse) | null = null;
  try {
    data = (await response.json()) as AuditHistoryItemResponse | ReputationApiErrorResponse;
  } catch {
    throw new Error('Unable to load audit details right now.');
  }

  if (!response.ok || !data || data.status === 'error') {
    throw new Error(buildErrorMessage((data as ReputationApiErrorResponse) || null, 'Unable to load audit details right now.'));
  }

  return data as AuditHistoryItemResponse;
}
