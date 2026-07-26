import { describe, it, expect } from 'vitest';

describe('Site configuration', () => {
  it('SITE_URL should be defined and a valid URL', async () => {
    const { SITE_URL } = await import('@/config/site');
    expect(SITE_URL).toBeDefined();
    expect(SITE_URL).toMatch(/^https?:\/\//);
  });

  it('WHATSAPP_URL should be a valid wa.me link', async () => {
    const { WHATSAPP_URL } = await import('@/config/contact');
    expect(WHATSAPP_URL).toMatch(/^https:\/\/wa\.me\/\d+$/);
  });

  it('BKASH_NUMBER should be a valid BD number', async () => {
    const { BKASH_NUMBER } = await import('@/config/contact');
    expect(BKASH_NUMBER).toMatch(/^0\d{10}$/);
  });
});

describe('getProductGradient', () => {
  it('returns a valid gradient string', async () => {
    const { getProductGradient } = await import('@/components/product-logo-banner');
    const result = getProductGradient('ChatGPT Plus');
    expect(typeof result).toBe('string');
    expect(result).toMatch(/from-/);
    expect(result).toMatch(/to-/);
  });

  it('is deterministic', async () => {
    const { getProductGradient } = await import('@/components/product-logo-banner');
    const a = getProductGradient('ChatGPT');
    const b = getProductGradient('ChatGPT');
    expect(a).toBe(b);
  });

  it('handles empty string', async () => {
    const { getProductGradient } = await import('@/components/product-logo-banner');
    const result = getProductGradient('');
    expect(typeof result).toBe('string');
  });
});

describe('cn utility', () => {
  it('merges class names', async () => {
    const { cn } = await import('@/lib/utils');
    const result = cn('px-4', 'py-2', 'rounded');
    expect(result).toBe('px-4 py-2 rounded');
  });

  it('filters falsy values', async () => {
    const { cn } = await import('@/lib/utils');
    const result = cn('base', false && 'hidden', undefined, 'extra');
    expect(result).toBe('base extra');
  });

  it('handles conditional objects', async () => {
    const { cn } = await import('@/lib/utils');
    const result = cn('base', { active: true, disabled: false });
    expect(result).toContain('base');
    expect(result).toContain('active');
    expect(result).not.toContain('disabled');
  });
});
