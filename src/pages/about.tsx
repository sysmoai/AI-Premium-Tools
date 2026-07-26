import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Clock, Wallet, MessageCircle, ArrowRight, Heart } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { WHATSAPP_URL } from "@/config/contact";

const ORIGIN = "https://aipt.com.bd";

export default function About() {
  useSeo({
    title: "About AIPT — Bangladesh's AI Subscription Store",
    description:
      "AIPT is Bangladesh's most affordable, most trusted store for premium AI subscriptions. Operating since 2023, we deliver tools like ChatGPT, Claude, Midjourney and Canva Pro in BDT — paid via bKash, Nagad or bank, with 1-hour activation and a 30-day warranty.",
    keywords: "about AIPT, AI premium tools Bangladesh, AI subscription company BD",
    canonical: `${ORIGIN}/about`,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: "About AIPT — AI Premium Tools",
        url: `${ORIGIN}/about`,
        description:
          "Bangladesh's most affordable, most trusted store for premium AI subscriptions, operating since 2023.",
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
    { Icon: Wallet, title: "BDT-only pricing", body: "Pay in your own currency via bKash, Nagad, Rocket, Upay or bank — no international card needed." },
    { Icon: Clock, title: "1-hour activation", body: "Credentials delivered to your WhatsApp within 60 minutes during 10am–11pm BD time." },
    { Icon: ShieldCheck, title: "30-day warranty", body: "Free replacement on every subscription if anything breaks during your access window." },
    { Icon: MessageCircle, title: "Bangla support", body: "Real humans on WhatsApp, fluent in Bangla and English, every day from 10am to 11pm." },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
      <div className="text-center mb-10">
        <div className="inline-flex h-14 w-14 rounded-2xl items-center justify-center text-white mb-4 shadow-lg" style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))" }}>
          <Heart className="h-7 w-7" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>
          Built for Bangladesh, run by people who use these tools every day
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          AIPT (AI Premium Tools) is Bangladesh's most affordable store for premium AI subscriptions — from ChatGPT and Claude to Midjourney, Canva Pro and 70+ more.
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6 md:p-8 space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed">
          <p>
            We started in 2023 because most AI tools price themselves in USD, settle in international cards, and answer support tickets only in English. For a student in Sylhet, a freelancer in Chittagong, or a small business in Dhaka, that turned a $20/month tool into a 30-minute headache and a 25%+ FX markup.
          </p>
          <p>
            AIPT removes every one of those barriers. You see the price in BDT. You pay with bKash. You get your account on WhatsApp within an hour. And if anything breaks for 30 days, we replace it for free — no questions, no email tickets.
          </p>
          <p>
            We never sell cracked accounts. Every subscription is sourced from official channels, which is exactly why we can stand behind a 30-day warranty.
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
          <h3 className="font-bold text-lg mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>Ready to start?</h3>
          <p className="text-sm text-muted-foreground mb-4">Browse 70+ AI subscriptions or chat with us on WhatsApp first.</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/products">
              <Button className="gap-1 w-full sm:w-auto h-11">Browse all tools <ArrowRight className="h-4 w-4" /></Button>
            </Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg text-white font-semibold transition-all hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, #25d366, #128c7e)" }}>
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
