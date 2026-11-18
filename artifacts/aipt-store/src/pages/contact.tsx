import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Mail, Clock, MapPin } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { WHATSAPP_URL, WHATSAPP_HOURS } from "@/config/contact";
import { SITE_URL as ORIGIN } from "@/config/site";

export default function Contact() {
  useSeo({
    title: "Contact AIPT — WhatsApp & Email",
    description: "Contact AIPT about product details, digital fulfilment, an existing order, or account/support questions using the WhatsApp link or admin@aipremium.tools.",
    keywords: "AIPT contact, AI subscription support Bangladesh, WhatsApp support",
    canonical: `${ORIGIN}/contact`,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: "Contact AIPT",
        url: `${ORIGIN}/contact`,
        inLanguage: ["en", "bn"],
        mainEntity: {
          "@type": "Organization",
          name: "AIPT — AI Premium Tools",
          email: "admin@aipremium.tools",
          areaServed: "BD",
          contactPoint: [{ "@type": "ContactPoint", contactType: "customer support", availableLanguage: ["en", "bn"], areaServed: "BD", email: "admin@aipremium.tools" }],
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: "Contact", item: `${ORIGIN}/contact` },
        ],
      },
    ],
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-black mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Contact AIPT</h1>
        <p className="text-muted-foreground">For the fastest order context, include your order ID and payment reference. Never send passwords or authentication secrets.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3 mb-2"><div className="h-10 w-10 rounded-lg flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, #25d366, #128c7e)" }}><MessageCircle className="h-5 w-5" /></div><h3 className="font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>WhatsApp</h3></div>
          <p className="text-sm text-muted-foreground mb-3">Use WhatsApp for product questions, fulfilment status, and existing-order support.</p>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-white font-semibold w-full" style={{ background: "linear-gradient(135deg, #25d366, #128c7e)" }}>Open WhatsApp</a>
        </CardContent></Card>

        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3 mb-2"><div className="h-10 w-10 rounded-lg flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))" }}><Mail className="h-5 w-5" /></div><h3 className="font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Email</h3></div>
          <p className="text-sm text-muted-foreground mb-3">For written support, billing records, or business inquiries.</p>
          <a href="mailto:admin@aipremium.tools" className="text-primary text-sm font-semibold hover:underline">admin@aipremium.tools</a>
        </CardContent></Card>

        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3 mb-2"><div className="h-10 w-10 rounded-lg flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))" }}><Clock className="h-5 w-5" /></div><h3 className="font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Published support hours</h3></div>
          <p className="text-sm text-muted-foreground">{WHATSAPP_HOURS}</p>
        </CardContent></Card>

        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3 mb-2"><div className="h-10 w-10 rounded-lg flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))" }}><MapPin className="h-5 w-5" /></div><h3 className="font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Service area</h3></div>
          <p className="text-sm text-muted-foreground">Bangladesh. Products on this storefront are digitally fulfilled rather than physically shipped.</p>
        </CardContent></Card>
      </div>
    </div>
  );
}
