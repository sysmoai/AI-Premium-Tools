import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";

const ORIGIN = "https://aipt.com.bd";

export default function RefundPolicy() {
  useSeo({
    title: "Refund & Replacement Policy — AIPT",
    description:
      "AIPT offers a 30-day free replacement on every subscription and a full refund if we cannot deliver within 24 hours of payment. Read our complete refund and replacement policy.",
    keywords: "AIPT refund policy, AI subscription replacement Bangladesh, 30-day warranty",
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
        "@type": "MerchantReturnPolicy",
        applicableCountry: "BD",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 30,
        returnFees: "https://schema.org/FreeReturn",
        url: `${ORIGIN}/refund-policy`,
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
        <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))" }}>
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black" style={{ fontFamily: "Outfit, sans-serif" }}>Refund &amp; Replacement Policy</h1>
      </div>

      <Card>
        <CardContent className="p-6 md:p-8 space-y-5 text-sm md:text-base leading-relaxed">
          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>30-day free replacement</h2>
            <p className="text-muted-foreground">
              Every AIPT subscription is covered by a 30-day free replacement warranty starting from the day your credentials are delivered. If your account stops working at any point during the warranty window — login failure, suspension, password reset, etc. — message us on WhatsApp with your order ID and we will replace it free of charge, typically within 2 hours.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Full refund</h2>
            <p className="text-muted-foreground">
              You are entitled to a full refund in BDT, paid back to the same payment method you used, in either of these situations:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
              <li>We are unable to deliver your order within 24 hours of payment confirmation.</li>
              <li>The product you received is materially different from what was advertised on the product page (wrong tier, wrong duration).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Why we prefer replacement over cash refund</h2>
            <p className="text-muted-foreground">
              After a successful delivery we offer free replacement instead of a cash refund. This keeps our prices the lowest in Bangladesh — refund processing fees on bKash and Nagad are real costs, and absorbing them on every order would force prices up for everyone.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>What is not covered</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Buyer's remorse after the account has been used.</li>
              <li>Account locks caused by the customer changing the password on a shared plan or violating the tool's own terms of service.</li>
              <li>Issues with the underlying tool that the vendor resolves (we will help you escalate).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>How to request a refund or replacement</h2>
            <p className="text-muted-foreground">
              Message us on WhatsApp with: (1) your order ID, (2) a screenshot of the issue, and (3) a one-line description. We respond within minutes during 10am–11pm BD time, every day.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
