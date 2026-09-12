import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: Number(id) },
    include: { customer: true },
  });
  if (!inquiry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const customerName = [inquiry.customer.firstName, inquiry.customer.lastName]
    .filter(Boolean)
    .join(" ");
  const nameParts = [customerName];
  if (inquiry.cities) nameParts.push(inquiry.cities);
  if (inquiry.days) nameParts.push(`${inquiry.days} kun`);

  const tour = await prisma.tour.create({
    data: {
      name: nameParts.filter(Boolean).join(" — ") || `Tour #${inquiry.id}`,
      customerId: inquiry.customerId,
      inquiryId: inquiry.id,
    },
  });

  if (inquiry.status === "new" || inquiry.status === "contacted") {
    await prisma.inquiry.update({
      where: { id: inquiry.id },
      data: { status: "preparing" },
    });
  }

  return NextResponse.json(tour, { status: 201 });
}
