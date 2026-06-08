import { describe, it, expect } from 'vitest';
import { UnrestrictSchema, TestConnectionSchema } from '../schemas/realDebrid.schema';

describe('UnrestrictSchema', () => {
  it('accepts a valid HTTPS URL', () => {
    const result = UnrestrictSchema.safeParse({ link: 'https://some-hoster.com/file.zip' });
    expect(result.success).toBe(true);
  });

  it('rejects non-URL', () => {
    const result = UnrestrictSchema.safeParse({ link: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects missing link', () => {
    const result = UnrestrictSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts optional password', () => {
    const result = UnrestrictSchema.safeParse({ link: 'https://hoster.com/file', password: 'secret' });
    expect(result.success).toBe(true);
  });
});

describe('TestConnectionSchema', () => {
  it('accepts empty body', () => {
    expect(TestConnectionSchema.safeParse({}).success).toBe(true);
  });
  it('accepts optional token', () => {
    expect(TestConnectionSchema.safeParse({ token: 'abc123' }).success).toBe(true);
  });
  it('rejects token over 256 chars', () => {
    expect(TestConnectionSchema.safeParse({ token: 'a'.repeat(257) }).success).toBe(false);
  });
});
