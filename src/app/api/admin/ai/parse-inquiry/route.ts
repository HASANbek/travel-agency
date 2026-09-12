import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  message: z.string().min(1),
});

const SYSTEM_PROMPT = `You are a data-extraction assistant for a tour operator's CRM. A customer sent a message via email, WhatsApp, or a website form, asking about a trip. Extract every field you can find into JSON. Use null for anything not mentioned — never invent values.

Return ONLY a JSON object with exactly these keys:
{
  "firstName": string | null,
  "lastName": string | null,
  "email": string | null,
  "phone": string | null,
  "travelStartDate": string | null,   // ISO format YYYY-MM-DD if a date is mentioned or can be inferred
  "travelEndDate": string | null,     // ISO format YYYY-MM-DD
  "adults": number | null,
  "children": number | null,
  "cities": string | null,            // comma-separated city names mentioned, e.g. "Tashkent, Samarkand, Bukhara"
  "budget": number | null,            // numeric value only
  "currency": string | null,          // e.g. "USD", "EUR", "UZS" — default to "USD" if a budget is given but no currency stated
  "hotelCategory": string | null,     // e.g. "3*", "4*", "5*"
  "mealPlan": string | null,          // one of RO, BB, HB, FB, AI if mentioned
  "transportRequirement": string | null,
  "guideLanguage": string | null,     // language requested for a guide, if any
  "specialRequests": string | null    // anything else notable, summarized briefly
}

The message may be in Uzbek, Russian, or English. Respond with the JSON object only, no other text.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const client = new OpenAI({ apiKey });

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: parsed.data.message },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "Empty AI response" }, { status: 502 });
    }

    const extracted = JSON.parse(raw);
    return NextResponse.json(extracted);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
