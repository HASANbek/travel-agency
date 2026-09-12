import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { COMMUNICATION_CHANNELS } from "@/lib/crm-constants";

// Generic inbound webhook for future WhatsApp/Telegram/Email integrations.
// A real provider (Meta, Telegram Bot API, etc.) would call this with its own
// payload shape — translate that at the integration point and forward the
// normalized fields below. Never auto-confirms bookings or moves money; it
// only files an inbound message against a matching customer for a human to act on.
const webhookSchema = z.object({
  channel: z.enum(COMMUNICATION_CHANNELS),
  fromIdentifier: z.string().min(1),
  message: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== (process.env.WEBHOOK_SECRET || "dev-secret")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { channel, fromIdentifier, message } = parsed.data;

  const customer = await prisma.customer.findFirst({
    where:
      channel === "telegram"
        ? { telegram: fromIdentifier }
        : channel === "whatsapp"
          ? { whatsapp: fromIdentifier }
          : { OR: [{ phone: fromIdentifier }, { email: fromIdentifier }] },
  });

  if (!customer) {
    return NextResponse.json({ matched: false });
  }

  const log = await prisma.communicationLog.create({
    data: { customerId: customer.id, channel, direction: "inbound", message },
  });

  return NextResponse.json({ matched: true, customerId: customer.id, logId: log.id });
}
