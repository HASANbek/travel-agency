import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const inquiries = await prisma.inquiry.findMany({
    where: {
      nextFollowUpAt: { not: null },
      status: { notIn: ["completed", "cancelled"] },
    },
    orderBy: { nextFollowUpAt: "asc" },
    include: { customer: true },
  });
  return NextResponse.json(inquiries);
}
