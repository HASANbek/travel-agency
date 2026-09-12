import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [latestPerCustomer, counts] = await Promise.all([
    prisma.communicationLog.findMany({
      orderBy: { createdAt: "desc" },
      distinct: ["customerId"],
      include: { customer: true },
    }),
    prisma.communicationLog.groupBy({
      by: ["customerId"],
      _count: { _all: true },
    }),
  ]);

  const countMap = new Map(counts.map((c) => [c.customerId, c._count._all]));

  const conversations = latestPerCustomer
    .map((log) => ({
      customerId: log.customerId,
      customer: log.customer,
      lastMessage: log.message,
      lastChannel: log.channel,
      lastDirection: log.direction,
      lastAt: log.createdAt,
      messageCount: countMap.get(log.customerId) ?? 0,
    }))
    .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

  return NextResponse.json(conversations);
}
