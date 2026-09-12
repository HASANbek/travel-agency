import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { EXPENSE_CATEGORIES } from "@/lib/crm-constants";

const expenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES).default("other"),
  description: z.string().min(1),
  amountUsd: z.number().nonnegative().optional().nullable(),
  amountUzs: z.number().nonnegative().optional().nullable(),
  date: z.string().min(1),
  notes: z.string().optional().nullable(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const expense = await prisma.expense.update({ where: { id: Number(id) }, data: parsed.data });
  return NextResponse.json(expense);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.expense.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
