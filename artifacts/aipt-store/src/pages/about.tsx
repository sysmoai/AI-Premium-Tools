import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, PackageCheck, Wallet, MessageCircle, ArrowRight, Heart } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { WHATSAPP_URL } from "@/config/contact";
import { SITE_URL as ORIGIN } from "@/config/site";
import { useListProducts } from "@workspace/api-client-react";

export default function About() {
  const { data: products } = useListProducts({ is_active: true });
  const productCount = products?.length ?? 0;

  useSeo({
    title: "About AIPT — AI & Digital Tool Subscriptions in Bangladesh",
    description: "AIPT is a Bangladesh-focused seller and support service for digital AI and tool subscriptions, with current prices in BDT and checkout via bKash, Nagad, or bank transfer.",
    keywords: "about AIPT, AI premium tools Bangladesh, AI subscription company BD",
    canonical: `${ORIGIN}/about`,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: "About AIPT — AI Premium Tools",
        url: `${ORIGIN}/about`,
        description: "Bangladesh-focused seller and support service for digital AI and tool subscriptions.",
        inLanguage: ["en", "bn"],
        isPartOf: { "@type": "WebSite", url: ORIGIN, name: "AIPT — AI Premium Tools" },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: "About", item: `${ORIGIN}/about` },
        ],
      },
    ],
  });

  const pillars = [
    { Icon: Wallet, title: "BDT checkout", body: "Current checkout methods are bKash, Nagad, and Bank Transfer." },
    { Icon: PackageCheck, title: "Live catalog", body: "Product names, prices, duration and availability are loaded from the current AIPT catalog." },
    { Icon: ShieldCheck, title: "Seller clarity", body: "AIPT is the seller/support entity. Third-party product names and trademarks belong to their providers." },
    { Icon: MessageCircle, title: "Order support", body: "Use WhatsApp and your order ID for fulfilment questions or post-order support." },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
      <div className="text-center mb-10">
        <div className="inline-flex h-14 w-14 rounded-2xl items-center justify-center text-white mb-4 shadow-lg" style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))" }}>
          <Heart className="h-7 w-7" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>
          AIPT — AI Premium Tools
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          A Bangladesh-focused seller and support service for digital AI and tool subscriptions{productCount > 0 ? `, with ${productCount} active catalog entries currently listed` : ""}.
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6 md:p-8 space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed">
          <p>
            AIPT publishes product information and BDT pricing in a local storefront and records checkout orders with the payment methods shown at checkout. Digital fulfilment and support are coordinated using the customer contact information provided with the order.
          </p>
          <p>
            Third-party service names identify their respective providers. AIPT does not treat a catalog listing as proof of provider affiliation, reseller status, account-sharing permission, or authorized seat rights. Commercial eligibility is reviewed separately and missing AIPT-specific evidence remains under review.
          </p>
          <p>
            For current product facts, use the live catalog. For delivery, refund, privacy and terms information, use the policy pages linked in the footer rather than historical marketing copy.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {pillars.map(p => (
          <Card key={p.title}>
            <CardContent className="p-5 flex gap-4">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))" }}>
                <p.Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="font-bold text-lg mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>Browse or ask a question</h3>
          <p className="text-sm text-muted-foreground mb-4">Check the live catalog for current products, or contact AIPT before ordering if you need clarification.</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/products"><Button className="gap-1 w-full sm:w-auto h-11">Browse all tools <ArrowRight className="h-4 w-4" /></Button></Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg text-white font-semibold transition-all hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, #25d366, #128c7e)" }}>
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
