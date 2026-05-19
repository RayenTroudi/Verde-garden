import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accentColor?: string;
  icon?: React.ReactNode;
}

export function StatsCard({ label, value, sub, accentColor = "#4a6741", icon }: StatsCardProps) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-sm">
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ background: accentColor }}
      />
      <CardContent className="pt-5 pb-4 pl-5 pr-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              {label}
            </p>
            <p
              className={cn(
                "font-display text-3xl font-semibold leading-none",
                "text-[#2d4a2d]"
              )}
            >
              {value}
            </p>
            {sub && (
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            )}
          </div>
          {icon && (
            <div className="shrink-0 mt-0.5 text-muted-foreground/40">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
