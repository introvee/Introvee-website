import { supabase } from '../../lib/supabase';

const defaultApiUrl = 'https://api.introvee.com';

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export class ApiClientError extends Error {
  constructor(public code: string, message: string, public status: number, public details?: unknown) {
    super(message);
  }
}

export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || defaultApiUrl).replace(/\/+$/, '');
}

function getBrowserOrigin() {
  return typeof window === 'undefined' ? 'this admin origin' : window.location.origin;
}

function networkErrorMessage() {
  const apiBaseUrl = getApiBaseUrl();
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return `Could not reach the Introvee API at ${apiBaseUrl}. Check your network connection and make sure the backend is running.`;
  }

  return `The browser could not read the Introvee API response from ${apiBaseUrl}. Make sure the backend is running and CORS allows ${getBrowserOrigin()}.`;
}

function apiErrorMessage(error: ApiResponse<unknown>['error'] | undefined, status: number) {
  if (status === 401 || error?.code === 'UNAUTHORIZED') {
    return 'Your admin session has expired. Please sign in again.';
  }

  if (status === 403 || error?.code === 'FORBIDDEN') {
    return error?.message ?? 'This account is not authorized to access Introvee Admin.';
  }

  return error?.message ?? `Request failed with status ${status}.`;
}

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new ApiClientError('UNAUTHORIZED', 'Please sign in again.', 401);
  }

  let session = data.session;
  const expiresAtMs = session?.expires_at ? session.expires_at * 1000 : 0;
  const shouldRefresh = session?.refresh_token && expiresAtMs > 0 && expiresAtMs <= Date.now() + 60_000;

  if (shouldRefresh) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error) {
      throw new ApiClientError('UNAUTHORIZED', 'Please sign in again.', 401);
    }
    session = refreshed.data.session;
  }

  if (!session?.access_token) {
    throw new ApiClientError('UNAUTHORIZED', 'Please sign in again.', 401);
  }

  return session.access_token;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const url = `${getApiBaseUrl()}${path}`;
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('API request failed', { url, method: options.method ?? 'GET', error });
    }
    throw new ApiClientError(
      'NETWORK_ERROR',
      networkErrorMessage(),
      0,
      error
    );
  }

  const responseText = await response.text().catch(() => '');
  const payload = responseText ? (safeParseJson(responseText) as ApiResponse<T> | null) : null;
  if (!response.ok || !payload?.success) {
    const error = payload?.error;
    if (import.meta.env.DEV) {
      console.error('API request failed', {
        url,
        method: options.method ?? 'GET',
        status: response.status,
        response: payload,
        responseText: payload ? undefined : responseText
      });
    }
    throw new ApiClientError(error?.code ?? 'API_ERROR', apiErrorMessage(error, response.status), response.status, error?.details);
  }

  return payload.data as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body)
    }),
  patch: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body)
    }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' })
};

function safeParseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
