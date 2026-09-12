"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input } from "@/components/admin/ui";
import { useAdminI18n } from "@/lib/admin-i18n";

export default function LoginPage() {
  const { t } = useAdminI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError(t.auth.invalidCredentials);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A2121] px-4">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-white/[0.06] p-8 shadow-lg">
        <p className="text-xs uppercase tracking-widest text-blue-300 mb-1">Travel Agency</p>
        <h1 className="text-xl font-semibold text-white mb-1">{t.auth.title}</h1>
        <p className="text-sm text-white/50 mb-6">{t.auth.subtitle}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label={t.auth.email}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </Field>
          <Field label={t.auth.password}>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={loading} className="mt-2 justify-center">
            {loading ? t.auth.loggingIn : t.auth.loginButton}
          </Button>
        </form>
      </div>
    </div>
  );
}
