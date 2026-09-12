import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { EXPENSE_CATEGORIES } from "@/lib/crm-constants";

export const dynamic = "force-dynamic";

const expenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES).default("other"),
  description: z.string().min(1),
  amountUsd: z.number().nonnegative().optional().nullable(),
  amountUzs: z.number().nonnegative().optional().nullable(),
  date: z.string().min(1),
  notes: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const expenses = await prisma.expense.findMany({
    where: {
      date: {
        gte: from || undefined,
        lte: to || undefined,
      },
    },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const expense = await prisma.expense.create({ data: parsed.data });
  return NextResponse.json(expense, { status: 201 });
}
