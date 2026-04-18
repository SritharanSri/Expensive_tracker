import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import { z } from "zod";
import { buildRateLimiter } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
  content: z.string().min(1).max(2000) // 2000 char max length to prevent prompt explosion
});

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).max(50), // Cap history size
  financialContext: FinancialContextSchema
});

export async function POST(req: NextRequest) {
  try {
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

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      systemInstruction: systemInstruction 
    });

    // Convert message history to Gemini format (excluding the last message which we'll send as the current prompt)
    const history: Content[] = messages.slice(0, -1).map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(lastMessage.content);
    const reply = result.response.text();

    return NextResponse.json({ message: reply });
  } catch (err) {
    return handleApiError(err);
  }
}
