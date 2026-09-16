#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const mode = process.argv[2];
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const storeRoot = path.join(repoRoot, 'artifacts', 'aipt-store');

function walk(dir, predicate, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, predicate, out);
    else if (predicate(p)) out.push(p);
  }
  return out;
}

function replaceAll(file, replacements) {
  if (!fs.existsSync(file)) return 0;
  let text = fs.readFileSync(file, 'utf8');
  const before = text;
  for (const [from, to] of replacements) text = text.split(from).join(to);
  if (text !== before) fs.writeFileSync(file, text);
  return text === before ? 0 : 1;
}

function sanitizeSource() {
  const sourceFiles = walk(path.join(storeRoot, 'src'), (p) => /\.[cm]?[jt]sx?$/.test(p));
  let changed = 0;

  // Generic commercial-claim cleanup across the storefront source. These are
  // deterministic text changes only; they do not redesign layout/components.
  const globalReplacements = [
    ["Bangladesh's most affordable store for premium AI subscriptions.", "Bangladesh-based store for supported premium AI subscriptions."],
    ["Bangladesh's #1 store for premium AI subscriptions.", "Bangladesh-based store for supported premium AI subscriptions."],
    ["Bangladesh's #1 Student AI Store", "Bangladesh AI Subscription Store"],
    ["30-Day Warranty", "Support Included"],
    ["30-day replacement warranty", "support during the confirmed service period"],
    ["30-day warranty", "support during the confirmed service period"],
    ["1-Hour Activation", "Activation Support"],
    ["1-hour activation", "activation after payment confirmation"],
    ["Access within 1 hour", "Activation after payment confirmation"],
    ["within 1 hour", "after payment confirmation"],
    ["Login credentials", "Supported activation details"],
    ["login credentials", "supported activation details"],
    ["Account replaced if anything fails", "Issue review via WhatsApp"],
    ["Replaced if it fails", "Issue review via WhatsApp"],
    ["Free swap during warranty period", "Resolution based on provider/account status"],
    ["Free swap in warranty", "Resolution based on provider/account status"],
    ["no questions asked", "after order verification"],
    ["Direct vendor (after BD VAT + FX)", "Provider checkout reference (when verified)"],
  ];
  for (const file of sourceFiles) changed += replaceAll(file, globalReplacements);

  const home = path.join(storeRoot, 'src', 'pages', 'home.tsx');
  changed += replaceAll(home, [
    ['const totalCustomersClaim = "1000+";', 'const totalCustomersClaim = "BDT";'],
    ['AIPT sells ChatGPT Plus subscriptions in Bangladesh starting from ৳999/month. Pay in BDT via bKash, Nagad, Rocket, Upay, or bank transfer — receive your login on WhatsApp after payment confirmation, backed by a support during the confirmed service period.', 'AIPT offers ChatGPT Plus at the current approved AIPT price when customer-specific activation is supported. Pay in BDT via supported local methods; activation details are confirmed before payment completion.'],
    ['Yes. AIPT has been operating since 2023 with thousands of deliveries. Every account is sourced from official channels — never cracked or hacked — and is covered by a support during the confirmed service period. If we miss the 24-hour delivery SLA you receive a full refund.', 'AIPT only lists direct-sale plans that pass the current pricing and access checks. Unsupported shared-credential or unverified offers are held for confirmation rather than sold automatically.'],
    ['Most orders are delivered after payment confirmation of payment confirmation, between 10am and 11pm Bangladesh time. Late-night orders are processed first thing the following morning.', 'Activation timing depends on the provider and supported access method. AIPT confirms the expected activation process after payment verification.'],
    ['Message AIPT on WhatsApp with your order ID — we replace failed accounts free of charge during the support during the confirmed service period window.', 'Message AIPT on WhatsApp with your order ID. We review access issues against the confirmed order, provider status, and supported activation method.'],
    ['Direct vendor pricing in Bangladesh adds 15% VAT plus FX markup, and requires an international credit card. AIPT pools verified subscriptions and bills locally in BDT, passing the savings to Bangladeshi students, freelancers, and creators.', 'AIPT shows a final BDT service price for verified direct-sale plans. Dynamic checkout, tax, FX, provider terms, or unsupported access structures are confirmed before an order is accepted.'],
    ['title: "AIPT — Affordable AI Subscriptions in Bangladesh | ChatGPT, Claude, Midjourney",', 'title: "AIPT — AI Subscriptions in Bangladesh | ChatGPT, Claude, Midjourney",'],
    ['priceRange: "৳499–৳9,999",', 'priceRange: "BDT",'],
    ['Your trusted partner for affordable educational and freelancing tool subscriptions. Premium AI tools at prices everyone can afford.', 'Bangladesh-based support for selected premium AI subscriptions with clear BDT pricing and provider-compatible activation.'],
    ['<Shield className="h-4 w-4 text-violet-300" /> Trusted by {totalCustomersClaim} students', '<Shield className="h-4 w-4 text-violet-300" /> {totalCustomersClaim} payment support'],
    ['<Star className="h-4 w-4 text-violet-300" /> 4.9/5 rating', '<Star className="h-4 w-4 text-violet-300" /> Verified-order reviews only'],
    ['{ label: "Happy Customers", value: totalCustomersClaim },', '{ label: "Local Payments", value: "BDT" },'],
    ['{ label: "Avg Savings", value: "20%" },', '{ label: "Price Review", value: "Current" },'],
    ['{ label: "Delivery Time", value: "1 hr" },', '{ label: "Activation", value: "Confirmed" },'],
    ['Most orders are delivered to your WhatsApp after payment confirmation, and every subscription is', 'Supported plans are activated after payment confirmation, and each order is'],
    ['covered by a <strong>support during the confirmed service period</strong>.', 'handled according to the confirmed access method and current provider terms.'],
    ['<h2 className="text-3xl font-black mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>What our customers say</h2>', '<h2 className="text-3xl font-black mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>How AIPT verifies trust</h2>'],
    ['<p className="text-muted-foreground">Real reviews from Bangladeshi students, freelancers and creators</p>', '<p className="text-muted-foreground">Only order-linked reviews are presented as verified customer feedback.</p>'],
    ['name: "Tahmid R.",', 'name: "Verified reviews",'],
    ['role: "Freelance designer · Dhaka",', 'role: "Order-linked feedback",'],
    ['quote: "Got my Midjourney within 40 minutes of paying via bKash. Been using it for 4 months without a single issue. Saved me thousands of taka vs paying directly.",', 'quote: "Reviews shown on product pages are marked verified only when the review can be linked to a matching order.",'],
    ['tool: "Midjourney",', 'tool: "Review policy",'],
    ['name: "Sumaiya I.",', 'name: "Clear pricing",'],
    ['role: "BUET student · Researcher",', 'role: "Approved catalog",'],
    ['quote: "ChatGPT Plus at this price is unbeatable in BD. Support replied to my WhatsApp in 5 minutes when I had a login question. Will keep renewing.",', 'quote: "Direct-sale prices are projected from the approved AIPT register; plans that cannot be verified are held for confirmation.",'],
    ['tool: "ChatGPT Plus",', 'tool: "Pricing",'],
    ['name: "Imran H.",', 'name: "Supported access",'],
    ['role: "Content creator · Chittagong",', 'role: "Provider-compatible activation",'],
    ['quote: "Tried two other sellers before AIPT — both had problems. AIPT delivered within an hour and gave a real warranty. This is the only place I buy from now.",', 'quote: "AIPT does not publish unsupported shared-credential offers as direct-sale products and confirms the access structure before activation.",'],
    ['tool: "Canva Pro",', 'tool: "Access",'],
    ['Join 1000+ Bangladeshi customers already using AIPT tools.', 'Choose a verified plan or ask AIPT to confirm the current price and supported access method for your use case.'],
    ['### 15–20% Lower Prices', '### Clear BDT Pricing'],
  ]);

  const productDetail = path.join(storeRoot, 'src', 'pages', 'product-detail.tsx');
  changed += replaceAll(productDetail, [
    ['a: `After we confirm your payment, we send your supported activation details directly via WhatsApp. Activation usually completes after payment confirmation during 10am–11pm daily.`,', 'a: `After payment verification, AIPT confirms the supported activation method for ${productName}. Customer-specific or provider-supported access is used where available; timing depends on the provider.`,'],
    ['a: "Yes — every account we provide is sourced from official channels. We never use cracked, hacked, or modified accounts. That\'s why we offer a support during the confirmed service period."', 'a: "AIPT only offers access methods that pass the current commercial and provider-compatibility checks. Unsupported shared credentials and unverified methods are not accepted for direct checkout."'],
    ['a: `If your account fails for any reason during the ${durationDays}-day period, simply message us on WhatsApp and we\'ll replace it free of charge — after order verification.`', 'a: `If access changes during the ${durationDays}-day service period, message AIPT with your order ID. We review the issue against the confirmed order and current provider status.`'],
    ['a: "Shared plans are intended for single-user usage from one device at a time. For team/family use, please look at our Personal/Premium tiers which allow multi-device login."', 'a: "AIPT does not treat credential sharing as an official access model. Use personal or provider-supported team/workspace access according to the provider terms."'],
    ['a: "Yes — if we\'re unable to deliver your order within 24 hours, you get a full refund. Once delivered, we offer free replacement instead of refund within the warranty period."', 'a: "Order resolution depends on payment status, activation status, and the confirmed service terms. Contact AIPT with the order ID for review before any resolution is promised."'],
    ['`Pay via bKash, Nagad, Rocket, Upay or bank. activation after payment confirmation, support during the confirmed service period.`', '`Pay in BDT via supported local methods. Activation timing and support are confirmed for the selected plan.`'],
    ['description: baseDesc || `${product.name} subscription available in Bangladesh from AIPT — pay in BDT, activation after payment confirmation, support during the confirmed service period.`,', 'description: baseDesc || `${product.name} subscription available in Bangladesh from AIPT with current BDT pricing and provider-compatible activation.`,'],
    ['merchantReturnDays: 30,', 'merchantReturnDays: 0,'],
    ['returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",', 'returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",'],
    ['{ "@type": "PropertyValue", name: "Activation time", value: "Within 1 hour (10am–11pm BD time)" },', '{ "@type": "PropertyValue", name: "Activation timing", value: "Confirmed after payment based on provider/access method" },'],
    ['{ "@type": "PropertyValue", name: "Authenticity", value: "Genuine subscription from official channels" },', '{ "@type": "PropertyValue", name: "Access policy", value: "Customer-specific or provider-supported access where available" },'],
    ['{ Icon: Wallet, title: "1. Place your order", desc: "Add to cart and pay via bKash, Nagad, Rocket, Upay, or bank transfer." },', '{ Icon: Wallet, title: "1. Place your order", desc: "Choose a verified direct-sale plan and pay via a supported local payment method." },'],
    ['{ Icon: Check, title: "2. We confirm payment", desc: "Our team verifies your transaction within 30 minutes (10am–11pm)." },', '{ Icon: Check, title: "2. We confirm payment", desc: "Our team verifies the transaction and the current provider/access requirements." },'],
    ['{ Icon: Sparkles, title: "3. Receive your access", desc: `Supported activation details for ${product.name} are delivered straight to your WhatsApp — usually after payment confirmation.` },', '{ Icon: Sparkles, title: "3. Activate the plan", desc: `AIPT confirms the supported activation method for ${product.name}; timing depends on the provider and account state.` },'],
    ['<h3 className="font-bold mb-3 text-base">Warranty & replacement</h3>', '<h3 className="font-bold mb-3 text-base">Support & issue resolution</h3>'],
    ['Every order comes with a <strong>support during the confirmed service period</strong>. If your access ever stops working during the\n                    warranty window, message us on WhatsApp and we will replace your account free of charge — after order verification.', 'If access changes during the confirmed service period, message AIPT with your order ID. We review the issue against the order state, supported access method, and current provider status before confirming a resolution.'],
    ['We never sell cracked or hacked accounts. Every {product.name} subscription is sourced from official channels,\n                    which is why we can stand behind it with a real warranty.', 'AIPT does not accept cracked or hacked access. Direct-sale plans must pass the current pricing and access checks before checkout.'],
    ['"Free replacement during the warranty period",', '"Issue review using your order ID",'],
    ['"Full refund if we cannot deliver within 24 hours",', '"Resolution confirmed from payment and activation status",'],
    ['"Lifetime WhatsApp support during your subscription",', '"WhatsApp support during the confirmed service period",'],
    ['<Check className="h-4 w-4 text-green-500 shrink-0" /> Activation in 1 hour', '<Check className="h-4 w-4 text-green-500 shrink-0" /> Activation method confirmed after payment'],
    ['<Check className="h-4 w-4 text-green-500 shrink-0" /> support during the confirmed service period', '<Check className="h-4 w-4 text-green-500 shrink-0" /> Support based on confirmed order/access status'],
  ]);

  const footer = path.join(storeRoot, 'src', 'components', 'footer.tsx');
  changed += replaceAll(footer, [
    ['We pay the foreign card so students,\n                freelancers and creators here can use ChatGPT, Claude, Midjourney and more — at fair BDT pricing.', 'AIPT supports selected premium AI subscriptions with clear BDT pricing and provider-compatible activation for Bangladesh customers.'],
  ]);

  console.log(`[aipt-commercial-guard] source commercial truth applied to ${changed} file(s)`);
}

