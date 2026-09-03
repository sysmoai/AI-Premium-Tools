import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { SITE_URL as ORIGIN } from "@/config/site";

export default function PrivacyPolicy() {
  useSeo({
    title: "Privacy Policy — AIPT",
    description: "How AIPT handles customer and order information submitted through the current storefront and support channels.",
    keywords: "AIPT privacy policy, data protection Bangladesh, AI store privacy",
    canonical: `${ORIGIN}/privacy-policy`,
    jsonLd: [
      { "@context": "https://schema.org", "@type": "WebPage", name: "Privacy Policy", url: `${ORIGIN}/privacy-policy`, inLanguage: ["en", "bn"] },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` },
        { "@type": "ListItem", position: 2, name: "Privacy Policy", item: `${ORIGIN}/privacy-policy` },
      ] },
    ],
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))" }}><Lock className="h-6 w-6" /></div>
        <h1 className="text-3xl md:text-4xl font-black" style={{ fontFamily: "Outfit, sans-serif" }}>Privacy Policy</h1>
      </div>

      <Card><CardContent className="p-6 md:p-8 space-y-5 text-sm md:text-base leading-relaxed">
        <p className="text-muted-foreground"><em>Last reviewed: September 2026.</em></p>

        <section>
          <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Information submitted to AIPT</h2>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1">
            <li><strong className="text-foreground">Customer details</strong> — name and phone number are required at checkout; email and university are optional.</li>
            <li><strong className="text-foreground">Order details</strong> — selected products, quantities, BDT totals, order status and timestamps.</li>
            <li><strong className="text-foreground">Payment-reference details</strong> — the checkout payment method and transaction/reference value supplied for manual verification.</li>
            <li><strong className="text-foreground">Optional notes and support messages</strong> — information you choose to provide when placing an order or asking for help.</li>
          </ul>
          <p className="text-muted-foreground mt-2">Do not send mobile-banking PINs, card credentials, provider passwords, recovery codes, or other authentication secrets to AIPT support.</p>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>How AIPT uses order data</h2>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1">
            <li>To create, verify, fulfil, administer, and support an order.</li>
            <li>To reconcile a payment reference with the order record.</li>
            <li>To investigate delivery, refund, replacement, fraud, or account-support disputes.</li>
            <li>To maintain operational and accounting records where reasonably required.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Storage and service providers</h2>
          <p className="text-muted-foreground">The current production storefront and APIs run on Cloudflare infrastructure and use a Cloudflare D1 database for application records. Infrastructure providers may process technical request data needed to operate and secure the service. AIPT does not claim that every external provider receives the same customer fields; data sharing depends on the actual service used for a particular order or support case.</p>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Browser storage</h2>
          <p className="text-muted-foreground">The storefront may store functional preferences or state in your browser, such as cart state and the selected light/dark appearance. Admin authentication data is stored in the browser only for the admin interface and protected admin requests are still validated server-side.</p>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Retention</h2>
          <p className="text-muted-foreground">AIPT retains order/customer records while they are reasonably needed for fulfilment, support, payment reconciliation, dispute handling, security, accounting, or applicable legal obligations. A universal automatic deletion period is not currently published.</p>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Access, correction, or deletion requests</h2>
          <p className="text-muted-foreground">You may ask AIPT to review, correct, or delete personal data associated with your order. Some records may need to be retained where there is a legitimate operational, security, dispute, accounting, or legal reason. Contact us on WhatsApp or email <a href="mailto:admin@aipremium.tools" className="text-primary hover:underline">admin@aipremium.tools</a>.</p>
        </section>
      </CardContent></Card>
    </div>
  );
}
