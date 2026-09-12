"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  LoadingRows,
  PageHeader,
  Select,
} from "@/components/admin/ui";
import { useAdminI18n } from "@/lib/admin-i18n";
import { INQUIRY_STATUSES } from "@/lib/crm-constants";
import { formatUsd } from "@/lib/format";

type Customer = { id: number; firstName: string; lastName: string | null };
type Inquiry = {
  id: number;
  customerId: number;
  customer: Customer;
  travelStartDate: string | null;
  travelEndDate: string | null;
  adults: number;
  children: number;
  budget: string | null;
  currency: string;
  status: string;
  priority: string;
};

export default function InquiriesPage() {
  const { t } = useAdminI18n();
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [convertingId, setConvertingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(
      statusFilter ? `/api/admin/inquiries?status=${statusFilter}` : "/api/admin/inquiries"
    );
    setInquiries(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function handleDelete(id: number) {
    if (!confirm(t.inquiries.confirmDelete)) return;
    await fetch(`/api/admin/inquiries/${id}`, { method: "DELETE" });
    load();
  }

  async function handleConvert(id: number) {
    setConvertingId(id);
    const res = await fetch(`/api/admin/inquiries/${id}/convert-to-tour`, { method: "POST" });
    setConvertingId(null);
    if (res.ok) {
      const tour = await res.json();
      router.push(`/admin/tours/${tour.id}`);
    }
  }

  function statusLabel(status: string) {
    const key = `status${status
      .split("_")
      .map((s) => s[0].toUpperCase() + s.slice(1))
      .join("")}` as keyof typeof t.inquiries;
    return (t.inquiries[key] as string) ?? status;
  }

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
    contacted: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400",
    preparing: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
    proposal_sent: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400",
    negotiation: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    paid: "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400",
    completed: "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white/70",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <PageHeader title={t.inquiries.title} description={t.inquiries.description} />
        <Link href="/admin/inquiries/new">
          <Button>{t.inquiries.addButton}</Button>
        </Link>
      </div>

      <div className="mb-4">
        <Field label={t.inquiries.filterByStatus} className="w-56">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">{t.inquiries.allStatuses}</option>
            {INQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingRows />
        ) : inquiries.length === 0 ? (
          <EmptyState message={t.inquiries.empty} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">{t.inquiries.colCustomer}</th>
                <th className="px-5 py-3 font-medium">{t.inquiries.colDates}</th>
                <th className="px-5 py-3 font-medium">{t.inquiries.colPax}</th>
                <th className="px-5 py-3 font-medium">{t.inquiries.colBudget}</th>
                <th className="px-5 py-3 font-medium">{t.inquiries.colStatus}</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inq) => (
                <tr
                  key={inq.id}
                  className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/admin/inquiries/${inq.id}`} className="hover:text-indigo-600">
                      {inq.customer.firstName} {inq.customer.lastName ?? ""}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-white/50">
                    {inq.travelStartDate || "—"} → {inq.travelEndDate || "—"}
                  </td>
                  <td className="px-5 py-3 tabular-nums">
                    {inq.adults + inq.children}
                  </td>
                  <td className="px-5 py-3 tabular-nums">
                    {inq.budget ? `${formatUsd(inq.budget)}` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs rounded-full px-2.5 py-1 font-medium ${statusColors[inq.status] ?? ""}`}>
                      {statusLabel(inq.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-1">
                    <IconButton
                      onClick={() => handleConvert(inq.id)}
                      disabled={convertingId === inq.id}
                    >
                      {convertingId === inq.id ? t.inquiries.converting : t.inquiries.convertToTour}
                    </IconButton>
                    <Link href={`/admin/inquiries/${inq.id}`}>
                      <IconButton>{t.common.view}</IconButton>
                    </Link>
                    <IconButton variant="danger" onClick={() => handleDelete(inq.id)}>
                      {t.common.delete}
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
