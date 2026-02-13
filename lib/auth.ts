export interface AuthUser {
  id: number;
  name: string;
  email: string;
  registration_provider?: string | null;
  avatar_url?: string | null;
  last_login_at?: string | null;
  last_login_provider?: string | null;
}

interface AuthApiResponse {
  status: 'success' | 'error';
  message?: string;
  user?: AuthUser;
  reset_url?: string;
  errors?: Record<string, string[]>;
}

const AUTH_STORAGE_KEY = 'biz_reputation_auth_user';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:8000/api'
).replace(/\/$/, '');

function isBrowser() {
  return typeof window !== 'undefined';
}

async function postAuth<TPayload extends Record<string, unknown>>(
  path: string,
  payload: TPayload
): Promise<AuthApiResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let data: AuthApiResponse | null = null;
  try {
    data = (await response.json()) as AuthApiResponse;
  } catch {
    // Ignore JSON parse failures and use fallback error below.
  }

  if (!response.ok || !data || data.status === 'error') {
    if (data?.errors) {
      const firstField = Object.values(data.errors)[0];
      if (firstField?.length) {
        throw new Error(firstField[0]);
      }
    }

    throw new Error(data?.message || 'Authentication request failed.');
  }

  return data;
}

export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<AuthUser> {
  const data = await postAuth('/auth/register', payload);

  if (!data.user) {
    throw new Error('Account was created but no user was returned.');
  }

  persistAuthUser(data.user);
  return data.user;
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<AuthUser> {
  const data = await postAuth('/auth/login', payload);

  if (!data.user) {
    throw new Error('Sign in succeeded but no user was returned.');
  }

  persistAuthUser(data.user);
  return data.user;
}

export async function loginWithGoogleCode(code: string): Promise<AuthUser> {
  const data = await postAuth('/auth/google', { code });

  if (!data.user) {
    throw new Error('Google sign in succeeded but no user was returned.');
  }

  persistAuthUser(data.user);
  return data.user;
}

export async function forgotPassword(email: string): Promise<{ resetUrl?: string }> {
  const data = await postAuth('/auth/forgot-password', { email });
  return { resetUrl: data.reset_url };
}

export async function resetPassword(payload: {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}): Promise<void> {
  await postAuth('/auth/reset-password', payload);
}

export function persistAuthUser(user: AuthUser): void {
  if (!isBrowser()) return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function getAuthUser(): AuthUser | null {
  if (!isBrowser()) return null;

  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getAuthUser() !== null;
}

export function logoutUser(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
