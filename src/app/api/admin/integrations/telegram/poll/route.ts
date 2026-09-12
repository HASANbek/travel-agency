import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIntegration } from "@/lib/integrations";

export const dynamic = "force-dynamic";

type TelegramUpdate = {
  update_id: number;
  message?: {
    chat: { id: number };
    text?: string;
    from?: { first_name?: string; last_name?: string };
  };
};

export async function POST() {
  const integration = await getIntegration("telegram");
  const config = integration.config as { botToken?: string; lastUpdateId?: number };

  if (!integration.enabled || !config.botToken) {
    return NextResponse.json({ error: "Telegram ulanmagan" }, { status: 400 });
  }

  const offset = config.lastUpdateId ? config.lastUpdateId + 1 : undefined;
  const url = `https://api.telegram.org/bot${config.botToken}/getUpdates${
    offset ? `?offset=${offset}` : ""
  }`;

  const res = await fetch(url);
  const json = await res.json();
  if (!json.ok) {
    return NextResponse.json({ error: "Telegram javob bermadi" }, { status: 502 });
  }

  const updates: TelegramUpdate[] = json.result;
  let newMessages = 0;
  let maxUpdateId = config.lastUpdateId ?? 0;

  for (const update of updates) {
    maxUpdateId = Math.max(maxUpdateId, update.update_id);
    const msg = update.message;
    if (!msg || !msg.text) continue;

    const chatId = String(msg.chat.id);
    let customer = await prisma.customer.findFirst({ where: { telegram: chatId } });
    if (!customer) {
      const name = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ") || "Telegram user";
      customer = await prisma.customer.create({
        data: {
          firstName: name,
          telegram: chatId,
          source: "telegram",
        },
      });
    }

    await prisma.communicationLog.create({
      data: {
        customerId: customer.id,
        channel: "telegram",
        direction: "inbound",
        message: msg.text,
      },
    });
    newMessages++;
  }

  await prisma.integration.update({
    where: { channel: "telegram" },
    data: { config: { ...config, lastUpdateId: maxUpdateId } },
  });

  return NextResponse.json({ newMessages });
}
