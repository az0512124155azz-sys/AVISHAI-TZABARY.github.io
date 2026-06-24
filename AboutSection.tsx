import { Printer, Heart, Zap, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function AboutSection() {
  const { t, dir } = useLanguage();

  const features = [
    { icon: Printer, title: t("about.quality"), desc: t("about.quality_desc") },
    { icon: Heart, title: t("about.personal"), desc: t("about.personal_desc") },
    { icon: Zap, title: t("about.fast"), desc: t("about.fast_desc") },
    { icon: Users, title: t("about.birthday"), desc: t("about.birthday_desc") },
  ];

  return (
    <section id="about" className="py-20 px-4" dir={dir}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black font-heading gradient-text inline-block mb-4">{t("about.title")}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("about.desc")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 text-center hover:border-primary/40 border border-transparent transition-all group">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
