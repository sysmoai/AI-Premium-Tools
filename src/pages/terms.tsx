import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";

const ORIGIN = "https://aipt.com.bd";

export default function Terms() {
  useSeo({
    title: "Terms of Service — AIPT",
    description:
      "The terms that govern your use of AIPT — the rights, responsibilities, and limitations that apply when you buy an AI subscription from us.",
    keywords: "AIPT terms of service, AI subscription terms Bangladesh",
    canonical: `${ORIGIN}/terms`,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Terms of Service",
        url: `${ORIGIN}/terms`,
        inLanguage: ["en", "bn"],
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: "Terms of Service", item: `${ORIGIN}/terms` },
        ],
      },
    ],
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))" }}>
          <FileText className="h-6 w-6" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black" style={{ fontFamily: "Outfit, sans-serif" }}>Terms of Service</h1>
      </div>

      <Card>
        <CardContent className="p-6 md:p-8 space-y-5 text-sm md:text-base leading-relaxed">
          <p className="text-muted-foreground"><em>Last updated: May 2026.</em></p>

          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>1. What AIPT sells</h2>
            <p className="text-muted-foreground">
              AIPT (AI Premium Tools) sells access to genuine third-party AI subscriptions to customers in Bangladesh. We are not affiliated with the underlying tool vendors — we resell legitimate access at a discounted BDT price for the convenience of local buyers.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>2. Your responsibilities</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Use the subscription only for the duration purchased.</li>
              <li>Comply with the underlying tool's own terms of service.</li>
              <li>For shared plans: do not change the password — it locks other users out and voids your warranty.</li>
              <li>Do not resell or sub-licence the credentials we provide unless you have explicitly purchased a reseller package.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>3. Payment</h2>
            <p className="text-muted-foreground">
              All payments are made in BDT in advance via bKash, Nagad, Rocket, Upay, or bank transfer. Orders are confirmed only after we verify your transaction reference.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>4. Delivery, warranty &amp; refunds</h2>
            <p className="text-muted-foreground">
              Delivery times, warranty terms, and refund eligibility are governed by our Delivery Policy and Refund Policy, which form part of these terms.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>5. Limitation of liability</h2>
            <p className="text-muted-foreground">
              AIPT's maximum liability for any order is the price you paid for that order. We are not liable for indirect losses caused by the underlying tool vendor (downtime, service changes, account policy changes by the vendor). We will, however, replace any broken account within 30 days under our warranty.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>6. Governing law</h2>
            <p className="text-muted-foreground">
              These terms are governed by the laws of the People's Republic of Bangladesh. Any dispute will be resolved in the courts of Dhaka.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>7. Contact</h2>
            <p className="text-muted-foreground">
              Questions about these terms? Email <a href="mailto:hello@aipt.com.bd" className="text-primary hover:underline">hello@aipt.com.bd</a> or message us on WhatsApp.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
