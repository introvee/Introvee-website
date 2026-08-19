import { api, apiRequest, getApiBaseUrl } from './client';
import { supabase } from '../../lib/supabase';

export type AdminPaged<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  levels?: number[];
};

export type AdminQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  lifeCategory?: string;
  level?: string;
  from?: string;
  to?: string;
};

export type AdminPlayStoreStats = {
  configured: boolean;
  totalInstalls: number | null;
  source?: string;
  reason?: string;
  message?: string;
  lastUpdated: string | null;
  metricSource: string | null;
  metrics?: {
    totalInstalls: number | null;
    installedAudience: number | null;
    newUserAcquisitions: number | null;
    userLosses: number | null;
    dailyActiveUsers: number | null;
    monthlyActiveUsers: number | null;
    currentAppVersion: string | null;
    latestRelease: string | null;
  };
};

function qs(query: AdminQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(key, String(value));
    }
  });
  const value = params.toString();
  return value ? `?${value}` : '';
}

export async function adminLogin(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return getAdminMe();
}

export async function adminLogout() {
  await supabase.auth.signOut();
}

export async function getAdminMe() {
  return api.get<{ email: string; role: string }>('/api/admin/me');
}

export async function getAdminDashboard() {
  return api.get<any>('/api/admin/dashboard');
}

export async function getAdminUsers(query?: AdminQuery) {
  return api.get<AdminPaged<any>>(`/api/admin/users${qs(query)}`);
}

export async function getAdminUser(id: string) {
  return api.get<any>(`/api/admin/users/${encodeURIComponent(id)}`);
}

export async function getAdminDares(query?: AdminQuery) {
  return api.get<AdminPaged<any>>(`/api/admin/dares${qs(query)}`);
}

export async function saveAdminDare(id: string | null, body: Record<string, unknown>) {
  return id ? api.patch<any>(`/api/admin/dares/${encodeURIComponent(id)}`, body) : api.post<any>('/api/admin/dares', body);
}

export async function getAdminDonations(query?: AdminQuery) {
  return api.get<AdminPaged<any> & { totals: any }>(`/api/admin/donations${qs(query)}`);
}

export async function getAdminSupportRequests(query?: AdminQuery) {
  return api.get<AdminPaged<any>>(`/api/admin/support-requests${qs(query)}`);
}

export async function getAdminSupportRequest(id: string) {
  return api.get<any>(`/api/admin/support-requests/${encodeURIComponent(id)}`);
}

export async function updateAdminSupportStatus(id: string, status: string) {
  return api.patch<any>(`/api/admin/support-requests/${encodeURIComponent(id)}/status`, { status });
}

export async function getAdminPlayStoreStats() {
  return api.get<AdminPlayStoreStats>('/api/admin/playstore/stats');
}

export { apiRequest, getApiBaseUrl };
