import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getIntegration } from "@/lib/integrations";

const bodySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  message: z.string().min(1),
  travelStartDate: z.string().optional().nullable(),
  travelEndDate: z.string().optional().nullable(),
  adults: z.number().int().positive().optional().nullable(),
  children: z.number().int().nonnegative().optional().nullable(),
  cities: z.string().optional().nullable(),
  budget: z.number().nonnegative().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const integration = await getIntegration("website");
  const config = integration.config as { secret?: string };
  const secret = request.headers.get("x-webhook-secret");
  if (!config.secret || secret !== config.secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!integration.enabled) {
    return NextResponse.json({ error: "Website integration is disabled" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  let customer = data.email
    ? await prisma.customer.findFirst({ where: { email: data.email } })
    : null;
  if (!customer && data.phone) {
    customer = await prisma.customer.findFirst({ where: { phone: data.phone } });
  }
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName || null,
        email: data.email || null,
        phone: data.phone || null,
        source: "website",
      },
    });
  }

  const inquiry = await prisma.inquiry.create({
    data: {
      customerId: customer.id,
      source: "website",
      requestDate: new Date().toISOString().slice(0, 10),
      travelStartDate: data.travelStartDate || null,
      travelEndDate: data.travelEndDate || null,
      adults: data.adults ?? 1,
      children: data.children ?? 0,
      cities: data.cities || null,
      budget: data.budget ?? null,
      specialRequests: data.message,
      status: "new",
    },
  });

  await prisma.communicationLog.create({
    data: {
      customerId: customer.id,
      channel: "website",
      direction: "inbound",
      message: data.message,
    },
  });

  return NextResponse.json({ customerId: customer.id, inquiryId: inquiry.id }, { status: 201 });
}
