"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAdminI18n } from "@/lib/admin-i18n";

type Notification = { id: string; type: string; message: string; link: string };

const icons: Record<string, string> = {
  new_inquiry: "🆕",
  travel_approaching: "✈️",
  pending_payment: "💰",
};

export default function NotificationBell() {
  const { t } = useAdminI18n();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/notifications")
      .then((res) => res.json())
      .then(setItems)
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function labelFor(type: string) {
    if (type === "new_inquiry") return t.notifications.newInquiry;
    if (type === "travel_approaching") return t.notifications.travelApproaching;
    if (type === "pending_payment") return t.notifications.pendingPayment;
    return type;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition"
        title={t.notifications.title}
      >
        🔔
        {items.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#0f1f1f]">
          <p className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-100 dark:border-white/10">
            {t.notifications.title}
          </p>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">{t.notifications.empty}</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-white/10">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.link}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <span>{icons[n.type] ?? "•"}</span>
                    <span>
                      <span className="block text-xs text-gray-400">{labelFor(n.type)}</span>
                      <span className="block text-gray-700 dark:text-white/80">{n.message}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
