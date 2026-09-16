#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const storeRoot = path.join(repoRoot, 'artifacts', 'aipt-store');

function rewrite(relativePath, replacements) {
  const file = path.join(storeRoot, relativePath);
  let text = fs.readFileSync(file, 'utf8');
  const before = text;
  for (const [from, to] of replacements) text = text.split(from).join(to);
  if (text !== before) fs.writeFileSync(file, text);
  return text === before ? 0 : 1;
}

let changed = 0;

changed += rewrite('index.html', [
  ['<title>AIPT — Affordable AI Subscriptions in Bangladesh | ChatGPT, Claude, Midjourney</title>', '<title>AIPT — AI Subscriptions in Bangladesh | ChatGPT, Claude, Midjourney</title>'],
  ['<meta name="description" content="Bangladesh\'s #1 store for premium AI subscriptions. ChatGPT Plus, Claude Pro, Midjourney, Canva Pro and 70+ more — paid in BDT via bKash, Nagad or bank. 1-hour activation, 30-day warranty." />', '<meta name="description" content="AIPT is a Bangladesh-based store for selected premium AI subscriptions with current BDT pricing and provider-compatible activation support." />'],
  ['<meta property="og:title" content="AIPT — Affordable AI Subscriptions in Bangladesh" />', '<meta property="og:title" content="AIPT — AI Subscriptions in Bangladesh" />'],
  ['<meta property="og:description" content="Premium AI tools at student-friendly BDT prices. Pay via bKash, Nagad, or bank. 1-hour delivery." />', '<meta property="og:description" content="Selected premium AI subscriptions with current BDT pricing and supported activation for Bangladesh customers." />'],
  ['<meta name="twitter:title" content="AIPT — Affordable AI Subscriptions in Bangladesh" />', '<meta name="twitter:title" content="AIPT — AI Subscriptions in Bangladesh" />'],
  ['<meta name="twitter:description" content="Premium AI tools at student-friendly BDT prices. 1-hour delivery, 30-day warranty." />', '<meta name="twitter:description" content="Selected premium AI subscriptions with current BDT pricing and supported activation for Bangladesh customers." />'],
  ['"description": "Bangladesh\'s most affordable store for premium AI subscriptions."', '"description": "Bangladesh-based store for selected premium AI subscriptions with current BDT pricing."'],
]);

changed += rewrite('src/pages/about.tsx', [
  ['"AIPT is Bangladesh\'s most affordable, most trusted store for premium AI subscriptions. Operating since 2023, we deliver tools like ChatGPT, Claude, Midjourney and Canva Pro in BDT — paid via bKash, Nagad or bank, with 1-hour activation and a 30-day warranty."', '"AIPT is a Bangladesh-based store for selected premium AI subscriptions. We provide clear BDT pricing and confirm the supported provider-compatible activation method for each direct-sale plan."'],
  ['"Bangladesh\'s most affordable, most trusted store for premium AI subscriptions, operating since 2023."', '"Bangladesh-based store for selected premium AI subscriptions with current BDT pricing and supported activation."'],
  ['{ Icon: Clock, title: "1-hour activation", body: "Credentials delivered to your WhatsApp within 60 minutes during 10am–11pm BD time." },', '{ Icon: Clock, title: "Activation confirmation", body: "AIPT confirms the supported activation method and expected timing after payment verification." },'],
  ['{ Icon: ShieldCheck, title: "30-day warranty", body: "Free replacement on every subscription if anything breaks during your access window." },', '{ Icon: ShieldCheck, title: "Order-linked support", body: "Access issues are reviewed using the order status, supported activation method, and current provider state." },'],
  ['AIPT (AI Premium Tools) is Bangladesh\'s most affordable store for premium AI subscriptions — from ChatGPT and Claude to Midjourney, Canva Pro and 70+ more.', 'AIPT (AI Premium Tools) is a Bangladesh-based store for selected premium AI subscriptions, including supported plans from major AI providers.'],
  ['We started in 2023 because most AI tools price themselves in USD, settle in international cards, and answer support tickets only in English. For a student in Sylhet, a freelancer in Chittagong, or a small business in Dhaka, that turned a $20/month tool into a 30-minute headache and a 25%+ FX markup.', 'AIPT focuses on making supported AI subscriptions easier to purchase in Bangladesh with clear BDT pricing, local payment support, and provider-compatible activation.'],
  ['AIPT removes every one of those barriers. You see the price in BDT. You pay with bKash. You get your account on WhatsApp within an hour. And if anything breaks for 30 days, we replace it for free — no questions, no email tickets.', 'For direct-sale plans, AIPT confirms the current price and supported access method, verifies payment, and provides activation guidance through its support channels.'],
  ['We never sell cracked accounts. Every subscription is sourced from official channels, which is exactly why we can stand behind a 30-day warranty.', 'AIPT does not accept cracked or hacked access. Products that cannot be verified against the current pricing and access rules are held for confirmation instead of being sold automatically.'],
  ['Browse 70+ AI subscriptions or chat with us on WhatsApp first.', 'Browse currently verified direct-sale plans or chat with AIPT on WhatsApp for a plan that requires confirmation.'],
]);

console.log(`[aipt-static-remediation] applied to ${changed} source file(s)`);
