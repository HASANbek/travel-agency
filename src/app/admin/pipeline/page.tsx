"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { useAdminI18n } from "@/lib/admin-i18n";
import { INQUIRY_STATUSES } from "@/lib/crm-constants";
import { formatUsd } from "@/lib/format";

type Customer = { id: number; firstName: string; lastName: string | null };
type Inquiry = {
  id: number;
  customer: Customer;
  status: string;
  priority: string;
  cities: string | null;
  adults: number;
  children: number;
  budget: string | null;
};

const COLUMN_COLORS: Record<string, string> = {
  new: "border-t-blue-400",
  contacted: "border-t-cyan-400",
  preparing: "border-t-purple-400",
  proposal_sent: "border-t-indigo-400",
  negotiation: "border-t-amber-400",
  confirmed: "border-t-emerald-400",
  paid: "border-t-teal-400",
  completed: "border-t-gray-400",
  cancelled: "border-t-red-400",
};

export default function PipelinePage() {
  const { t } = useAdminI18n();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/inquiries");
    setInquiries(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function statusLabel(status: string) {
    const key = `status${status
      .split("_")
      .map((s) => s[0].toUpperCase() + s.slice(1))
      .join("")}` as keyof typeof t.inquiries;
    return (t.inquiries[key] as string) ?? status;
  }

  async function handleDrop(newStatus: string) {
    setDragOverColumn(null);
    if (!draggedId) return;
    const inquiry = inquiries.find((i) => i.id === draggedId);
    if (!inquiry || inquiry.status === newStatus) {
      setDraggedId(null);
      return;
    }
    setInquiries((prev) =>
      prev.map((i) => (i.id === draggedId ? { ...i, status: newStatus } : i))
    );
    setDraggedId(null);
    await fetch(`/api/admin/inquiries/${inquiry.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  if (loading) {
    return <p className="text-sm text-gray-400">{t.common.loading}</p>;
  }

  return (
    <div>
      <PageHeader title={t.pipeline.title} description={t.pipeline.description} />
      <p className="text-xs text-gray-400 mb-4">{t.pipeline.dragHint}</p>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {INQUIRY_STATUSES.map((status) => {
            const cards = inquiries.filter((i) => i.status === status);
            return (
              <div
                key={status}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverColumn(status);
                }}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={() => handleDrop(status)}
                className={`w-64 shrink-0 rounded-lg border-t-4 bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 ${
                  COLUMN_COLORS[status] ?? "border-t-gray-300"
                } ${dragOverColumn === status ? "ring-2 ring-indigo-400" : ""}`}
              >
                <div className="px-3 py-2.5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/60">
                    {statusLabel(status)}
                  </span>
                  <span className="text-xs text-gray-400 tabular-nums">{cards.length}</span>
                </div>
                <div className="p-2 space-y-2 min-h-[80px]">
                  {cards.length === 0 ? (
                    <p className="text-xs text-gray-300 dark:text-white/20 text-center py-4">
                      {t.pipeline.empty}
                    </p>
                  ) : (
                    cards.map((inq) => (
                      <div
                        key={inq.id}
                        draggable
                        onDragStart={() => setDraggedId(inq.id)}
                        onDragEnd={() => setDraggedId(null)}
                        className={`rounded-lg border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-2.5 cursor-move transition ${
                          draggedId === inq.id ? "opacity-40" : "hover:shadow-sm"
                        }`}
                      >
                        <Link
                          href={`/admin/inquiries/${inq.id}`}
                          className="text-sm font-medium hover:text-indigo-600 block truncate"
                        >
                          {inq.customer.firstName} {inq.customer.lastName ?? ""}
                        </Link>
                        {inq.cities && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{inq.cities}</p>
                        )}
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs text-gray-400">
                            {inq.adults + inq.children} pax
                          </span>
                          {inq.budget && (
                            <span className="text-xs font-medium tabular-nums">
                              {formatUsd(inq.budget)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
