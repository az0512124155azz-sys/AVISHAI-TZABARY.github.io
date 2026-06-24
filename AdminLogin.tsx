import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Download } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, dir } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success(t("login.success"));
      const redirectTo = (location.state as { from?: string } | null)?.from || "/admin";
      navigate(redirectTo, { replace: true });
    } catch {
      toast.error(t("login.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 w-full max-w-sm space-y-6" dir={dir}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-black font-heading gradient-text">{t("login.title")}</h1>
        </div>
        <div>
          <Label className="text-foreground mb-2 block">{t("login.email")}</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="bg-secondary border-border" />
        </div>
        <div>
          <Label className="text-foreground mb-2 block">{t("login.password")}</Label>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="bg-secondary border-border" />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-bold">
          {loading ? t("login.loading") : t("login.submit")}
        </Button>
        <button
          type="button"
          onClick={() => navigate("/install")}
          className="w-full text-sm text-muted-foreground hover:text-primary transition flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          התקן כאפליקציה לטלפון/מחשב
        </button>
      </form>
    </div>
  );
}
