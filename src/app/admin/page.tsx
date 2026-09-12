"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, LoadingRows, PageHeader } from "@/components/admin/ui";
import { useAdminI18n } from "@/lib/admin-i18n";
import { formatUsd, formatUzs } from "@/lib/format";

type DashboardData = {
  newLeads: number;
  newLeadsTrend: number | null;
  activeInquiries: number;
  proposalsSent: number;
  proposalsSentTrend: number | null;
  confirmedBookings: number;
  confirmedBookingsTrend: number | null;
  completedBookings: number;
  depositPendingCount: number;
  revenueUsd: number;
  revenueUzs: number;
  revenueTrend: number | null;
  pendingUsd: number;
  pendingUzs: number;
  upcomingTours: { id: number; customerName: string; travelStartDate: string | null; cities: string | null }[];
  todaysFollowUps: { id: number; customerName: string; nextFollowUpAt: string }[];
  managerPerformance: { manager: string; count: number }[];
};

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
        positive
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
          : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
      }`}
    >
      {positive ? "▲" : "▼"} {Math.abs(value).toFixed(0)}%
    </span>
  );
}

function StatCard({
  label,
  value,
  trend,
  accent,
}: {
  label: string;
  value: string;
  trend?: number | null;
  accent?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">{label}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <p className={`text-2xl font-semibold tabular-nums ${accent ?? ""}`}>{value}</p>
        {trend !== undefined && <TrendBadge value={trend} />}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { t } = useAdminI18n();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <div>
      <PageHeader title={t.dashboard.title} description={t.dashboard.description} />

      {!data ? (
        <LoadingRows />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label={t.dashboard.newLeads} value={String(data.newLeads)} trend={data.newLeadsTrend} />
            <StatCard label={t.dashboard.activeInquiries} value={String(data.activeInquiries)} />
            <StatCard
              label={t.dashboard.proposalsSent}
              value={String(data.proposalsSent)}
              trend={data.proposalsSentTrend}
            />
            <StatCard
              label={t.dashboard.confirmedBookings}
              value={String(data.confirmedBookings)}
              trend={data.confirmedBookingsTrend}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <StatCard label={t.dashboard.completedTours} value={String(data.completedBookings)} />
            <StatCard label={t.dashboard.depositPending} value={String(data.depositPendingCount)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <StatCard
              label={t.dashboard.revenue}
              value={`${formatUsd(data.revenueUsd)} / ${formatUzs(data.revenueUzs)}`}
              trend={data.revenueTrend}
              accent="text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              label={t.dashboard.pendingPayments}
              value={`${formatUsd(data.pendingUsd)} / ${formatUzs(data.pendingUzs)}`}
              accent="text-amber-600 dark:text-amber-400"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                  {t.nav.followUps}
                </h3>
                <Link href="/admin/follow-ups" className="text-xs text-indigo-600 hover:underline">
                  {t.common.view}
                </Link>
              </div>
              {data.todaysFollowUps.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-white/40">{t.followUps.empty}</p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-white/10">
                  {data.todaysFollowUps.map((f) => (
                    <li key={f.id} className="py-2.5 flex items-center justify-between text-sm">
                      <Link href={`/admin/inquiries/${f.id}`} className="hover:text-indigo-600">
                        {f.customerName || "—"}
                      </Link>
                      <span className="tabular-nums text-gray-500 dark:text-white/50">
                        {f.nextFollowUpAt}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
                {t.dashboard.upcomingTours}
              </h3>
              {data.upcomingTours.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-white/40">{t.dashboard.noUpcoming}</p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-white/10">
                  {data.upcomingTours.map((u) => (
                    <li key={u.id} className="py-2.5 flex items-center justify-between text-sm">
                      <Link href={`/admin/inquiries/${u.id}`} className="hover:text-indigo-600">
                        {u.customerName || "—"} {u.cities && <span className="text-gray-400">· {u.cities}</span>}
                      </Link>
                      <span className="tabular-nums text-gray-500 dark:text-white/50">
                        {u.travelStartDate}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
                {t.dashboard.managerPerformance}
              </h3>
              {data.managerPerformance.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-white/40">{t.dashboard.noManagerData}</p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-white/10">
                  {data.managerPerformance.map((m) => (
                    <li key={m.manager} className="py-2.5 flex items-center justify-between text-sm">
                      <span>{m.manager}</span>
                      <span className="tabular-nums font-medium">{m.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
