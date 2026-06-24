import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "he" ? "en" : "he")}
      className="fixed top-4 left-4 z-50 glass rounded-full px-3 py-1.5 text-sm font-bold text-foreground hover:text-primary transition-colors"
      aria-label="Toggle language"
    >
      {lang === "he" ? "EN" : "עב"}
    </button>
  );
}
