"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, PageHeader, Select } from "@/components/admin/ui";
import { useAdminI18n } from "@/lib/admin-i18n";
import { COMMUNICATION_CHANNELS } from "@/lib/crm-constants";

type Customer = { id: number; firstName: string; lastName: string | null };

type Conversation = {
  customerId: number;
  customer: Customer;
  lastMessage: string;
  lastChannel: string;
  lastDirection: string;
  lastAt: string;
  messageCount: number;
};

type LogEntry = {
  id: number;
  channel: string;
  direction: string;
  message: string;
  createdAt: string;
};

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: "💬",
  telegram: "✈️",
  email: "📧",
  website: "🌐",
  phone: "📞",
  other: "💭",
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function MessagesPage() {
  const { t } = useAdminI18n();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [thread, setThread] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyChannel, setReplyChannel] = useState("whatsapp");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  async function loadConversations() {
    setLoading(true);
    const res = await fetch("/api/admin/communication-log/inbox");
    const data: Conversation[] = await res.json();
    setConversations(data);
    setLoading(false);
    if (!selectedId && data.length > 0) {
      setSelectedId(data[0].customerId);
    }
  }

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadThread(customerId: number) {
    const res = await fetch(`/api/admin/communication-log?customerId=${customerId}`);
    const data: LogEntry[] = await res.json();
    setThread(data.slice().reverse());
  }

  useEffect(() => {
    if (selectedId) loadThread(selectedId);
  }, [selectedId]);

  async function handleSend() {
    if (!selectedId || !replyText.trim()) return;
    setSending(true);
    await fetch("/api/admin/communication-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: selectedId,
        channel: replyChannel,
        direction: "outbound",
        message: replyText,
      }),
    });
    setReplyText("");
    setSending(false);
    await loadThread(selectedId);
    await loadConversations();
  }

  async function handleDelete(id: number) {
    if (!selectedId) return;
    await fetch(`/api/admin/communication-log/${id}`, { method: "DELETE" });
    await loadThread(selectedId);
    await loadConversations();
  }

  const selected = conversations.find((c) => c.customerId === selectedId);

  return (
    <div>
      <PageHeader title={t.messages.title} description={t.messages.description} />

      <Card className="overflow-hidden">
        <div className="flex h-[calc(100vh-260px)] min-h-[420px]">
          {/* Conversation list */}
          <div className="w-72 shrink-0 border-r border-gray-100 dark:border-white/10 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-sm text-gray-400">{t.common.loading}</p>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-gray-400">{t.messages.empty}</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.customerId}
                  onClick={() => setSelectedId(c.customerId)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 dark:border-white/5 transition ${
                    selectedId === c.customerId
                      ? "bg-indigo-50 dark:bg-indigo-500/10"
                      : "hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm truncate">
                      {c.customer.firstName} {c.customer.lastName ?? ""}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">{timeAgo(c.lastAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-white/50 truncate">
                    {CHANNEL_ICONS[c.lastChannel] ?? "💭"}{" "}
                    {c.lastDirection === "outbound" ? "→ " : ""}
                    {c.lastMessage}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Thread */}
          <div className="flex-1 flex flex-col min-w-0">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                {t.messages.selectConversation}
              </div>
            ) : (
              <>
                <div className="px-5 py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                  <Link
                    href={`/admin/customers/${selected.customerId}`}
                    className="font-medium hover:text-indigo-600"
                  >
                    {selected.customer.firstName} {selected.customer.lastName ?? ""}
                  </Link>
                  <span className="text-xs text-gray-400">{selected.messageCount} messages</span>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {thread.length === 0 ? (
                    <p className="text-sm text-gray-400">{t.messages.noMessages}</p>
                  ) : (
                    thread.map((log) => (
                      <div
                        key={log.id}
                        className={`group flex items-center gap-1.5 ${log.direction === "outbound" ? "justify-end" : "justify-start"}`}
                      >
                        {log.direction === "outbound" && (
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-red-500 transition"
                          >
                            {t.common.delete}
                          </button>
                        )}
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                            log.direction === "outbound"
                              ? "bg-indigo-600 text-white rounded-br-sm"
                              : "bg-gray-100 dark:bg-white/10 rounded-bl-sm"
                          }`}
                        >
                          <p>{log.message}</p>
                          <p
                            className={`mt-1 text-[10px] ${
                              log.direction === "outbound" ? "text-indigo-200" : "text-gray-400"
                            }`}
                          >
                            {CHANNEL_ICONS[log.channel] ?? "💭"} {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {log.direction === "inbound" && (
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-red-500 transition"
                          >
                            {t.common.delete}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-gray-100 dark:border-white/10 p-3">
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-2">
                    {t.messages.channelNotConnected}
                  </p>
                  <div className="flex items-end gap-2">
                    <Select
                      value={replyChannel}
                      onChange={(e) => setReplyChannel(e.target.value)}
                      className="w-32"
                    >
                      {COMMUNICATION_CHANNELS.map((c) => (
                        <option key={c} value={c}>
                          {CHANNEL_ICONS[c] ?? "💭"} {c}
                        </option>
                      ))}
                    </Select>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={t.messages.typeMessage}
                      rows={1}
                      className="flex-1 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-white/[0.08] px-3 py-2 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 resize-none"
                    />
                    <button
                      onClick={handleSend}
                      disabled={sending || !replyText.trim()}
                      className="inline-flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 px-4 py-2 text-sm font-medium shadow-sm transition disabled:opacity-50"
                    >
                      {t.messages.send}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
