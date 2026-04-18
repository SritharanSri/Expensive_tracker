import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { buildRateLimiter } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface PlannerRequest {
  itemName: string;
  itemPrice: number;
  timeline: "asap" | "1month" | "3months" | "6months";
  financialSnapshot: {
    balance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySavings: number;
    budgets: { category: string; limit: number; spent: number }[];
    currencySymbol: string;
    currencyCode: string;
  };
  isPremium: boolean;
}

const checkRateLimit = buildRateLimiter({ limit: 10, windowMs: 60 * 1000 });

const PlannerRequestSchema = z.object({
  itemName: z.string().min(1).max(100),
  itemPrice: z.number().nonnegative().max(100000000),
  timeline: z.enum(["asap", "1month", "3months", "6months"]),
  financialSnapshot: z.object({
    balance: z.number(),
    monthlyIncome: z.number().nonnegative(),
    monthlyExpenses: z.number().nonnegative(),
    monthlySavings: z.number(),
    budgets: z.array(z.object({
      category: z.string().max(50),
      limit: z.number().nonnegative(),
      spent: z.number().nonnegative(),
    })).max(50),
    currencySymbol: z.string().max(5),
    currencyCode: z.string().max(5)
  }),
  isPremium: z.boolean()
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResponse = checkRateLimit(ip);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const parsedData = PlannerRequestSchema.parse(body);
    const { itemName, itemPrice, timeline, financialSnapshot, isPremium } = parsedData;
    const {
      balance,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      budgets,
      currencySymbol,
      currencyCode,
    } = financialSnapshot;

    const budgetsSummary = budgets
      .map((b) => `  • ${b.category}: ${currencySymbol}${b.limit} limit, ${currencySymbol}${b.spent} spent`)
      .join("\n");

    const prompt = `You are Spendly's Smart Purchase Advisor — an expert personal finance AI. 
Analyze whether the user can afford this purchase and give precise, actionable advice.

USER FINANCIAL SNAPSHOT:
- Current Balance: ${currencySymbol}${balance.toFixed(2)} ${currencyCode}
- Monthly Income: ${currencySymbol}${monthlyIncome.toFixed(2)}
- Monthly Expenses: ${currencySymbol}${monthlyExpenses.toFixed(2)}
- Monthly Savings: ${currencySymbol}${monthlySavings.toFixed(2)}
- Active Budgets:
${budgetsSummary || "  • No active budgets"}

PURCHASE REQUEST:
- Item: ${itemName}
- Price: ${currencySymbol}${itemPrice.toFixed(2)}
- Desired Timeline: ${timeline === "asap" ? "As Soon As Possible" : timeline === "1month" ? "Within 1 Month" : timeline === "3months" ? "Within 3 Months" : "Within 6 Months"}

TASK: Respond ONLY with a valid JSON object (no markdown, no code fences) with this exact structure:
{
  "verdict": "safe" | "risky" | "not_recommended",
  "verdictReason": "one short sentence explaining the verdict",
  "monthsToAfford": number,
  "daysToAfford": number,
  "monthlySavingNeeded": number,
  "dailySavingNeeded": number,
  "balanceAfterPurchase": number,
  "willGoBelowZero": boolean,
  "affectedBudgets": ["category1", "category2"],
  "budgetConflictMessage": "string explaining budget conflicts if any",
  "suggestions": [
    { "type": "reduce_expense", "title": "string", "detail": "string", "impact": number, "daysEarlier": number },
    { "type": "adjust_budget", "title": "string", "detail": "string", "impact": number, "daysEarlier": number },
    { "type": "saving_goal", "title": "string", "detail": "string", "impact": number, "daysEarlier": number }
  ],
  "savingPlan": {
    "monthlyTarget": number,
    "dailyTarget": number,
    "weeksToGoal": number,
    "achievableBy": "Month Year"
  },
  "riskWarnings": ["warning1", "warning2"],
  "positiveSignals": ["signal1", "signal2"],
  "confidenceScore": number
}

Rules:
- monthsToAfford: how many months at current savings rate to afford it (0 if can buy now safely)
- affectedBudgets: list category names that will be impacted if bought now
- suggestions: provide exactly 3 suggestions
- riskWarnings: max 2 items
- positiveSignals: max 2 items
- confidenceScore: 0-100 based on how confident the prediction is
- All currency amounts in ${currencyCode}`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1200,
      },
    });

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

    const analysis = JSON.parse(text);

    if (!isPremium) {
      analysis.suggestions = [];
      analysis.riskWarnings = ["Premium unlocks detailed risk analysis."];
      analysis.positiveSignals = ["Premium unlocks detailed positive signals."];
      analysis.affectedBudgets = [];
      analysis.budgetConflictMessage = "Premium unlocks conflict analysis.";
    }

    return NextResponse.json({ success: true, analysis });
  } catch (err) {
    return handleApiError(err);
  }
}
