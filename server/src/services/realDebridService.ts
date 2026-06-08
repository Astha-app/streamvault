import axios from 'axios';
import type { RDUser, RDUnrestrictLink } from '../types/realDebrid';
import type { UnrestrictResult, RealDebridUser } from '../../../shared/types/api';
import { cacheService } from './cacheService';
import { logger } from '../utils/logger';

const RD_BASE = 'https://api.real-debrid.com/rest/1.0';

/**
 * SECURITY: The API token is read exclusively from the server environment.
 * It is never echoed in responses, never logged, never sent to the client.
 */
function getToken(override?: string): string {
  const token = override || process.env.REALDEBRID_API_TOKEN || '';
  if (!token) throw new AppError('Real-Debrid API token is not configured on the server.', 'NO_TOKEN', 401);
  return token;
}

function rdHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

function mapRDError(status: number, data: unknown): AppError {
  const msg = (data as { error?: string })?.error || 'Real-Debrid request failed';
  const code = (data as { error_code?: number })?.error_code;

  if (status === 401) return new AppError('Invalid or expired Real-Debrid token.', 'INVALID_TOKEN', 401);
  if (status === 403) return new AppError('Access forbidden – check your API key permissions.', 'FORBIDDEN', 403);
  if (status === 429) return new AppError('Real-Debrid rate limit reached. Try again shortly.', 'RATE_LIMIT', 429);
  if (code === 2) return new AppError('Bad token – please re-enter your API token.', 'BAD_TOKEN', 401);
  if (code === 8) return new AppError('Permission denied.', 'PERMISSION_DENIED', 403);
  if (code === 10) return new AppError('Two-factor authentication required on your account.', 'TWO_FA_REQUIRED', 403);
  if (code === 20) return new AppError('File unavailable on Real-Debrid.', 'FILE_UNAVAILABLE', 422);
  if (code === 21) return new AppError('Unsupported hoster – Real-Debrid does not support this link.', 'UNSUPPORTED_HOST', 422);
  if (code === 23) return new AppError('Traffic exhausted for this hoster.', 'TRAFFIC_EXHAUSTED', 422);

  return new AppError(msg, 'RD_ERROR', status >= 500 ? 502 : 400);
}

export async function testConnection(tokenOverride?: string): Promise<RealDebridUser> {
  const token = getToken(tokenOverride);
  try {
    const res = await axios.get<RDUser>(`${RD_BASE}/user`, {
      headers: rdHeaders(token),
      timeout: 10_000,
    });
    logger.info('Real-Debrid connection test successful', { username: res.data.username });
    return res.data as RealDebridUser;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      throw mapRDError(err.response.status, err.response.data);
    }
    throw new AppError('Could not reach Real-Debrid API. Check your network connection.', 'NETWORK_ERROR', 503);
  }
}

export async function unrestrictLink(
  link: string,
  password?: string,
  remote?: number,
): Promise<UnrestrictResult> {
  // Check cache first
  const cached = cacheService.get(link);
  if (cached) {
    logger.debug('Cache hit for resolved link');
    return cached;
  }

  const token = getToken();

  const params = new URLSearchParams({ link });
  if (password) params.set('password', password);
  if (remote !== undefined) params.set('remote', String(remote));

  try {
    const res = await axios.post<RDUnrestrictLink>(
      `${RD_BASE}/unrestrict/link`,
      params.toString(),
      {
        headers: {
          ...rdHeaders(token),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15_000,
      },
    );

    const ttlMs = parseInt(process.env.REALDEBRID_CACHE_TTL_MINUTES || '60', 10) * 60 * 1000;
    const result: UnrestrictResult = {
      ...res.data,
      resolvedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttlMs).toISOString(),
    };

    cacheService.set(link, result);
    // SECURITY: do not log the download URL
    logger.info('Link unrestricted', { host: result.host, filename: result.filename });
    return result;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      throw mapRDError(err.response.status, err.response.data);
    }
    throw new AppError('Could not reach Real-Debrid API.', 'NETWORK_ERROR', 503);
  }
}

export async function refreshLink(link: string): Promise<UnrestrictResult> {
  // Force evict cached entry then re-resolve
  cacheService.delete(link);
  return unrestrictLink(link);
}
