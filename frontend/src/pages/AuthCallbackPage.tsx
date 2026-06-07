import { useEffect } from "react";
import { useLocation } from "wouter";
import { api, setTokens } from "../lib/apiClient";
import { Loader2 } from "lucide-react";
import type { AuthUser } from "../context/AuthContext";

export default function AuthCallbackPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get("code");
    const error  = params.get("error");

    if (error) { setLocation("/auth?error=" + encodeURIComponent(error)); return; }
    if (!code)  { setLocation("/auth"); return; }

    fetch("/api/auth/google/exchange", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ code }),
    })
      .then(async res => {
        if (!res.ok) throw new Error("Exchange failed");
        return res.json() as Promise<{ accessToken: string; refreshToken: string }>;
      })
      .then(async data => {
        setTokens(data.accessToken, data.refreshToken);

        // Fetch user profile to decide redirect target
        const { user } = await api.get<{ user: AuthUser }>("/auth/me");

        if (user.role === "admin") {
          window.location.replace("/admin");
        } else if (!user.phone) {
          window.location.replace("/auth/phone");
        } else {
          window.location.replace("/");
        }
      })
      .catch(() => setLocation("/auth?error=google_failed"));
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#E63946] mx-auto mb-4" />
        <p className="text-gray-500 font-medium">جارٍ تسجيل الدخول…</p>
      </div>
    </div>
  );
}