function auditOutput() {
  const dist = path.join(storeRoot, 'dist', 'public');
  const files = walk(dist, (p) => /\.(?:html|js)$/i.test(p));
  if (files.length === 0) throw new Error('AIPT commercial output audit: no built HTML/JS files found');

  const banned = [
    /Bangladesh's #1/i,
    /Bangladesh's most affordable/i,
    /Trusted by 1000\+/i,
    /4\.9\/5 rating/i,
    /30-Day Warranty/i,
    /30-day warranty/i,
    /1-Hour Activation/i,
    /Access within 1 hour/i,
    /login credentials/i,
    /Account replaced if anything fails/i,
    /Free swap during warranty period/i,
    /no questions asked/i,
    /AIPT pools verified subscriptions/i,
    /Got my Midjourney within 40 minutes/i,
    /ChatGPT Plus at this price is unbeatable/i,
    /Tried two other sellers before AIPT/i,
  ];

  const violations = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const rx of banned) {
      if (rx.test(text)) violations.push(`${path.relative(repoRoot, file)} :: ${rx}`);
    }
  }
  if (violations.length) {
    console.error('AIPT commercial output audit blocked unsupported claims:');
    for (const v of violations) console.error(`- ${v}`);
    process.exit(1);
  }
  console.log(`[aipt-commercial-guard] output PASS — ${files.length} built HTML/JS file(s), revision aipt-pricing-v2-2026-09-17`);
}

if (mode === 'pre') sanitizeSource();
else if (mode === 'post') auditOutput();
else {
  console.error('Usage: node scripts/aipt-commercial-build-guard.mjs <pre|post>');
  process.exit(2);
}
