import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id: Number(id) } });
  if (doc) {
    const fullPath = path.join(process.cwd(), "public", doc.filePath);
    await unlink(fullPath).catch(() => {});
  }
  await prisma.document.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
