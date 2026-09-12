import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "documents");

export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get("customerId");
  const bookingId = request.nextUrl.searchParams.get("bookingId");
  const documents = await prisma.document.findMany({
    where: {
      customerId: customerId ? Number(customerId) : undefined,
      bookingId: bookingId ? Number(bookingId) : undefined,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(documents);
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file");
  const customerId = form.get("customerId");
  const bookingId = form.get("bookingId");
  const notes = form.get("notes");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${Date.now()}-${safeName}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, storedName), bytes);

  const document = await prisma.document.create({
    data: {
      customerId: customerId ? Number(customerId) : null,
      bookingId: bookingId ? Number(bookingId) : null,
      fileName: file.name,
      filePath: `/uploads/documents/${storedName}`,
      fileType: file.type || null,
      notes: notes ? String(notes) : null,
    },
  });
  return NextResponse.json(document, { status: 201 });
}
