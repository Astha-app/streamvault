/** Extract a safe, non-leaking error message from unknown thrown values */
export function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    // Avoid leaking internal paths or stack details in production
    return err.message;
  }
  if (typeof err === 'string') return err;
  return 'An unexpected error occurred';
}

export function isAxiosError(err: unknown): err is { response?: { status: number; data: unknown }; message: string } {
  return typeof err === 'object' && err !== null && 'isAxiosError' in err;
}
