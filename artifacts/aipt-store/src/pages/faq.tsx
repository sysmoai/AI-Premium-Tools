import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Search, MessageCircle, ArrowRight, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSeo } from "@/hooks/use-seo";
import { WHATSAPP_URL } from "@/config/contact";

interface FaqItem { q: string; a: string }

const FAQ_GROUPS: Array<{ title: string; items: FaqItem[] }> = [
  {
    title: "Ordering & Payment",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept bKash, Nagad, Rocket, Upay, and direct bank transfer. All payments are made in BDT — no need for international cards or currency conversion.",
      },
      {
        q: "How do I place an order?",
        a: "Add the tools you want to your cart, click checkout, fill in your name and WhatsApp number, choose your payment method, send the payment, and submit your transaction reference. We'll confirm and deliver within 1 hour.",
      },
      {
        q: "Is it safe to pay before receiving the account?",
        a: "Yes — AIPT has been operating since 2023 with thousands of successful deliveries. Every order is backed by our 30-day warranty. If we can't deliver within 24 hours, you get a full refund.",
      },
      {
        q: "Do you accept advance payment from new customers?",
        a: "Yes. Our reputation is built on consistent delivery and visible reviews. New customers can also start with our lowest-priced shared plans to verify our service before purchasing premium tiers.",
      },
    ],
  },
  {
    title: "Delivery & Activation",
    items: [
      {
        q: "How long does delivery take?",
        a: "Most orders are delivered within 1 hour of payment confirmation, between 10am and 11pm Bangladesh time. Late-night orders are delivered first thing the following morning.",
      },
      {
        q: "How will I receive my login credentials?",
        a: "Credentials are sent directly to the WhatsApp number you provided at checkout. We never share details over email or SMS for security reasons.",
      },
      {
        q: "Can I activate the tool on multiple devices?",
        a: "It depends on the plan. Shared plans are intended for single-device use at a time. Personal/Premium plans allow simultaneous logins on multiple devices. The product page lists which tier you're buying.",
      },
    ],
  },
  {
    title: "Warranty & Support",
    items: [
      {
        q: "What does the 30-day warranty cover?",
        a: "If your account stops working at any point during the 30-day period — login issues, password changes, suspended access — we replace it free of charge. Just message us on WhatsApp with your order ID.",
      },
      {
        q: "What if my account stops working after 30 days?",
        a: "Most subscriptions last 30 days, so the warranty covers the full duration. For longer durations or recurring use, you can renew at the same discounted price.",
      },
      {
        q: "Do you offer refunds?",
        a: "Yes. If we cannot deliver within 24 hours, you receive a full refund. After delivery, we offer free replacement instead of a cash refund — this keeps prices low for everyone.",
      },
      {
        q: "How do I contact support?",
        a: "WhatsApp is the fastest way to reach us — typically responding within minutes during 10am–11pm. You can also use the chat icon in the bottom-right of any page.",
      },
    ],
  },
  {
    title: "Account & Sharing",
    items: [
      {
        q: "Can I change the password on my account?",
        a: "For shared plans, please don't — it will lock other users out and void your warranty. For personal plans, you can fully customize the credentials after activation.",
      },
      {
        q: "Will I get notified before my subscription expires?",
        a: "Yes, we send a renewal reminder via WhatsApp 3 days before your access expires, with a one-click renewal link.",
      },
      {
        q: "Can I gift a subscription to someone else?",
        a: "Absolutely. During checkout, just provide the recipient's WhatsApp number in the notes field, and we'll deliver directly to them.",
      },
    ],
  },
  {
    title: "For Resellers & Bulk Buyers",
    items: [
      {
        q: "Do you offer reseller pricing?",
        a: "Yes. If you're planning to resell or order in bulk (5+ accounts/month), reach out on WhatsApp for tiered pricing and a dedicated account manager.",
      },
      {
        q: "Do you have an affiliate program?",
        a: "We're piloting an affiliate program for content creators and student groups in Bangladesh. Message us on WhatsApp to apply.",
      },
    ],
  },
];

const ALL_ITEMS: Array<FaqItem & { group: string }> = FAQ_GROUPS.flatMap(g =>
  g.items.map(i => ({ ...i, group: g.title }))
);

export default function Faq() {
  const [query, setQuery] = useState("");

  useSeo({
    title: "FAQ — AI Subscriptions in Bangladesh | AIPT",
    description: "Answers to common questions about ordering, payment, delivery, warranty and support for premium AI subscriptions at AIPT.",
    keywords: "AIPT FAQ, AI subscription Bangladesh FAQ, bKash AI questions, ChatGPT delivery Bangladesh",
    type: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: ALL_ITEMS.map(item => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  });

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return FAQ_GROUPS;
    const q = query.toLowerCase();
    return FAQ_GROUPS
      .map(g => ({ ...g, items: g.items.filter(i => i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q)) }))
      .filter(g => g.items.length > 0);
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
      <div className="text-center mb-8">
        <div
          className="inline-flex h-14 w-14 rounded-2xl items-center justify-center text-white mb-4 shadow-lg"
          style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))" }}
        >
          <HelpCircle className="h-7 w-7" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
          Frequently Asked Questions
        </h1>
        <p className="text-muted-foreground">Everything you need to know about ordering AI subscriptions from AIPT.</p>
      </div>

      <div className="relative max-w-xl mx-auto mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10 h-11"
          placeholder="Search the FAQ…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          data-testid="input-faq-search"
        />
      </div>

      {filteredGroups.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="mb-4">No answers found for "{query}". Try a different keyword.</p>
            <Button variant="outline" onClick={() => setQuery("")}>Clear search</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map(group => (
            <Card key={group.title}>
              <CardContent className="p-6">
                <h2 className="font-bold text-lg mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>
                  {group.title}
                </h2>
                <Accordion type="single" collapsible>
                  {group.items.map((item, i) => (
                    <AccordionItem key={i} value={`${group.title}-${i}`}>
                      <AccordionTrigger className="text-left text-sm font-semibold" data-testid={`faq-q-${group.title.toLowerCase().replace(/\s+/g, "-")}-${i}`}>
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-8">
        <CardContent className="p-6 text-center">
          <h3 className="font-bold text-lg mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>
            Still have questions?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Our team replies on WhatsApp within minutes during 10am–11pm.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg text-white font-semibold transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #25d366, #128c7e)" }}
              data-testid="btn-faq-whatsapp"
            >
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
            <Link href="/products">
              <Button variant="outline" className="gap-1 w-full sm:w-auto h-11">
                Browse all tools <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
