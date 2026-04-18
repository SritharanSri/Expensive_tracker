import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { z } from "zod";
import { buildRateLimiter } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";

interface FinancialContext {
  balance: string;
  currencySymbol: string;
  income: string;
  expenses: string;
  topCategory: string;
  transactionCount: number;
}

const checkRateLimit = buildRateLimiter({ limit: 10, windowMs: 60 * 1000 }); // 10 requests per minute

const FinancialContextSchema = z.object({
  balance: z.number().or(z.string()).transform(String).refine(s => s.length <= 50),
  currencySymbol: z.string().max(5),
  income: z.number().or(z.string()).transform(String).refine(s => s.length <= 50),
  expenses: z.number().or(z.string()).transform(String).refine(s => s.length <= 50),
  topCategory: z.string().max(100),
  transactionCount: z.number().min(0).max(1000000)
});

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000)
});

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).max(50), 
  financialContext: FinancialContextSchema
});

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("[AI_CHAT]: GROQ_API_KEY is missing from environment variables.");
      return NextResponse.json(
        { 
          success: false, 
          error: "AI_CONFIG_MISSING",
          message: "The AI Assistant (Groq) is not configured on the server. Please check environment variables."
        }, 
        { status: 503 }
      );
    }

    const groq = new Groq({ apiKey });
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResponse = checkRateLimit(ip);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const parsedData = ChatRequestSchema.parse(body);
    const { messages, financialContext } = parsedData;

    const systemInstruction = `You are Spendly AI, a smart and friendly personal finance assistant built into the Spendly expense tracker app.

Current user financial snapshot:
- Balance: ${financialContext.balance}
- This month income: ${financialContext.income}
- This month expenses: ${financialContext.expenses}
- Top spending category: ${financialContext.topCategory}
- Total transactions tracked: ${financialContext.transactionCount}

Guidelines:
- Be concise (2–3 sentences max unless asked for detail)
- Be warm, encouraging, and practical
- Use the user's currency when mentioning specific amounts
- If asked about spending predictions or budget tips, use the data above
- Never make up financial data — only reference what's in the snapshot`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemInstruction },
        ...messages.map(msg => ({
          role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: msg.content
        }))
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 400,
    });

    const reply = chatCompletion.choices[0]?.message?.content || "";

    return NextResponse.json({ message: reply });
  } catch (err) {
    return handleApiError(err);
  }
}
