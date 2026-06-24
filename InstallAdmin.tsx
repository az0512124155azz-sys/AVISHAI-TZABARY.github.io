import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Monitor, Share, Plus, Apple, Chrome, ArrowRight, CheckCircle2 } from "lucide-react";

export default function InstallAdmin() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform("ios");
    else if (/android/.test(ua)) setPlatform("android");
    else setPlatform("desktop");

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => setInstalled(true);
    window.addEventListener("appinstalled", installedHandler);

    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin-login")} className="mb-6">
          <ArrowRight className="w-4 h-4 ml-2" />
          לפנל הניהול
        </Button>

        <div className="text-center mb-8">
          <img src="/admin-icon.png" alt="Magic 3D Admin" width={96} height={96} className="mx-auto rounded-2xl shadow-lg shadow-primary/30 mb-4" />
          <h1 className="text-3xl font-black font-heading gradient-text mb-2">התקנת אפליקציית הניהול</h1>
          <p className="text-muted-foreground">התקן את פנל הניהול כאפליקציה במסך הבית או בשולחן העבודה</p>
        </div>

        {installed && (
          <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 mb-6 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-primary" />
            <div>
              <div className="font-bold">האפליקציה מותקנת!</div>
              <div className="text-sm text-muted-foreground">פתח אותה ממסך הבית כדי להתחיל</div>
            </div>
          </div>
        )}

        {/* Quick install button (Chrome / Edge / Android) */}
        {deferredPrompt && !installed && (
          <button
            onClick={handleInstall}
            className="w-full mb-6 rounded-2xl bg-gradient-to-r from-primary to-primary/70 text-primary-foreground p-5 font-bold text-lg shadow-lg shadow-primary/30 hover:scale-[1.01] transition flex items-center justify-center gap-3"
          >
            <Download className="w-6 h-6" />
            התקן עכשיו
          </button>
        )}

        {/* iOS instructions */}
        <div className={`rounded-2xl border p-5 mb-4 ${platform === "ios" ? "border-primary/50 bg-primary/5" : "border-border bg-card"}`}>
          <div className="flex items-center gap-2 mb-3">
            <Apple className="w-5 h-5" />
            <h2 className="text-lg font-bold">אייפון / אייפד (Safari)</h2>
          </div>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="font-bold text-foreground">1.</span> פתח את האתר בדפדפן <strong>Safari</strong></li>
            <li className="flex gap-2"><span className="font-bold text-foreground">2.</span> לחץ על כפתור השיתוף <Share className="w-4 h-4 inline" /> בתחתית המסך</li>
            <li className="flex gap-2"><span className="font-bold text-foreground">3.</span> גלול ובחר <strong>"הוסף למסך הבית"</strong> (Add to Home Screen) <Plus className="w-4 h-4 inline" /></li>
            <li className="flex gap-2"><span className="font-bold text-foreground">4.</span> לחץ <strong>"הוסף"</strong> בפינה</li>
          </ol>
        </div>

        {/* Android instructions */}
        <div className={`rounded-2xl border p-5 mb-4 ${platform === "android" ? "border-primary/50 bg-primary/5" : "border-border bg-card"}`}>
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="w-5 h-5" />
            <h2 className="text-lg font-bold">אנדרואיד (Chrome)</h2>
          </div>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="font-bold text-foreground">1.</span> פתח את האתר ב-<strong>Chrome</strong></li>
            <li className="flex gap-2"><span className="font-bold text-foreground">2.</span> לחץ על כפתור התקן למעלה אם הוא מופיע, או על תפריט שלוש הנקודות ⋮</li>
            <li className="flex gap-2"><span className="font-bold text-foreground">3.</span> בחר <strong>"התקן אפליקציה"</strong> או <strong>"הוסף למסך הבית"</strong></li>
            <li className="flex gap-2"><span className="font-bold text-foreground">4.</span> אשר את ההתקנה</li>
          </ol>
        </div>

        {/* Desktop instructions */}
        <div className={`rounded-2xl border p-5 mb-4 ${platform === "desktop" ? "border-primary/50 bg-primary/5" : "border-border bg-card"}`}>
          <div className="flex items-center gap-2 mb-3">
            <Monitor className="w-5 h-5" />
            <h2 className="text-lg font-bold">מחשב (Chrome / Edge)</h2>
          </div>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="font-bold text-foreground">1.</span> פתח את האתר ב-<Chrome className="w-4 h-4 inline" /> <strong>Chrome</strong> או <strong>Edge</strong></li>
            <li className="flex gap-2"><span className="font-bold text-foreground">2.</span> בשורת הכתובת, לחץ על האייקון <Download className="w-4 h-4 inline" /> בצד ימין</li>
            <li className="flex gap-2"><span className="font-bold text-foreground">3.</span> או: תפריט ⋮ → <strong>"התקן את Magic 3D Admin"</strong></li>
            <li className="flex gap-2"><span className="font-bold text-foreground">4.</span> האפליקציה תפתח בחלון נפרד ותתווסף לשולחן העבודה</li>
          </ol>
        </div>

        <div className="text-center mt-8 text-xs text-muted-foreground">
          לאחר ההתקנה, האפליקציה תיפתח ישירות בדף ההתחברות לניהול
        </div>
      </div>
    </div>
  );
}