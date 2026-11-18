import { useMemo, useState } from "react";
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
      { q: "What payment methods do you accept?", a: "Current checkout methods are bKash, Nagad, and Bank Transfer. Orders are recorded in BDT." },
      { q: "How do I place an order?", a: "Add products to your cart, open checkout, provide your name and Bangladeshi mobile number, choose a listed payment method, enter the payment reference, and submit the order." },
      { q: "When is an order considered submitted?", a: "An order is created only after the checkout request is accepted by the AIPT order API. Keep your order ID and payment reference for support." },
      { q: "Can I confirm product details before paying?", a: "Yes. Use the live product page for the current price and description, and contact AIPT on WhatsApp if any fulfilment detail is unclear before payment." },
    ],
  },
  {
    title: "Delivery & Activation",
    items: [
      { q: "How does delivery work?", a: "AIPT products are digitally fulfilled after payment confirmation. There is no physical shipment. Fulfilment timing varies by product, payment verification, availability, and order status." },
      { q: "Where will order information be sent?", a: "AIPT uses the phone/WhatsApp contact supplied at checkout for order coordination. Make sure the number is correct before submitting." },
      { q: "Can I use a product on multiple devices?", a: "Device, account, seat, and login rules depend on the specific provider and purchased product. Check the product details and provider rules before use." },
    ],
  },
  {
    title: "Refunds & Support",
    items: [
      { q: "What if my order is delayed or incorrect?", a: "Contact AIPT with your order ID and payment reference. The order will be reviewed under the current Digital Delivery and Refund & Replacement policies." },
      { q: "Do you offer refunds or replacements?", a: "Available remedies depend on the verified order facts. They may include corrected fulfilment, replacement, cancellation before fulfilment, or refund. See the Refund & Replacement Policy for the current wording." },
      { q: "How do I contact support?", a: "WhatsApp is the primary support channel linked throughout the site. Include your order ID and a short description, and avoid sending passwords or other authentication secrets." },
    ],
  },
  {
    title: "Accounts & Providers",
    items: [
      { q: "Is AIPT the provider of the listed tools?", a: "AIPT is the seller/support entity. Third-party product and trademark names belong to their respective providers. A catalog listing does not itself imply provider affiliation or endorsement." },
      { q: "Does AIPT claim reseller or seat authorization for every listing?", a: "No. AIPT does not infer authorization. Commercial eligibility is reviewed separately, and missing AIPT-specific evidence remains under review rather than being presented as provider authorization." },
      { q: "Can I change account credentials?", a: "Credential rules depend on the provider and fulfilment model. Do not change credentials unless the product instructions and provider rules allow it." },
    ],
  },
  {
    title: "Bangla / বাংলা",
    items: [
      { q: "bKash বা Nagad দিয়ে অর্ডার করতে পারব?", a: "জি। বর্তমানে checkout-এ bKash, Nagad এবং Bank Transfer অপশন আছে। অর্ডারের payment reference ঠিকভাবে দিন।" },
      { q: "অর্ডার দেরি হলে কী করব?", a: "Order ID এবং payment reference নিয়ে WhatsApp-এ যোগাযোগ করুন। Digital Delivery ও Refund policy অনুযায়ী অর্ডারটি review করা হবে।" },
      { q: "AIPT কি সব provider-এর authorized reseller?", a: "এমন blanket claim AIPT করে না। যেকোনো provider authorization বা seat right-এর জন্য AIPT-specific current evidence দরকার; evidence না থাকলে সেটা under review থাকে।" },
    ],
  },
];

const ALL_ITEMS: Array<FaqItem & { group: string }> = FAQ_GROUPS.flatMap(g => g.items.map(i => ({ ...i, group: g.title })));

export default function Faq() {
  const [query, setQuery] = useState("");

  useSeo({
    title: "FAQ — AIPT AI & Digital Tool Subscriptions",
    description: "Current answers about AIPT checkout, digital fulfilment, support, provider identity, and order policies.",
    keywords: "AIPT FAQ, AI subscription Bangladesh FAQ, bKash AI questions",
    type: "website",
    jsonLd: [{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: ALL_ITEMS.map(item => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
    }],
  });

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return FAQ_GROUPS;
    const q = query.toLowerCase();
    return FAQ_GROUPS.map(g => ({ ...g, items: g.items.filter(i => i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q)) })).filter(g => g.items.length > 0);
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
      <div className="text-center mb-8">
        <div className="inline-flex h-14 w-14 rounded-2xl items-center justify-center text-white mb-4 shadow-lg" style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))" }}><HelpCircle className="h-7 w-7" /></div>
        <h1 className="text-3xl md:text-4xl font-black mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Frequently Asked Questions</h1>
        <p className="text-muted-foreground">Current operational answers for ordering from AIPT.</p>
      </div>

      <div className="relative max-w-xl mx-auto mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10 h-11" placeholder="Search the FAQ…" value={query} onChange={e => setQuery(e.target.value)} data-testid="input-faq-search" />
      </div>

      {filteredGroups.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground"><p className="mb-4">No answers found for "{query}".</p><Button variant="outline" onClick={() => setQuery("")}>Clear search</Button></CardContent></Card>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map(group => (
            <Card key={group.title}><CardContent className="p-6">
              <h2 className="font-bold text-lg mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>{group.title}</h2>
              <Accordion type="single" collapsible>
                {group.items.map((item, i) => (
                  <AccordionItem key={i} value={`${group.title}-${i}`}>
                    <AccordionTrigger className="text-left text-sm font-semibold" data-testid={`faq-q-${group.title.toLowerCase().replace(/\s+/g, "-")}-${i}`}>{item.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent></Card>
          ))}
        </div>
      )}

      <Card className="mt-8"><CardContent className="p-6 text-center">
        <h3 className="font-bold text-lg mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>Still have questions?</h3>
        <p className="text-sm text-muted-foreground mb-4">Contact AIPT before ordering if a product or fulfilment detail is unclear.</p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg text-white font-semibold transition-all hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, #25d366, #128c7e)" }} data-testid="btn-faq-whatsapp"><MessageCircle className="h-4 w-4" /> Chat on WhatsApp</a>
          <Link href="/products"><Button variant="outline" className="gap-1 w-full sm:w-auto h-11">Browse all tools <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
      </CardContent></Card>
    </div>
  );
}
