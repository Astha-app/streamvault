import { z } from 'zod';

export const UnrestrictSchema = z.object({
  link: z
    .string()
    .url('Must be a valid URL')
    .max(2048, 'URL too long')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'Only HTTP/HTTPS links are supported',
    ),
  password: z.string().max(256).optional(),
  remote: z.number().int().min(0).max(1).optional(),
});

export const TestConnectionSchema = z.object({
  /** Optionally allow the user to test with a provided token during setup.
   *  The server will NEVER echo this token back or log it.
   *  For production use, rely on the server's .env REALDEBRID_API_TOKEN. */
  token: z.string().min(1).max(256).optional(),
});

export type UnrestrictInput = z.infer<typeof UnrestrictSchema>;
export type TestConnectionInput = z.infer<typeof TestConnectionSchema>;
