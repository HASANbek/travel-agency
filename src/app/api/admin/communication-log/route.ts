import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import nodemailer from "nodemailer";
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

async function trySendWhatsApp(customerId: number, message: string) {
  const integration = await getIntegration("whatsapp");
  const config = integration.config as { phoneNumberId?: string; accessToken?: string };
  if (!integration.enabled || !config.phoneNumberId || !config.accessToken) {
    return { sent: false, reason: "not_connected" };
  }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer?.whatsapp) return { sent: false, reason: "no_phone" };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: customer.whatsapp,
          type: "text",
          text: { body: message },
        }),
      }
    );
    const json = await res.json();
    return { sent: res.ok && !json.error, reason: json.error ? "whatsapp_error" : undefined };
  } catch {
    return { sent: false, reason: "network_error" };
  }
}

async function trySendEmail(customerId: number, message: string) {
  const integration = await getIntegration("email");
  const config = integration.config as { email?: string; appPassword?: string };
  if (!integration.enabled || !config.email || !config.appPassword) {
    return { sent: false, reason: "not_connected" };
  }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer?.email) return { sent: false, reason: "no_email" };

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: config.email, pass: config.appPassword },
    });
    await transporter.sendMail({
      from: config.email,
      to: customer.email,
      subject: "Travel Agency",
      text: message,
    });
    return { sent: true };
  } catch {
    return { sent: false, reason: "email_error" };
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = logSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let delivery: { sent: boolean; reason?: string } | null = null;
  if (parsed.data.direction === "outbound") {
    if (parsed.data.channel === "telegram") {
      delivery = await trySendTelegram(parsed.data.customerId, parsed.data.message);
    } else if (parsed.data.channel === "whatsapp") {
      delivery = await trySendWhatsApp(parsed.data.customerId, parsed.data.message);
    } else if (parsed.data.channel === "email") {
      delivery = await trySendEmail(parsed.data.customerId, parsed.data.message);
    }
  }

  const log = await prisma.communicationLog.create({ data: parsed.data });
  return NextResponse.json({ ...log, delivery }, { status: 201 });
}
