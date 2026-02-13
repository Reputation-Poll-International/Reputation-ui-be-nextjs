interface PlanApiErrorResponse {
  status: 'error';
  message?: string;
  errors?: Record<string, string[]>;
}

export interface UserPlan {
  id: number;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  is_active: boolean;
  is_custom: boolean;
  contact_sales: boolean;
  pricing_label: string | null;
  features: Record<string, number | null>;
}

export interface UserSubscription {
  id: number;
  status: 'active' | 'cancelled' | 'suspended';
  started_at: string | null;
  renews_at: string | null;
  payment_method: string | null;
  plan: UserPlan | null;
}

export interface UserUsageStats {
  period_start: string;
  period_end: string;
  audits_used: number;
  audits_limit: number | null;
  audits_remaining: number | null;
  storage_used_mb: number | null;
  storage_limit_mb: number | null;
  concurrent_running: number;
  concurrent_allowed: number;
}

export interface PlanRestriction {
  allowed: boolean;
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
}

export interface PlansResponse {
  status: 'success';
  plans_active: boolean;
  total: number;
  plans: UserPlan[];
}

export interface CurrentPlanResponse {
  status: 'success';
  plans_active: boolean;
  message?: string;
  plan: UserPlan | null;
  subscription: UserSubscription | null;
  usage: UserUsageStats | null;
}

export interface UsageStatsResponse {
  status: 'success';
  plans_active: boolean;
  usage: UserUsageStats | null;
  restrictions: PlanRestriction;
}

export interface SubscriptionResponse {
  status: 'success';
  plans_active: boolean;
  subscription: UserSubscription | null;
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:8000/api'
).replace(/\/$/, '');

function buildPlanErrorMessage(data: PlanApiErrorResponse | null, fallback: string): string {
  if (data?.errors && typeof data.errors === 'object') {
    const firstField = Object.values(data.errors)[0];
    if (Array.isArray(firstField) && firstField.length > 0) {
      return String(firstField[0]);
    }
  }

  return data?.message || fallback;
}

function buildUserLookupQuery(payload: {
  user_id?: number;
  lookup_email?: string;
}): string {
  const params = new URLSearchParams();
  if (payload.user_id) params.set('user_id', String(payload.user_id));
  if (payload.lookup_email) params.set('lookup_email', payload.lookup_email);
  const query = params.toString();
  return query ? `?${query}` : '';
}

async function requestPlans<TSuccess>(
  path: string,
  fallbackErrorMessage: string
): Promise<TSuccess> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  let data: (TSuccess & { status?: string }) | PlanApiErrorResponse | null = null;
  try {
    data = (await response.json()) as (TSuccess & { status?: string }) | PlanApiErrorResponse;
  } catch {
    throw new Error(fallbackErrorMessage);
  }

  if (
    !response.ok ||
    !data ||
    (typeof data === 'object' && 'status' in data && data.status === 'error')
  ) {
    throw new Error(buildPlanErrorMessage((data as PlanApiErrorResponse) || null, fallbackErrorMessage));
  }

  return data as TSuccess;
}

export async function fetchPlans(): Promise<PlansResponse> {
  return requestPlans<PlansResponse>('/plans', 'Unable to load plans right now.');
}

export async function fetchUserCurrentPlan(payload: {
  user_id?: number;
  lookup_email?: string;
}): Promise<CurrentPlanResponse> {
  const query = buildUserLookupQuery(payload);
  return requestPlans<CurrentPlanResponse>(
    `/user/current-plan${query}`,
    'Unable to load your current plan right now.'
  );
}

export async function fetchUserUsageStats(payload: {
  user_id?: number;
  lookup_email?: string;
}): Promise<UsageStatsResponse> {
  const query = buildUserLookupQuery(payload);
  return requestPlans<UsageStatsResponse>(
    `/user/usage-stats${query}`,
    'Unable to load usage stats right now.'
  );
}

export async function fetchUserSubscription(payload: {
  user_id?: number;
  lookup_email?: string;
}): Promise<SubscriptionResponse> {
  const query = buildUserLookupQuery(payload);
  return requestPlans<SubscriptionResponse>(
    `/user/subscription${query}`,
    'Unable to load subscription details right now.'
  );
}
