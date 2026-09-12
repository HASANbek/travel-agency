import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const fromParam = request.nextUrl.searchParams.get("from");
  const toParam = request.nextUrl.searchParams.get("to");

  const from = fromParam ? new Date(fromParam) : defaultFrom;
  const to = toParam ? new Date(toParam + "T23:59:59") : now;
  const fromStr = fromParam || from.toISOString().slice(0, 10);
  const toStr = toParam || now.toISOString().slice(0, 10);

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    bookings,
    inquiriesCount,
    managerGroups,
    customerSourceGroups,
    expenses,
    recentInquiries,
    recentBookings,
    recentPayments,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: {
        tour: { include: { cities: { include: { city: true } } } },
        customer: true,
        payments: { select: { amountUsd: true, amountUzs: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.inquiry.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.inquiry.groupBy({
      by: ["responsibleManager"],
      where: { createdAt: { gte: from, lte: to }, responsibleManager: { not: null } },
      _count: { _all: true },
    }),
    prisma.customer.groupBy({
      by: ["source"],
      where: { source: { not: null } },
      _count: { _all: true },
    }),
    prisma.expense.findMany({ where: { date: { gte: fromStr, lte: toStr } } }),
    prisma.inquiry.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    prisma.booking.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    prisma.payment.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, amountUsd: true },
    }),
  ]);

  const totalSalesUsd = bookings.reduce((sum, b) => sum + Number(b.totalUsd), 0);
  const totalSalesUzs = bookings.reduce((sum, b) => sum + Number(b.totalUzs), 0);
  const totalProfitUsd = bookings.reduce((sum, b) => sum + Number(b.tour.profitUsd), 0);
  const totalProfitUzs = bookings.reduce((sum, b) => sum + Number(b.tour.profitUzs), 0);
  const totalPaidUsd = bookings.reduce(
    (sum, b) => sum + b.payments.reduce((s, p) => s + Number(p.amountUsd ?? 0), 0),
    0
  );
  const totalPaidUzs = bookings.reduce(
    (sum, b) => sum + b.payments.reduce((s, p) => s + Number(p.amountUzs ?? 0), 0),
    0
  );

  const destinationCounts = new Map<string, number>();
  for (const b of bookings) {
    for (const tc of b.tour.cities) {
      destinationCounts.set(tc.city.name, (destinationCounts.get(tc.city.name) ?? 0) + 1);
    }
  }
  const bestDestinations = Array.from(destinationCounts.entries())
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const managerPerformance = managerGroups
    .map((g) => ({ manager: g.responsibleManager as string, count: g._count._all }))
    .sort((a, b) => b.count - a.count);

  const customerSources = customerSourceGroups
    .map((g) => ({ source: g.source as string, count: g._count._all }))
    .sort((a, b) => b.count - a.count);

  const bookingsCount = bookings.length;
  const conversionRate = inquiriesCount > 0 ? (bookingsCount / inquiriesCount) * 100 : 0;
  const avgBookingValueUsd = bookingsCount > 0 ? totalSalesUsd / bookingsCount : 0;

  const totalExpensesUsd = expenses.reduce((sum, e) => sum + Number(e.amountUsd ?? 0), 0);
  const totalExpensesUzs = expenses.reduce((sum, e) => sum + Number(e.amountUzs ?? 0), 0);
  const netProfitUsd = totalProfitUsd - totalExpensesUsd;
  const netProfitUzs = totalProfitUzs - totalExpensesUzs;

  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  function monthKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  const inquiriesByMonth = new Map<string, number>();
  for (const i of recentInquiries) {
    const k = monthKey(i.createdAt);
    inquiriesByMonth.set(k, (inquiriesByMonth.get(k) ?? 0) + 1);
  }
  const bookingsByMonth = new Map<string, number>();
  for (const b of recentBookings) {
    const k = monthKey(b.createdAt);
    bookingsByMonth.set(k, (bookingsByMonth.get(k) ?? 0) + 1);
  }
  const revenueByMonth = new Map<string, number>();
  for (const p of recentPayments) {
    const k = monthKey(p.createdAt);
    revenueByMonth.set(k, (revenueByMonth.get(k) ?? 0) + Number(p.amountUsd ?? 0));
  }
  const monthlyTrend = monthKeys.map((k) => ({
    month: k,
    inquiries: inquiriesByMonth.get(k) ?? 0,
    bookings: bookingsByMonth.get(k) ?? 0,
    revenueUsd: revenueByMonth.get(k) ?? 0,
  }));

  return NextResponse.json({
    totalSalesUsd,
    totalSalesUzs,
    totalProfitUsd,
    totalProfitUzs,
    totalExpensesUsd,
    totalExpensesUzs,
    netProfitUsd,
    netProfitUzs,
    totalPaidUsd,
    totalPaidUzs,
    bookingsCount,
    inquiriesCount,
    conversionRate,
    avgBookingValueUsd,
    bestDestinations,
    managerPerformance,
    customerSources,
    monthlyTrend,
    bookingsList: bookings.map((b) => ({
      id: b.id,
      tourName: b.tour.name,
      customerName: b.customer ? `${b.customer.firstName} ${b.customer.lastName ?? ""}`.trim() : "",
      totalUsd: b.totalUsd,
      totalUzs: b.totalUzs,
      status: b.status,
      createdAt: b.createdAt,
    })),
  });
}
