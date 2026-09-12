"use client";

import { useEffect, useState } from "react";
import { Button, Card, Field, Input, LoadingRows, PageHeader } from "@/components/admin/ui";
import { useAdminI18n } from "@/lib/admin-i18n";
import { formatUsd, formatUzs } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";

type ReportData = {
  totalSalesUsd: number;
  totalSalesUzs: number;
  totalProfitUsd: number;
  totalProfitUzs: number;
  totalExpensesUsd: number;
  totalExpensesUzs: number;
  netProfitUsd: number;
  netProfitUzs: number;
  totalPaidUsd: number;
  totalPaidUzs: number;
  bookingsCount: number;
  inquiriesCount: number;
  conversionRate: number;
  avgBookingValueUsd: number;
  bestDestinations: { city: string; count: number }[];
  managerPerformance: { manager: string; count: number }[];
  customerSources: { source: string; count: number }[];
  monthlyTrend: { month: string; inquiries: number; bookings: number; revenueUsd: number }[];
  bookingsList: {
    id: number;
    tourName: string;
    customerName: string;
    totalUsd: string;
    totalUzs: string;
    status: string;
    createdAt: string;
  }[];
};

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6", "#ec4899"];

function BarList({ items }: { items: { label: string; count: number }[] }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={item.label}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span>{item.label}</span>
            <span className="tabular-nums font-medium">{item.count}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(item.count / max) * 100}%`,
                backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ items }: { items: { label: string; count: number }[] }) {
  const total = items.reduce((sum, i) => sum + i.count, 0) || 1;
  let cumulative = 0;
  const stops = items.map((item, i) => {
    const start = (cumulative / total) * 100;
    cumulative += item.count;
    const end = (cumulative / total) * 100;
    return `${CHART_COLORS[i % CHART_COLORS.length]} ${start}% ${end}%`;
  });
  return (
    <div className="flex items-center gap-5 flex-wrap">
      <div
        className="h-32 w-32 rounded-full shrink-0"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
      />
      <ul className="space-y-1.5 text-sm">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span>{item.label}</span>
            <span className="tabular-nums text-gray-400">
              ({((item.count / total) * 100).toFixed(0)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("uz-UZ", { month: "short" });
}

function GroupedBarChart({
  data,
  seriesA,
  seriesB,
}: {
  data: { month: string; inquiries: number; bookings: number }[];
  seriesA: string;
  seriesB: string;
}) {
  const max = Math.max(...data.map((d) => Math.max(d.inquiries, d.bookings)), 1);
  return (
    <div>
      <div className="flex items-end gap-4 h-40">
        {data.map((d) => (
          <div key={d.month} className="flex-1 flex items-end justify-center gap-1 h-full">
            <div
              className="w-3 rounded-t"
              style={{ height: `${(d.inquiries / max) * 100}%`, backgroundColor: CHART_COLORS[0] }}
              title={`${seriesA}: ${d.inquiries}`}
            />
            <div
              className="w-3 rounded-t"
              style={{ height: `${(d.bookings / max) * 100}%`, backgroundColor: CHART_COLORS[1] }}
              title={`${seriesB}: ${d.bookings}`}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-1">
        {data.map((d) => (
          <div key={d.month} className="flex-1 text-center text-xs text-gray-400">
            {monthLabel(d.month)}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[0] }} />
          {seriesA}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[1] }} />
          {seriesB}
        </span>
      </div>
    </div>
  );
}

function LineChart({ data }: { data: { month: string; revenueUsd: number }[] }) {
  const width = 480;
  const height = 140;
  const pad = 24;
  const max = Math.max(...data.map((d) => d.revenueUsd), 1);
  const stepX = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = height - pad - (d.revenueUsd / max) * (height - pad * 2);
    return { x, y, value: d.revenueUsd, month: d.month };
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${path} L${points[points.length - 1]?.x ?? pad},${height - pad} L${pad},${height - pad} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36">
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="currentColor" className="text-gray-200 dark:text-white/10" />
        <path d={areaPath} fill={CHART_COLORS[0]} opacity={0.12} />
        <path d={path} fill="none" stroke={CHART_COLORS[0]} strokeWidth={2} />
        {points.map((p) => (
          <circle key={p.month} cx={p.x} cy={p.y} r={3} fill={CHART_COLORS[0]} />
        ))}
      </svg>
      <div className="flex mt-1">
        {data.map((d) => (
          <div key={d.month} className="flex-1 text-center text-xs text-gray-400">
            {monthLabel(d.month)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { t } = useAdminI18n();
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/reports?from=${from}&to=${to}`);
    setData(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  function handleExport() {
    if (!data) return;
    downloadCsv(
      `report_${from}_${to}.csv`,
      [t.reports.colTour, t.reports.colCustomer, t.reports.colTotal, t.reports.colStatus, t.reports.colDate],
      data.bookingsList.map((b) => [
        b.tourName,
        b.customerName,
        `${formatUsd(b.totalUsd)} / ${formatUzs(b.totalUzs)}`,
        b.status,
        new Date(b.createdAt).toISOString().slice(0, 10),
      ])
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <PageHeader title={t.reports.title} description={t.reports.description} />
        <Button onClick={handleExport} variant="secondary" disabled={!data}>
          {t.reports.exportCsv}
        </Button>
      </div>

      <Card className="p-4 mb-6 flex flex-wrap items-end gap-3">
        <Field label={t.reports.from} className="w-40">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label={t.reports.to} className="w-40">
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
      </Card>

      {loading || !data ? (
        <LoadingRows />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label={t.reports.totalSales}
              value={`${formatUsd(data.totalSalesUsd)} / ${formatUzs(data.totalSalesUzs)}`}
            />
            <StatCard
              label={t.reports.totalProfit}
              value={`${formatUsd(data.totalProfitUsd)} / ${formatUzs(data.totalProfitUzs)}`}
            />
            <StatCard
              label={t.reports.totalPaid}
              value={`${formatUsd(data.totalPaidUsd)} / ${formatUzs(data.totalPaidUzs)}`}
            />
            <StatCard label={t.reports.bookingsCount} value={String(data.bookingsCount)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label={t.reports.inquiriesCount} value={String(data.inquiriesCount)} />
            <StatCard label={t.reports.conversionRate} value={`${data.conversionRate.toFixed(1)}%`} />
            <StatCard label={t.reports.avgBookingValue} value={formatUsd(data.avgBookingValueUsd)} />
            <StatCard
              label={t.expenses.totalExpenses}
              value={`${formatUsd(data.totalExpensesUsd)} / ${formatUzs(data.totalExpensesUzs)}`}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <StatCard
              label={t.expenses.netProfit}
              value={`${formatUsd(data.netProfitUsd)} / ${formatUzs(data.netProfitUzs)}`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
                {t.reports.bestDestinations}
              </h3>
              {data.bestDestinations.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-white/40">{t.reports.noData}</p>
              ) : (
                <BarList items={data.bestDestinations.map((d) => ({ label: d.city, count: d.count }))} />
              )}
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
                {t.reports.bestManagers}
              </h3>
              {data.managerPerformance.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-white/40">{t.reports.noData}</p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-white/10">
                  {data.managerPerformance.map((m) => (
                    <li key={m.manager} className="py-2 flex items-center justify-between text-sm">
                      <span>{m.manager}</span>
                      <span className="tabular-nums font-medium">{m.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
                {t.reports.customerSources}
              </h3>
              {data.customerSources.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-white/40">{t.reports.noData}</p>
              ) : (
                <DonutChart items={data.customerSources.map((s) => ({ label: s.source, count: s.count }))} />
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
                {t.reports.inquiriesVsBookings}
              </h3>
              <GroupedBarChart
                data={data.monthlyTrend}
                seriesA={t.reports.colInquiries}
                seriesB={t.reports.colBookings}
              />
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
                {t.reports.monthlyRevenue}
              </h3>
              <LineChart data={data.monthlyTrend} />
            </Card>
          </div>

          <Card className="overflow-hidden">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 p-5 pb-0">
              {t.reports.bookingsTable}
            </h3>
            {data.bookingsList.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-white/40 p-5">{t.reports.noData}</p>
            ) : (
              <table className="w-full text-sm mt-3">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/10 text-left text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-5 py-3 font-medium">{t.reports.colTour}</th>
                    <th className="px-5 py-3 font-medium">{t.reports.colCustomer}</th>
                    <th className="px-5 py-3 font-medium">{t.reports.colTotal}</th>
                    <th className="px-5 py-3 font-medium">{t.reports.colStatus}</th>
                    <th className="px-5 py-3 font-medium">{t.reports.colDate}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bookingsList.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-gray-50 dark:border-white/5 last:border-0"
                    >
                      <td className="px-5 py-3 font-medium">{b.tourName}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-white/50">{b.customerName}</td>
                      <td className="px-5 py-3 tabular-nums">
                        {formatUsd(b.totalUsd)} / {formatUzs(b.totalUzs)}
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-white/50">{b.status}</td>
                      <td className="px-5 py-3 tabular-nums text-gray-500 dark:text-white/50">
                        {new Date(b.createdAt).toISOString().slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
