"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, EmptyState, IconButton, LoadingRows, PageHeader } from "@/components/admin/ui";
import { useAdminI18n } from "@/lib/admin-i18n";

type Customer = { id: number; firstName: string; lastName: string | null };
type FollowUp = {
  id: number;
  customerId: number;
  customer: Customer;
  nextFollowUpAt: string;
  followUpStep: number;
  updatedAt: string;
  responsibleManager: string | null;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function FollowUpsPage() {
  const { t } = useAdminI18n();
  const [items, setItems] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/follow-ups");
    setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleMarkDone(id: number) {
    await fetch(`/api/admin/inquiries/${id}/follow-up`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nextFollowUpAt: null, incrementStep: true }),
    });
    load();
  }

  const todayStr = today();

  return (
    <div>
      <PageHeader title={t.followUps.title} description={t.followUps.description} />

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingRows />
        ) : items.length === 0 ? (
          <EmptyState message={t.followUps.empty} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">{t.followUps.colClient}</th>
                <th className="px-5 py-3 font-medium">{t.followUps.colNextFollowUp}</th>
                <th className="px-5 py-3 font-medium">{t.followUps.colStep}</th>
                <th className="px-5 py-3 font-medium">{t.followUps.colLastContact}</th>
                <th className="px-5 py-3 font-medium">{t.followUps.colResponsible}</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const overdue = item.nextFollowUpAt < todayStr;
                const isToday = item.nextFollowUpAt === todayStr;
                return (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3 font-medium">
                      <Link href={`/admin/inquiries/${item.id}`} className="hover:text-indigo-600">
                        {item.customer.firstName} {item.customer.lastName ?? ""}
                      </Link>
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      <span
                        className={
                          overdue
                            ? "text-red-600 dark:text-red-400 font-medium"
                            : isToday
                              ? "text-amber-600 dark:text-amber-400 font-medium"
                              : "text-gray-500 dark:text-white/50"
                        }
                      >
                        {item.nextFollowUpAt}
                        {overdue && ` · ${t.followUps.overdue}`}
                        {isToday && ` · ${t.followUps.todayLabel}`}
                      </span>
                    </td>
                    <td className="px-5 py-3 tabular-nums">{item.followUpStep}</td>
                    <td className="px-5 py-3 tabular-nums text-gray-500 dark:text-white/50">
                      {new Date(item.updatedAt).toISOString().slice(0, 10)}
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-white/50">
                      {item.responsibleManager || "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <IconButton onClick={() => handleMarkDone(item.id)}>
                        {t.followUps.markDone}
                      </IconButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
