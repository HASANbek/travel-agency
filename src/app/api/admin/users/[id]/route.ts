import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-password";
import { USER_ROLES } from "@/lib/crm-constants";
import { canManageUsers } from "@/lib/rbac";

const updateSchema = z.object({
  name: z.string().min(1),
  role: z.enum(USER_ROLES),
  isActive: z.boolean(),
  password: z.string().min(6).optional().nullable(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get("x-user-role") || "";
  if (!canManageUsers(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: { name: string; role: string; isActive: boolean; passwordHash?: string } = {
    name: parsed.data.name,
    role: parsed.data.role,
    isActive: parsed.data.isActive,
  };
  if (parsed.data.password) {
    data.passwordHash = hashPassword(parsed.data.password);
  }

  const user = await prisma.user.update({
    where: { id: Number(id) },
    data,
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });
  return NextResponse.json(user);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = request.headers.get("x-user-role") || "";
  if (!canManageUsers(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.user.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
