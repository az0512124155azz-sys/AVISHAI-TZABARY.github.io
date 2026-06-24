import heroBanner from "@/assets/hero-banner.jpg";
import logo from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import { Sparkles, ShoppingCart, PartyPopper } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { FloatingParticles } from "@/components/FloatingParticles";

export function HeroSection() {
  const { t, dir } = useLanguage();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background: hero banner with logo blended on top */}
      <div className="absolute inset-0">
        <img src={heroBanner} alt="Magic 3D Hero" className="w-full h-full object-cover opacity-40" />
        {/* Logo blended into the background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={logo}
            alt=""
            className="w-[500px] h-[500px] md:w-[700px] md:h-[700px] object-contain opacity-15 blur-[2px] mix-blend-lighten"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <FloatingParticles />

      <div className="absolute top-6 left-0 right-0 w-full flex justify-center z-20">
        <nav className="glass rounded-full px-6 py-3 flex gap-4 items-center text-sm font-medium" dir={dir}>
          <button onClick={() => scrollTo("hero")} className="text-foreground/80 hover:text-primary transition-colors">{t("nav.home")}</button>
          <button onClick={() => scrollTo("catalog")} className="text-foreground/80 hover:text-primary transition-colors">{t("nav.catalog")}</button>
          <button onClick={() => scrollTo("order")} className="text-foreground/80 hover:text-primary transition-colors">{t("nav.order")}</button>
          <button onClick={() => scrollTo("about")} className="text-foreground/80 hover:text-primary transition-colors">{t("nav.about")}</button>
        </nav>
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto" id="hero">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm text-foreground/80">{t("hero.badge")}</span>
        </div>

        {/* Foreground logo */}
        <div className="relative mx-auto mb-6 w-40 h-40 md:w-56 md:h-56">
          <img
            src={logo}
            alt="Magic 3D Logo"
            className="relative w-full h-full object-contain mix-blend-lighten drop-shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
          />
        </div>

        <h1 className="text-5xl md:text-7xl font-black mb-6 font-heading leading-tight">
          <span className="gradient-text">Magic 3D</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed whitespace-pre-line" dir={dir}>
          {t("hero.subtitle")}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-bold text-base px-8 py-6 rounded-xl shadow-lg hover:shadow-primary/30 transition-all hover:scale-105"
            onClick={() => scrollTo("catalog")}
          >
            <ShoppingCart className="w-5 h-5 ml-2" />
            {t("hero.catalog_btn")}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-primary/40 text-foreground font-bold text-base px-8 py-6 rounded-xl hover:bg-primary/10 transition-all"
            onClick={() => scrollTo("order")}
          >
            <PartyPopper className="w-5 h-5 ml-2" />
            {t("hero.order_btn")}
          </Button>
        </div>

      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
