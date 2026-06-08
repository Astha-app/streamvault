import axios from 'axios';

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (typeof data === 'object' && data !== null && 'error' in data) {
      return String((data as { error: string }).error);
    }
    if (err.response?.status === 404) return 'API endpoint not found. Is the server running?';
    if (err.response?.status === 429) return 'Rate limit reached. Please slow down.';
    if (!err.response) return 'Cannot connect to server. Make sure the backend is running.';
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred.';
}

export type VideoErrorType =
  | 'network'
  | 'format'
  | 'expired'
  | 'unavailable'
  | 'invalid_token'
  | 'rate_limit'
  | 'unsupported_host'
  | 'browser_unsupported'
  | 'unknown';

export function classifyVideoError(err: unknown): VideoErrorType {
  const msg = getErrorMessage(err).toLowerCase();
  if (msg.includes('token') || msg.includes('401')) return 'invalid_token';
  if (msg.includes('rate limit') || msg.includes('429')) return 'rate_limit';
  if (msg.includes('expired')) return 'expired';
  if (msg.includes('unsupported host') || msg.includes('unsupported hoster')) return 'unsupported_host';
  if (msg.includes('unavailable')) return 'unavailable';
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('connect')) return 'network';
  if (msg.includes('format') || msg.includes('codec') || msg.includes('decode')) return 'format';
  return 'unknown';
}
