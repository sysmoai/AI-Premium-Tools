import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { SITE_URL as ORIGIN } from "@/config/site";

export default function RefundPolicy() {
  useSeo({
    title: "Refund & Replacement Policy — AIPT",
    description: "AIPT handles refund and replacement requests for digital orders based on delivery status, product accuracy, access circumstances, and the specific order facts.",
    keywords: "AIPT refund policy, AI subscription replacement Bangladesh, digital order support",
    canonical: `${ORIGIN}/refund-policy`,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Refund & Replacement Policy",
        url: `${ORIGIN}/refund-policy`,
        inLanguage: ["en", "bn"],
        about: { "@type": "Thing", name: "Refund and replacement policy for digital subscriptions" },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: "Refund Policy", item: `${ORIGIN}/refund-policy` },
        ],
      },
    ],
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))" }}><ShieldCheck className="h-6 w-6" /></div>
        <h1 className="text-3xl md:text-4xl font-black" style={{ fontFamily: "Outfit, sans-serif" }}>Refund &amp; Replacement Policy</h1>
      </div>

      <Card>
        <CardContent className="p-6 md:p-8 space-y-5 text-sm md:text-base leading-relaxed">
          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Digital-order policy</h2>
            <p className="text-muted-foreground">AIPT sells digitally fulfilled products, so ordinary physical return-by-mail rules do not apply. Requests are reviewed against the order record, payment status, product delivered, and the issue reported.</p>
          </section>
          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>When to contact us</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Your paid order has not been fulfilled and you need a status or resolution.</li>
              <li>The delivered product materially differs from the product/tier/duration shown in your order.</li>
              <li>Access supplied for an order stops working and you need AIPT to review the fulfilment record and available remedy.</li>
              <li>You believe an order or payment reference was processed incorrectly.</li>
            </ul>
          </section>
          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Resolution</h2>
            <p className="text-muted-foreground">Depending on the verified circumstances, the available resolution may include corrected fulfilment, replacement, cancellation before fulfilment, or refund. AIPT does not publish a universal replacement duration or automatic cash-refund entitlement that applies to every product and scenario.</p>
          </section>
          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Customer-caused or provider-side issues</h2>
            <p className="text-muted-foreground">AIPT may need additional information when an issue results from customer credential changes, provider account restrictions, provider outages, policy enforcement, or use outside the purchased product terms. The outcome depends on the facts and the applicable provider/product conditions.</p>
          </section>
          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>How to request review</h2>
            <p className="text-muted-foreground">Contact AIPT on WhatsApp with your order ID, payment reference, a screenshot when relevant, and a short description. Do not send passwords or sensitive authentication secrets in support messages.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
