import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function trendPercent(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export async function GET() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    newLeadsThisMonth,
    newLeadsLastMonth,
    activeInquiries,
    proposalsThisMonth,
    proposalsLastMonth,
    confirmedBookings,
    completedBookings,
    bookingsThisMonth,
    bookingsLastMonth,
    upcomingInquiries,
    todaysFollowUps,
    payments,
    paymentsThisMonth,
    paymentsLastMonth,
    bookings,
    managerGroups,
  ] = await Promise.all([
    prisma.inquiry.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.inquiry.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    prisma.inquiry.count({ where: { status: { notIn: ["completed", "cancelled"] } } }),
    prisma.quotation.count({ where: { sentAt: { gte: thisMonthStart } } }),
    prisma.quotation.count({ where: { sentAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    prisma.booking.count({ where: { status: "confirmed" } }),
    prisma.booking.count({ where: { status: "completed" } }),
    prisma.booking.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.booking.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    prisma.inquiry.findMany({
      where: {
        travelStartDate: { gte: today },
        status: { notIn: ["completed", "cancelled"] },
      },
      orderBy: { travelStartDate: "asc" },
      take: 5,
      include: { customer: true },
    }),
    prisma.inquiry.findMany({
      where: {
        nextFollowUpAt: { lte: today },
        status: { notIn: ["completed", "cancelled"] },
      },
      orderBy: { nextFollowUpAt: "asc" },
      take: 6,
      include: { customer: true },
    }),
    prisma.payment.findMany({ select: { amountUsd: true, amountUzs: true } }),
    prisma.payment.findMany({
      where: { createdAt: { gte: thisMonthStart } },
      select: { amountUsd: true },
    }),
    prisma.payment.findMany({
      where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      select: { amountUsd: true },
    }),
    prisma.booking.findMany({
      where: { status: { not: "cancelled" } },
      select: {
        totalUsd: true,
        totalUzs: true,
        payments: { select: { amountUsd: true, amountUzs: true } },
      },
    }),
    prisma.inquiry.groupBy({
      by: ["responsibleManager"],
      where: { responsibleManager: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const revenueUsd = payments.reduce((sum, p) => sum + Number(p.amountUsd ?? 0), 0);
  const revenueUzs = payments.reduce((sum, p) => sum + Number(p.amountUzs ?? 0), 0);
  const revenueThisMonthUsd = paymentsThisMonth.reduce((sum, p) => sum + Number(p.amountUsd ?? 0), 0);
  const revenueLastMonthUsd = paymentsLastMonth.reduce((sum, p) => sum + Number(p.amountUsd ?? 0), 0);

  let pendingUsd = 0;
  let pendingUzs = 0;
  let depositPendingCount = 0;
  for (const b of bookings) {
    const paidUsd = b.payments.reduce((sum, p) => sum + Number(p.amountUsd ?? 0), 0);
    const paidUzs = b.payments.reduce((sum, p) => sum + Number(p.amountUzs ?? 0), 0);
    const remainingUsd = Number(b.totalUsd) - paidUsd;
    const remainingUzs = Number(b.totalUzs) - paidUzs;
    if (remainingUsd > 0) pendingUsd += remainingUsd;
    if (remainingUzs > 0) pendingUzs += remainingUzs;
    if (remainingUsd > 0 || remainingUzs > 0) depositPendingCount++;
  }

  const managerPerformance = managerGroups
    .map((g) => ({ manager: g.responsibleManager as string, count: g._count._all }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    newLeads: newLeadsThisMonth,
    newLeadsTrend: trendPercent(newLeadsThisMonth, newLeadsLastMonth),
    activeInquiries,
    proposalsSent: proposalsThisMonth,
    proposalsSentTrend: trendPercent(proposalsThisMonth, proposalsLastMonth),
    confirmedBookings,
    confirmedBookingsTrend: trendPercent(bookingsThisMonth, bookingsLastMonth),
    completedBookings,
    depositPendingCount,
    revenueUsd,
    revenueUzs,
    revenueTrend: trendPercent(revenueThisMonthUsd, revenueLastMonthUsd),
    pendingUsd,
    pendingUzs,
    upcomingTours: upcomingInquiries.map((i) => ({
      id: i.id,
      customerName: `${i.customer.firstName} ${i.customer.lastName ?? ""}`.trim(),
      travelStartDate: i.travelStartDate,
      cities: i.cities,
    })),
    todaysFollowUps: todaysFollowUps.map((i) => ({
      id: i.id,
      customerName: `${i.customer.firstName} ${i.customer.lastName ?? ""}`.trim(),
      nextFollowUpAt: i.nextFollowUpAt,
    })),
    managerPerformance,
  });
}
