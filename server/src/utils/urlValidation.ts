/**
 * URL validation for backend proxy security.
 *
 * SECURITY: We only allow requests to the official Real-Debrid API.
 * This prevents open-proxy abuse where attackers could use our server
 * to make arbitrary outbound requests.
 */

const ALLOWED_HOSTS = ['api.real-debrid.com'];

export function isAllowedApiHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_HOSTS.some(host => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Validate that a user-supplied link is a plausible URL to unrestrict.
 *  Does NOT validate the host — Real-Debrid handles host support. */
export function isValidUnrestrictLink(value: string): boolean {
  return isValidHttpUrl(value) && value.length < 2048;
}
