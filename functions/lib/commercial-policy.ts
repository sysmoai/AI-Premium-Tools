export const AIPT_COMMERCIAL_REVISION = "aipt-pricing-v2-2026-09-17";

export type ApprovedCommercialState = "CUSTOMER_OWNED" | "AUTHORIZED_SEAT";

export type CommercialRule = {
  id: string;
  pattern: RegExp;
  whereSql: string;
  priceBdt: number;
  state: ApprovedCommercialState;
  planType: "monthly";
  deliveryType: "customer_account_activation" | "provider_workspace_seat";
  featured: boolean;
  minQuantity: number;
  canonicalName?: string;
};

/**
 * AIPT production commerce allow-list.
 *
 * Anything not matched here is HOLD/PROHIBITED and is never eligible for
 * direct checkout. Shared-credential offers are intentionally absent.
 * Prices are the owner-approved 2026-09-17 register, except where a provider
 * changed its official monthly price before deployment and the approved
 * profit formula therefore produces a lower/current governed price.
 */
export const AIPT_COMMERCIAL_RULES: readonly CommercialRule[] = [
  { id: "chatgpt-plus", pattern: /^ChatGPT Plus.*Personal$/i, whereSql: "name LIKE 'ChatGPT Plus%Personal%'", priceBdt: 3390, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: true, minQuantity: 1 },
  { id: "chatgpt-go", pattern: /^ChatGPT Go.*Personal$/i, whereSql: "name LIKE 'ChatGPT Go%Personal%'", priceBdt: 1299, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: true, minQuantity: 1 },

  { id: "claude-pro", pattern: /^Claude Pro.*Personal$/i, whereSql: "name LIKE 'Claude Pro%Personal%'", priceBdt: 3390, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: true, minQuantity: 1 },
  { id: "claude-max-5x", pattern: /^Claude Max 5x.*Personal$/i, whereSql: "name LIKE 'Claude Max 5x%Personal%'", priceBdt: 16790, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: false, minQuantity: 1 },
  { id: "claude-max-20x", pattern: /^Claude Max 20x.*Personal$/i, whereSql: "name LIKE 'Claude Max 20x%Personal%'", priceBdt: 33590, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: false, minQuantity: 1 },
  { id: "claude-team-standard", pattern: /^Claude Team.*Seat$/i, whereSql: "name LIKE 'Claude Team%Seat%'", priceBdt: 4290, state: "AUTHORIZED_SEAT", planType: "monthly", deliveryType: "provider_workspace_seat", featured: false, minQuantity: 2, canonicalName: "Claude Team Standard — Workspace Seat" },

  { id: "google-ai-pro", pattern: /^Google AI Pro(?: \(Gemini Advanced\))?(?:.*Personal)?$/i, whereSql: "name LIKE 'Google AI Pro%'", priceBdt: 3390, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: true, minQuantity: 1 },
  { id: "supergrok", pattern: /^SuperGrok(?! Lite).*Personal$/i, whereSql: "name LIKE 'SuperGrok%Personal%' AND name NOT LIKE '%Lite%'", priceBdt: 5090, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: false, minQuantity: 1 },

  { id: "perplexity-pro", pattern: /^Perplexity Pro.*Personal$/i, whereSql: "name LIKE 'Perplexity Pro%Personal%'", priceBdt: 3390, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: true, minQuantity: 1 },
  { id: "perplexity-max", pattern: /^Perplexity Max.*Personal$/i, whereSql: "name LIKE 'Perplexity Max%Personal%'", priceBdt: 33590, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: false, minQuantity: 1 },

  { id: "midjourney-standard", pattern: /^Midjourney Standard.*Personal$/i, whereSql: "name LIKE 'Midjourney Standard%Personal%'", priceBdt: 5090, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: true, minQuantity: 1 },
  { id: "midjourney-pro", pattern: /^Midjourney Pro.*Personal$/i, whereSql: "name LIKE 'Midjourney Pro%Personal%'", priceBdt: 10090, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: false, minQuantity: 1 },
  { id: "midjourney-mega", pattern: /^Midjourney Mega.*Personal$/i, whereSql: "name LIKE 'Midjourney Mega%Personal%'", priceBdt: 20190, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: false, minQuantity: 1 },

  { id: "ideogram-plus", pattern: /^Ideogram Plus.*Personal$/i, whereSql: "name LIKE 'Ideogram Plus%Personal%'", priceBdt: 3390, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: false, minQuantity: 1 },
  { id: "ideogram-pro", pattern: /^Ideogram Pro.*Personal$/i, whereSql: "name LIKE 'Ideogram Pro%Personal%'", priceBdt: 10090, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: false, minQuantity: 1 },

  { id: "runway-standard", pattern: /^Runway Standard.*Personal$/i, whereSql: "name LIKE 'Runway Standard%Personal%'", priceBdt: 2690, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: false, minQuantity: 1 },
  { id: "runway-pro", pattern: /^Runway Pro.*Personal$/i, whereSql: "name LIKE 'Runway Pro%Personal%'", priceBdt: 5890, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: false, minQuantity: 1 },

  { id: "elevenlabs-starter", pattern: /^ElevenLabs Starter.*Personal$/i, whereSql: "name LIKE 'ElevenLabs Starter%Personal%'", priceBdt: 1390, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: false, minQuantity: 1 },
  { id: "elevenlabs-creator", pattern: /^ElevenLabs Creator.*Personal$/i, whereSql: "name LIKE 'ElevenLabs Creator%Personal%'", priceBdt: 3690, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: false, minQuantity: 1 },
  { id: "elevenlabs-pro", pattern: /^ElevenLabs Pro.*Personal$/i, whereSql: "name LIKE 'ElevenLabs Pro%Personal%'", priceBdt: 16690, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: false, minQuantity: 1 },

  { id: "suno-pro", pattern: /^Suno AI Pro.*Personal$/i, whereSql: "name LIKE 'Suno AI Pro%Personal%'", priceBdt: 1990, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: false, minQuantity: 1 },
  { id: "suno-premier", pattern: /^Suno AI Premier.*Personal$/i, whereSql: "name LIKE 'Suno AI Premier%Personal%'", priceBdt: 5090, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: false, minQuantity: 1 },

  { id: "github-copilot-pro", pattern: /^GitHub Copilot Pro(?!\+).*Personal$/i, whereSql: "name LIKE 'GitHub Copilot Pro%Personal%' AND name NOT LIKE '%Pro+%'", priceBdt: 1990, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: false, minQuantity: 1 },
  { id: "github-copilot-pro-plus", pattern: /^GitHub Copilot Pro\+.*Personal$/i, whereSql: "name LIKE 'GitHub Copilot Pro+%Personal%'", priceBdt: 6590, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: false, minQuantity: 1 },
  { id: "cursor-pro", pattern: /^Cursor Pro(?!\+).*Personal$/i, whereSql: "name LIKE 'Cursor Pro%Personal%' AND name NOT LIKE '%Pro+%'", priceBdt: 3390, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: false, minQuantity: 1 },
  { id: "cursor-pro-plus", pattern: /^Cursor Pro\+.*Personal$/i, whereSql: "name LIKE 'Cursor Pro+%Personal%'", priceBdt: 10090, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: false, minQuantity: 1 },
  { id: "replit-core", pattern: /^Replit Core.*Personal$/i, whereSql: "name LIKE 'Replit Core%Personal%'", priceBdt: 3390, state: "CUSTOMER_OWNED", planType: "monthly", deliveryType: "customer_account_activation", featured: false, minQuantity: 1 },
] as const;

export function findCommercialRule(name: string): CommercialRule | null {
  return AIPT_COMMERCIAL_RULES.find((rule) => rule.pattern.test(name)) ?? null;
}

export function isCommerciallyValidProduct(row: {
  name: unknown;
  price_bdt: unknown;
  is_active: unknown;
  commercial_state?: unknown;
}): boolean {
  const name = String(row.name ?? "");
  const rule = findCommercialRule(name);
  if (!rule) return false;
  if (Number(row.is_active) !== 1 && row.is_active !== true) return false;
  if (Number(row.price_bdt) !== rule.priceBdt) return false;
  if (row.commercial_state != null && String(row.commercial_state) !== rule.state) return false;
  return !/shared/i.test(name);
}

export const AIPT_REQUIRED_PRODUCTS = [
  "ChatGPT Plus",
  "Claude Pro",
  "Google AI Pro",
  "Perplexity Pro",
  "Midjourney Standard",
] as const;
