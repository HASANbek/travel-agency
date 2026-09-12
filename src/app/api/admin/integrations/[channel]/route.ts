import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { CHANNELS, generateSecret, getIntegration, IntegrationChannel } from "@/lib/integrations";

const bodySchema = z.object({
  enabled: z.boolean().optional(),
  botToken: z.string().optional(),
  email: z.string().optional(),
  appPassword: z.string().optional(),
  phoneNumberId: z.string().optional(),
  accessToken: z.string().optional(),
  regenerateSecret: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
) {
  const { channel } = await params;
  if (!CHANNELS.includes(channel as IntegrationChannel)) {
    return NextResponse.json({ error: "Unknown channel" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const current = await getIntegration(channel as IntegrationChannel);
  const config = { ...(current.config as Record<string, unknown>) };
  let status: string | null = current.status;

  if (channel === "telegram" && data.botToken) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${data.botToken}/getMe`);
      const json = await res.json();
      if (!json.ok) {
        return NextResponse.json({ error: "Telegram bot token noto'g'ri" }, { status: 400 });
      }
      config.botToken = data.botToken;
      config.botUsername = json.result.username;
      status = `Connected as @${json.result.username}`;
    } catch {
      return NextResponse.json({ error: "Telegram bilan bog'lanib bo'lmadi" }, { status: 502 });
    }
  }

  if (channel === "email") {
    if (data.email !== undefined) config.email = data.email;
    if (data.appPassword !== undefined) config.appPassword = data.appPassword;
    status = config.email ? `${config.email}` : null;
  }

  if (channel === "whatsapp") {
    if (data.phoneNumberId !== undefined) config.phoneNumberId = data.phoneNumberId;
    if (data.accessToken !== undefined) config.accessToken = data.accessToken;
    status = config.phoneNumberId ? `Phone ID: ${config.phoneNumberId}` : null;
  }

  if (channel === "website" && data.regenerateSecret) {
    config.secret = generateSecret();
  }

  const updated = await prisma.integration.update({
    where: { channel },
    data: {
      config: config as Prisma.InputJsonValue,
      status,
      enabled: data.enabled ?? current.enabled,
    },
  });

  return NextResponse.json(updated);
}
