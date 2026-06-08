/** Shared API response shapes used by both client and server */

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface HealthResponse {
  status: 'ok';
  version: string;
  timestamp: string;
}

/** Real-Debrid unrestrict result */
export interface UnrestrictResult {
  id: string;
  filename: string;
  mimeType: string;
  filesize: number;
  link: string;       // original input link
  host: string;
  host_icon: string;
  chunks: number;
  crc: number;
  download: string;   // playable stream URL
  streamable: number;
  resolvedAt: string; // ISO timestamp
  expiresAt: string;  // ISO timestamp for cache expiry
}

/** Real-Debrid user account info */
export interface RealDebridUser {
  id: number;
  username: string;
  email: string;
  points: number;
  locale: string;
  avatar: string;
  type: string;
  premium: number;
  expiration: string;
}

export interface CacheStatusResponse {
  resolvedLinks: number;
  totalEntries: number;
  estimatedBytes?: number;
}
