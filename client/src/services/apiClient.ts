import axios from 'axios';
import type { ApiResponse, UnrestrictResult, RealDebridUser, CacheStatusResponse } from '@shared/types/api';

const api = axios.create({
  baseURL: '/api',
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

function unwrap<T>(res: { data: ApiResponse<T> }): T {
  if (!res.data.success) throw new Error((res.data as { error: string }).error || 'Unknown error');
  return (res.data as { success: true; data: T }).data;
}

export const realDebridApi = {
  /** Test connection using the server-configured token */
  test: async (token?: string): Promise<RealDebridUser> =>
    unwrap(await api.post<ApiResponse<RealDebridUser>>('/realdebrid/test', token ? { token } : {})),

  /** Unrestrict / resolve a link via the backend proxy */
  unrestrict: async (link: string, password?: string): Promise<UnrestrictResult> =>
    unwrap(await api.post<ApiResponse<UnrestrictResult>>('/realdebrid/unrestrict', { link, password })),

  /** Force-refresh a cached resolved link */
  refresh: async (link: string): Promise<UnrestrictResult> =>
    unwrap(await api.post<ApiResponse<UnrestrictResult>>('/realdebrid/refresh', { link })),
};

export const cacheApi = {
  status: async (): Promise<CacheStatusResponse> =>
    unwrap(await api.get<ApiResponse<CacheStatusResponse>>('/cache/status')),

  clear: async (): Promise<void> => {
    await api.delete('/cache');
  },
};

export async function checkHealth(): Promise<boolean> {
  try {
    await axios.get('/health', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
