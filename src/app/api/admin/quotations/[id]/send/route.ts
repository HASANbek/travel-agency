import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const quotation = await prisma.quotation.update({
    where: { id: Number(id) },
    data: { status: "sent", sentAt: new Date() },
    include: { tour: true, customer: true },
  });
  return NextResponse.json(quotation);
}
