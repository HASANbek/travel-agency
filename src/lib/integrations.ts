import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

export const CHANNELS = ["website", "telegram", "email", "whatsapp"] as const;
export type IntegrationChannel = (typeof CHANNELS)[number];

export function generateSecret(): string {
  return crypto.randomBytes(24).toString("hex");
}

export async function getIntegration(channel: IntegrationChannel) {
  const existing = await prisma.integration.findUnique({ where: { channel } });
  if (existing) return existing;

  const defaults: Record<IntegrationChannel, Record<string, unknown>> = {
    website: { secret: generateSecret() },
    telegram: {},
    email: {},
    whatsapp: {},
  };

  return prisma.integration.create({
    data: { channel, enabled: false, config: defaults[channel] as Prisma.InputJsonValue },
  });
}

export async function ensureAllIntegrations() {
  return Promise.all(CHANNELS.map((c) => getIntegration(c)));
}
