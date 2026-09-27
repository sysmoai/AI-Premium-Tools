import { Card, CardContent } from "@/components/ui/card";
import { Truck } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { SITE_URL as ORIGIN } from "@/config/site";

export default function ShippingPolicy() {
  useSeo({
    title: "Digital Delivery Policy — AIPT",
    description: "AIPT orders are digitally fulfilled after payment confirmation. There is no physical shipment or shipping fee; fulfilment timing can vary by product and order status.",
    keywords: "AIPT delivery, digital subscription delivery Bangladesh, WhatsApp order support",
    canonical: `${ORIGIN}/shipping-policy`,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Digital Delivery Policy",
        url: `${ORIGIN}/shipping-policy`,
        inLanguage: ["en", "bn"],
        about: { "@type": "Thing", name: "Digital subscription fulfilment in Bangladesh" },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: "Delivery Policy", item: `${ORIGIN}/shipping-policy` },
        ],
      },
    ],
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))" }}><Truck className="h-6 w-6" /></div>
        <h1 className="text-3xl md:text-4xl font-black" style={{ fontFamily: "Outfit, sans-serif" }}>Digital Delivery Policy</h1>
      </div>

      <Card>
        <CardContent className="p-6 md:p-8 space-y-5 text-sm md:text-base leading-relaxed">
          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>How fulfilment works</h2>
            <p className="text-muted-foreground">AIPT products are digital. There is no physical parcel, courier shipment, or physical shipping charge. After payment confirmation, AIPT coordinates fulfilment using the contact information supplied with the order.</p>
          </section>
          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Timing</h2>
            <p className="text-muted-foreground">Fulfilment timing varies by product, payment verification, availability, and order status. AIPT does not publish a universal numerical delivery guarantee. If an order is delayed, contact support with the order ID for a status update.</p>
          </section>
          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Where fulfilment is sent</h2>
            <p className="text-muted-foreground">Order coordination uses the phone/WhatsApp contact supplied at checkout. Customers should verify that the contact information is correct before submitting the order.</p>
          </section>
          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>If your order is delayed or incorrect</h2>
            <p className="text-muted-foreground">Contact AIPT with the order ID, payment reference, and a short description of the issue. Refund or replacement eligibility is handled under the currently published Refund & Replacement Policy and the specific order facts.</p>
          </section>
          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Physical shipping fees</h2>
            <p className="text-muted-foreground">Not applicable. AIPT does not physically ship these digital products.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
