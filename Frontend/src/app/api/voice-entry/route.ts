import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { z } from "zod";
import { buildRateLimiter } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";

const CATEGORIES = [
  "food", "transport", "shopping", "health", "entertainment",
  "utilities", "education", "salary", "investment", "freelance",
  "rent", "other"
];

const checkRateLimit = buildRateLimiter({ limit: 5, windowMs: 60 * 1000 }); // 5 requests per minute

const VoiceEntrySchema = z.object({
  text: z.string().min(1).max(500) // Prevent huge context overflows
});

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("[VOICE_ENTRY]: GROQ_API_KEY is missing from environment variables.");
      return NextResponse.json(
        { 
          success: false, 
          error: "AI_CONFIG_MISSING",
          message: "The Voice AI is not configured on the server. Please check environment variables."
        }, 
        { status: 503 }
      );
    }

    const groq = new Groq({ apiKey });
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResponse = checkRateLimit(ip);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const { text } = VoiceEntrySchema.parse(body);

    const prompt = `You are a financial transaction parser.
User spoken text: "${text}"

Extract the following information from the text and return EXACTLY a valid JSON object with NO markup and NO markdown block wrappers.

Required keys:
- amount: (number) The numeric amount mentioned. Ignore currency symbols or words.
- type: (string) Must be exactly "income" or "expense".
- category: (string) Must be exactly one of the following category IDs: ${CATEGORIES.join(", ")}.
- title: (string) A concise 1-3 word title summarizing the transaction (e.g., "Fuel", "KFC", "Freelance Work", "Salary").

Rules:
- Earning money, getting paid, or generic "income" is "income" (e.g., salary, freelance).
- Paying, buying, or spending is "expense" (default assumption).
- The input text may be in English, Sinhala, Tamil, Hindi, or a phonetic mix (e.g., Singlish, Tanglish). Understand the semantic meaning in the local language and map it precisely to the requested English JSON fields.

Output JSON only.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 200,
    });

    let responseText = chatCompletion.choices[0]?.message?.content || "";
    
    // Clean up Markdown backticks if the model ignores the instruction
    responseText = responseText.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();

    const data = JSON.parse(responseText);

    // Validate structure 
    if (!data.type || !data.amount || !data.category || !data.title) {
        throw new Error("Missing required fields in parsed response");
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
}
