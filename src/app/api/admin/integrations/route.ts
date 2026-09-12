import { NextResponse } from "next/server";
import { ensureAllIntegrations } from "@/lib/integrations";

export const dynamic = "force-dynamic";

export async function GET() {
  const integrations = await ensureAllIntegrations();
  return NextResponse.json(integrations);
}
