import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { INQUIRY_STATUSES } from "@/lib/crm-constants";

const schema = z.object({ status: z.enum(INQUIRY_STATUSES) });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const inquiry = await prisma.inquiry.update({
    where: { id: Number(id) },
    data: { status: parsed.data.status },
  });
  return NextResponse.json(inquiry);
}
