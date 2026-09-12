import { NextResponse } from "next/server";
import { ensureAllIntegrations } from "@/lib/integrations";

export async function GET() {
  const integrations = await ensureAllIntegrations();
  return NextResponse.json(integrations);
}
