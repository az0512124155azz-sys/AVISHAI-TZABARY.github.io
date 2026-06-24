import { WHATSAPP_NUMBER, COMPANY_NAME } from "@/lib/constants";
import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { t, dir } = useLanguage();

  return (
    <footer className="border-t border-border py-8 px-4" dir={dir}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} {COMPANY_NAME}. {t("footer.rights")}
        </p>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-accent hover:text-primary transition-colors text-sm font-medium"
        >
          <MessageCircle className="w-4 h-4" />
          {t("footer.whatsapp")}
        </a>
      </div>
    </footer>
  );
}
