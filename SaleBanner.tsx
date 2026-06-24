import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Timer, Sparkles } from "lucide-react";
import { useSaleSettings } from "@/hooks/useSaleSettings";

export function SaleBanner() {
  const { lang } = useLanguage();
  const { data: settings } = useSaleSettings();

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const endDate = settings?.end_date ? new Date(settings.end_date) : null;
  const isActive = settings?.is_active && endDate && endDate.getTime() > Date.now();

  useEffect(() => {
    if (!endDate) return;
    const calc = () => {
      const diff = Math.max(0, endDate.getTime() - Date.now());
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endDate?.getTime()]);

  if (!isActive) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  const saleText = lang === "he" ? settings?.sale_text_he : settings?.sale_text_en;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 border-y border-primary/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.1),transparent_70%)]" />
      <div className="relative max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <span className="font-bold text-foreground text-sm sm:text-base">
            🔥 {saleText}
            {settings?.discount_percent ? ` — ${settings.discount_percent}%` : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="w-4 h-4 text-primary" />
          <div className="flex gap-1">
            {[
              { val: timeLeft.days, label: lang === "he" ? "ימים" : "D" },
              { val: timeLeft.hours, label: lang === "he" ? "שעות" : "H" },
              { val: timeLeft.minutes, label: lang === "he" ? "דקות" : "M" },
              { val: timeLeft.seconds, label: lang === "he" ? "שניות" : "S" },
            ].map((unit, i) => (
              <div key={i} className="flex items-center gap-0.5">
                {i > 0 && <span className="text-muted-foreground font-bold">:</span>}
                <span className="bg-background/60 backdrop-blur-sm rounded-md px-2 py-1 text-sm font-mono font-bold text-foreground min-w-[2rem] text-center">
                  {pad(unit.val)}
                </span>
                <span className="text-[10px] text-muted-foreground">{unit.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
