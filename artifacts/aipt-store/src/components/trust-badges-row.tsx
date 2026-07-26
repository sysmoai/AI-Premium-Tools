import { ShieldCheck, Zap, RefreshCw, Lock } from "lucide-react";

const BADGES = [
  { Icon: ShieldCheck, title: "30-day warranty", subtitle: "Account replaced if anything fails" },
  { Icon: Zap, title: "1-hour delivery", subtitle: "After payment confirmation" },
  { Icon: RefreshCw, title: "Easy replacement", subtitle: "Free swap during warranty" },
  { Icon: Lock, title: "Safe payments", subtitle: "bKash · Nagad · Bank" },
];

export function TrustBadgesRow({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${compact ? "" : "md:gap-4"}`}
      data-testid="trust-badges-row"
    >
      {BADGES.map(({ Icon, title, subtitle }) => (
        <div
          key={title}
          className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 p-3"
        >
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-white shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 60%))" }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold leading-tight">{title}</div>
            {!compact && <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{subtitle}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
