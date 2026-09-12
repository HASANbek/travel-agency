import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const today = now.toISOString().slice(0, 10);

  const [newInquiries, upcomingTrips, bookings] = await Promise.all([
    prisma.inquiry.findMany({
      where: { status: "new", createdAt: { gte: twoDaysAgo } },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.inquiry.findMany({
      where: {
        travelStartDate: { gte: today, lte: in7Days },
        status: { notIn: ["completed", "cancelled"] },
      },
      include: { customer: true },
      orderBy: { travelStartDate: "asc" },
      take: 10,
    }),
    prisma.booking.findMany({
      where: { status: { not: "cancelled" } },
      include: {
        tour: true,
        payments: { select: { amountUsd: true } },
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const notifications: { id: string; type: string; message: string; link: string }[] = [];

  for (const inq of newInquiries) {
    notifications.push({
      id: `new_inquiry_${inq.id}`,
      type: "new_inquiry",
      message: `${inq.customer.firstName} ${inq.customer.lastName ?? ""}`.trim(),
      link: `/admin/inquiries/${inq.id}`,
    });
  }

  for (const inq of upcomingTrips) {
    notifications.push({
      id: `travel_${inq.id}`,
      type: "travel_approaching",
      message: `${inq.customer.firstName} ${inq.customer.lastName ?? ""} — ${inq.travelStartDate}`.trim(),
      link: `/admin/inquiries/${inq.id}`,
    });
  }

  for (const b of bookings) {
    const paidUsd = b.payments.reduce((sum, p) => sum + Number(p.amountUsd ?? 0), 0);
    const remaining = Number(b.totalUsd) - paidUsd;
    if (remaining > 0) {
      notifications.push({
        id: `payment_${b.id}`,
        type: "pending_payment",
        message: `${b.tour.name} — $${remaining.toFixed(2)}`,
        link: `/admin/bookings/${b.id}`,
      });
    }
  }

  return NextResponse.json(notifications.slice(0, 20));
}
