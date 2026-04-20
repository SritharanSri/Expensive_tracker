import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { z } from "zod";
import { buildRateLimiter } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";

const checkRateLimit = buildRateLimiter({ limit: 10, windowMs: 60 * 1000 });

const ParseSmsSchema = z.object({
  text: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "AI_CONFIG_MISSING" },
        { status: 503 }
      );
    }

    const groq = new Groq({ apiKey });
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResponse = checkRateLimit(ip);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const { text } = ParseSmsSchema.parse(body);

    const systemInstruction = `You are a financial data extractor. Your task is to parse a bank SMS or transaction notification and extract transaction details.
    
    Return ONLY a raw JSON object with the following keys:
    - merchant: Name of the store or person (string)
    - amount: Numeric value (number)
    - currency: Currency symbol or code (string)
    - type: Either "expense" or "income" (string)
    - category: One of [food, transport, entertainment, shopping, health, bills, salary, freelance, investment, general] (string)
    - description: A short summary of the transaction (string)

    If you cannot find a value, use "general" for category or "unknown" for merchant.
    Respond with JSON ONLY. No preamble or markdown formatting blocks.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: text }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1, // low temperature for precise extraction
      max_tokens: 200,
    });

    const reply = chatCompletion.choices[0]?.message?.content || "{}";
    let parsed;
    try {
      // Clean up optional markdown if model ignores "No markdown" instruction
      const cleanJson = reply.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      return NextResponse.json({ success: false, error: "PARSE_FAILED" }, { status: 422 });
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (err) {
    return handleApiError(err);
  }
}
