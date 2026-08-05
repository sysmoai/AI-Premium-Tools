import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { SITE_URL as ORIGIN } from "@/config/site";

export default function PrivacyPolicy() {
  useSeo({
    title: "Privacy Policy — AIPT",
    description:
      "How AIPT collects, uses and protects your personal information when you order an AI subscription. We collect only what is needed to deliver your order and process your payment.",
    keywords: "AIPT privacy policy, data protection Bangladesh, AI store privacy",
    canonical: `${ORIGIN}/privacy-policy`,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Privacy Policy",
        url: `${ORIGIN}/privacy-policy`,
        inLanguage: ["en", "bn"],
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: "Privacy Policy", item: `${ORIGIN}/privacy-policy` },
        ],
      },
    ],
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))" }}>
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black" style={{ fontFamily: "Outfit, sans-serif" }}>Privacy Policy</h1>
      </div>

      <Card>
        <CardContent className="p-6 md:p-8 space-y-5 text-sm md:text-base leading-relaxed">
          <p className="text-muted-foreground"><em>Last updated: May 2026.</em></p>

          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>What we collect</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">Order details</strong> — your name, WhatsApp number, and (optionally) email so we can deliver and renew your subscription.</li>
              <li><strong className="text-foreground">Payment proof</strong> — the transaction reference / screenshot you submit. We never store full card or mobile-banking PINs.</li>
              <li><strong className="text-foreground">Delivery records</strong> — the credentials we send and the date of delivery, so we can honour the 30-day warranty.</li>
              <li><strong className="text-foreground">Basic analytics</strong> — anonymous page-view data to improve the store. No third-party advertising trackers.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>How we use it</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>To deliver your order and provide warranty support.</li>
              <li>To send renewal reminders 3 days before your subscription expires.</li>
              <li>To investigate any payment or fulfilment dispute.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Who we share it with</h2>
            <p className="text-muted-foreground">
              We do not sell, rent, or share your personal data with advertisers or marketing networks. The only third parties that ever see your data are the payment platform you used (bKash, Nagad, etc.) and, where strictly required, the legal authorities of Bangladesh.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>How long we keep it</h2>
            <p className="text-muted-foreground">
              We retain order records for as long as needed to honour warranty and tax-record obligations under Bangladeshi law. You can request deletion of your record at any time after your warranty period ends.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-lg mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Your rights</h2>
            <p className="text-muted-foreground">
              You can request a copy of the data we hold on you, ask us to correct it, or ask us to delete it. Message us on WhatsApp or email <a href="mailto:admin@aipremium.tools" className="text-primary hover:underline">admin@aipremium.tools</a>.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
