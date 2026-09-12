import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  nextFollowUpAt: z.string().optional().nullable(),
  incrementStep: z.boolean().default(true),
});

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

  const current = await prisma.inquiry.findUnique({ where: { id: Number(id) } });
  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const inquiry = await prisma.inquiry.update({
    where: { id: Number(id) },
    data: {
      nextFollowUpAt: parsed.data.nextFollowUpAt ?? null,
      followUpStep: parsed.data.incrementStep ? current.followUpStep + 1 : current.followUpStep,
    },
  });

  return NextResponse.json(inquiry);
}
