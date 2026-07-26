import { Card, CardContent } from "@/components/ui/card";
import { Truck } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";

const ORIGIN = "https://aipt.com.bd";

export default function ShippingPolicy() {
  useSeo({
    title: "Delivery Policy — How AIPT Activates Your AI Subscription",
    description:
      "All AIPT orders are digital. Login credentials are delivered to your WhatsApp within 1 hour of payment confirmation, between 10am and 11pm Bangladesh time. Late-night orders are sent first thing the next morning.",
    keywords: "AIPT delivery, AI subscription delivery Bangladesh, WhatsApp delivery",
    canonical: `${ORIGIN}/shipping-policy`,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Delivery Policy",
        url: `${ORIGIN}/shipping-policy`,
        inLanguage: ["en", "bn"],
        about: { "@type": "Thing", name: "Digital subscription delivery in Bangladesh" },
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
        <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))" }}>
          <Truck className="h-6 w-6" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black" style={{ fontFamily: "Outfit, sans-serif" }}>Delivery Policy</h1>
      </div>

      <Card>
        <CardContent className="p-6 md:p-8 space-y-5 text-sm md:text-base leading-relaxed">
          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>How delivery works</h2>
            <p className="text-muted-foreground">
              All AIPT products are digital subscriptions. There is no physical shipment, no courier, and no shipping fee. After your payment is confirmed, we send your login credentials directly to the WhatsApp number you provided at checkout.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Delivery time</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">Standard SLA:</strong> within 1 hour of payment confirmation.</li>
              <li><strong className="text-foreground">Business hours:</strong> 10:00am – 11:00pm Bangladesh time, all 7 days of the week.</li>
              <li><strong className="text-foreground">Late-night orders:</strong> any order placed after 11pm is delivered first thing the following morning, typically by 11am.</li>
              <li><strong className="text-foreground">Festival days:</strong> we operate at reduced hours on Eid and government holidays. Orders are still typically delivered the same day.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Coverage</h2>
            <p className="text-muted-foreground">
              AIPT serves customers across all 64 districts of Bangladesh. Because every product is delivered digitally over WhatsApp, your physical location does not affect delivery time or cost.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>If your order is late</h2>
            <p className="text-muted-foreground">
              If you have not received your credentials within 1 hour during business hours, please message us on WhatsApp with your order ID. If we are unable to deliver within 24 hours, you are entitled to a full refund — see our Refund Policy.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Delivery fees</h2>
            <p className="text-muted-foreground">
              ৳0. Delivery is always free.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
