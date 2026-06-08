const isDev = process.env.NODE_ENV !== 'production';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}]`;

  // SECURITY: never log tokens, secrets, or full private download URLs
  const safeMeta = meta ? redactSecrets(meta) : undefined;

  if (safeMeta) {
    console[level === 'debug' ? 'log' : level](`${prefix} ${message}`, safeMeta);
  } else {
    console[level === 'debug' ? 'log' : level](`${prefix} ${message}`);
  }
}

/** Strip sensitive keys from log objects */
function redactSecrets(obj: Record<string, unknown>): Record<string, unknown> {
  const REDACTED = '[REDACTED]';
  const SENSITIVE_KEYS = ['token', 'apiToken', 'authorization', 'password', 'secret', 'key', 'download'];
  const result: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(obj)) {
    const lower = k.toLowerCase();
    if (SENSITIVE_KEYS.some(s => lower.includes(s))) {
      result[k] = REDACTED;
    } else {
      result[k] = v;
    }
  }
  return result;
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => {
    if (isDev) log('debug', msg, meta);
  },
};
