import { HeroSection } from "@/components/HeroSection";
import { SaleBanner } from "@/components/SaleBanner";
import { CatalogSection } from "@/components/CatalogSection";
import { ReviewsSection } from "@/components/ReviewsSection";
import { OrderSection } from "@/components/OrderSection";
import { AboutSection } from "@/components/AboutSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <HeroSection />
      <SaleBanner />
      <CatalogSection />
      <OrderSection />
      <AboutSection />
      <ReviewsSection />
      <Footer />
    </div>
  );
};

export default Index;
