"use client";

import { useEffect, useState } from "react";
import { Button, Card, Field, Input, PageHeader } from "@/components/admin/ui";
import { useAdminI18n } from "@/lib/admin-i18n";
import { useAuth } from "@/lib/auth-context";
import { canManageUsers } from "@/lib/rbac";

type Integration = {
  channel: string;
  enabled: boolean;
  status: string | null;
  config: Record<string, string | number | undefined>;
};

function ToggleBadge({
  enabled,
  onToggle,
  t,
}: {
  enabled: boolean;
  onToggle: () => void;
  t: ReturnType<typeof useAdminI18n>["t"];
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`text-xs rounded-full px-2.5 py-1 font-medium transition ${
        enabled
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
          : "bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-white/60"
      }`}
    >
      {enabled ? t.integrations.enabled : t.integrations.disabled}
    </button>
  );
}

export default function IntegrationsSettingsPage() {
  const { t } = useAdminI18n();
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Record<string, Integration>>({});
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("");

  const [botTokenInput, setBotTokenInput] = useState("");
  const [connectingTelegram, setConnectingTelegram] = useState(false);
  const [pollingTelegram, setPollingTelegram] = useState(false);
  const [pollMsg, setPollMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const [emailForm, setEmailForm] = useState({ email: "", appPassword: "" });
  const [savingEmail, setSavingEmail] = useState(false);
  const [whatsappForm, setWhatsappForm] = useState({ phoneNumberId: "", accessToken: "" });
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/integrations");
    const list: Integration[] = await res.json();
    const map: Record<string, Integration> = {};
    list.forEach((i) => (map[i.channel] = i));
    setIntegrations(map);
    setEmailForm({
      email: (map.email?.config.email as string) || "",
      appPassword: "",
    });
    setWhatsappForm({
      phoneNumberId: (map.whatsapp?.config.phoneNumberId as string) || "",
      accessToken: "",
    });
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleEnabled(channel: string) {
    const current = integrations[channel];
    await fetch(`/api/admin/integrations/${channel}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !current.enabled }),
    });
    load();
  }

  async function handleRegenerateSecret() {
    await fetch(`/api/admin/integrations/website`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerateSecret: true, enabled: true }),
    });
    load();
  }

  function handleCopySecret() {
    const secret = integrations.website?.config.secret as string;
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleConnectTelegram() {
    if (!botTokenInput.trim()) return;
    setConnectingTelegram(true);
    const res = await fetch(`/api/admin/integrations/telegram`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botToken: botTokenInput.trim(), enabled: true }),
    });
    setConnectingTelegram(false);
    if (res.ok) {
      setBotTokenInput("");
      load();
    }
  }

  async function handleDisconnectTelegram() {
    await fetch(`/api/admin/integrations/telegram`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: false }),
    });
    load();
  }

  async function handlePollTelegram() {
    setPollingTelegram(true);
    setPollMsg("");
    const res = await fetch(`/api/admin/integrations/telegram/poll`, { method: "POST" });
    const data = await res.json();
    setPollingTelegram(false);
    if (res.ok) {
      setPollMsg(`${data.newMessages} ${t.integrations.newMessagesFound}`);
    }
  }

  async function handleSaveEmail() {
    setSavingEmail(true);
    await fetch(`/api/admin/integrations/email`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...emailForm, enabled: true }),
    });
    setSavingEmail(false);
    load();
  }

  async function handleSaveWhatsapp() {
    setSavingWhatsapp(true);
    await fetch(`/api/admin/integrations/whatsapp`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...whatsappForm, enabled: true }),
    });
    setSavingWhatsapp(false);
    load();
  }

  if (!user || !canManageUsers(user.role)) {
    return <div className="text-sm text-gray-500 dark:text-white/50">{t.users.noAccess}</div>;
  }

  if (loading) {
    return <p className="text-sm text-gray-400">{t.common.loading}</p>;
  }

  const website = integrations.website;
  const telegram = integrations.telegram;

  return (
    <div>
      <PageHeader title={t.integrations.title} description={t.integrations.description} />

      <div className="space-y-6">
        {/* Website */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{t.integrations.websiteTitle}</h3>
            {website && <ToggleBadge enabled={website.enabled} onToggle={() => toggleEnabled("website")} t={t} />}
          </div>
          <p className="text-sm text-gray-500 dark:text-white/50 mb-4">
            {t.integrations.websiteDescription}
          </p>
          <Field label={t.integrations.webhookUrl} className="mb-3">
            <Input readOnly value={`${origin}/api/webhooks/website`} className="font-mono text-xs" />
          </Field>
          <Field label={t.integrations.secret} className="mb-3">
            <div className="flex gap-2">
              <Input
                readOnly
                type="password"
                value={(website?.config.secret as string) || ""}
                className="font-mono text-xs flex-1"
              />
              <Button type="button" variant="secondary" onClick={handleCopySecret}>
                {copied ? t.integrations.copied : t.integrations.copy}
              </Button>
            </div>
          </Field>
          <Button type="button" variant="secondary" onClick={handleRegenerateSecret}>
            {t.integrations.regenerate}
          </Button>
        </Card>

        {/* Telegram */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{t.integrations.telegramTitle}</h3>
            {telegram && <ToggleBadge enabled={telegram.enabled} onToggle={() => toggleEnabled("telegram")} t={t} />}
          </div>
          <p className="text-sm text-gray-500 dark:text-white/50 mb-4">
            {t.integrations.telegramDescription}
          </p>

          {telegram?.enabled && telegram.config.botToken ? (
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="text-sm text-emerald-600 dark:text-emerald-400">
                ✅ {t.integrations.connectedAs}: @{telegram.config.botUsername as string}
              </span>
              <Button type="button" variant="secondary" onClick={handleDisconnectTelegram}>
                {t.integrations.disconnect}
              </Button>
              <Button type="button" onClick={handlePollTelegram} disabled={pollingTelegram}>
                {pollingTelegram ? t.integrations.checking : t.integrations.checkNow}
              </Button>
              {pollMsg && <span className="text-sm text-gray-500">{pollMsg}</span>}
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-3 mb-3">
              <Field label={t.integrations.botToken} className="flex-1 min-w-[220px]">
                <Input
                  type="password"
                  value={botTokenInput}
                  onChange={(e) => setBotTokenInput(e.target.value)}
                  placeholder="123456:ABC-DEF..."
                />
              </Field>
              <Button type="button" onClick={handleConnectTelegram} disabled={connectingTelegram}>
                {connectingTelegram ? t.integrations.connecting : t.integrations.connect}
              </Button>
            </div>
          )}
          <p className="text-xs text-gray-400">{t.integrations.pollingNote}</p>
        </Card>

        {/* Email */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{t.integrations.emailTitle}</h3>
            {integrations.email && (
              <ToggleBadge enabled={integrations.email.enabled} onToggle={() => toggleEnabled("email")} t={t} />
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-white/50 mb-4">
            {t.integrations.emailDescription}
          </p>
          <div className="flex flex-wrap items-end gap-3 mb-2">
            <Field label={t.integrations.emailAddress} className="w-64">
              <Input
                value={emailForm.email}
                onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
              />
            </Field>
            <Field label={t.integrations.appPassword} className="w-56">
              <Input
                type="password"
                value={emailForm.appPassword}
                onChange={(e) => setEmailForm({ ...emailForm, appPassword: e.target.value })}
              />
            </Field>
            <Button type="button" onClick={handleSaveEmail} disabled={savingEmail}>
              {savingEmail ? t.builder.saving : t.integrations.save}
            </Button>
          </div>
          {integrations.email?.config.email && (
            <p className="text-xs text-amber-600 dark:text-amber-400">{t.integrations.comingSoon}</p>
          )}
        </Card>

        {/* WhatsApp */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{t.integrations.whatsappTitle}</h3>
            {integrations.whatsapp && (
              <ToggleBadge
                enabled={integrations.whatsapp.enabled}
                onToggle={() => toggleEnabled("whatsapp")}
                t={t}
              />
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-white/50 mb-4">
            {t.integrations.whatsappDescription}
          </p>
          <div className="flex flex-wrap items-end gap-3 mb-2">
            <Field label={t.integrations.phoneNumberId} className="w-56">
              <Input
                value={whatsappForm.phoneNumberId}
                onChange={(e) => setWhatsappForm({ ...whatsappForm, phoneNumberId: e.target.value })}
              />
            </Field>
            <Field label={t.integrations.accessToken} className="w-64">
              <Input
                type="password"
                value={whatsappForm.accessToken}
                onChange={(e) => setWhatsappForm({ ...whatsappForm, accessToken: e.target.value })}
              />
            </Field>
            <Button type="button" onClick={handleSaveWhatsapp} disabled={savingWhatsapp}>
              {savingWhatsapp ? t.builder.saving : t.integrations.save}
            </Button>
          </div>
          {integrations.whatsapp?.config.phoneNumberId && (
            <p className="text-xs text-amber-600 dark:text-amber-400">{t.integrations.comingSoon}</p>
          )}
        </Card>
      </div>
    </div>
  );
}
