import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { COMMUNICATION_CHANNELS, COMMUNICATION_DIRECTIONS } from "@/lib/crm-constants";
import { getIntegration } from "@/lib/integrations";

export const dynamic = "force-dynamic";

const logSchema = z.object({
  customerId: z.number().int().positive(),
  channel: z.enum(COMMUNICATION_CHANNELS).default("other"),
  direction: z.enum(COMMUNICATION_DIRECTIONS).default("outbound"),
  message: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json({ error: "customerId is required" }, { status: 400 });
  }
  const logs = await prisma.communicationLog.findMany({
    where: { customerId: Number(customerId) },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(logs);
}

async function trySendTelegram(customerId: number, message: string) {
  const integration = await getIntegration("telegram");
  const config = integration.config as { botToken?: string };
  if (!integration.enabled || !config.botToken) return { sent: false, reason: "not_connected" };

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer?.telegram) return { sent: false, reason: "no_chat_id" };

  try {
    const res = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: customer.telegram, text: message }),
    });
    const json = await res.json();
    return { sent: Boolean(json.ok), reason: json.ok ? undefined : "telegram_error" };
  } catch {
    return { sent: false, reason: "network_error" };
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = logSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let delivery: { sent: boolean; reason?: string } | null = null;
  if (parsed.data.direction === "outbound" && parsed.data.channel === "telegram") {
    delivery = await trySendTelegram(parsed.data.customerId, parsed.data.message);
  }

  const log = await prisma.communicationLog.create({ data: parsed.data });
  return NextResponse.json({ ...log, delivery }, { status: 201 });
}
